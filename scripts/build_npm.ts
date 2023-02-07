// ex. scripts/build_npm.ts
import { build, emptyDir } from 'https://deno.land/x/dnt/mod.ts';

await emptyDir('./npm');

await build({
    entryPoints: ['./mod.ts'],
    outDir: './npm',
    scriptModule: true,
    test: false,
    shims: {
        undici: true,
        deno: 'dev',
    },
    package: {
        // package.json properties
        name: 'oura_api',
        version: Deno.args[0],
        description: 'Interact with v2 of the Oura Ring API.',
        license: 'MIT',
        author: 'Pinta365@GitHub',
        repository: {
            type: 'git',
            url: 'git+https://github.com/Pinta365/oura_api.git',
        },
        bugs: {
            url: 'https://github.com/Pinta365/oura_api/issues',
        },
    },
});

// post build steps
Deno.copyFileSync('LICENSE', 'npm/LICENSE');
Deno.copyFileSync('README.md', 'npm/README.md');
