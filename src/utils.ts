/**
 * Contains API base urls.
 */
export const API_URLS = {
    /** Default api endpoint url */
    baseV2: "https://api.ouraring.com/v2/usercollection/",
    /** Used when requesting sandbox endpoints */
    basev2Sandbox: "https://api.ouraring.com/v2/sandbox/usercollection/",

    oauth: {
        authorize: "https://cloud.ouraring.com/oauth/authorize",
        token: "https://api.ouraring.com/oauth/token",
        revokeToken: "https://api.ouraring.com/oauth/revoke",
    },
};

/** Default per-request timeout in milliseconds. */
export const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Delay before retrying a rate-limited request: the `Retry-After` header (seconds or HTTP date) capped at 60s,
 * otherwise exponential backoff starting at 1s.
 *
 * @param {Response} response - The 429 response.
 * @param {number} attempt - Zero-based retry attempt.
 * @returns {number} Delay in milliseconds.
 */
export function retryDelayMs(response: Response, attempt: number): number {
    const header = response.headers.get("retry-after");
    if (header) {
        const seconds = Number(header);
        const ms = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(header) - Date.now();
        if (Number.isFinite(ms)) return Math.min(Math.max(ms, 0), 60_000);
    }
    return 1000 * 2 ** attempt;
}

/**
 * Custom error class representing an API error.
 * @class
 * @extends {Error}
 */
export class APIError extends Error {
    /** The HTTP status code. */
    statusCode: number;
    /** The raw response body text. */
    responseBody: string;
    /** The `detail` field of a JSON error body, or the raw body text if there is none. */
    detail: string;
    url: string;
    method: string;

    constructor(
        message: string,
        statusCode: number,
        responseBody: string,
        detail: string,
        url: string,
        method: string,
    ) {
        super(message);
        this.name = "APIError";
        this.statusCode = statusCode;
        this.responseBody = responseBody;
        this.detail = detail;
        this.url = url;
        this.method = method;
    }
}

/**
 * Custom error class representing a rate limit exceeded error.
 * @class
 * @extends {APIError}
 */
export class RateLimitExceeded extends APIError {
    constructor(
        message: string,
        statusCode: number,
        responseBody: string,
        detail: string,
        url: string,
        method: string,
    ) {
        super(message, statusCode, responseBody, detail, url, method);
        this.name = "RateLimitExceeded";
    }
}

/**
 * Custom error class representing a validation error.
 * @class
 * @extends {APIError}
 */
export class ValidationError extends APIError {
    /**
     * Creates a new ValidationError instance.
     * @param {string} message - The error message.
     * @param {number} statusCode - The HTTP status code.
     * @param {string} responseBody - The raw response body text.
     * @param {string} detail - Detailed error message.
     * @param {string} url - The API endpoint URL.
     * @param {string} method - The HTTP method.
     */
    constructor(
        message: string,
        statusCode: number,
        responseBody: string,
        detail: string,
        url: string,
        method: string,
    ) {
        super(message, statusCode, responseBody, detail, url, method);
        this.name = "ValidationError";
    }
}

/**
 * Builds an APIError (or subclass) from a failed response, reading the body once.
 * `detail` is taken from a JSON `{ "detail": ... }` body when present, otherwise the raw body text.
 *
 * @param {typeof APIError} ErrorClass - APIError or one of its subclasses.
 * @param {string} message - The error message.
 * @param {Response} response - The failed fetch response.
 * @param {string} url - The request URL to report (must not contain secrets).
 * @param {string} method - The HTTP method.
 * @returns {Promise<APIError>} The constructed error.
 */
export async function createAPIError(
    ErrorClass: typeof APIError,
    message: string,
    response: Response,
    url: string,
    method: string,
): Promise<APIError> {
    let body = "";
    try {
        body = await response.text();
    } catch {
        // Body unreadable (e.g. connection dropped); fall through with an empty body.
    }
    let detail = body || response.statusText || "No details";
    try {
        const parsed = JSON.parse(body) as { detail?: unknown };
        if (typeof parsed?.detail === "string") detail = parsed.detail;
        else if (parsed?.detail !== undefined) detail = JSON.stringify(parsed.detail);
    } catch {
        // Not JSON; keep the raw body as the detail.
    }
    return new ErrorClass(message, response.status, body, detail, url, method);
}

/**
 * Custom error class representing a configuration error.
 * @class
 * @extends {Error}
 */
export class ConfigurationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ConfigurationError";
    }
}

/**
 * Custom error class representing a missing redirect URI error.
 * @class
 * @extends {Error}
 */
export class MissingRedirectUriError extends Error {
    constructor() {
        super("Redirect URI is missing");
        this.name = "MissingRedirectUriError";
    }
}

/**
 * Custom error class representing a missing access token error.
 * @class
 * @extends {Error}
 */
export class MissingTokenError extends Error {
    constructor() {
        super("Access token is missing");
        this.name = "MissingTokenError";
    }
}

/**
 * Custom error class representing a missing client id error.
 * @class
 * @extends {Error}
 */
export class MissingClientIdError extends Error {
    constructor() {
        super("Client Id is missing");
        this.name = "MissingClientIdError";
    }
}

/**
 * Custom error class representing a missing client secret error.
 * @class
 * @extends {Error}
 */
export class MissingClientSecretError extends Error {
    constructor() {
        super("Client Secret is missing");
        this.name = "MissingClientSecretError";
    }
}
