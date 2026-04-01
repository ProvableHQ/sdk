import { readFile, writeFile } from "node:fs/promises";
import { glob } from "glob";

function isValidVersion(value) {
  return typeof value === "string" && /^\d+\.\d+\.\d+([-.][0-9A-Za-z.-]+)?$/.test(value);
}

function parseVersionArgs(argv) {
  const single = argv[2];
  if (isValidVersion(single)) {
    return { legacy: single, engines: single };
  }

  const legacyIndex = argv.indexOf("--legacy-version");
  const enginesIndex = argv.indexOf("--engine-version");
  const legacy = legacyIndex >= 0 ? argv[legacyIndex + 1] : undefined;
  const engines = enginesIndex >= 0 ? argv[enginesIndex + 1] : undefined;

  if (isValidVersion(legacy) && isValidVersion(engines)) {
    return { legacy, engines };
  }

  throw new Error(
    "Usage: node scripts/change-version.js <version> OR node scripts/change-version.js --legacy-version <x.y.z> --engine-version <x.y.z>",
  );
}

async function updateVersion(path, newVersion) {
  const json = await readFile(path, { encoding: "utf8" });
  const replaced = json.replace(/"version": *"[^"]+"/, `"version": "${newVersion}"`);
  await writeFile(path, replaced);
}

async function updateDependencies(path, versions) {
  const json = await readFile(path, { encoding: "utf8" });
  const replaced = json
    .replace(/"@provablehq\/sdk": *"[^"]+"/g, `"@provablehq/sdk": "^${versions.legacy}"`)
    .replace(/"@provablehq\/wasm": *"[^"]+"/g, `"@provablehq/wasm": "^${versions.legacy}"`)
    .replace(/"@provablehq\/provablekit": *"[^"]+"/g, `"@provablehq/provablekit": "^${versions.engines}"`)
    .replace(
      /"@provablehq\/provable-engine-wasm": *"[^"]+"/g,
      `"@provablehq/provable-engine-wasm": "^${versions.engines}"`,
    )
    .replace(
      /"@provablehq\/provable-engine-react-native": *"[^"]+"/g,
      `"@provablehq/provable-engine-react-native": "^${versions.engines}"`,
    );
  await writeFile(path, replaced);
}

async function updateVersions(versions) {
  await Promise.all(
    [
      ["create-leo-app/package.json", versions.legacy],
      ["sdk/package.json", versions.legacy],
      ["wasm/package.json", versions.legacy],
      ["packages/provable-core/package.json", versions.engines],
      ["packages/provable-engine-wasm/package.json", versions.engines],
      ["packages/provable-engine-react-native/package.json", versions.engines],
    ].map(async ([file, version]) => {
      await updateVersion(file, version);
    }),
  );
}

async function updateCargo(legacyVersion) {
  const tomlPath = "wasm/Cargo.toml";
  const toml = await readFile(tomlPath, { encoding: "utf8" });

  const packageSectionRegex = /(\[package\][\s\S]*?\nversion\s*=\s*)"[^"]+"/;
  if (!packageSectionRegex.test(toml)) {
    throw new Error(`Could not locate [package] version in ${tomlPath}`);
  }

  const replaced = toml.replace(packageSectionRegex, `$1"${legacyVersion}"`);
  await writeFile(tomlPath, replaced);
}

async function updateAllDependencyRanges(versions) {
  const files = await glob("**/package.json", { ignore: "**/node_modules/**" });
  await Promise.all(
    files.map(async (file) => {
      await updateDependencies(file, versions);
    }),
  );
}

const versions = parseVersionArgs(process.argv);
await updateVersions(versions);
await updateCargo(versions.legacy);
await updateAllDependencyRanges(versions);

console.log(
  `Updated versions successfully (legacy=${versions.legacy}, engines=${versions.engines}).`,
);
