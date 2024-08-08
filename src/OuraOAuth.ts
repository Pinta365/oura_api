/**
 * Class containing all the methods to access the Oura API with OAuth2 Authentication.
 *
 * @class OuraOAuth
 * @author Pinta <https://github.com/Pinta365>
 * @license MIT
 */

import OuraBase from "./OuraBase.ts";
import type { ApiOptionsBase } from "./OuraBase.ts";
import { generateAuthUrl, getTokens, type OAuth2TokenResponse, refreshToken, revokeToken } from "./utilsOAuth.ts";
import { MissingClientIdError, MissingClientSecretError, MissingRedirectUriError, MissingTokenError } from "./utils.ts";
/**
 * Options for configuring the Oura OAuth API client.
 */
interface ApiOptionsOAuth extends ApiOptionsBase {
    /** Oura API client ID. */
    clientId?: string;
    /** Oura API client secret. */
    clientSecret?: string;
    /** The redirect URI where Oura will send the user after authorization. */
    redirectUri?: string;
}

/**
 * Base class for the OuraOAuth API.
 * Class containing all the methods to access the Oura API with OAuth2 Authentication.
 */
class OuraOAuth extends OuraBase {
    #clientId: string | undefined;
    #clientSecret: string | undefined;
    #redirectUri: string | undefined;

    /**
     * Creates a new Oura API client.
     *
     * @constructor
     * @param {ApiOptionsOAuth} options - Options object containing the configuration settings.
     * @throws {MissingClientIdError} If the `clientId` option is missing.
     * @throws {MissingClientSecretError} If the `clientSecret` option is missing.
     * @throws {MissingRedirectUriError} If the `redirectUri` option is missing.
     */
    constructor(options: ApiOptionsOAuth) {
        super(options);

        if (!options.clientId) {
            throw new MissingClientIdError();
        }
        if (!options.clientSecret) {
            throw new MissingClientSecretError();
        }
        if (!options.redirectUri) {
            throw new MissingRedirectUriError();
        }

        this.#clientId = options.clientId;
        this.#clientSecret = options.clientSecret;
        this.#redirectUri = options.redirectUri;
    }

    /**
     * Fetches data from the Oura API using an OAuth2 access token.
     *
     * @protected
     * @param {string} endpoint - The API endpoint URL.
     * @param {Record<string, string>} [params] - Optional query parameters.
     * @param {string} accessToken - Access token required for OAuth-driven calls.
     * @returns {Promise<unknown>} A promise that resolves with the fetched data (either an array or a single object).
     * @throws {MissingTokenError} If the `accessToken` is missing.
     */
    protected fetchData(
        endpoint: string,
        params?: Record<string, string>,
        accessToken?: string,
    ): Promise<unknown> {
        if (!accessToken) {
            throw new MissingTokenError();
        }
        return this.getAll(accessToken, endpoint, params);
    }

    /**
     * Generates the authorization URL for the Oura OAuth2 flow.
     *
     * @param {string[]} scopes - An array of scopes to request access to (e.g., ['email', 'daily']).
     * @param {string} [state] - An optional state parameter for security and session management.
     * @returns {string} The authorization URL.
     */
    generateAuthUrl(scopes: string[], state?: string): string {
        return generateAuthUrl(this.#clientId!, scopes, this.#redirectUri, state);
    }

    /**
     * Exchanges an authorization code for an access token and refresh token.
     *
     * @param {string} code - The authorization code received from Oura.
     * @returns {Promise<OAuth2TokenResponse>} A promise that resolves with the token response.
     */
    async exchangeCodeForToken(code: string): Promise<OAuth2TokenResponse> {
        const tokenData = await getTokens(
            this.#clientId!,
            this.#clientSecret!,
            code,
            this.#redirectUri,
        );
        return tokenData;
    }

    /**
     * Refreshes an expired OAuth2 access token using a refresh token.
     *
     * @param {string} suppliedRefreshToken - The refresh token obtained during the initial OAuth2 authorization.
     * @returns {Promise<OAuth2TokenResponse>} A promise that resolves with a new access token and (potentially) a new refresh token.
     */
    async refreshAccessToken(suppliedRefreshToken: string): Promise<OAuth2TokenResponse> {
        const tokenData = await refreshToken(
            this.#clientId!,
            this.#clientSecret!,
            suppliedRefreshToken,
        );
        return tokenData;
    }

    /**
     * Revoke an OAuth2 access token.
     *
     * @param {string} accessToken - The access token to revoke.
     * @returns {Promise<boolean>} A promise that resolves when the token is successfully revoked.
     */
    async revokeAccessToken(accessToken: string): Promise<boolean> {
        return await revokeToken(accessToken);
    }
}

export default OuraOAuth;
