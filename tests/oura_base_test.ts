import { assert, assertEquals, assertInstanceOf, assertRejects } from "@std/assert";
import { Oura, OuraOAuth } from "../mod.ts";
import { APIError, MissingTokenError, RateLimitExceeded, ValidationError } from "../src/utils.ts";
import { json, withFetch } from "./_helpers.ts";

Deno.test("pagination follows next_token and keeps the original query params", async () => {
    await withFetch(
        (req) => {
            const token = new URL(req.url).searchParams.get("next_token");
            if (!token) return json({ data: [{ id: "1" }], next_token: "t1" });
            if (token === "t1") return json({ data: [{ id: "2" }], next_token: "t2" });
            return json({ data: [{ id: "3" }], next_token: null });
        },
        async (requests) => {
            const docs = await new Oura("pat").getDailySleepDocuments("2024-01-01", "2024-01-31");
            assertEquals(docs.map((d) => d.id), ["1", "2", "3"]);
            assertEquals(requests.length, 3);
            for (const req of requests) {
                const params = new URL(req.url).searchParams;
                assertEquals(params.get("start_date"), "2024-01-01");
                assertEquals(params.get("end_date"), "2024-01-31");
            }
            assertEquals(new URL(requests[2].url).searchParams.get("next_token"), "t2");
        },
    );
});

Deno.test("single-document endpoints return the object, not an array", async () => {
    await withFetch(() => json({ id: "abc", age: 30 }), async () => {
        const info = await new Oura("pat").getPersonalInfo();
        assertEquals(info, { id: "abc", age: 30 } as unknown as typeof info);
    });
});

Deno.test("document ids are URL-encoded", async () => {
    await withFetch(() => json({ id: "x" }), async (requests) => {
        await new Oura("pat").getSleep("a/b?c#d");
        assert(requests[0].url.endsWith("/v2/usercollection/sleep/a%2Fb%3Fc%23d"), requests[0].url);
    });
});

Deno.test("sends the bearer token, and a placeholder one in sandbox mode", async () => {
    await withFetch(() => json({ data: [], next_token: null }), async (requests) => {
        await new Oura("pat").getWorkoutDocuments("2024-01-01", "2024-01-02");
        await new Oura({ useSandbox: true }).getWorkoutDocuments("2024-01-01", "2024-01-02");
        assertEquals(requests[0].headers.get("authorization"), "Bearer pat");
        assert(requests[1].url.includes("/v2/sandbox/usercollection/"));
        assertEquals(requests[1].headers.get("authorization"), "Bearer sandbox");
    });
});

Deno.test("400 throws ValidationError with parsed detail and raw body", async () => {
    await withFetch(() => json({ detail: "bad date" }, 400), async () => {
        const err = await assertRejects(() => new Oura("pat").getSleepDocuments("x", "y"), ValidationError);
        assertEquals(err.statusCode, 400);
        assertEquals(err.detail, "bad date");
        assertEquals(err.responseBody, '{"detail":"bad date"}');
        assertEquals(err.method, "GET");
    });
});

Deno.test("422 (Oura's param validation) also throws ValidationError, with structured detail stringified", async () => {
    const body = { detail: [{ type: "datetime_from_date_parsing", loc: ["query", "start_date"] }] };
    await withFetch(() => json(body, 422), async () => {
        const err = await assertRejects(() => new Oura("pat").getSleepDocuments("2026-13-45", "y"), ValidationError);
        assertEquals(err.statusCode, 422);
        assertEquals(err.detail, JSON.stringify(body.detail));
    });
});

Deno.test("non-JSON error bodies are used as detail", async () => {
    await withFetch(() => new Response("upstream down", { status: 502 }), async () => {
        const err = await assertRejects(() => new Oura("pat").getSleepDocuments("a", "b"), APIError);
        assertEquals(err.statusCode, 502);
        assertEquals(err.detail, "upstream down");
    });
});

Deno.test("429 is retried, honoring Retry-After", async () => {
    let calls = 0;
    await withFetch(
        () =>
            ++calls === 1
                ? json({ detail: "slow down" }, 429, { "retry-after": "0" })
                : json({ data: [1], next_token: null }),
        async () => {
            const docs = await new Oura("pat").getSleepDocuments("a", "b");
            assertEquals(docs as unknown[], [1]);
            assertEquals(calls, 2);
        },
    );
});

Deno.test("429 throws RateLimitExceeded once retries are exhausted", async () => {
    let calls = 0;
    await withFetch(() => (calls++, json({ detail: "slow down" }, 429, { "retry-after": "0" })), async () => {
        const err = await assertRejects(
            () => new Oura({ accessToken: "pat", maxRetries: 1 }).getSleepDocuments("a", "b"),
            RateLimitExceeded,
        );
        assertEquals(err.detail, "slow down");
        assertEquals(calls, 2);
    });
});

Deno.test("requests time out", async () => {
    await withFetch(
        (_req, init) =>
            new Promise<Response>((_resolve, reject) => {
                init?.signal?.addEventListener("abort", () => reject(init.signal!.reason));
            }),
        async () => {
            const err = await assertRejects(() =>
                new Oura({ accessToken: "pat", timeoutMs: 20 }).getSleepDocuments("a", "b")
            );
            assertInstanceOf(err, DOMException);
            assertEquals(err.name, "TimeoutError");
        },
    );
});

Deno.test("deprecated tag methods warn once on stderr, never stdout", async () => {
    const origLog = console.log;
    const origWarn = console.warn;
    let logs = 0;
    let warns = 0;
    console.log = () => logs++;
    console.warn = () => warns++;
    try {
        await withFetch(() => json({ data: [], next_token: null }), async () => {
            const oura = new Oura("pat");
            await oura.getTagDocuments("a", "b");
            await oura.getTagDocuments("a", "b");
        });
    } finally {
        console.log = origLog;
        console.warn = origWarn;
    }
    assertEquals(logs, 0);
    assert(warns <= 1, `expected at most one warning, got ${warns}`);
});

Deno.test("getRingConfigurationDocuments accepts the token as first arg and the deprecated date form", async () => {
    await withFetch(() => json({ data: [], next_token: null }), async (requests) => {
        const client = new OuraOAuth({ clientId: "c", clientSecret: "s", redirectUri: "http://localhost/cb" });
        await client.getRingConfigurationDocuments("tok1");
        await client.getRingConfigurationDocuments("2024-01-01", "2024-01-02", "tok2");
        assertEquals(requests.map((r) => r.headers.get("authorization")), ["Bearer tok1", "Bearer tok2"]);
        assertEquals(new URL(requests[1].url).search, "");
    });
});

Deno.test("constructors validate required credentials", async () => {
    let threw = false;
    try {
        new Oura({});
    } catch (e) {
        threw = e instanceof MissingTokenError;
    }
    assert(threw);
    const client = new OuraOAuth({ clientId: "c", clientSecret: "s", redirectUri: "http://localhost/cb" });
    await assertRejects(() => client.getSleepDocuments("a", "b"), MissingTokenError);
});
