// scripts/build_npm.ts
// deno-lint-ignore no-import-prefix
import { build, emptyDir } from "jsr:@deno/dnt@0.42.3";

import pkg from "../deno.json" with { type: "json" };

const outputDir = "./npm";

await emptyDir(outputDir);

await build({
    importMap: "deno.json",
    entryPoints: ["./mod.ts"],
    outDir: outputDir,
    shims: {
        deno: false,
    },
    package: {
        name: pkg.name,
        version: pkg.version,
        description:
            "ŌURA Cloud API. Interact with v2 of the Oura API using access tokens, OAuth2 or the Sandbox environment. Includes support for the Webhook subscriptions.",
        license: "MIT",
        repository: {
            type: "git",
            url: "git+https://github.com/Pinta365/oura_api.git",
        },
        bugs: {
            url: "https://github.com/Pinta365/oura_api/issues",
        },
        homepage: "https://github.com/Pinta365/oura_api",
        keywords: [
            "oura",
            "health data",
            "sleep",
            "activity",
            "readiness",
            "resilience",
            "api",
            "oauth",
            "oauth2",
        ],
    },
    async postBuild() {
        Deno.copyFileSync("LICENSE", "npm/LICENSE");
        Deno.copyFileSync("README.md", "npm/README.md");
        const npmIgnore = "npm/.npmignore";
        const npmIgnoreContent = [
            "*.map",
            "scripts/",
            ".github/",
        ].join("\n");
        try {
            const content = await Deno.readTextFile(npmIgnore);
            await Deno.writeTextFile(npmIgnore, content + "\n" + npmIgnoreContent);
        } catch {
            await Deno.writeTextFile(npmIgnore, npmIgnoreContent);
        }
    },
    typeCheck: false,
    test: false,
    compilerOptions: {
        lib: ["ESNext", "DOM", "DOM.Iterable"],
        sourceMap: false,
        inlineSources: false,
        skipLibCheck: true,
    },
});
