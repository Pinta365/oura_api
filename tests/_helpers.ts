/**
 * Test helpers: a fetch stub that records requests and lets each test script the responses.
 * Requests to localhost are passed through to the real fetch so the MCP callback server can be exercised.
 */

export interface RecordedRequest {
    url: string;
    method: string;
    headers: Headers;
    body: string | null;
}

export type Handler = (req: RecordedRequest, init?: RequestInit) => Response | Promise<Response>;

const realFetch = globalThis.fetch;

/** Replaces globalThis.fetch for the duration of `fn`, then restores it. */
export async function withFetch(
    handler: Handler,
    fn: (requests: RecordedRequest[]) => Promise<void>,
): Promise<void> {
    const requests: RecordedRequest[] = [];
    globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
        const url = input instanceof Request ? input.url : input.toString();
        if (new URL(url).hostname === "localhost") {
            return await realFetch(input, init);
        }
        const req: RecordedRequest = {
            url,
            method: init?.method ?? "GET",
            headers: new Headers(init?.headers),
            body: typeof init?.body === "string" ? init.body : null,
        };
        requests.push(req);
        return await handler(req, init);
    }) as typeof fetch;
    try {
        await fn(requests);
    } finally {
        globalThis.fetch = realFetch;
    }
}

export function json(body: unknown, status = 200, headers?: HeadersInit): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json", ...headers },
    });
}

/** Points the MCP token store at a fresh temp directory on every OS. */
export async function useTempConfigDir(): Promise<string> {
    const dir = await Deno.makeTempDir({ prefix: "oura-mcp-test-" });
    Deno.env.set("XDG_CONFIG_HOME", dir);
    Deno.env.set("HOME", dir);
    Deno.env.set("APPDATA", dir);
    return dir;
}
