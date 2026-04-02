import * as $fs from "node:fs/promises";
import * as $path from "node:path";
import { fileURLToPath } from "node:url";
import { rollup } from "rollup";
import virtual from "@rollup/plugin-virtual";
import rust from "@wasm-tool/rollup-plugin-rust";

const here = $path.dirname(fileURLToPath(import.meta.url));
const wasmSourceRoot = $path.resolve(here, "./rust");
const cargoTomlPath = $path.join(wasmSourceRoot, "Cargo.toml");
const isDebugBuild = process.env.BUILD_DEBUG === "1";

async function buildRollup(input, output) {
  const bundle = await rollup(input);
  try {
    await bundle.write(output);
  } finally {
    await bundle.close();
  }
}

async function buildWasm(network) {
  await buildRollup(
    {
      input: {
        aleo_wasm: cargoTomlPath,
        aleo_wasm_custom: `${cargoTomlPath}?custom`,
      },
      plugins: [
        rust({
          extraArgs: {
            cargo: ["--no-default-features", "--features", `browser,${network}`],
            rustc: ["-C", "link-arg=--max-memory=4294967296"],
            wasmOpt: [
              "-O",
              "--enable-threads",
              "--enable-bulk-memory",
              "--enable-nontrapping-float-to-int",
            ],
          },
          optimize: isDebugBuild ? { release: false, wasmOpt: false, rustc: false } : undefined,
          experimental: {
            atomics: true,
            typescriptDeclarationDir: `dist/${network}`,
          },
        }),
      ],
    },
    {
      dir: `dist/${network}/tmp`,
      format: "es",
      sourcemap: true,
      assetFileNames: `[name][extname]`,
      chunkFileNames: `[name].js`,
      entryFileNames: `[name].js`,
    },
  );
}

async function buildJS(network) {
  const js = `export * from "./dist/${network}/tmp/aleo_wasm.js";

import { initThreadPool as wasmInitThreadPool } from "./dist/${network}/tmp/aleo_wasm.js";

export async function initThreadPool(threads) {
  if (threads == null) {
    threads = navigator.hardwareConcurrency;
  }

  console.info(\`Spawning \${threads} threads\`);
  await wasmInitThreadPool(new URL("worker.js", import.meta.url), threads);
}`;

  await buildRollup(
    {
      input: { index: "entry" },
      plugins: [virtual({ entry: js })],
    },
    {
      dir: `dist/${network}`,
      format: "es",
      sourcemap: true,
    },
  );
}

async function buildWorker(network) {
  const worker = `import { init } from "./dist/${network}/tmp/aleo_wasm_custom.js";

async function initializeWorker() {
  function waitForEvent() {
    return new Promise((resolve) => {
      addEventListener("message", (event) => {
        resolve(event.data);
      }, { capture: true, once: true });
    });
  }

  const { module, memory, address } = await waitForEvent();
  const exports = await init({ module, memory });
  postMessage(null);
  exports.runRayonThread(address);
  close();
}

await initializeWorker();`;

  await buildRollup(
    {
      input: { worker: "entry" },
      plugins: [virtual({ entry: worker })],
    },
    {
      dir: `dist/${network}`,
      format: "es",
      sourcemap: true,
    },
  );
}

async function patchNodeWasmInit(network) {
  const indexPath = $path.join("dist", network, "index.js");
  const contents = await $fs.readFile(indexPath, "utf8");

  const initPattern =
    /const module\$1 = new URL\("aleo_wasm\.wasm", import\.meta\.url\);\s*[\r\n]+\s*await __wbg_init\(\{ module_or_path: module\$1 \}\);/m;

const initReplacement = `const module$1 = new URL("aleo_wasm.wasm", import.meta.url);
const ready = __wbg_init({ module_or_path: module$1 });`;

  let next = contents.replace(initPattern, initReplacement);
  if (next === contents) {
    throw new Error(`Failed to patch wasm init for ${network}: expected init snippet not found`);
  }

  next = next.replace(
    /threads = navigator\.hardwareConcurrency;/g,
    'threads = typeof navigator !== "undefined" ? navigator.hardwareConcurrency : 1;',
  );

  await $fs.writeFile(indexPath, next, "utf8");
}

async function buildTypes(network) {
  const js = `/**
 * Initializes a thread pool of Workers.
 */
export function initThreadPool(threads?: number): Promise<void>;
export * from "./aleo_wasm.js";`;
  const worker = `export {};`;
  await $fs.mkdir(`dist/${network}`, { recursive: true });
  await Promise.all([
    $fs.writeFile(`dist/${network}/index.d.ts`, js),
    $fs.writeFile(`dist/${network}/worker.d.ts`, worker),
  ]);
}

async function build(network) {
  await Promise.all([buildTypes(network), buildWasm(network)]);
  await Promise.all([buildJS(network), buildWorker(network)]);
  await $fs.rename(
    $path.join("dist", network, "tmp", "aleo_wasm.wasm"),
    $path.join("dist", network, "aleo_wasm.wasm"),
  );
  await Promise.all([
    $fs.rm($path.join("dist", network, "tmp"), { recursive: true }),
    $fs.rm($path.join("dist", network, "aleo_wasm_custom.d.ts")),
  ]);
  await patchNodeWasmInit(network);
}

console.time("Building inlined wasm engine runtime");
await Promise.all(["testnet", "mainnet"].map(build));
console.timeEnd("Building inlined wasm engine runtime");
