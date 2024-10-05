/**
 * This is just a very simplified logic to show the Oauth2 functions.
 *
 * Using Hono as web application framework for this example.
 */

import { Hono } from "jsr:@hono/hono";
import { type OAuthScope, OuraOAuth } from "jsr:@pinta365/oura-api";

const app = new Hono();
const clientId = "REPLACE_WITH_YOUR_CLIENT_ID"; // Replace this with your client id
const clientSecret = "REPLACE_WITH_YOUR_CLIENT_SECRET"; // Replace this with your client secret
const redirectUri = "http://localhost:8000/callback"; // Replace this with your redirect callback url

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
              body { font-family: sans-serif; text-align: center; margin-top: 50px; }
              span { color: red; font-weight: bold; }
              footer { position: fixed; left: 0; bottom: 50px; width: 100%; background-color: #f0f0f0; padding: 10px; text-align: center; }
              footer a { margin: 0 10px; text-decoration: none; color: #333; }
          </style>
      </head>
      <body>
          <h1>Oauth2 Demo</h1>
          <p>This is a minimal example to use @pinta365/oura_api with Oauth2.</p>
          <p>Click button to authenticate and get personal info from the Oura API.</p>
          ${content}
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

    if (error) {
        // Handle authentication error (e.g., user denied access)
        const html = generatePage(
            `<p><span>${error}</span></p><a href="/"><button>Restart</button></a>`,
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
        const state = "random_state_value";

        // Generate the URL that initiate authentication. Based on your scopes and state.
        const authUrl = oura.generateAuthUrl(scopes, state);

        // Generate and return the page html.
        const html = generatePage(
            `<a href="${authUrl}"><button>Authenticate with Oura</button></a>`,
        );
        return c.html(html);
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

    // Request the personal information with the access token.
    const personal = await oura.getPersonalInfo(tokens.access_token);

    // You can revoke an access token with revokeAccessToken() if you need.
    //await oura.revokeAccessToken(tokens.access_token);

    // Generate html.
    const html = generatePage(
        `<p>${JSON.stringify(personal)}</p><a href="/"><button>Restart</button></a>`,
    );
    return c.html(html);
});

Deno.serve(app.fetch);
