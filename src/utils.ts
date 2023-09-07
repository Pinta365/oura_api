/**
 * Checks if a given string represents a valid date.
 * @param {string} dateString - The date string to validate.
 * @returns {boolean} Returns true if the date string is a valid date; otherwise, false.
 */
export function isValidDate(dateString: string): boolean {
    // Attempt to create a Date object from the input string
    const date = new Date(dateString);

    // Check if the date is valid and the input string is in a valid format
    return !isNaN(date.getTime()) && !isNaN(date.getDate());
}

/**
 * Custom error class representing an API error.
 * @class
 * @extends {Error}
 */
export class APIError extends Error {
    statusCode: number;
    responseBody: string;

    constructor(message: string, statusCode: number, responseBody: string) {
        super(message);
        this.name = "APIError";
        this.statusCode = statusCode;
        this.responseBody = responseBody;
    }
}

/**
 * Custom error class representing a validation error.
 * @class
 * @extends {Error}
 */
export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ValidationError";
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
