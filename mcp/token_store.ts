/**
 * File-based token storage for the stdio MCP server.
 *
 * Tokens are stored in the platform-appropriate config directory:
 *   Windows : %APPDATA%\oura-mcp\tokens.json
 *   macOS   : ~/Library/Application Support/oura-mcp/tokens.json
 *   Linux   : $XDG_CONFIG_HOME/oura-mcp/tokens.json  (fallback: ~/.config)
 */

export interface StoredTokens {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    accessToken: string;
    refreshToken: string;
    /** Unix timestamp (ms) when the Oura access token expires. */
    expiresAt: number;
}

function getTokenFilePath(): string {
    const sep = Deno.build.os === "windows" ? "\\" : "/";
    let base: string;

    if (Deno.build.os === "windows") {
        base = Deno.env.get("APPDATA") ||
            (Deno.env.get("USERPROFILE") || "") + sep + "AppData" + sep + "Roaming";
    } else if (Deno.build.os === "darwin") {
        base = (Deno.env.get("HOME") || "") + sep + "Library" + sep + "Application Support";
    } else {
        base = Deno.env.get("XDG_CONFIG_HOME") ||
            ((Deno.env.get("HOME") || "") + sep + ".config");
    }

    return [base, "oura-mcp", "tokens.json"].join(sep);
}

export async function readTokens(): Promise<StoredTokens | null> {
    try {
        const text = await Deno.readTextFile(getTokenFilePath());
        return JSON.parse(text) as StoredTokens;
    } catch {
        return null;
    }
}

export async function writeTokens(tokens: StoredTokens): Promise<void> {
    const filePath = getTokenFilePath();
    const sep = Deno.build.os === "windows" ? "\\" : "/";
    const dir = filePath.split(sep).slice(0, -1).join(sep);
    await Deno.mkdir(dir, { recursive: true });
    await Deno.writeTextFile(filePath, JSON.stringify(tokens, null, 2));
}

export function tokenFilePath(): string {
    return getTokenFilePath();
}
