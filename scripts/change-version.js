import { readFile, writeFile } from "node:fs/promises";
import { glob } from "glob";


// Updates the version in the `package.json` file
async function updateVersion(path, newVersion) {
    const json = await readFile(path, { encoding: "utf8" });

    const replaced = json.replace(/"version": *"[^"]+"/, `"version": "${newVersion}"`);

    await writeFile(path, replaced);
}


// Updates the `package.json` file so it uses the correct
// version of `@provablehq/wasm` and `@provablehq/sdk`
async function updateDependency(path, newVersion) {
    const json = await readFile(path, { encoding: "utf8" });

    const replaced = json
        .replace(/"@provablehq\/sdk": *"[^"]+"/g, `"@provablehq/sdk": "^${newVersion}"`)
        .replace(/"@provablehq\/wasm": *"[^"]+"/g, `"@provablehq/wasm": "^${newVersion}"`);

    await writeFile(path, replaced);
}


// Updates the version of the published `package.json` files
async function updateVersions(newVersion) {
    await Promise.all([
        "create-leo-app/package.json",
        "sdk/package.json",
        "wasm/package.json",
    ].map(async (file) => {
        await updateVersion(file, newVersion);
    }));
}


// Updates the version in `Cargo.toml`
async function updateCargo(newVersion) {
    const toml = await readFile("wasm/Cargo.toml", { encoding: "utf8" });

    const replaced = toml
        .replace(/(\[package\]\s+name *= *"aleo-wasm"\s+version *= *)"[^"]+"/, `$1"${newVersion}"`);

    await writeFile("wasm/Cargo.toml", replaced);

    // Memory64 builds with --locked; keep both root package entries in sync
    // without resolving or updating any third-party dependencies.
    for (const path of ["wasm/Cargo.lock", "wasm/memory64/Cargo.lock"]) {
        const lock = await readFile(path, { encoding: "utf8" });
        const packageVersion = /(\[\[package\]\]\s+name = "aleo-wasm"\s+version = )"[^"]+"/;
        if (!packageVersion.test(lock)) throw new Error(`Missing aleo-wasm package in ${path}`);
        await writeFile(path, lock.replace(packageVersion, `$1"${newVersion}"`));
    }
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
