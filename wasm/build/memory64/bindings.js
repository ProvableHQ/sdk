import * as fs from "node:fs/promises";
import path from "node:path";
import { rollup } from "rollup";
import virtual from "@rollup/plugin-virtual";

async function bundle(source, output, format) {
    const build = await rollup({
        input: "entry",
        plugins: [virtual({ entry: source })],
        external: ["node:fs", "node:url"],
    });
    try {
        await build.write({ file: output, format, sourcemap: true });
    } finally {
        await build.close();
    }
}

export async function emitBindings(output) {
    const bindings = JSON.stringify(path.join(output, "aleo_wasm.js"));
    const checkRuntime = `
try {
    new WebAssembly.Memory({ initial: 0n, maximum: 1n, shared: true, address: "i64" });
} catch (cause) {
    throw new Error("This SDK build requires Memory64 shared-memory support. Select the wasm32 import on unsupported runtimes.", { cause });
}
`;
    await bundle(
        `
import initialize, { initThreadPool as initializePool } from ${bindings};
export * from ${bindings};
${checkRuntime}
await initialize({ module_or_path: new URL("./aleo_wasm.wasm", import.meta.url) });
export function initThreadPool(threads = navigator.hardwareConcurrency) {
    return initializePool(new URL("worker.js", import.meta.url), threads);
}
`,
        path.join(output, "index.js"),
        "es",
    );

    await bundle(
        `
import * as bindings from ${bindings};
import { readFileSync } from "node:fs";
${checkRuntime}
bindings.initSync({ module: readFileSync(new URL("./aleo_wasm.wasm", import.meta.url)) });
const { default: initialize, ...exports } = bindings;
module.exports = { ...exports, initThreadPool(threads = navigator.hardwareConcurrency) {
    return bindings.initThreadPool(new URL("worker.js", import.meta.url), threads);
} };
`,
        path.join(output, "index.cjs"),
        "cjs",
    );

    await bundle(
        `
import initialize, { runRayonThread } from ${bindings};
const { module, memory, address } = await new Promise(resolve =>
    addEventListener("message", ({ data }) => resolve(data), { once: true }));
await initialize({ module_or_path: module, memory });
postMessage(null);
runRayonThread(address);
close();
`,
        path.join(output, "worker.js"),
        "es",
    );

    const types =
        'export * from "./aleo_wasm.js";\nexport declare function initThreadPool(threads?: number): Promise<void>;\n';
    await fs.writeFile(path.join(output, "index.d.ts"), types);
    await fs.writeFile(path.join(output, "index.d.cts"), types);
    await fs.writeFile(path.join(output, "worker.d.ts"), "export {};\n");
}
