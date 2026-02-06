/**
 * Type generation script for Oura API types
 *
 * Uses @pinta365/openapi-typegen to generate TypeScript types from Oura's
 * openapi specification.
 */

import { generateTypes } from "jsr:@pinta365/openapi-typegen@^0.0.3";

const OUTPUT_FILE = "./src/types/generated.ts";

/** Opaque date/time types from the spec that we fix to `string` (API returns ISO 8601 strings). */
const TIMESTAMP_TYPES = [
    "ISODate",
    "LocalDateTime",
    "LocalDateTimeWithMilliseconds",
    "LocalizedDateTime",
    "UtcDateTime",
] as const;

function fixTimestampTypes(filePath: string): void {
    let content = Deno.readTextFileSync(filePath);
    for (const name of TIMESTAMP_TYPES) {
        content = content.replace(
            new RegExp(
                `(export type ${name} = )Record<string, unknown>;`,
                "g",
            ),
            "$1string;",
        );
    }
    Deno.writeTextFileSync(filePath, content);
    console.log("Fixed timestamp types (→ string):", TIMESTAMP_TYPES.join(", "));
}

const getOpenApiSpecUrl = async (): Promise<string> => {
    try {
        const response = await fetch("https://cloud.ouraring.com/v2/docs");
        const htmlContent = await response.text();

        const redocRegex = /<redoc\s+spec-url="([^"]+)"\s*>/;
        const match = redocRegex.exec(htmlContent);
        if (match && match[1]) {
            const specUrl = match[1];
            return `https://cloud.ouraring.com${specUrl}`;
        } else {
            throw new Error("<redoc> element or spec-url attribute not found.");
        }
    } catch (error) {
        throw error;
    }
};

async function main(): Promise<void> {
    const specUrl = await getOpenApiSpecUrl();
    console.log(`Generating types from openapi spec: ${specUrl}`);
    await generateTypes(specUrl, {
        output: OUTPUT_FILE,
        propertyNaming: "preserve",
    });

    fixTimestampTypes(OUTPUT_FILE);

    // Format to match project style (e.g. line width from deno.json)
    const formatProcess = new Deno.Command(Deno.execPath(), {
        args: ["fmt", OUTPUT_FILE],
        stdout: "piped",
        stderr: "piped",
    });
    const formatResult = await formatProcess.output();
    if (!formatResult.success) {
        console.warn(
            "Warning: Failed to format generated types:",
            new TextDecoder().decode(formatResult.stderr),
        );
    }

    console.log(`Types generated successfully: ${OUTPUT_FILE}`);
}

if (import.meta.main) {
    try {
        await main();
        Deno.exit(0);
    } catch (error) {
        console.error("Error generating types:", error);
        Deno.exit(1);
    }
}
