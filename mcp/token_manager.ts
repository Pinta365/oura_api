/**
 * Holds the current Oura tokens and runs the OAuth flow on demand for the
 * stdio transport. `beginAuthorize()` is non-blocking — it starts a local
 * callback listener and returns the auth URL synchronously, so the MCP tool
 * can return a clickable link instead of holding the call open while the
 * user authorizes in their browser.
 */

import { generateAuthUrl, getTokens, refreshToken } from "../src/utilsOAuth.ts";
import { readTokens, type StoredTokens, tokenFilePath, writeTokens } from "./token_store.ts";

const SCOPES = ["personal", "daily", "heartrate", "workout", "session", "spo2Daily"] as const;
const AUTHORIZE_TIMEOUT_MS = 5 * 60 * 1000;

export type AuthStatus = "idle" | "pending" | "authorized";

export interface BeginAuthorizeResult {
    authUrl: string;
    callbackPort: number;
    expiresInSeconds: number;
}

interface PendingFlow {
    server: { shutdown: () => Promise<void> };
    timeoutId: number;
    lastError: string | null;
}

export class TokenManager {
    #tokens: StoredTokens | null = null;
    #pending: PendingFlow | null = null;

    async load(): Promise<void> {
        this.#tokens = await readTokens();
    }

    isAuthorized(): boolean {
        return this.#tokens !== null;
    }

    status(): AuthStatus {
        if (this.#tokens) return "authorized";
        if (this.#pending) return "pending";
        return "idle";
    }

    lastAuthError(): string | null {
        return this.#pending?.lastError ?? null;
    }

    async getAccessToken(): Promise<string | null> {
        if (!this.#tokens) return null;

        if (Date.now() >= this.#tokens.expiresAt - 60_000) {
            const refreshed = await refreshToken(
                this.#tokens.clientId,
                this.#tokens.clientSecret,
                this.#tokens.refreshToken,
            );
            this.#tokens = {
                ...this.#tokens,
                accessToken: refreshed.access_token,
                refreshToken: refreshed.refresh_token,
                expiresAt: Date.now() + refreshed.expires_in * 1000,
            };
            await writeTokens(this.#tokens);
        }

        return this.#tokens.accessToken;
    }

    getCredentials(): { clientId: string; clientSecret: string; redirectUri: string } | null {
        if (!this.#tokens) return null;
        return {
            clientId: this.#tokens.clientId,
            clientSecret: this.#tokens.clientSecret,
            redirectUri: this.#tokens.redirectUri,
        };
    }

    async beginAuthorize(opts: {
        clientId: string;
        clientSecret: string;
        callbackPort: number;
    }): Promise<BeginAuthorizeResult> {
        if (this.#pending) {
            await this.#cancelPending();
        }

        const redirectUri = `http://localhost:${opts.callbackPort}/callback`;

        const pending: PendingFlow = {
            server: null as unknown as { shutdown: () => Promise<void> },
            timeoutId: 0,
            lastError: null,
        };

        const server = Deno.serve({ port: opts.callbackPort, onListen: () => {} }, async (req) => {
            const url = new URL(req.url);
            if (url.pathname !== "/callback") {
                return new Response("Not found", { status: 404 });
            }
            const error = url.searchParams.get("error");
            if (error) {
                pending.lastError = `Oura authorization denied: ${error} — ${
                    url.searchParams.get("error_description") || ""
                }`;
                console.error(`[oura-mcp] ${pending.lastError}`);
                return new Response("Authorization denied. You can close this window.", {
                    headers: { "content-type": "text/plain" },
                });
            }
            const code = url.searchParams.get("code");
            if (!code) {
                pending.lastError = "No authorization code received in callback";
                return new Response("Missing code. You can close this window.", {
                    headers: { "content-type": "text/plain" },
                });
            }

            try {
                const tokens = await getTokens(opts.clientId, opts.clientSecret, code, redirectUri);
                const stored: StoredTokens = {
                    clientId: opts.clientId,
                    clientSecret: opts.clientSecret,
                    redirectUri,
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token,
                    expiresAt: Date.now() + tokens.expires_in * 1000,
                };
                await writeTokens(stored);
                this.#tokens = stored;
                console.error(`[oura-mcp] Tokens saved to: ${tokenFilePath()}`);
            } catch (err) {
                pending.lastError = err instanceof Error ? err.message : String(err);
                console.error(`[oura-mcp] Token exchange failed: ${pending.lastError}`);
                return new Response("Token exchange failed. You can close this window.", {
                    headers: { "content-type": "text/plain" },
                });
            } finally {
                queueMicrotask(() => void this.#cancelPending());
            }

            return new Response(
                "Authorization successful! You can close this window and return to your MCP client.",
                { headers: { "content-type": "text/plain" } },
            );
        });

        pending.server = server;
        pending.timeoutId = setTimeout(() => {
            pending.lastError = "Authorization timed out — no callback received within 5 minutes.";
            console.error(`[oura-mcp] ${pending.lastError}`);
            void this.#cancelPending();
        }, AUTHORIZE_TIMEOUT_MS);

        this.#pending = pending;

        const authUrl = generateAuthUrl(opts.clientId, [...SCOPES], redirectUri);

        console.error("[oura-mcp] Authorization started.");
        console.error(`[oura-mcp] Visit: ${authUrl}`);

        void openBrowser(authUrl);

        return {
            authUrl,
            callbackPort: opts.callbackPort,
            expiresInSeconds: Math.floor(AUTHORIZE_TIMEOUT_MS / 1000),
        };
    }

    async #cancelPending(): Promise<void> {
        const pending = this.#pending;
        if (!pending) return;
        this.#pending = null;
        clearTimeout(pending.timeoutId);
        try {
            await pending.server.shutdown();
        } catch { /* already shut down */ }
    }
}

async function openBrowser(url: string): Promise<void> {
    const attempts: Array<{ cmd: string; args: string[] }> = [];

    if (Deno.build.os === "windows") {
        // Multiple Windows strategies because `cmd /c start` from an
        // Electron-spawned subprocess can silently no-op.
        attempts.push(
            { cmd: "rundll32.exe", args: ["url.dll,FileProtocolHandler", url] },
            { cmd: "cmd.exe", args: ["/c", "start", "", url] },
            { cmd: "explorer.exe", args: [url] },
        );
    } else if (Deno.build.os === "darwin") {
        attempts.push({ cmd: "open", args: [url] });
    } else {
        attempts.push({ cmd: "xdg-open", args: [url] });
    }

    for (const attempt of attempts) {
        try {
            const result = await new Deno.Command(attempt.cmd, {
                args: attempt.args,
                stderr: "null",
                stdout: "null",
            }).output();
            // explorer.exe returns 1 even on success; treat any non-throwing spawn as good enough.
            if (result.success || attempt.cmd === "explorer.exe") return;
        } catch { /* fall through to next strategy */ }
    }
}
