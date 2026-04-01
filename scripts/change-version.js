import { readFile, writeFile } from "node:fs/promises";
import { glob } from "glob";

function isValidVersion(value) {
  return typeof value === "string" && /^\d+\.\d+\.\d+([-.][0-9A-Za-z.-]+)?$/.test(value);
}

function parseVersionArgs(argv) {
  const single = argv[2];
  if (isValidVersion(single)) {
    return { apps: single, engines: single };
  }

  const appsIndex = argv.indexOf("--apps-version");
  const enginesIndex = argv.indexOf("--engine-version");
  const apps = appsIndex >= 0 ? argv[appsIndex + 1] : undefined;
  const engines = enginesIndex >= 0 ? argv[enginesIndex + 1] : undefined;

  if (isValidVersion(apps) && isValidVersion(engines)) {
    return { apps, engines };
  }

  throw new Error(
    "Usage: node scripts/change-version.js <version> OR node scripts/change-version.js --apps-version <x.y.z> --engine-version <x.y.z>",
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
      ["create-leo-app/package.json", versions.apps],
      ["packages/provable-core/package.json", versions.engines],
      ["packages/provable-engine-wasm/package.json", versions.engines],
      ["packages/provable-engine-react-native/package.json", versions.engines],
    ].map(async ([file, version]) => {
      await updateVersion(file, version);
    }),
  );
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
await updateAllDependencyRanges(versions);

console.log(
  `Updated versions successfully (apps=${versions.apps}, engines=${versions.engines}).`,
);
