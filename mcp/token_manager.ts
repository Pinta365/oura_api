/**
 * Holds the current Oura tokens and runs the OAuth flow on demand for the
 * stdio transport. `beginAuthorize()` is non-blocking — it starts a local
 * callback listener and returns the auth URL synchronously, so the MCP tool
 * can return a clickable link instead of holding the call open while the
 * user authorizes in their browser.
 */

import { generateAuthUrl, getTokens, refreshToken } from "../src/utilsOAuth.ts";
import { readTokens, type StoredTokens, tokenFilePath, writeTokens } from "./token_store.ts";

const SCOPES = ["personal", "daily", "heartrate", "workout", "tag", "session", "spo2Daily"] as const;
const AUTHORIZE_TIMEOUT_MS = 5 * 60 * 1000;

export type AuthStatus = "idle" | "pending" | "authorized";

export interface BeginAuthorizeResult {
    authUrl: string;
    callbackPort: number;
    expiresInSeconds: number;
}

interface PendingFlow {
    server: { shutdown: () => Promise<void> };
    timeoutId?: ReturnType<typeof setTimeout>;
}

export class TokenManager {
    #tokens: StoredTokens | null = null;
    #pending: PendingFlow | null = null;
    #lastError: string | null = null;
    #refreshing: Promise<StoredTokens> | null = null;
    #openBrowser: (url: string) => Promise<void>;

    /** @param options.openBrowser - Override how the auth URL is opened (defaults to the OS browser). */
    constructor(options: { openBrowser?: (url: string) => Promise<void> } = {}) {
        this.#openBrowser = options.openBrowser ?? openBrowser;
    }

    async load(): Promise<void> {
        this.#tokens = await readTokens();
    }

    isAuthorized(): boolean {
        return this.#tokens !== null;
    }

    /** A flow in progress takes precedence, so re-authorizing reports "pending" until it completes. */
    status(): AuthStatus {
        if (this.#pending) return "pending";
        if (this.#tokens) return "authorized";
        return "idle";
    }

    lastAuthError(): string | null {
        return this.#lastError;
    }

    async getAccessToken(): Promise<string | null> {
        if (!this.#tokens) return null;

        if (Date.now() >= this.#tokens.expiresAt - 60_000) {
            // Oura refresh tokens are single-use, so concurrent callers must share one refresh.
            this.#refreshing ??= this.#refresh(this.#tokens).finally(() => {
                this.#refreshing = null;
            });
            return (await this.#refreshing).accessToken;
        }

        return this.#tokens.accessToken;
    }

    async #refresh(current: StoredTokens): Promise<StoredTokens> {
        const refreshed = await refreshToken(current.clientId, current.clientSecret, current.refreshToken);
        const next: StoredTokens = {
            ...current,
            accessToken: refreshed.access_token,
            refreshToken: refreshed.refresh_token,
            expiresAt: Date.now() + refreshed.expires_in * 1000,
        };
        // Don't clobber tokens from a re-authorization that completed while this refresh was in flight.
        if (this.#tokens === current) {
            this.#tokens = next;
            await writeTokens(next);
        }
        return this.#tokens ?? next;
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
        this.#lastError = null;

        const redirectUri = `http://localhost:${opts.callbackPort}/callback`;
        // Ties the callback to this flow so a third-party page can't inject its own code (login CSRF).
        const state = crypto.randomUUID();

        const pending: PendingFlow = {
            server: null as unknown as { shutdown: () => Promise<void> },
        };

        const server = Deno.serve({ port: opts.callbackPort, onListen: () => {} }, async (req) => {
            const url = new URL(req.url);
            if (url.pathname !== "/callback") {
                return new Response("Not found", { status: 404 });
            }
            if (url.searchParams.get("state") !== state) {
                return new Response("Invalid state parameter.", {
                    status: 400,
                    headers: { "content-type": "text/plain" },
                });
            }
            const error = url.searchParams.get("error");
            if (error) {
                this.#lastError = `Oura authorization denied: ${error} — ${
                    url.searchParams.get("error_description") || ""
                }`;
                console.error(`[oura-mcp] ${this.#lastError}`);
                return new Response("Authorization denied. You can close this window.", {
                    headers: { "content-type": "text/plain" },
                });
            }
            const code = url.searchParams.get("code");
            if (!code) {
                this.#lastError = "No authorization code received in callback";
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
                this.#lastError = null;
                console.error(`[oura-mcp] Tokens saved to: ${tokenFilePath()}`);
            } catch (err) {
                this.#lastError = err instanceof Error ? err.message : String(err);
                console.error(`[oura-mcp] Token exchange failed: ${this.#lastError}`);
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
            this.#lastError = "Authorization timed out — no callback received within 5 minutes.";
            console.error(`[oura-mcp] ${this.#lastError}`);
            void this.#cancelPending();
        }, AUTHORIZE_TIMEOUT_MS);

        this.#pending = pending;

        const authUrl = generateAuthUrl(opts.clientId, [...SCOPES], redirectUri, state);

        console.error("[oura-mcp] Authorization started.");
        console.error(`[oura-mcp] Visit: ${authUrl}`);

        void this.#openBrowser(authUrl);

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
