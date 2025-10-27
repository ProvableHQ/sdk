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

function buildNetwork(network) {
    return {
        input: {
            "node-polyfill": "./src/node-polyfill.ts",
            "browser": "./src/browser.ts",
            "node": "./src/node.ts",
        },
        output: {
            dir: `dist/${network}`,
            format: "es",
            sourcemap: true,
        },
        external: [
            // Used by node-polyfill
            "node:worker_threads",
            "node:os",
            "node:fs",
            "node:crypto",
            "mime/lite",
            "sync-request",
            "xmlhttprequest-ssl",

            // Used by the SDK
            "comlink",
            `@provablehq/wasm/${network}.js`,
            "core-js/proposals/json-parse-with-source.js",
        ],
        plugins: [
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
        ],
    };
}

async function buildRuntimes() {
    await Promise.all(runtimes.map(async (runtime) => {
        await $fs.mkdir(`dist/dynamic`, { recursive: true });

        const loading = networks.map((network) => `"${network}": () => import("../${network}/${runtime}.js"),`).join("\n    ");

        const typings = networks.map((network) => `"${network}": typeof import("../${network}/${runtime}"),`).join("\n    ");

        await $fs.writeFile(`dist/dynamic/${runtime}.js`, `const networks = {
    ${loading}
};

export function loadNetwork(name) {
    return networks[name]();
}
`);

        await $fs.writeFile(`dist/dynamic/${runtime}.d.ts`, `interface Networks {
    ${typings}
}

export { Networks };

export declare function loadNetwork<Key extends keyof Networks>(name: Key): Promise<Networks[Key]>;
`);
    }));
}

await buildRuntimes();

export default networks.map(buildNetwork);
