// ex. scripts/build_npm.ts
import { build, emptyDir } from "jsr:@deno/dnt";

await emptyDir("./npm");

await build({
    entryPoints: ["./mod.ts"],
    outDir: "./npm",
    //scriptModule: false,
    test: false,
    shims: {
        deno: "dev",
    },
    package: {
        // package.json properties
        name: "oura_api",
        version: Deno.args[0],
        description:
            "ŌURA Cloud API. Interact with v2 of the Oura API using Personal Access Tokens, OAuth2, or the Sandbox environment. Includes support for the Webhook subscriptions.",
        license: "MIT",
        author: "Pinta <https://github.com/Pinta365>",
        keywords: ["oura", "health data", "sleep", "activity", "readiness", "resilience", "api", "oauth", "oauth2"],
        repository: {
            type: "git",
            url: "git+https://github.com/Pinta365/oura_api.git",
        },
        bugs: {
            url: "https://github.com/Pinta365/oura_api/issues",
        },
    },
    postBuild() {
        // steps to run after building and before running the tests
        Deno.copyFileSync("LICENSE", "npm/LICENSE");
        Deno.copyFileSync("README.md", "npm/README.md");
    },
});
