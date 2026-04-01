import { readFile } from "node:fs/promises";

const requiredSnippets = [
  {
    name: "e2e imports provablekit",
    path: "e2e/testnet/index.js",
    contains: "@provablehq/provablekit",
  },
  {
    name: "e2e imports wasm engine",
    path: "e2e/testnet/index.js",
    contains: 'from "@provablehq/provable-engine-wasm"',
  },
  {
    name: "website hook imports provablekit",
    path: "website/src/aleo-wasm-hook.js",
    contains: 'import("@provablehq/provablekit")',
  },
  {
    name: "website worker imports wasm engine",
    path: "website/src/workers/worker.js",
    contains: 'from "@provablehq/provable-engine-wasm"',
  },
  {
    name: "create-leo-app template uses provablekit",
    path: "create-leo-app/template-node/index.js",
    contains: "@provablehq/provablekit",
  },
];

for (const check of requiredSnippets) {
  const content = await readFile(check.path, "utf8");
  if (!content.includes(check.contains)) {
    throw new Error(`Migration guard failed: ${check.name} (${check.path})`);
  }
}

console.log("Migration guards passed.");
