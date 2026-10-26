// Emits the source of the default `dynamic` entry points,
// `dist/dynamic/{browser,node}.{js,cjs,d.ts}`.
//
// The entry loads the SDK for a network and selects the WebAssembly build:
// wasm32 by default, wasm64 on request, or "auto" to take wasm64 when the
// runtime supports it and fall back to wasm32 otherwise. `rollup.config.js`
// writes the output; `tests/dynamic-entry/select.test.mjs` runs it against
// stub leaves.

export function dynamicEntry({ runtime, format, networks }) {
    switch (format) {
        case "esm":
            return esm(runtime, networks);
        case "cjs":
            return cjs(runtime, networks);
        case "dts":
            return dts(runtime, networks);
        default:
            throw new Error(`Unknown dynamic entry format "${format}"`);
    }
}

// The leaves point each format at its format-native build, so a CJS
// consumer's `loadNetwork()` stays on the CJS code path end-to-end instead of
// pulling in an ESM leaf through the dual-package boundary.
function leaves(runtime, networks, load, extension) {
    const entries = (prefix) =>
        networks
            .map(
                (network) =>
                    `        ${JSON.stringify(network)}: () => ${load}("../${prefix}${network}/${runtime}.${extension}"),`,
            )
            .join("\n");
    return `const leaves = {
    wasm32: {
${entries("")}
    },
    wasm64: {
${entries("wasm64/")}
    },
};`;
}

function body(networks) {
    const expected = networks
        .map((network) => JSON.stringify(network))
        .join(" or ");
    return `
const VARIANTS = ["wasm32", "wasm64"];

// Reports whether the runtime can create 64-bit shared WebAssembly memory,
// which the wasm64 build needs. Pure and synchronous.
function supportsWasm64() {
    try {
        new WebAssembly.Memory({ initial: 0n, maximum: 1n, shared: true, address: "i64" });
        return true;
    } catch {
        return false;
    }
}

// Reports whether the threaded builds can start their Rayon pool: shared
// memory, a Worker implementation, and cross-origin isolation in browsers.
function supportsThreads() {
    if (typeof SharedArrayBuffer === "undefined") return false;
    if (typeof crossOriginIsolated !== "undefined" && !crossOriginIsolated) return false;
    return typeof Worker !== "undefined" || isNode();
}

function isNode() {
    return typeof process !== "undefined"
        && typeof process.versions === "object"
        && process.versions !== null
        && typeof process.versions.node === "string";
}

// PROVABLE_SDK_VARIANT pins a build for a Node.js deployment without a code
// change. It applies when the caller passes no variant or "auto".
function environmentVariant() {
    if (!isNode() || typeof process.env !== "object" || process.env === null) return undefined;
    const value = process.env.PROVABLE_SDK_VARIANT;
    return value === undefined || value === "" ? undefined : value;
}

function resolveVariant(requested) {
    const open = requested === undefined || requested === "auto";
    const choice = open ? environmentVariant() ?? requested ?? "wasm32" : requested;
    if (choice !== "auto" && !VARIANTS.includes(choice)) {
        throw new TypeError(\`Unknown SDK variant "\${choice}"; expected "wasm32", "wasm64" or "auto"\`);
    }
    return choice;
}

// Records the loaded build so that loading the other build in the same realm
// is reported. Objects of one build cannot be used with the other.
const MARK = Symbol.for("@provablehq/sdk/variant");
function mark(variant, sdk) {
    const previous = globalThis[MARK];
    if (previous !== undefined && previous !== variant) {
        console.warn(\`@provablehq/sdk: loaded the \${variant} build after the \${previous} build; objects from one build cannot be used with the other.\`);
    }
    globalThis[MARK] = variant;
    return sdk;
}

async function loadNetwork(name, options = {}) {
    if (!Object.prototype.hasOwnProperty.call(leaves.wasm32, name)) {
        throw new TypeError(\`Unknown network "\${name}"; expected ${expected}\`);
    }
    const requested = resolveVariant(options.variant);
    const chosen = requested === "auto" ? (supportsWasm64() ? "wasm64" : "wasm32") : requested;
    if (chosen === "wasm64") {
        try {
            return mark("wasm64", await leaves.wasm64[name]());
        } catch (error) {
            // "auto" falls back when @provablehq/wasm64 is not installed or
            // the build fails to initialize. An explicit request surfaces it.
            if (requested !== "auto") throw error;
        }
    }
    return mark("wasm32", await leaves.wasm32[name]());
}
`;
}

function esm(runtime, networks) {
    return `${leaves(runtime, networks, "import", "js")}
${body(networks)}
export { loadNetwork, supportsWasm64, supportsThreads };
`;
}

function cjs(runtime, networks) {
    return `"use strict";

${leaves(runtime, networks, "require", "cjs")}
${body(networks)}
module.exports = { loadNetwork, supportsWasm64, supportsThreads };
`;
}

function dts(runtime, networks) {
    const typings = networks
        .map(
            (network) =>
                `    ${JSON.stringify(network)}: typeof import("../${network}/${runtime}.js"),`,
        )
        .join("\n");
    return `interface Networks {
${typings}
}

export { Networks };

/**
 * WebAssembly build of the SDK. \`wasm32\` caps linear memory at 4 GiB. \`wasm64\`
 * raises the cap to 8 GiB and needs 64-bit shared memory in the runtime and the
 * optional peer dependency \`@provablehq/wasm64\`.
 */
export type Variant = "wasm32" | "wasm64";

/**
 * Options for \`loadNetwork\`.
 *
 * @property variant Build to load. Defaults to "wasm32". "wasm64" loads the
 *   wasm64 build and fails when the runtime lacks 64-bit shared memory or
 *   \`@provablehq/wasm64\` is not installed. "auto" loads wasm64 when
 *   \`supportsWasm64()\` is true and the build initializes, and otherwise falls
 *   back to wasm32. In Node.js the \`PROVABLE_SDK_VARIANT\` environment variable
 *   replaces an absent or "auto" value.
 */
export interface LoadNetworkOptions {
    variant?: Variant | "auto";
}

/**
 * Reports whether the runtime can create 64-bit shared WebAssembly memory.
 *
 * Pure and synchronous. Covers the memory model only; \`supportsThreads()\`
 * covers Workers and shared memory.
 */
export declare function supportsWasm64(): boolean;

/**
 * Reports whether the threaded builds can start their Rayon pool.
 *
 * True when the runtime has \`SharedArrayBuffer\`, a \`Worker\` implementation or
 * is Node.js, and is cross-origin isolated where that applies.
 */
export declare function supportsThreads(): boolean;

/**
 * Loads the SDK for a network and selects the WebAssembly build.
 *
 * Loads and initializes the chosen build, which compiles its WebAssembly
 * module. The choice MUST be made once per application: objects from one build
 * cannot be passed to the other.
 *
 * @param name Network to load.
 * @param options Build selection. Defaults to the wasm32 build.
 * @returns The SDK module for the network.
 * @throws If the network or variant is unknown, or an explicit "wasm64" cannot
 *   load.
 *
 * @example
 * const { Account } = await loadNetwork("mainnet", { variant: "auto" });
 */
export declare function loadNetwork<Key extends keyof Networks>(name: Key, options?: LoadNetworkOptions): Promise<Networks[Key]>;
`;
}
