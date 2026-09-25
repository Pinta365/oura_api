import { assert, assertEquals } from "@std/assert";
import { z } from "zod";
import { TokenManager } from "../mcp/token_manager.ts";
import { readTokens, tokenFilePath, writeTokens } from "../mcp/token_store.ts";
import { registerTools } from "../mcp/tools.ts";
import OuraOAuth from "../src/OuraOAuth.ts";
import { json, useTempConfigDir, withFetch } from "./_helpers.ts";

const noBrowser = () => Promise.resolve();
const tokenResponse = (access: string, refresh: string) =>
    json({ access_token: access, refresh_token: refresh, expires_in: 3600, token_type: "bearer" });

/** Starts a flow and returns the manager plus a helper that hits the local callback with the flow's state. */
async function startFlow(port: number) {
    const tm = new TokenManager({ openBrowser: noBrowser });
    const { authUrl } = await tm.beginAuthorize({ clientId: "cid", clientSecret: "secret", callbackPort: port });
    const url = new URL(authUrl);
    const state = url.searchParams.get("state")!;
    const callback = async (params: Record<string, string>) => {
        const res = await fetch(`http://localhost:${port}/callback?${new URLSearchParams(params)}`);
        await res.body?.cancel();
        return res.status;
    };
    return { tm, url, state, callback };
}

/** Gives the flow's queued shutdown a chance to finish before the test ends. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 20));

Deno.test("token file is written with owner-only permissions", async () => {
    await useTempConfigDir();
    const path = tokenFilePath();
    await Deno.mkdir(path.slice(0, path.lastIndexOf("/")), { recursive: true });
    await Deno.writeTextFile(path, "{}", { mode: 0o644 });
    await writeTokens({
        clientId: "c",
        clientSecret: "s",
        redirectUri: "r",
        accessToken: "a",
        refreshToken: "f",
        expiresAt: 1,
    });
    assertEquals((await readTokens())?.accessToken, "a");
    if (Deno.build.os !== "windows") {
        assertEquals((await Deno.stat(path)).mode! & 0o777, 0o600);
    }
});

Deno.test({
    name: "auth URL carries tag scope and state; callback rejects a missing or wrong state",
    sanitizeOps: false,
    sanitizeResources: false,
    fn: async () => {
        await useTempConfigDir();
        await withFetch(() => tokenResponse("acc", "ref"), async (requests) => {
            const { tm, url, state, callback } = await startFlow(34562);
            assert(url.searchParams.get("scope")!.split(" ").includes("tag"));
            assertEquals(await callback({ code: "evil" }), 400);
            assertEquals(await callback({ code: "evil", state: "wrong" }), 400);
            assertEquals(requests.length, 0, "no token exchange for a bad state");
            assertEquals(tm.status(), "pending");
            assertEquals(tm.lastAuthError(), null);

            assertEquals(await callback({ code: "good", state }), 200);
            await settle();
            assertEquals(tm.status(), "authorized");
            assertEquals(await tm.getAccessToken(), "acc");
            assertEquals(new URLSearchParams(requests[0].body!).get("code"), "good");
        });
    },
});

Deno.test({
    name: "token exchange failure stays visible after the flow is torn down",
    sanitizeOps: false,
    sanitizeResources: false,
    fn: async () => {
        await useTempConfigDir();
        await withFetch(() => json({ error: "invalid_grant" }, 400), async () => {
            const { tm, state, callback } = await startFlow(34563);
            await callback({ code: "c", state });
            await settle();
            assertEquals(tm.status(), "idle");
            assert(tm.lastAuthError()?.includes("Failed to exchange code"), String(tm.lastAuthError()));
        });
    },
});

Deno.test("concurrent getAccessToken calls share a single refresh", async () => {
    await useTempConfigDir();
    await writeTokens({
        clientId: "c",
        clientSecret: "s",
        redirectUri: "r",
        accessToken: "old",
        refreshToken: "r1",
        expiresAt: 0,
    });
    const tm = new TokenManager({ openBrowser: noBrowser });
    await tm.load();
    let refreshes = 0;
    await withFetch(async () => {
        refreshes++;
        await new Promise((r) => setTimeout(r, 20));
        return tokenResponse("new", "r2");
    }, async () => {
        const tokens = await Promise.all([tm.getAccessToken(), tm.getAccessToken(), tm.getAccessToken()]);
        assertEquals(tokens, ["new", "new", "new"]);
        assertEquals(refreshes, 1);
        assertEquals((await readTokens())?.refreshToken, "r2");
        assertEquals(await tm.getAccessToken(), "new");
        assertEquals(refreshes, 1, "fresh token is not refreshed again");
    });
});

Deno.test("tool input schemas validate dates and datetimes", () => {
    const schemas = new Map<string, Record<string, z.ZodTypeAny>>();
    const fakeServer = {
        registerTool: (name: string, config: { inputSchema: Record<string, z.ZodTypeAny> }) => {
            schemas.set(name, config.inputSchema);
        },
    };
    registerTools(
        fakeServer as unknown as Parameters<typeof registerTools>[0],
        new OuraOAuth({ clientId: "c", clientSecret: "s", redirectUri: "r" }),
        { tokens: new TokenManager({ openBrowser: noBrowser }), bootstrapCredentials: null, callbackPort: 0 },
    );

    const dates = z.object(schemas.get("get_daily_sleep")!);
    assert(dates.safeParse({ start_date: "2024-01-01", end_date: "2024-01-31" }).success);
    assert(!dates.safeParse({ start_date: "2024-1-1", end_date: "2024-01-31" }).success);

    const datetimes = z.object(schemas.get("get_heart_rate")!);
    for (
        const ok of ["2024-01-01T00:00:00", "2024-01-01T00:00", "2024-01-01T00:00:00Z", "2024-01-01T00:00:00.123+02:00"]
    ) {
        assert(datetimes.safeParse({ start_datetime: ok, end_datetime: ok }).success, ok);
    }
    for (const bad of ["2024-01-01", "yesterday", "2024-01-01 00:00:00"]) {
        assert(!datetimes.safeParse({ start_datetime: bad, end_datetime: bad }).success, bad);
    }
});
