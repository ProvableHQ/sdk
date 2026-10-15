import * as fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

export const wasmRoot = fileURLToPath(new URL("../../", import.meta.url));
const directory = fileURLToPath(new URL("./", import.meta.url));
export const cache = path.join(wasmRoot, "target/memory64-build");
export const manifestDirectory = path.join(wasmRoot, "memory64");
export const toolchain = "nightly-2026-04-02";
const dependencies = JSON.parse(
    await fs.readFile(new URL("dependencies.json", import.meta.url), "utf8"),
);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export function run(command, args, options = {}) {
    const result = spawnSync(command, args, { stdio: "inherit", ...options });
    if (result.error) throw result.error;
    if (result.status !== 0)
        throw new Error(`${command} exited with status ${result.status}`);
}

// These browser-target and threading patches are build dependencies until their
// upstream releases support Memory64. Never modify Cargo's shared registry.
async function prepareDependency(key, dependency) {
    const destination = path.join(cache, "dependencies", key);
    const patch =
        dependency.patch &&
        (await fs.readFile(path.join(directory, dependency.patch)));
    const fingerprint = sha256(
        Buffer.concat([
            Buffer.from(dependency.sha256),
            patch || Buffer.alloc(0),
        ]),
    );
    const marker = path.join(destination, ".sdk-source-sha256");
    if ((await fs.readFile(marker, "utf8").catch(() => "")) === fingerprint)
        return destination;

    const response = await fetch(
        `https://static.crates.io/crates/${dependency.name}/${key}.crate`,
    );
    if (!response.ok)
        throw new Error(`Downloading ${key}: HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (sha256(bytes) !== dependency.sha256)
        throw new Error(`Checksum mismatch for ${key}`);

    await fs.mkdir(path.dirname(destination), { recursive: true });
    const temporary = await fs.mkdtemp(path.join(cache, "extract-"));
    try {
        const archive = path.join(temporary, "source.crate");
        await fs.writeFile(archive, bytes);
        run("tar", ["-xzf", archive, "-C", temporary]);
        const source = path.join(temporary, key);
        if (patch) {
            const patchPath = path.join(directory, dependency.patch);
            run("git", ["apply", "--check", patchPath], { cwd: source });
            run("git", ["apply", patchPath], { cwd: source });
        }
        await fs.writeFile(
            path.join(source, ".sdk-source-sha256"),
            fingerprint,
        );
        await fs.rm(destination, { recursive: true, force: true });
        await fs.rename(source, destination);
    } finally {
        await fs.rm(temporary, { recursive: true, force: true });
    }
    return destination;
}

export async function prepareDependencies() {
    await fs.mkdir(cache, { recursive: true });
    const sources = {};
    for (const [key, dependency] of Object.entries(dependencies)) {
        sources[key] = await prepareDependency(key, dependency);
    }
    return sources;
}

export async function prepareManifest(sources) {
    // Build the same Rust sources and dependency requirements as wasm32. Keep a
    // separate lockfile so newer Memory64 bindings do not update the wasm32 ABI.
    let manifest = await fs.readFile(path.join(wasmRoot, "Cargo.toml"), "utf8");
    manifest = manifest.replace(
        "[package]",
        '[package]\nbuild = "../build.rs"',
    );
    manifest = manifest.replace("[lib]", '[lib]\npath = "../src/lib.rs"');
    const bindings = {
        "wasm-bindgen": "0.2.129",
        "wasm-bindgen-futures": "0.4.79",
        "wasm-bindgen-test": "0.3.79",
        "js-sys": "0.3.106",
        "web-sys": "0.3.106",
    };
    for (const [name, version] of Object.entries(bindings)) {
        const section =
            name === "wasm-bindgen-test" ? "dev-dependencies" : "dependencies";
        const pattern = new RegExp(
            `(\\[${section}\\.${name}\\]\\s*version\\s*=\\s*)"[^"]+"`,
        );
        if (!pattern.test(manifest))
            throw new Error(`Missing ${section}.${name} in wasm/Cargo.toml`);
        manifest = manifest.replace(pattern, `$1"=${version}"`);
    }
    manifest += "\n[workspace]\n\n[patch.crates-io]\n";
    for (const [key, dependency] of Object.entries(dependencies)) {
        if (dependency.name.startsWith("wasm-bindgen-cli")) continue;
        const relative = path
            .relative(manifestDirectory, sources[key])
            .split(path.sep)
            .join("/");
        const alias =
            dependency.name === "reqwest"
                ? `reqwest_${dependency.version.split(".")[1]}`
                : dependency.name;
        manifest += `${alias} = { package = "${dependency.name}", path = "${relative}" }\n`;
    }
    await fs.mkdir(manifestDirectory, { recursive: true });
    const manifestPath = path.join(manifestDirectory, "Cargo.toml");
    if (
        (await fs.readFile(manifestPath, "utf8").catch(() => "")) !== manifest
    ) {
        await fs.writeFile(manifestPath, manifest);
    }
}

export async function buildBindgen(sources) {
    const cli = sources["wasm-bindgen-cli-0.2.129"];
    const support = sources["wasm-bindgen-cli-support-0.2.129"];
    // Keep every CLI dependency pinned to its checksum-verified release lockfile;
    // only replace the cli-support registry package with the patched local copy.
    const lockPath = path.join(cli, "Cargo.lock");
    let lock = await fs.readFile(lockPath, "utf8");
    lock = lock.replace(
        /(\[\[package\]\]\nname = "wasm-bindgen-cli-support"\nversion = "0\.2\.129"\n)source = "[^"\n]+"\nchecksum = "[^"\n]+"\n/,
        "$1",
    );
    await fs.writeFile(lockPath, lock);
    const target = path.join(cache, "tools");
    run(
        "cargo",
        [
            "+1.96.0",
            "build",
            "--release",
            "--locked",
            "--bin",
            "wasm-bindgen",
            "--manifest-path",
            path.join(cli, "Cargo.toml"),
            "--target-dir",
            target,
            "--config",
            `patch.crates-io.wasm-bindgen-cli-support.path=${JSON.stringify(support)}`,
        ],
        { cwd: wasmRoot },
    );
    return path.join(
        target,
        "release",
        process.platform === "win32" ? "wasm-bindgen.exe" : "wasm-bindgen",
    );
}
