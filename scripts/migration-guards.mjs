import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

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
    name: "create-leo-app template imports wasm engine",
    path: "create-leo-app/template-node/index.js",
    contains: "@provablehq/provable-engine-wasm",
  },
  {
    name: "provablekit root export only",
    path: "packages/provable-core/package.json",
    contains: '"default": "./dist/index.js"',
  },
  {
    name: "rn engine keeps nitro bindings entry",
    path: "packages/provable-engine-react-native/src/index.ts",
    contains: 'import { createReactNativeBindings } from "./native-bindings-nitro.js";',
  },
];

const scanRoots = ["packages", "create-leo-app", "website", "e2e", "scripts", ".github", "docs", "README.md"];

const scanExtensions = new Set([".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".md", ".json", ".yml", ".yaml", ".toml"]);

const bannedPatterns = [
  {
    name: "legacy @provablehq/sdk import",
    regex: /\b(?:from\s+["']|import\(\s*["']|require\(\s*["'])@provablehq\/sdk(?:\/[A-Za-z0-9._/-]+)?["']/,
  },
  {
    name: "legacy @provablehq/wasm import",
    regex: /\b(?:from\s+["']|import\(\s*["']|require\(\s*["'])@provablehq\/wasm(?:\/[A-Za-z0-9._/-]+)?["']/,
  },
  {
    name: "legacy root wasm Cargo path",
    regex: /\bwasm\/Cargo\.toml\b/,
  },
  {
    name: "legacy root wasm working directory",
    regex: /\b(?:cd\s+wasm|working-directory:\s*wasm)\b/,
  },
  {
    name: "legacy sdk source path",
    regex: /\b(?:\.\.\/)+sdk\/src\//,
  },
  {
    name: "legacy shield-mobile-sdk import",
    regex: /\b(?:from\s+["']|import\(\s*["']|require\(\s*["'])@provablehq\/shield-mobile-sdk(?:\/[A-Za-z0-9._/-]+)?["']/,
  },
  {
    name: "legacy provablekit subpath import",
    regex: /\b(?:from\s+["']|import\(\s*["']|require\(\s*["'])@provablehq\/provablekit\/(?:testnet|mainnet|dynamic)\.js["']/,
  },
];

async function collectFiles(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === "target") continue;
      files.push(...(await collectFiles(fullPath)));
      continue;
    }
    if (scanExtensions.has(path.extname(entry.name))) files.push(fullPath);
  }
  return files;
}

if (existsSync("sdk")) {
  throw new Error("Migration guard failed: legacy root sdk/ directory still exists");
}

if (existsSync("wasm")) {
  throw new Error("Migration guard failed: legacy root wasm/ directory still exists");
}

for (const check of requiredSnippets) {
  const content = await readFile(check.path, "utf8");
  if (!content.includes(check.contains)) {
    throw new Error(`Migration guard failed: ${check.name} (${check.path})`);
  }
}

for (const root of scanRoots) {
  if (!existsSync(root)) continue;
  let files;
  try {
    await readdir(root, { withFileTypes: true });
    files = await collectFiles(root);
  } catch {
    files = [root];
  }

  for (const file of files) {
    const content = await readFile(file, "utf8");
    for (const banned of bannedPatterns) {
      if (banned.regex.test(content)) {
        throw new Error(`Migration guard failed: ${banned.name} (${file})`);
      }
    }
  }
}

console.log("Migration guards passed.");
