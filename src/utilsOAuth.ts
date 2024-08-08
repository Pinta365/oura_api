import { API_URLS, APIError } from "./utils.ts";

/**
 * Represents the response from an OAuth2 token exchange or refresh request.
 */
export interface OAuth2TokenResponse {
    /**
     * The access token used to authenticate API requests.
     */
    access_token: string;
    /**
     * The lifetime of the access token in seconds.
     */
    expires_in: number;
    /**
     * The refresh token used to obtain a new access token when the current one expires.
     */
    refresh_token: string;
    /**
     * The type of the token, which is typically "bearer" for OAuth2.
     */
    token_type: "bearer";
}

/**
 * Generates the authorization URL for the Oura P.OAuth2 flow.
 *
 * @param {string} clientId - Your Oura API client ID.
 * @param {string[]} scopes - An array of scopes to request access to (e.g., ['email', 'daily']).
 * @param {string} [redirectUri] - The redirect URI where Oura will send the user after authorization.
 * @param {string} [state] - An optional state parameter for security and session management.
 * @returns {string} The authorization URL.
 */
export function generateAuthUrl(
    clientId: string,
    scopes: string[],
    redirectUri?: string,
    state?: string,
): string {
    const params = new URLSearchParams({
        response_type: "code",
        client_id: clientId,
        redirect_uri: redirectUri || "",
        scope: scopes.join(" "),
        state: state || "",
    });

    return `${API_URLS.oauth.authorize}?${params.toString()}`;
}

/**
 * Exchanges an authorization code for an access token and refresh token.
 *
 * @param {string} clientId - Your Oura API client ID.
 * @param {string} clientSecret - Your Oura API client secret.
 * @param {string} code - The authorization code received from Oura.
 * @param {string} [redirectUri] - The redirect URI used during authorization (optional if not provided earlier).
 * @returns {Promise<OAuth2TokenResponse>} A promise that resolves with the token response.
 */
export async function getTokens(
    clientId: string,
    clientSecret: string,
    code: string,
    redirectUri?: string,
): Promise<OAuth2TokenResponse> {
    const params = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri || "",
        client_id: clientId,
        client_secret: clientSecret,
    });

    const response = await fetch(API_URLS.oauth.token, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
    });

    if (!response.ok) {
        throw new APIError(
            "Failed to exchange code for token.",
            response.status,
            response.statusText,
            await response.text(),
            API_URLS.oauth.token,
            "POST",
        );
    }

    return response.json();
}

/**
 * Refreshes the access token using the refresh token.
 *
 * @param {string} clientId - Your Oura API client ID.
 * @param {string} clientSecret - Your Oura API client secret.
 * @param {string} refreshToken - The refresh token received during the initial token exchange.
 * @returns {Promise<OAuth2TokenResponse>} A promise that resolves with the new token response.
 */
export async function refreshToken(
    clientId: string,
    clientSecret: string,
    refreshToken: string,
): Promise<OAuth2TokenResponse> {
    const params = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
    });

    const response = await fetch(API_URLS.oauth.token, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
    });

    if (!response.ok) {
        throw new APIError(
            "Failed to refresh token.",
            response.status,
            response.statusText,
            await response.text(),
            API_URLS.oauth.token,
            "POST",
        );
    }

    return response.json();
}

/**
 * Revokes an Oura access token.
 *
 * @param {string} accessToken - The access token to revoke.
 * @returns {Promise<boolean>} A promise that resolves when the token is successfully revoked.
 * @throws {APIError} If there's an error revoking the token.
 */
export async function revokeToken(accessToken: string): Promise<boolean> {
    const response = await fetch(
        `${API_URLS.oauth.revokeToken}?access_token=${accessToken}`,
        {
            method: "POST",
        },
    );

    if (!response.ok) {
        throw new APIError(
            "Failed to revoke token.",
            response.status,
            response.statusText,
            await response.text(),
            `${API_URLS.oauth.revokeToken}?access_token=${accessToken}`,
            "POST",
        );
    }

    return true;
}
