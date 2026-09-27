import { assert, assertEquals, assertInstanceOf } from "@std/assert";
import {
    APIError,
    ConfigurationError,
    MissingClientIdError,
    MissingClientSecretError,
    MissingRedirectUriError,
    MissingTokenError,
    RateLimitExceeded,
    retryDelayMs,
    ValidationError,
} from "../src/utils.ts";

const responseWithRetryAfter = (value?: string) =>
    new Response(null, { headers: value === undefined ? undefined : { "retry-after": value } });

Deno.test("retryDelayMs uses Retry-After seconds and constrains the delay", () => {
    assertEquals(retryDelayMs(responseWithRetryAfter("2.5"), 0), 2_500);
    assertEquals(retryDelayMs(responseWithRetryAfter("-1"), 0), 0);
    assertEquals(retryDelayMs(responseWithRetryAfter("120"), 0), 60_000);
});

Deno.test("retryDelayMs supports HTTP-date Retry-After values", () => {
    const future = new Date(Date.now() + 120_000).toUTCString();

    assertEquals(retryDelayMs(responseWithRetryAfter(future), 0), 60_000);

    // HTTP dates have second precision, so allow for truncation and elapsed time.
    const soon = retryDelayMs(responseWithRetryAfter(new Date(Date.now() + 30_000).toUTCString()), 0);
    assert(soon > 28_000 && soon <= 30_000, `expected ~30s, got ${soon}ms`);

    const past = new Date(Date.now() - 60_000).toUTCString();
    assertEquals(retryDelayMs(responseWithRetryAfter(past), 0), 0);
});

Deno.test("retryDelayMs falls back to exponential backoff without a valid Retry-After value", () => {
    assertEquals(retryDelayMs(responseWithRetryAfter(), 3), 8_000);
    assertEquals(retryDelayMs(responseWithRetryAfter("invalid"), 2), 4_000);
});

Deno.test("API error classes preserve request and response details", () => {
    const error = new APIError("Request failed", 500, "raw body", "detail", "https://example.test", "POST");
    const rateLimitError = new RateLimitExceeded(
        "Rate limited",
        429,
        "raw body",
        "detail",
        "https://example.test",
        "GET",
    );
    const validationError = new ValidationError(
        "Invalid request",
        400,
        "raw body",
        "detail",
        "https://example.test",
        "PATCH",
    );

    assertInstanceOf(error, Error);
    assertEquals(error.name, "APIError");
    assertEquals(error.message, "Request failed");
    assertEquals(error.statusCode, 500);
    assertEquals(error.responseBody, "raw body");
    assertEquals(error.detail, "detail");
    assertEquals(error.url, "https://example.test");
    assertEquals(error.method, "POST");

    assertInstanceOf(rateLimitError, APIError);
    assertEquals(rateLimitError.name, "RateLimitExceeded");
    assertEquals(rateLimitError.message, "Rate limited");
    assertEquals(rateLimitError.statusCode, 429);
    assertEquals(rateLimitError.method, "GET");

    assertInstanceOf(validationError, APIError);
    assertEquals(validationError.name, "ValidationError");
    assertEquals(validationError.message, "Invalid request");
    assertEquals(validationError.statusCode, 400);
    assertEquals(validationError.responseBody, "raw body");
    assertEquals(validationError.detail, "detail");
    assertEquals(validationError.url, "https://example.test");
    assertEquals(validationError.method, "PATCH");
});

Deno.test("configuration error classes provide their expected names and messages", () => {
    const errors = [
        [new ConfigurationError("Invalid configuration"), "ConfigurationError", "Invalid configuration"],
        [new MissingRedirectUriError(), "MissingRedirectUriError", "Redirect URI is missing"],
        [new MissingTokenError(), "MissingTokenError", "Access token is missing"],
        [new MissingClientIdError(), "MissingClientIdError", "Client Id is missing"],
        [new MissingClientSecretError(), "MissingClientSecretError", "Client Secret is missing"],
    ] as const;

    for (const [error, name, message] of errors) {
        assertInstanceOf(error, Error);
        assertEquals(error.name, name);
        assertEquals(error.message, message);
    }
});
