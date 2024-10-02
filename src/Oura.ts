/**
 * Class containing all the methods to access the Oura API with a personal access token.
 *
 * @class Oura
 * @author Pinta <https://github.com/Pinta365>
 * @license MIT
 */

import OuraBase from "./OuraBase.ts";
import type { ApiOptionsBase } from "./OuraBase.ts";
import { MissingTokenError } from "./utils.ts";
/**
 * Options for configuring the Oura API client.
 */
interface ApiOptionsAccessToken extends ApiOptionsBase {
    /** A personal access token generated at the Oura Cloud website. */
    accessToken?: string;
}

/**
 * Base class for the Oura API.
 * Class containing all the methods to access the Oura API with a personal access token.
 */
class Oura extends OuraBase {
    #personalAccesstoken: string | undefined;

    /**
     * Creates a new Oura API client.
     *
     * @constructor
     * @param {string | ApiOptionsAccessToken} accessTokenOrOptions - Either a personal access token (string) generated at the Oura Cloud website, or an options object containing the configuration settings.
     * @throws {MissingTokenError} If the access token is missing.
     */
    constructor(options: string | ApiOptionsAccessToken) {
        // If a string is provided, assume it's the access token
        if (typeof options === "string") {
            options = { accessToken: options };
        }

        super(options);

        if (options.accessToken) {
            this.#personalAccesstoken = options.accessToken;
        } else if (!options.useSandbox) {
            throw new MissingTokenError();
        }
    }

    /**
     * Fetches data from the Oura API using the stored personal access token.
     *
     * @protected
     * @override
     * @param {string} endpoint - The API endpoint URL.
     * @param {Record<string, string>} [params] - Optional query parameters.
     * @returns {Promise<unknown>} A promise that resolves with the fetched data (either an array or a single object).
     */
    protected override fetchData(endpoint: string, params?: Record<string, string>): Promise<unknown> {
        return this.getAll(this.#personalAccesstoken, endpoint, params);
    }
}

export default Oura;
