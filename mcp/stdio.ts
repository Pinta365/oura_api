/**
 * Oura MCP Server — stdio transport
 *
 * Spawned by Claude Desktop (or similar) as a subprocess. Authorization is
 * driven by the `oura_authorize` tool; tokens persist to disk between runs.
 *
 * See MCP.md for setup and env vars.
 */

import { McpServer } from "npm:@modelcontextprotocol/sdk@^1.18.0/server/mcp.js";
import { StdioServerTransport } from "npm:@modelcontextprotocol/sdk@^1.18.0/server/stdio.js";
import OuraOAuth from "../src/OuraOAuth.ts";
import { TokenManager } from "./token_manager.ts";
import { registerTools } from "./tools.ts";

const CALLBACK_PORT = parseInt(Deno.env.get("OURA_CALLBACK_PORT") || "3456");

const tokens = new TokenManager();
await tokens.load();

const ENV_CLIENT_ID = Deno.env.get("OURA_CLIENT_ID");
const ENV_CLIENT_SECRET = Deno.env.get("OURA_CLIENT_SECRET");
const storedCreds = tokens.getCredentials();

const bootstrapCredentials = ENV_CLIENT_ID && ENV_CLIENT_SECRET
    ? { clientId: ENV_CLIENT_ID, clientSecret: ENV_CLIENT_SECRET }
    : null;

if (!tokens.isAuthorized() && !bootstrapCredentials) {
    console.error(
        "[oura-mcp] No saved tokens and no OURA_CLIENT_ID/OURA_CLIENT_SECRET in environment. " +
            "Calls to oura_authorize will fail until those are set.",
    );
} else if (!tokens.isAuthorized()) {
    console.error("[oura-mcp] No saved tokens yet. Call the `oura_authorize` tool to grant access.");
}

// OuraOAuth's constructor requires non-empty credentials, but only the data
// methods (which take an access token explicitly) are used here. Seed it with
// placeholders if the user hasn't authorized yet.
const seedCreds = storedCreds ?? {
    clientId: ENV_CLIENT_ID ?? "pending",
    clientSecret: ENV_CLIENT_SECRET ?? "pending",
    redirectUri: `http://localhost:${CALLBACK_PORT}/callback`,
};

const ouraClient = new OuraOAuth({
    clientId: seedCreds.clientId,
    clientSecret: seedCreds.clientSecret,
    redirectUri: seedCreds.redirectUri,
});

const server = new McpServer({ name: "oura-mcp", version: "0.1.0" });
registerTools(server, ouraClient, {
    tokens,
    bootstrapCredentials,
    callbackPort: CALLBACK_PORT,
});

const transport = new StdioServerTransport();
await server.connect(transport);
