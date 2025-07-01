import { assert } from "jsr:@std/assert";
import { Oura } from "../mod.ts";

const oura = new Oura({ useSandbox: true });
const start = "2023-01-01";
const end = "2023-01-07";

Deno.test("Oura sandbox: getDailyActivityDocuments returns an array", async () => {
    const activities = await oura.getDailyActivityDocuments(start, end);
    assert(Array.isArray(activities), "Should return an array");
    if (activities.length > 0) {
        assert(typeof activities[0] === "object", "Array items should be objects");
    }
});

Deno.test("Oura sandbox: getDailyCardiovascularAgeDocuments returns an array", async () => {
    const docs = await oura.getDailyCardiovascularAgeDocuments(start, end);
    assert(Array.isArray(docs), "Should return an array");
});

Deno.test("Oura sandbox: getDailyReadinessDocuments returns an array", async () => {
    const docs = await oura.getDailyReadinessDocuments(start, end);
    assert(Array.isArray(docs), "Should return an array");
});

Deno.test("Oura sandbox: getDailyResilienceDocuments returns an array", async () => {
    const docs = await oura.getDailyResilienceDocuments(start, end);
    assert(Array.isArray(docs), "Should return an array");
});

Deno.test("Oura sandbox: getDailySleepDocuments returns an array", async () => {
    const docs = await oura.getDailySleepDocuments(start, end);
    assert(Array.isArray(docs), "Should return an array");
});

Deno.test("Oura sandbox: getDailySpo2Documents returns an array", async () => {
    const docs = await oura.getDailySpo2Documents(start, end);
    assert(Array.isArray(docs), "Should return an array");
});

Deno.test("Oura sandbox: getDailyStressDocuments returns an array", async () => {
    const docs = await oura.getDailyStressDocuments(start, end);
    assert(Array.isArray(docs), "Should return an array");
});

Deno.test("Oura sandbox: getEnhancedTagDocuments returns an array", async () => {
    const docs = await oura.getEnhancedTagDocuments(start, end);
    assert(Array.isArray(docs), "Should return an array");
});

Deno.test("Oura sandbox: getHeartrate returns an array", async () => {
    const startTime = "2023-01-01T00:00:00.000Z";
    const endTime = "2023-01-07T23:59:59.000Z";
    const docs = await oura.getHeartrate(startTime, endTime);
    assert(Array.isArray(docs), "Should return an array");
});

Deno.test("Oura sandbox: getRestModePeriodDocuments returns an array", async () => {
    const docs = await oura.getRestModePeriodDocuments(start, end);
    assert(Array.isArray(docs), "Should return an array");
});

Deno.test("Oura sandbox: getDailySessionDocuments returns an array", async () => {
    const docs = await oura.getDailySessionDocuments(start, end);
    assert(Array.isArray(docs), "Should return an array");
});

Deno.test("Oura sandbox: getSleepDocuments returns an array", async () => {
    const docs = await oura.getSleepDocuments(start, end);
    assert(Array.isArray(docs), "Should return an array");
});

Deno.test("Oura sandbox: getSleepTimeDocuments returns an array", async () => {
    const docs = await oura.getSleepTimeDocuments(start, end);
    assert(Array.isArray(docs), "Should return an array");
});

Deno.test("Oura sandbox: getTagDocuments returns an array (deprecated)", async () => {
    const docs = await oura.getTagDocuments(start, end);
    assert(Array.isArray(docs), "Should return an array");
});

Deno.test("Oura sandbox: getVO2MaxDocuments returns an array", async () => {
    const docs = await oura.getVO2MaxDocuments(start, end);
    assert(Array.isArray(docs), "Should return an array");
});

Deno.test("Oura sandbox: getWorkoutDocuments returns an array", async () => {
    const docs = await oura.getWorkoutDocuments(start, end);
    assert(Array.isArray(docs), "Should return an array");
});
