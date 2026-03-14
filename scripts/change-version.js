import { readFile, writeFile } from "node:fs/promises";
import { glob } from "glob";


// Updates the version in the `package.json` file
async function updateVersion(path, newVersion) {
    const json = await readFile(path, { encoding: "utf8" });

    const replaced = json.replace(/"version": *"[^"]+"/, `"version": "${newVersion}"`);

    await writeFile(path, replaced);
}


// Updates the `package.json` file so it uses the correct
// version of `@provablehq/wasm`, `@provablehq/wasm-account-tools`, and `@provablehq/sdk`
async function updateDependency(path, newVersion) {
    const json = await readFile(path, { encoding: "utf8" });

    const replaced = json
        .replace(/"@provablehq\/sdk": *"[^"]+"/g, `"@provablehq/sdk": "^${newVersion}"`)
        .replace(/"@provablehq\/wasm": *"[^"]+"/g, `"@provablehq/wasm": "^${newVersion}"`)
        .replace(/"@provablehq\/wasm-account-tools": *"[^"]+"/g, `"@provablehq/wasm-account-tools": "^${newVersion}"`);

    await writeFile(path, replaced);
}


// Updates the version of the published `package.json` files
async function updateVersions(newVersion) {
    await Promise.all([
        "create-leo-app/package.json",
        "sdk/package.json",
        "sdk-account-tools/package.json",
        "wasm/package.json",
        "wasm-account-tools/package.json",
    ].map(async (file) => {
        await updateVersion(file, newVersion);
    }));
}


// Updates the version in `Cargo.toml` files
async function updateCargo(newVersion) {
    await Promise.all([
        {
            path: "wasm/Cargo.toml",
            pattern: /(\[package\]\s+name *= *"aleo-wasm"\s+version *= *)"[^"]+"/,
        },
        {
            path: "wasm-account-tools/Cargo.toml",
            pattern: /(\[package\]\s+name *= *"wasm-account-tools"\s+version *= *)"[^"]+"/,
        },
    ].map(async ({ path, pattern }) => {
        const toml = await readFile(path, { encoding: "utf8" });
        const replaced = toml.replace(pattern, `$1"${newVersion}"`);
        await writeFile(path, replaced);
    }));
}


// Updates all of the `package.json` files so they use the correct
// version of `@provablehq/wasm` and `@provablehq/sdk`
async function updateDependencies(newVersion) {
    const files = await glob("**/package.json", { ignore: "**/node_modules/**" });

    await Promise.all(files.map(async (file) => {
        await updateDependency(file, newVersion);
    }));
}


const newVersion = process.argv[2];

await updateVersions(newVersion);
await updateCargo(newVersion);
await updateDependencies(newVersion);
