[![Authors](https://img.shields.io/badge/authors-Aleo-orange.svg)](https://provable.com)
[![License](https://img.shields.io/badge/License-GPLv3-blue.svg)](./LICENSE.md)

[![github]](https://github.com/ProvableHQ/sdk)

[github]: https://img.shields.io/badge/github-8da0cb?style=for-the-badge&labelColor=555555&logo=github
[crates-io]: https://img.shields.io/badge/crates.io-fc8d62?style=for-the-badge&labelColor=555555&logo=rust
[docs-rs]: https://img.shields.io/badge/docs.rs-66c2a5?style=for-the-badge&labelColor=555555&logo=docs.rs

# Aleo Wasm

Aleo JavaScript and WebAssembly bindings for building zero-knowledge web applications.

`Rust` compiles easily to `WebAssembly`, but creating the glue code necessary to use compiled WebAssembly binaries
from other languages such as JavaScript is a challenging task. `wasm-bindgen` is a tool that simplifies this process by
auto-generating JavaScript bindings to Rust code that has been compiled into WebAssembly.

This crate uses `wasm-bindgen` to create JavaScript bindings to Aleo source code so that it can be used to create zero-knowledge proofs directly within web browsers and `Node.js`.

Functionality exposed by this crate includes:
* Aleo account management objects
* Aleo primitives such as `Records`, `Programs`, and `Transactions` and their associated helper methods
* A `ProgramManager` object that contains methods for authoring, deploying, and interacting with Aleo programs

More information on these concepts can be found at the [Aleo Developer Hub](https://docs.leo-lang.org/concepts).

## Usage

The [rollup-plugin-rust](https://github.com/wasm-tool/rollup-plugin-rust/) tool is used to compile the Rust code in this crate into JavaScript
modules which can be imported into other JavaScript projects.

#### Installation

Follow the [installation instructions](https://github.com/wasm-tool/rollup-plugin-rust/#installation) on the rollup-plugin-rust README.

### Build Instructions

```bash
yarn build
```

This will produce `.js` and `.wasm` files inside of the `dist` folder.

### Memory64 build

The separate Memory64 build uses the same Rust sources and snarkVM version as
wasm32, with an 8 GiB maximum, shared memory, atomics and the existing Rayon pool.
The caller still selects the thread count through `initThreadPool(threads)`.

From the repository root:

```bash
rustup toolchain install 1.96.0 --profile minimal
rustup toolchain install nightly-2026-04-02 --profile minimal --component rust-src
yarn install --immutable
yarn build:wasm
yarn build:wasm64
yarn build:sdk
```

`yarn build:all` includes both WASM variants and the SDK. The Memory64 artifacts
are written to `wasm/dist/wasm64/{testnet,mainnet}/` and
`sdk/dist/wasm64/{testnet,mainnet}/`. Existing output directories and default
package imports continue to select wasm32. Development builds can set
`BUILD_DEBUG=1` for the Memory64 build.

Use `@provablehq/wasm/wasm64/mainnet.js` or
`@provablehq/wasm/wasm64/testnet.js` for the low-level bindings. The corresponding
worker paths are `@provablehq/wasm/wasm64/mainnet/worker.js` and
`@provablehq/wasm/wasm64/testnet/worker.js`. Keep the JS, WASM and workers from the
same build together. Memory64 needs a runtime with 64-bit shared-memory and
atomics support; the installed-package tests run on Node.js 24.

The build pins wasm-bindgen 0.2.129 and Binaryen 125 separately from wasm32.
It explicitly enables the multivalue binding ABI, including for stripped release
modules. Set `WASM_OPT_BIN` to use a native Binaryen 125 `wasm-opt` executable
instead of the pinned npm tool.
Until upstream dependencies support threaded Memory64, the build applies the
compatibility patches in `build/memory64/patches/` to checksum-verified crate
archives under `target/`. These patches implement 64-bit thread/TLS/stack
addresses and select browser backends in the dependencies. They contain no
proving diagnostics or changes to proof algorithms. Cargo's shared registry
sources are never modified. The first build needs network access; subsequent
builds reuse the prepared dependencies and compiled tools.

`build/memory64/dependencies.js` generates `memory64/Cargo.toml` from the current
SDK manifest, pointing at the same library and license-check sources. The
separate, tracked `memory64/Cargo.lock` keeps the wasm32 binding ABI unchanged.
When updating SDK dependencies, prepare the manifest with
`node wasm/build/memory64.js --prepare-only` from the repository root, update
that lockfile intentionally, and test both variants. The build itself always
uses `--locked`; it does not resolve or upgrade dependencies during compilation.

Run `yarn workspace @provablehq/sdk test:wasm64` on Node.js 24 after building.
This packs and installs both packages into a clean fixture, then tests ESM,
CommonJS, Memory64 shared memory and Rayon workers on both networks. The local
execution check downloads public SRS parameters if they are not cached. The
Memory64 GitHub Actions workflow also checks both packages' export maps.

## Testing

Run tests in Node.js
```bash
wasm-pack test --node
```

Run tests in a browser
```bash
wasm-pack test --[firefox/chrome/safari]
```

## Building Web Apps

Further documentation and tutorials as to how to use the modules built from this crate to build web apps will be built
in the future. However, in the meantime, the [provable.tools](https://provable.tools) website is a good
example of how to use these modules to build a web app. Its source code can be found in the
[Provable SDK](https://github.com/ProvableHQ/sdk) repo in the `website` folder.
