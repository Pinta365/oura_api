/**
 * Full OAuth 2.0 server implementation with refresh token capability.
 *
 * This server implements the complete OAuth 2.0 authorization code flow
 * with token management and refresh tokens.
 * It demonstrates the full OAuth library functionality using Hono framework.
 *
 * @example
 * ```bash
 * deno run --allow-net examples/full-oauth-server.ts
 * ```
 */

import { Hono } from "jsr:@hono/hono";
import { type OAuthScope, OuraOAuth } from "jsr:@pinta365/oura-api";
import type { OAuth2TokenResponse } from "../src/utilsOAuth.ts";

const app = new Hono();
const clientId = "REPLACE_WITH_YOUR_CLIENT_ID"; // Replace this with your client id
const clientSecret = "REPLACE_WITH_YOUR_CLIENT_SECRET"; // Replace this with your client secret
const redirectUri = "http://localhost:8000/callback"; // Replace this with your redirect callback url

// Simple in-memory storage for demo purposes
// In production, use a proper database or secure session storage
let storedTokens: OAuth2TokenResponse | null = null;
let storedPersonalInfo: any = null;

/**
 * Just a simple layout template used to display the page.
 */
const generatePage = (content: string) => {
    return `
  <!DOCTYPE html>
  <html>
      <head>
          <title>@pinta365/oura_api</title>
          <style>
              body { 
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                  text-align: center; 
                  margin: 0;
                  padding: 20px;
                  background-color: #f5f5f5;
                  min-height: 100vh;
              }
              .container {
                  max-width: 800px;
                  margin: 0 auto;
                  background: white;
                  padding: 30px;
                  border-radius: 8px;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                  margin-bottom: 20px;
              }
              h1 { 
                  color: #333;
                  margin-bottom: 10px;
              }
              p { 
                  color: #666;
                  line-height: 1.6;
                  margin: 10px 0;
              }
              button {
                  background: #007bff;
                  color: white;
                  border: none;
                  padding: 12px 24px;
                  border-radius: 4px;
                  cursor: pointer;
                  margin: 5px;
                  font-size: 16px;
                  text-decoration: none;
                  display: inline-block;
              }
              button:hover {
                  background: #0056b3;
              }
              .error { 
                  color: #dc3545; 
                  font-weight: bold;
                  background: #f8d7da;
                  padding: 15px;
                  border-radius: 4px;
                  border: 1px solid #f5c6cb;
                  margin: 10px 0;
              }
              .success { 
                  color: #28a745; 
                  font-weight: bold;
                  background: #d4edda;
                  padding: 15px;
                  border-radius: 4px;
                  border: 1px solid #c3e6cb;
                  margin: 10px 0;
              }
              .token-display {
                  background: #f8f9fa;
                  padding: 15px;
                  border-radius: 4px;
                  font-family: monospace;
                  word-break: break-all;
                  margin: 10px 0;
                  border: 1px solid #dee2e6;
                  text-align: left;
              }
              .logged-in-section {
                  background: #e8f5e8;
                  padding: 20px;
                  border-radius: 8px;
                  margin: 20px 0;
                  border: 1px solid #c3e6cb;
              }
              .auth-section {
                  background: #e7f3ff;
                  padding: 20px;
                  border-radius: 8px;
                  margin: 20px 0;
                  border: 1px solid #bee5eb;
              }
              footer { 
                  position: fixed; 
                  left: 0; 
                  bottom: 0; 
                  width: 100%; 
                  background-color: #f0f0f0; 
                  padding: 10px; 
                  text-align: center;
                  border-top: 1px solid #dee2e6;
              }
              footer a { 
                  margin: 0 10px; 
                  text-decoration: none; 
                  color: #333;
              }
              footer a:hover {
                  color: #007bff;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>🚀 Oura OAuth 2.0 Demo</h1>
              <p>This is a complete example demonstrating the @pinta365/oura_api OAuth 2.0 functionality.</p>
              <p>Click the button below to authenticate and get access to the Oura API.</p>
              ${content}
          </div>
          <footer>
            <a href="https://github.com/Pinta365/oura_api" target="_blank">Source Code on GitHub</a> |
            <a href="https://discord.gg/J7QtVxAt6F" target="_blank">Reach out on Discord</a>
          </footer>
      </body>
  </html>
  `;
};

/**
 * Configure the Oura lib to use OAuth.
 */
const oura = new OuraOAuth({ clientId, clientSecret, redirectUri });

/**
 * Root route.
 * Generates a page with a button to initiate authentication.
 *
 * If we got redirected here with an "error" query parameter print an error.
 */
app.get("/", (c) => {
    const error = c.req.query("error");
    const message = c.req.query("message");

    if (error) {
        // Handle authentication error (e.g., user denied access)
        const html = generatePage(
            `<div class="error">❌ Error: ${error}</div><a href="/"><button>🔄 Restart</button></a>`,
        );
        return c.html(html);
    } else if (message) {
        // Handle success message
        const html = generatePage(
            `<div class="success">✅ ${message}</div><a href="/"><button>🔄 Continue</button></a>`,
        );
        return c.html(html);
    } else {
        // Define the required Oura API data scopes (permissions)
        // See: https://cloud.ouraring.com/docs/authentication#oauth2-scopes
        const scopes: OAuthScope[] = ["personal"];

        // **Important Security Note:** In a production environment, you should
        // generate unique and random state values and securely store the value
        // server-side (e.g., in an encrypted session) and verify it upon receiving
        // the callback to prevent CSRF attacks.
        const state = Math.random().toString(36).substring(2, 15);

        // Generate the URL that initiate authentication. Based on your scopes and state.
        const authUrl = oura.generateAuthUrl(scopes, state);

        // Check if we have stored tokens (user is "logged in")
        if (storedTokens) {
            let personalInfoHtml = "";
            if (storedPersonalInfo) {
                personalInfoHtml = '<div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #c3e6cb;">' +
                    "<h4>👤 Personal Information</h4>" +
                    '<div class="token-display">' +
                    JSON.stringify(storedPersonalInfo, null, 2) +
                    "</div>" +
                    "</div>";
            }

            const html = generatePage(
                '<div class="logged-in-section">' +
                    "<h3>✅ Successfully Authenticated</h3>" +
                    "<p><strong>Access Token:</strong></p>" +
                    '<div class="token-display">' +
                    storedTokens.access_token +
                    "</div>" +
                    "<p><strong>Refresh Token:</strong></p>" +
                    '<div class="token-display">' +
                    storedTokens.refresh_token +
                    "</div>" +
                    personalInfoHtml +
                    '<div style="margin-top: 20px;">' +
                    '<a href="/refresh"><button style="background: #28a745; margin-right: 10px;">🔄 Refresh Token</button></a>' +
                    '<a href="/logout"><button style="background: #dc3545;">🚪 Logout</button></a>' +
                    "</div>" +
                    "</div>",
            );
            return c.html(html);
        } else {
            // Generate and return the page html.
            const html = generatePage(
                `<div class="auth-section">
                    <h3>🔐 Ready to Authenticate</h3>
                    <p>Click the button below to start the OAuth 2.0 flow and get your access tokens.</p>
                    <a href="${authUrl}"><button>🔐 Authenticate with Oura</button></a>
                </div>`,
            );
            return c.html(html);
        }
    }
});

/**
 * Callback route used to redirect to from the Oura authentication.
 *
 * "code" is exchanged for the access and refresh tokens and used to
 * retrieve the personal information.
 */
app.get("/callback", async (c) => {
    const error = c.req.query("error");
    const code = c.req.query("code");

    if (error) {
        // We got an error instead of a code.
        return c.redirect(`/?error=${error}`);
    }

    //  You want to validate that the state is correct for session management
    //const state = c.req.query("state");

    // Exchange the code for access and refresh tokens.
    // In a real application, you would typically store these tokens securely
    // (e.g., in a database or session) for future use.
    const tokens = await oura.exchangeCodeForToken(code!);

    // Store tokens for demo purposes
    storedTokens = tokens;

    // Request the personal information with the access token.
    const personal = await oura.getPersonalInfo(tokens.access_token);

    // Store personal info for demo purposes
    storedPersonalInfo = personal;

    // You can revoke an access token with revokeAccessToken() if you need.
    //await oura.revokeAccessToken(tokens.access_token);

    // Redirect to home page to show tokens and personal info
    return c.redirect("/");
});

/**
 * Refresh token route.
 * Uses the stored refresh token to get a new access token.
 */
app.get("/refresh", async (c) => {
    if (!storedTokens) {
        return c.redirect("/?error=No tokens available");
    }

    try {
        // Use the refresh token to get a new access token
        const newTokens = await oura.refreshAccessToken(storedTokens.refresh_token);

        // Update stored tokens for demo purposes
        storedTokens = newTokens;

        return c.redirect("/?message=Token refreshed successfully");
    } catch (error) {
        console.error("Failed to refresh token:", error);
        return c.redirect("/?error=Failed to refresh token");
    }
});

/**
 * Logout route.
 * Clears stored tokens.
 */
app.get("/logout", (c) => {
    storedTokens = null;
    storedPersonalInfo = null;
    return c.redirect("/?message=Logged out successfully");
});

Deno.serve(app.fetch);
