/**
 * Client-side OAuth development server for quick token generation.
 *
 * This server implements the implicit grant OAuth flow (client-side only)
 * for development and testing purposes. It provides a simple web interface
 * to generate access tokens without refresh token capability.
 *
 * @example
 * ```bash
 * deno run --allow-net examples/client-oauth.ts
 * ```
 */

import type { OAuthScope } from "../src/OuraOAuth.ts";

// Configuration
const CLIENT_ID = ""; // Replace with your actual client ID or supply it in the development server webpage
const REDIRECT_URI = "http://localhost:3000/callback";
const SCOPES: OAuthScope[] = ["email", "personal", "daily"];
const PORT = 3000;

/**
 * Create CSS styles for the application
 */
function getStyles(): string {
    return `
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .success { color: #28a745; }
        .error { color: #dc3545; }
        .token-display {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            font-family: monospace;
            word-break: break-all;
            margin: 10px 0;
            border: 1px solid #dee2e6;
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
        }
        button:hover {
            background: #0056b3;
        }
        .info {
            background: #e7f3ff;
            padding: 15px;
            border-radius: 4px;
            margin: 10px 0;
        }
        .warning {
            background: #fff3cd;
            padding: 15px;
            border-radius: 4px;
            margin: 10px 0;
            border: 1px solid #ffeaa7;
        }
        .status {
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
        }
        .status.success { background: #d4edda; border: 1px solid #c3e6cb; }
        .status.error { background: #f8d7da; border: 1px solid #f5c6cb; }
        .status.info { background: #d1ecf1; border: 1px solid #bee5eb; }
    `;
}

/**
 * Create the main page HTML
 */
function createMainPage(): string {
    const styles = getStyles();
    const scopesText = SCOPES.join(" ");

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Oura OAuth Development Server</title>
    <style>${styles}</style>
</head>
<body>
    <div class="container">
        <h1>🚀 Oura OAuth Development Server</h1>
        
        <div id="clientIdSection">
            <div class="warning" id="clientIdWarning" style="display: none;">
                <strong>⚠️ Configuration Required:</strong> 
                <div style="margin: 15px 0;">
                    <label for="clientIdInput">Client ID:</label><br>
                    <input type="text" id="clientIdInput" placeholder="Enter your Oura Client ID" style="width: 300px; padding: 8px; margin: 5px 0; border: 1px solid #ccc; border-radius: 4px;">
                    <button onclick="setClientId()">Set Client ID</button>
                </div>
                <div style="margin: 15px 0;">
                    <label for="scopesInput">Scopes (space-separated):</label><br>
                    <input type="text" id="scopesInput" value="${scopesText}" style="width: 300px; padding: 8px; margin: 5px 0; border: 1px solid #ccc; border-radius: 4px;">
                    <button onclick="setScopes()">Set Scopes</button>
                </div>
                <p style="margin-top: 10px; font-size: 14px; color: #666;">
                    You can find your Client ID in your <a href="https://cloud.ouraring.com/oauth/applications" target="_blank">Oura OAuth Applications</a> page.
                </p>
            </div>
            <div class="info" id="clientIdReady">
                <strong>✅ Ready to go!</strong> Your configuration is ready for OAuth testing.
            </div>
        </div>
        
        <h2>Quick Start</h2>
        <p>Click the button below to start the OAuth flow:</p>
        <button id="oauthButton" onclick="startOAuthFlow()">🔐 Start OAuth Flow</button>
        
        <h2>📋 Instructions</h2>
        <div class="info">
            <p><strong>How to get your access token:</strong></p>
            <ol>
                <li>Set your Client ID and Scopes above, if not already set by the server code</li>
                <li>Click "Start OAuth Flow" above</li>
                <li>A new tab will open with Oura's authorization page</li>
                <li>Log in and authorize your app</li>
                <li>You'll be redirected to a callback page with your token</li>
                <li>Click "Copy Token & Close" to copy the token and close the tab</li>
                <li>Paste the token wherever you need it</li>
            </ol>
            <p><strong>Note:</strong> Tokens expire in 30 days and require re-authentication.</p>
        </div>
    </div>
    
    <div class="container">
        <h2>🔧 Development Info</h2>
        <div class="info">
            <p><strong>Client ID:</strong> ${CLIENT_ID}</p>
            <p><strong>Redirect URI:</strong> ${REDIRECT_URI}</p>
            <p><strong>Scopes:</strong> ${SCOPES.join(", ")}</p>
            <p><strong>Server Port:</strong> ${PORT}</p>
        </div>
        
        <div class="warning">
            <strong>💡 Development Tips:</strong>
            <ul>
                <li>Tokens expire in 30 days</li>
                <li>This is for development only - don't use in production</li>
            </ul>
        </div>
    </div>
    
    <script>
        let currentClientId = '${CLIENT_ID}';
        let currentScopes = ${JSON.stringify(SCOPES)};
        
        if (!currentClientId || currentClientId === 'YOUR_CLIENT_ID_HERE') {
            document.getElementById('clientIdWarning').style.display = 'block';
            document.getElementById('clientIdReady').style.display = 'none';
        }
        
        updateOAuthButton();
        
        function setClientId() {
            const input = document.getElementById('clientIdInput');
            const clientId = input.value.trim();
            
            if (clientId) {
                currentClientId = clientId;
                updateConfiguration();
            } else {
                alert('Please enter a valid Client ID');
            }
        }
        
        function setScopes() {
            const input = document.getElementById('scopesInput');
            const scopesText = input.value.trim();
            
            if (scopesText) {
                currentScopes = scopesText.split(' ').filter(scope => scope.trim());
                updateConfiguration();
            } else {
                alert('Please enter valid scopes');
            }
        }
        
        function updateConfiguration() {
            if (currentClientId && currentScopes.length > 0) {
                document.getElementById('clientIdWarning').style.display = 'none';
                document.getElementById('clientIdReady').style.display = 'block';
                
                updateOAuthButton();
            }
        }
        
        function updateOAuthButton() {
            const button = document.getElementById('oauthButton');
            if (currentClientId && currentScopes.length > 0) {
                button.disabled = false;
                button.textContent = '🔐 Start OAuth Flow';
            } else {
                button.disabled = true;
                button.textContent = '🔐 Configure First';
            }
        }
        
        function startOAuthFlow() {
            if (!currentClientId) {
                alert('Please set your Client ID first');
                return;
            }
            
            if (window.oauthWindow && !window.oauthWindow.closed) {
                window.oauthWindow.close();
            }
            
            const authUrl = generateAuthUrl(currentClientId);
            
            window.oauthWindow = window.open(authUrl, '_blank');
        }
        
        function generateAuthUrl(clientId) {
            const redirectUri = '${REDIRECT_URI}';
            const state = Math.random().toString(36).substring(2, 15);
            
            const params = new URLSearchParams({
                response_type: 'token',
                client_id: clientId,
                redirect_uri: redirectUri,
                scope: currentScopes.join(' '),
                state: state
            });
            
            return \`https://cloud.ouraring.com/oauth/authorize?\${params.toString()}\`;
        }
        
        function copyToken() {
            const tokenElement = document.querySelector('.token-display');
            if (tokenElement) {
                const textArea = document.createElement('textarea');
                textArea.value = tokenElement.textContent;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
                const button = event.target;
                const originalText = button.textContent;
                button.textContent = '✅ Copied!';
                setTimeout(() => {
                    button.textContent = originalText;
                }, 2000);
            }
        }
        
        function refreshPage() {
            location.reload();
        }
    </script>
</body>
</html>`;
}

/**
 * Create the callback page HTML
 */
function createCallbackPage(): string {
    const styles = getStyles();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Oura OAuth Callback</title>
    <style>${styles}</style>
</head>
<body>
    <div class="container">
        <h1>Oura OAuth Callback</h1>
        <div id="content">
            <div class="loading">
                <p>Processing OAuth response...</p>
            </div>
        </div>
    </div>

    <script>
        function parseFragment() {
            const fragment = window.location.hash.substring(1);
            const params = new URLSearchParams(fragment);
            
            console.log('Fragment:', fragment);
            console.log('Params:', params);
            
            if (params.has('error')) {
                document.getElementById('content').innerHTML = \`
                    <h2 class="error">❌ Authorization Failed</h2>
                    <p><strong>Error:</strong> \${params.get('error')}</p>
                    \${params.get('state') ? \`<p><strong>State:</strong> \${params.get('state')}</p>\` : ''}
                    <button onclick="window.close()">❌ Close Window</button>
                \`;
                return;
            }
            
            if (params.has('access_token')) {
                const token = params.get('access_token');
                const expiresIn = params.get('expires_in');
                const scope = params.get('scope');
                const state = params.get('state');
                
                const expiresDate = new Date(Date.now() + (parseInt(expiresIn) * 1000));
                
                document.getElementById('content').innerHTML = \`
                    <h2 class="success">✅ Authorization Successful!</h2>
                    
                    <div class="info">
                        <p><strong>Token expires:</strong> \${expiresDate}</p>
                        <p><strong>Scopes:</strong> \${scope || 'All scopes'}</p>
                        \${state ? \`<p><strong>State:</strong> \${state}</p>\` : ''}
                    </div>
                    
                    <h3>Access Token:</h3>
                    <div class="token-display" id="token">\${token}</div>
                    
                    <button onclick="copyAndClose()">📋 Copy Token & Close</button>
                    
                    <div class="info">
                        <p><strong>Note:</strong> This token will expire in 30 days. You'll need to re-authenticate after that.</p>
                    </div>
                \`;
            } else {
                document.getElementById('content').innerHTML = \`
                    <h2 class="error">❌ Invalid Response</h2>
                    <p>No access token found in the response.</p>
                    <p>Fragment: \${fragment}</p>
                    <button onclick="window.close()">❌ Close Window</button>
                \`;
            }
        }
        
        function copyAndClose() {
            const tokenElement = document.getElementById('token');
            if (tokenElement) {
                const textArea = document.createElement('textarea');
                textArea.value = tokenElement.textContent;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
                const button = event.target;
                const originalText = button.textContent;
                button.textContent = '✅ Copied!';
                
                setTimeout(() => {
                    window.close();
                }, 1000);
            }
        }
        
        parseFragment();
    </script>
</body>
</html>`;
}

/**
 * HTTP request handler
 */
async function handler(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;

    switch (path) {
        case "/":
            return new Response(createMainPage(), {
                headers: { "Content-Type": "text/html; charset=utf-8" },
            });

        case "/callback":
            return new Response(createCallbackPage(), {
                headers: { "Content-Type": "text/html; charset=utf-8" },
            });

        default:
            return new Response("Not Found", { status: 404 });
    }
}

/**
 * Main function
 */
async function main() {
    console.log(`🚀 Starting Oura OAuth development server on port ${PORT}`);
    console.log(`📱 Open http://localhost:${PORT} in your browser`);
    console.log(`\n💡 Remember to set ${REDIRECT_URI} as your redirect URI in Oura app settings`);
    console.log(`\n⏳ Server running... (Press Ctrl+C to stop)`);

    Deno.serve({ port: PORT }, handler);
}

if (import.meta.main) {
    await main();
}
