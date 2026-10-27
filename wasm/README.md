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

### wasm64 build

The separate wasm64 build compiles the same Rust sources and snarkVM version as
wasm32 for `wasm64-unknown-unknown`, with an 8 GiB maximum, shared memory, atomics
and the existing Rayon pool. The caller still selects the thread count through
`initThreadPool(threads)`. Its bindings are published as
[`@provablehq/wasm64`](../wasm64/README.md), versioned in lockstep
with `@provablehq/wasm`.

From the repository root:

```bash
yarn install --immutable
yarn build:wasm
yarn build:wasm64
yarn build:sdk
```

Both builds use the toolchain in `rust-toolchain.toml`; the wasm64 build also
needs its `rust-src` component for `-Zbuild-std`. `yarn build:all` includes both
WASM variants and the SDK. The wasm64 artifacts are written to
`wasm64/dist/{testnet,mainnet}/` and `sdk/dist/wasm64/{testnet,mainnet}/`.
Development builds can set `BUILD_DEBUG=1` for the wasm64 build.

The wasm64 build uses Binaryen 125 instead of the wasm32 Binaryen 120, and a
wasm-bindgen CLI built from source with the same toolchain. It explicitly enables
the multivalue binding ABI, including for stripped release modules. Set
`WASM_OPT_BIN` to use a native Binaryen 125 `wasm-opt` executable instead of the
pinned npm tool.
Until upstream dependencies support threaded wasm64, the build applies the
compatibility patches in `build/wasm64/patches/` to checksum-verified crate
archives under `target/`. These patches implement 64-bit thread/TLS/stack
addresses and select browser backends in the dependencies. They contain no
proving diagnostics or changes to proof algorithms. Cargo's shared registry
sources are never modified. The first build needs network access; subsequent
builds reuse the prepared dependencies and compiled tools.

`build/wasm64/dependencies.js` generates `wasm64/Cargo.toml` from the current
SDK manifest, pointing at the same library and license-check sources. The
separate, tracked `wasm64/Cargo.lock` matches `Cargo.lock` except for the
patched crates, which resolve to the build-local copies. When updating SDK
dependencies, prepare the manifest with `node wasm/build/wasm64.js --prepare-only`
from the repository root, update that lockfile intentionally, and test both
variants. The snarkVM patches are pinned to the snarkVM release in `Cargo.toml`
and must be regenerated when it changes. The build itself always uses `--locked`;
it does not resolve or upgrade dependencies during compilation.

Run `yarn test:sdk:wasm64` on Node.js 24 after building. It runs the SDK test
suite against the wasm64 build instead of wasm32. Run
`yarn workspace @provablehq/sdk test:cjs:pack:wasm64` to pack and install the
three packages into a clean fixture, then test ESM, CommonJS, wasm64 shared
memory and Rayon workers on both networks. The local execution check downloads
public SRS parameters if they are not cached. On a Node.js line without wasm64
shared memory (before 24), add `--expect-unsupported` to assert instead that the
wasm64 entry points throw the documented error while the wasm32 entry still
works. The `runtime compat` jobs in `.github/workflows/sdk.yml` run both forms
on Node.js 20, 22, 24 and 26 for every pull request. The wasm64 GitHub Actions
workflow also checks the packages' export maps.

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
