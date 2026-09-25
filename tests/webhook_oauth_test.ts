import { assert, assertEquals, assertRejects } from "@std/assert";
import { OuraOAuth, Webhook } from "../mod.ts";
import { APIError } from "../src/utils.ts";
import { json, withFetch } from "./_helpers.ts";

Deno.test("Webhook sends client credentials and encodes subscription ids", async () => {
    await withFetch(() => json({ id: "x" }), async (requests) => {
        await new Webhook("cid", "secret").getSubscription("a/b?c");
        assert(requests[0].url.endsWith("/v2/webhook/subscription/a%2Fb%3Fc"), requests[0].url);
        assertEquals(requests[0].headers.get("x-client-id"), "cid");
        assertEquals(requests[0].headers.get("x-client-secret"), "secret");
    });
});

Deno.test("Webhook.updateSubscription only sends the fields that were given", async () => {
    await withFetch(() => json({ id: "x" }), async (requests) => {
        await new Webhook("cid", "secret").updateSubscription("id1", "verify", undefined, "create");
        assertEquals(requests[0].method, "PUT");
        assertEquals(JSON.parse(requests[0].body!), { verification_token: "verify", event_type: "create" });
    });
});

Deno.test("Webhook.deleteSubscription returns the text body", async () => {
    await withFetch(() => new Response(null, { status: 204 }), async () => {
        assertEquals(await new Webhook("cid", "secret").deleteSubscription("id1"), "");
    });
});

Deno.test("Webhook errors carry status, detail and body", async () => {
    await withFetch(() => json({ detail: "nope" }, 403), async () => {
        const err = await assertRejects(() => new Webhook("cid", "secret").listSubscriptions(), APIError);
        assertEquals(err.statusCode, 403);
        assertEquals(err.detail, "nope");
        assertEquals(err.responseBody, '{"detail":"nope"}');
    });
});

const client = () =>
    new OuraOAuth({ clientId: "cid", clientSecret: "secret", redirectUri: "http://localhost:3456/callback" });

Deno.test("generateAuthUrl includes scopes, redirect uri and state", () => {
    const url = new URL(client().generateAuthUrl(["daily", "tag"], "st8"));
    assertEquals(url.searchParams.get("scope"), "daily tag");
    assertEquals(url.searchParams.get("state"), "st8");
    assertEquals(url.searchParams.get("redirect_uri"), "http://localhost:3456/callback");
});

Deno.test("exchangeCodeForToken posts a form body and surfaces error bodies", async () => {
    await withFetch(() => json({ error: "invalid_grant" }, 400), async (requests) => {
        const err = await assertRejects(() => client().exchangeCodeForToken("code1"), APIError);
        const form = new URLSearchParams(requests[0].body!);
        assertEquals(form.get("grant_type"), "authorization_code");
        assertEquals(form.get("code"), "code1");
        assertEquals(err.responseBody, '{"error":"invalid_grant"}');
    });
});

Deno.test("revokeAccessToken encodes the token and keeps it out of the error", async () => {
    await withFetch(() => new Response("bad", { status: 400 }), async (requests) => {
        const err = await assertRejects(() => client().revokeAccessToken("SECRET tok&x=1"), APIError);
        assertEquals(new URL(requests[0].url).searchParams.get("access_token"), "SECRET tok&x=1");
        assert(!err.url.includes("SECRET"), err.url);
        assert(!err.message.includes("SECRET") && !err.detail.includes("SECRET"));
    });
});
