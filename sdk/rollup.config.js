import * as $fs from "node:fs/promises";
import * as $path from "node:path";
import typescript from "rollup-plugin-typescript2";
import replace from "@rollup/plugin-replace";
import $package from "./package.json" with { type: "json" };

const networks = [
    "testnet",
    "mainnet",
];

const runtimes = [
    "browser",
    "node",
];

const sharedExternal = (network) => [
    // Used by node-polyfill
    "node:worker_threads",
    "node:os",
    "node:fs",
    "node:fs/promises",
    "node:crypto",
    "node:path",
    "node:url",
    "mime/lite",
    "sync-request",
    "xmlhttprequest-ssl",

    // Used by the SDK
    "comlink",
    "@serenity-kit/noble-sodium",
    "@scure/base",
    `@provablehq/wasm/${network}.js`,
    "core-js/proposals/json-parse-with-source.js",
];

function sharedPlugins(network) {
    return [
        replace({
            preventAssignment: true,
            delimiters: ['', ''],
            values: {
                '%%VERSION%%': $package.version,
                '%%NETWORK%%': network,
            },
        }),
        typescript({
            tsconfig: "tsconfig.json",
            clean: true,
        }),
    ];
}

// Single config per network with two `output` entries: TypeScript compiles
// once and Rollup emits both ESM and CJS from the same input graph.
//
// Browsers don't consume CJS, but emitting `browser.cjs` costs nothing and
// keeps the output matrix uniform. Worker entries (wasm workers) stay ESM
// regardless, because the Node polyfill spawns them via `eval` + dynamic
// `import()` which works fine from a CJS parent.
function buildNetwork(network) {
    return {
        input: {
            "node-polyfill": "./src/node-polyfill.ts",
            "browser": "./src/browser.ts",
            "node": "./src/node.ts",
        },
        output: [
            {
                dir: `dist/${network}`,
                format: "es",
                sourcemap: true,
            },
            {
                dir: `dist/${network}`,
                format: "cjs",
                entryFileNames: "[name].cjs",
                chunkFileNames: "[name].cjs",
                sourcemap: true,
            },
        ],
        external: sharedExternal(network),
        plugins: [...sharedPlugins(network), emitCtsDeclarations(network)],
    };
}

// Rollup plugin that, at the end of the build, copies every `*.d.ts` in
// `dist/<network>/` to a `*.d.cts` sibling. CJS consumers resolve types
// through the `require` condition (which expects `.d.cts`); without these
// siblings `arethetypeswrong` flags "Masquerading as ESM". The declaration
// bodies are identical — the distinct filename is all TypeScript's node16
// module-resolution check cares about.
async function copyDtsToCts(dir) {
    let entries;
    try {
        entries = await $fs.readdir(dir, { withFileTypes: true });
    } catch (err) {
        if (err.code === "ENOENT") return;
        throw err;
    }
    await Promise.all(entries.map(async (entry) => {
        const fullPath = $path.join(dir, entry.name);
        if (entry.isDirectory()) {
            await copyDtsToCts(fullPath);
        } else if (entry.isFile() && entry.name.endsWith(".d.ts")) {
            const target = fullPath.replace(/\.d\.ts$/, ".d.cts");
            await $fs.copyFile(fullPath, target);
        }
    }));
}

function emitCtsDeclarations(network) {
    return {
        name: "emit-cts-declarations",
        async writeBundle() {
            await copyDtsToCts(`dist/${network}`);
        },
    };
}

async function buildRuntimes() {
    await Promise.all(runtimes.map(async (runtime) => {
        await $fs.mkdir(`dist/dynamic`, { recursive: true });

        // Dynamic `import()` is legal in both ESM and CJS, but we point each
        // format at its format-native leaves so a CJS consumer's
        // `loadNetwork()` call stays on the CJS code path end-to-end instead
        // of pulling in an ESM leaf through the dual-package boundary.
        const esmLeaves = networks.map((network) => `"${network}": () => import("../${network}/${runtime}.js"),`).join("\n    ");
        const cjsLeaves = networks.map((network) => `"${network}": () => require("../${network}/${runtime}.cjs"),`).join("\n    ");

        const typings = networks.map((network) => `"${network}": typeof import("../${network}/${runtime}.js"),`).join("\n    ");

        await $fs.writeFile(`dist/dynamic/${runtime}.js`, `const networks = {
    ${esmLeaves}
};

export function loadNetwork(name) {
    return networks[name]();
}
`);

        await $fs.writeFile(`dist/dynamic/${runtime}.cjs`, `"use strict";

const networks = {
    ${cjsLeaves}
};

function loadNetwork(name) {
    return networks[name]();
}

module.exports = { loadNetwork };
`);

        const dtsContent = `interface Networks {
    ${typings}
}

export { Networks };

export declare function loadNetwork<Key extends keyof Networks>(name: Key): Promise<Networks[Key]>;
`;

        await $fs.writeFile(`dist/dynamic/${runtime}.d.ts`, dtsContent);
        await $fs.writeFile(`dist/dynamic/${runtime}.d.cts`, dtsContent);
    }));
}

await buildRuntimes();

export default networks.map(buildNetwork);
