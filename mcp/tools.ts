/**
 * Registers all Oura API tools. Tools resolve the access token at call time
 * so they pick up refreshed tokens automatically and surface a friendly
 * "not authorized" message instead of throwing when the user hasn't
 * authorized yet.
 */

import { McpServer } from "npm:@modelcontextprotocol/sdk@^1.18.0/server/mcp.js";
import { z } from "npm:zod@^3.23.8";
import OuraOAuth from "../src/OuraOAuth.ts";
import type { TokenManager } from "./token_manager.ts";

const DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Date in YYYY-MM-DD format");
const DATETIME = z.string().describe("Date-time in YYYY-MM-DDTHH:mm:ss format");
const DATE_RANGE = { start_date: DATE, end_date: DATE } as const;
type DateRange = { start_date: string; end_date: string };

function ok(data: unknown) {
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function fail(err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { isError: true as const, content: [{ type: "text" as const, text: msg }] };
}

const NOT_AUTHORIZED_MSG = "Not authorized with Oura. Call the `oura_authorize` tool first to grant access.";

export interface RegisterToolsOptions {
    tokens: TokenManager;
    bootstrapCredentials: { clientId: string; clientSecret: string } | null;
    callbackPort: number;
}

export function registerTools(server: McpServer, client: OuraOAuth, options: RegisterToolsOptions): void {
    const { tokens } = options;

    function withToken<A>(handler: (args: A, accessToken: string) => Promise<unknown>) {
        return async (args: A) => {
            let accessToken: string | null;
            try {
                accessToken = await tokens.getAccessToken();
            } catch (e) {
                return fail(e);
            }
            if (!accessToken) return fail(NOT_AUTHORIZED_MSG);
            try {
                return ok(await handler(args, accessToken));
            } catch (e) {
                return fail(e);
            }
        };
    }

    registerAuthTools(server, options);

    server.registerTool(
        "get_personal_info",
        {
            title: "Get personal information",
            description:
                "Personal info for the authenticated Oura user: age, weight, height, biological sex, and ring type.",
            inputSchema: {},
        },
        withToken(async (_args: Record<string, never>, accessToken) => {
            return await client.getPersonalInfo(accessToken);
        }),
    );

    server.registerTool(
        "get_daily_readiness",
        {
            title: "Get daily readiness scores",
            description: "Daily readiness scores for a date range. Returns the overall 0-100 readiness score plus " +
                "contributor sub-scores (HRV balance, sleep balance, previous day activity, activity balance, " +
                "body temperature, resting heart rate, recovery index). " +
                "IMPORTANT: contributor values are 0-100 scores indicating how each factor contributed to the " +
                "readiness score — they are NOT raw measurements. For raw HRV in milliseconds use " +
                "`get_sleep_details` (per-night average and minute-level series).",
            inputSchema: DATE_RANGE,
        },
        withToken(async ({ start_date, end_date }: DateRange, accessToken) => {
            return await client.getDailyReadinessDocuments(start_date, end_date, accessToken);
        }),
    );

    server.registerTool(
        "get_daily_sleep",
        {
            title: "Get daily sleep scores",
            description: "Daily sleep scores for a date range. Returns the overall 0-100 sleep score plus " +
                "contributor sub-scores (efficiency, latency, restfulness, REM sleep, deep sleep, total sleep, " +
                "timing). " +
                "IMPORTANT: contributor values are 0-100 scores, NOT raw measurements (e.g. `deep_sleep: 57` means " +
                "the deep-sleep contributor scored 57/100, not 57 minutes). For minutes, HRV in ms, heart rate, " +
                "etc., use `get_sleep_details`.",
            inputSchema: DATE_RANGE,
        },
        withToken(async ({ start_date, end_date }: DateRange, accessToken) => {
            return await client.getDailySleepDocuments(start_date, end_date, accessToken);
        }),
    );

    server.registerTool(
        "get_daily_activity",
        {
            title: "Get daily activity scores",
            description: "Daily activity scores, step counts, calories burned, and contributors for a date range.",
            inputSchema: DATE_RANGE,
        },
        withToken(async ({ start_date, end_date }: DateRange, accessToken) => {
            return await client.getDailyActivityDocuments(start_date, end_date, accessToken);
        }),
    );

    server.registerTool(
        "get_daily_stress",
        {
            title: "Get daily stress summary",
            description:
                "Daily stress summary for a date range: minutes in high stress, low stress, and recovery states.",
            inputSchema: DATE_RANGE,
        },
        withToken(async ({ start_date, end_date }: DateRange, accessToken) => {
            return await client.getDailyStressDocuments(start_date, end_date, accessToken);
        }),
    );

    server.registerTool(
        "get_daily_resilience",
        {
            title: "Get daily resilience",
            description: "Daily resilience score and contributors (sleep recovery, daytime stress) for a date range.",
            inputSchema: DATE_RANGE,
        },
        withToken(async ({ start_date, end_date }: DateRange, accessToken) => {
            return await client.getDailyResilienceDocuments(start_date, end_date, accessToken);
        }),
    );

    server.registerTool(
        "get_daily_spo2",
        {
            title: "Get daily blood oxygen (SpO2)",
            description: "Daily average blood oxygen saturation for a date range. Requires Oura Gen 3+ ring.",
            inputSchema: DATE_RANGE,
        },
        withToken(async ({ start_date, end_date }: DateRange, accessToken) => {
            return await client.getDailySpo2Documents(start_date, end_date, accessToken);
        }),
    );

    server.registerTool(
        "get_daily_cardiovascular_age",
        {
            title: "Get daily cardiovascular age",
            description: "Estimated cardiovascular age compared to biological age for a date range.",
            inputSchema: DATE_RANGE,
        },
        withToken(async ({ start_date, end_date }: DateRange, accessToken) => {
            return await client.getDailyCardiovascularAgeDocuments(start_date, end_date, accessToken);
        }),
    );

    server.registerTool(
        "get_heart_rate",
        {
            title: "Get heart rate data",
            description: "Heart rate measurements for a datetime range. Each entry has bpm, source " +
                "(awake, sleep, workout, rest, etc.), and timestamp. Datetimes are ISO 8601 — pass either " +
                "naive `YYYY-MM-DDTHH:mm:ss` or with timezone, e.g. `2026-05-04T00:00:00+02:00`.",
            inputSchema: { start_datetime: DATETIME, end_datetime: DATETIME },
        },
        withToken(
            async (
                { start_datetime, end_datetime }: { start_datetime: string; end_datetime: string },
                accessToken,
            ) => {
                return await client.getHeartrate(start_datetime, end_datetime, accessToken);
            },
        ),
    );

    server.registerTool(
        "get_sleep_details",
        {
            title: "Get detailed sleep sessions",
            description: "Detailed sleep sessions for a date range — the place to go for raw measurements " +
                "rather than 0-100 scores. Includes per-night `average_hrv` (ms), `lowest_heart_rate` (bpm), " +
                "`average_breath` (rpm), minute-level `heart_rate.items` and `hrv.items` time series, " +
                "minute-level sleep-stage hypnogram, and phase durations (deep/light/REM/awake in seconds).",
            inputSchema: DATE_RANGE,
        },
        withToken(async ({ start_date, end_date }: DateRange, accessToken) => {
            return await client.getSleepDocuments(start_date, end_date, accessToken);
        }),
    );

    server.registerTool(
        "get_workouts",
        {
            title: "Get workout sessions",
            description: "Workout sessions for a date range: sport type, start/end time, duration, " +
                "average and max heart rate, and intensity.",
            inputSchema: DATE_RANGE,
        },
        withToken(async ({ start_date, end_date }: DateRange, accessToken) => {
            return await client.getWorkoutDocuments(start_date, end_date, accessToken);
        }),
    );

    server.registerTool(
        "get_sleep_recommendations",
        {
            title: "Get recommended bedtime windows",
            description: "Oura's recommended bedtime windows for a date range, based on the user's recent " +
                "sleep patterns. Each entry has an optimal bedtime range and a recommendation status " +
                "(e.g. earlier, later, on-track).",
            inputSchema: DATE_RANGE,
        },
        withToken(async ({ start_date, end_date }: DateRange, accessToken) => {
            return await client.getSleepTimeDocuments(start_date, end_date, accessToken);
        }),
    );

    server.registerTool(
        "get_sessions",
        {
            title: "Get guided sessions",
            description: "Guided sessions logged in the Oura app for a date range — meditation, breathing, " +
                "naps, relaxation, etc. Includes type, start/end time, mood, and per-session heart rate / " +
                "HRV samples when available.",
            inputSchema: DATE_RANGE,
        },
        withToken(async ({ start_date, end_date }: DateRange, accessToken) => {
            return await client.getDailySessionDocuments(start_date, end_date, accessToken);
        }),
    );

    server.registerTool(
        "get_enhanced_tags",
        {
            title: "Get enhanced tags (lifestyle/habit/mood)",
            description: "User-entered tags from the Oura app for a date range — anything the user has " +
                "tracked (alcohol, caffeine, late meals, illness, travel, mood, custom tags, etc.). Useful " +
                "for correlating lifestyle factors with sleep, readiness, or HRV. Each tag has a name, " +
                "start/end time, optional comment, and may repeat daily.",
            inputSchema: DATE_RANGE,
        },
        withToken(async ({ start_date, end_date }: DateRange, accessToken) => {
            return await client.getEnhancedTagDocuments(start_date, end_date, accessToken);
        }),
    );

    server.registerTool(
        "get_vo2_max",
        {
            title: "Get VO2 max measurements",
            description: "VO2 max (cardiorespiratory fitness) measurements for a date range. Reported in " +
                "ml/kg/min. Higher is fitter.",
            inputSchema: DATE_RANGE,
        },
        withToken(async ({ start_date, end_date }: DateRange, accessToken) => {
            return await client.getVO2MaxModelDocuments(start_date, end_date, accessToken);
        }),
    );

    server.registerTool(
        "get_rest_mode_periods",
        {
            title: "Get rest mode periods",
            description: "Periods the user has flagged as rest/recovery (illness, injury, travel, etc.) for " +
                "a date range. Important context when interpreting readiness, HRV, or activity dips during " +
                "the same window.",
            inputSchema: DATE_RANGE,
        },
        withToken(async ({ start_date, end_date }: DateRange, accessToken) => {
            return await client.getRestModePeriodDocuments(start_date, end_date, accessToken);
        }),
    );

    server.registerTool(
        "get_ring_configuration",
        {
            title: "Get ring hardware configuration",
            description: "Ring hardware metadata: generation, color, size, hardware type, and firmware " +
                "version. Useful for capability checks (e.g. SpO2 requires Gen 3+).",
            inputSchema: {},
        },
        withToken(async (_args: Record<string, never>, accessToken) => {
            return await client.getRingConfigurationDocuments(accessToken);
        }),
    );
}

function registerAuthTools(server: McpServer, options: RegisterToolsOptions): void {
    const { tokens } = options;

    server.registerTool(
        "oura_authorize",
        {
            title: "Authorize Oura access",
            description:
                "Starts the Oura OAuth flow and returns an authorization URL. The user opens that URL, grants " +
                "access, and tokens are saved silently in the background. After calling this, present the " +
                "returned `authUrl` to the user as a clickable link, then check `oura_auth_status` (or just " +
                "retry the data tool) once they say they have approved. Call this once on first use, or " +
                "again if authorization has been revoked.",
            inputSchema: {},
        },
        async () => {
            const creds = tokens.getCredentials() ?? options.bootstrapCredentials;
            if (!creds) {
                return fail(
                    "Cannot authorize: OURA_CLIENT_ID and OURA_CLIENT_SECRET must be set in the MCP " +
                        "server's environment before first authorization.",
                );
            }
            try {
                const result = await tokens.beginAuthorize({
                    clientId: creds.clientId,
                    clientSecret: creds.clientSecret,
                    callbackPort: options.callbackPort,
                });
                return ok({
                    status: "pending",
                    authUrl: result.authUrl,
                    expiresInSeconds: result.expiresInSeconds,
                    message: "Open the authUrl in a browser and approve access. Tokens save automatically once " +
                        "you finish — no need to come back here. Use `oura_auth_status` to confirm, or just " +
                        "retry the data tool you wanted.",
                });
            } catch (e) {
                return fail(e);
            }
        },
    );

    server.registerTool(
        "oura_auth_status",
        {
            title: "Check Oura authorization status",
            description: "Reports whether the server currently has Oura tokens, plus whether an authorization flow " +
                "is in progress. Useful for confirming the user finished the browser step.",
            inputSchema: {},
        },
        () => {
            return Promise.resolve(ok({
                status: tokens.status(),
                authorized: tokens.isAuthorized(),
                lastError: tokens.lastAuthError(),
            }));
        },
    );
}
