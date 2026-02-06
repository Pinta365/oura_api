# OURA_API

Interact with v2 of the [Oura API](https://cloud.ouraring.com/v2/docs) using Access Token, OAuth2 or the Sandbox
environment.

Available as:

- ESM module: [JSR](https://jsr.io/@pinta365/oura-api)
- CommonJS module: [NPM](https://www.npmjs.com/package/oura_api)

---

## ⚠️ Personal Access Tokens (PATs) no longer supported

**The Oura API platform has deprecated direct Personal Access Tokens.** Authentication is now done via **OAuth2** only.

**For development and testing:**

- **Development server:** Run `deno run --allow-net examples/client-oauth.ts` to obtain OAuth2 access tokens
- **Sandbox mode:** Use the sandbox environment for testing without real data (see Sandbox Environment section below)

**For production,** use OAuth2 as described in the authentication section below.

---

## ⚡️ Quickstart

**Installation**

```bash
# Deno
deno add jsr:@pinta365/oura-api

# Bun
bunx jsr add @pinta365/oura-api

# Node.js
npx jsr add @pinta365/oura-api

# NPM (CommonJS)
npm install oura_api --save
```

**Basic Usage (ESM)**

```javascript
import { Oura } from "@pinta365/oura-api";

const accessToken = "YOUR_ACCESS_TOKEN";
const oura = new Oura(accessToken);

const personalInfo = await oura.getPersonalInfo();
console.log(personalInfo);
```

**Basic Usage (CommonJS)**

```javascript
const { Oura } = require("oura_api");
// ... (same as above)
```

**See the `examples` folder for more detailed implementations.**

## 🧪 Sandbox Environment (Testing)

The Oura API's sandbox environment ([Docs](https://cloud.ouraring.com/v2/docs#tag/Sandbox-Routes)) is perfect for
development. It provides sample data so you don't need a real Oura account to test your application.

```javascript
const ouraSandboxClient = new Oura({ useSandbox: true });
// ...Make API calls with `ouraSandboxClient`
```

## 🔑 OAuth2 Support

Our library simplifies OAuth2 authentication with these functions:

- `generateAuthUrl(scopes: string[], state?: string): string`
  - Generates the authorization URL for the user.

- `async exchangeCodeForToken(code: string): Promise<OAuth2TokenResponse>`
  - Exchanges the received authorization code for access and refresh tokens.

- `async refreshAccessToken(suppliedRefreshToken: string): Promise<OAuth2TokenResponse>`
  - Refreshes an expired access token.

- `async revokeAccessToken(accessToken: string): Promise<boolean>`
  - Revokes the specified access token.

**Example Usage (Simplified)** See the `examples` folder and `full-oauth-server.ts` for a basic implementation using
Hono.

```javascript
import { OuraOAuth } from "@pinta365/oura-api";

const oura = new OuraOAuth({
    clientId: "YOUR_CLIENT_ID",
    clientSecret: "YOUR_CLIENT_SECRET",
    redirectUri: "http://localhost:8000/callback",
});

// 1. Generate the authorization URL with the personal scope
const authUrl = oura.generateAuthUrl(["personal"]);

// 2. Redirect the user to `authUrl`
// ... (Implementation in your web application)

// 3. In your callback route, exchange the code for tokens
app.get("/callback", async (c) => {
    const code = c.req.query("code");
    const tokens = await oura.exchangeCodeForToken(code);

    // ... Store tokens securely and use the access_token for API calls
});
```

## 🚀 Client-Side Only OAuth Flow (Development)

For easy development and testing, we provide sample code for the client-side only OAuth flow (implicit grant). This flow
is perfect for getting Access Tokens quickly during development.

**Development Server:**

Run the included example development server for testing:

```bash
deno run --allow-net examples/client-oauth.ts
```

Then open `http://localhost:3000` in your browser and click "Start OAuth Flow" to get your access token.

**Note:** This flow doesn't support refresh tokens - tokens expire after 30 days and require re-authentication.

## 📑 Documentation

- Full API reference: [JSR Documentation](https://jsr.io/@pinta365/oura-api/doc)

### Included data scopes for v2 of the API.

| Endpoint/Scope                                                                   | Status      |
| :------------------------------------------------------------------------------- | :---------- |
| **[Oura Base docs](https://jsr.io/@pinta365/oura-api/doc/~/Oura)**               |             |
| Daily Activity                                                                   | Implemented |
| Daily Cardiovascular Age                                                         | Implemented |
| Daily Readiness                                                                  | Implemented |
| Daily Resilience                                                                 | Implemented |
| Daily Sleep                                                                      | Implemented |
| Daily Spo2                                                                       | Implemented |
| Daily Stress                                                                     | Implemented |
| Enhanced Tag                                                                     | Implemented |
| Heart Rate                                                                       | Implemented |
| Personal Info                                                                    | Implemented |
| Rest Mode Period                                                                 | Implemented |
| Ring Configuration                                                               | Implemented |
| Session                                                                          | Implemented |
| Sleep                                                                            | Implemented |
| Sleep Time                                                                       | Implemented |
| Tag                                                                              | DEPRECATED  |
| Vo2 Max                                                                          | Implemented |
| Workout                                                                          | Implemented |
| **[Webhook Subscription docs](https://jsr.io/@pinta365/oura-api/doc/~/Webhook)** |             |
| List subscription                                                                | Implemented |
| Create subscription                                                              | Implemented |
| Update subscription                                                              | Implemented |
| Delete subscription                                                              | Implemented |
| Renew subscription                                                               | Implemented |

**Additional info concerning the webhook API**

Webhooks enable near real-time Oura data updates and are recommended for getting the latest information. The
subscription workflow is implemented in this library – see the
[Webhook docs](https://cloud.ouraring.com/v2/docs#tag/Webhook-Subscription-Routes) for details.

⚠️ I have not been able to fully verify this yet but the subscription workflow has been implemented.

## 🐞 Issues

Please report any issues or questions on the [GitHub repository](https://github.com/Pinta365/oura_api/issues).

## 📄 License

MIT License - see the [LICENSE](LICENSE) file.
