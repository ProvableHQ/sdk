[![Crates.io](https://img.shields.io/crates/v/aleo-wasm.svg?color=neon)](https://crates.io/crates/aleo-wasm)
[![Authors](https://img.shields.io/badge/authors-Aleo-orange.svg)](https://aleo.org)
[![License](https://img.shields.io/badge/License-GPLv3-blue.svg)](./LICENSE.md)

[![github]](https://github.com/AleoHQ/sdk)&ensp;[![crates-io]](https://crates.io/crates/aleo-wasm)&ensp;[![docs-rs]](https://docs.rs/aleo-wasm/latest/aleo-wasm/)

[github]: https://img.shields.io/badge/github-8da0cb?style=for-the-badge&labelColor=555555&logo=github
[crates-io]: https://img.shields.io/badge/crates.io-fc8d62?style=for-the-badge&labelColor=555555&logo=rust
[docs-rs]: https://img.shields.io/badge/docs.rs-66c2a5?style=for-the-badge&labelColor=555555&logo=docs.rs

# Aleo Wasm

Aleo JavaScript and WebAssembly bindings for building zero-knowledge web applications.

`Rust` compiles easily to `WebAssembly` but creating the glue code necessary to use compiled WebAssembly binaries 
from other languages such as JavaScript is a challenging task. `wasm-bindgen` is a tool that simplifies this process by 
auto-generating JavaScript bindings to Rust code that has been compiled into WebAssembly. 

This crate uses `wasm-bindgen` to create JavaScript bindings to Aleo source code so that it can be used to create zero 
knowledge proofs directly within `web browsers` and `NodeJS`.

Functionality exposed by this crate includes:
* Aleo account management objects
* Aleo primitives such as `Records`, `Programs`, and `Transactions` and their associated helper methods
* A `ProgramManager` object that contains methods for authoring, deploying, and interacting with Aleo programs

More information on these concepts can be found at the [Aleo Developer Hub](https://developer.aleo.org/concepts).

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

## Testing

Run tests in NodeJS
```bash
wasm-pack test --node
```

Run tests in a browser
```bash
wasm-pack test --[firefox/chrome/safari]
```

## Building Web Apps

Further documentation and tutorials as to how to use the modules built from this crate to build web apps  will be built 
in the future. However - in the meantime, the [aleo.tools](https://aleo.tools) website is a good
example of how to use these modules to build a web app. Its source code can be found in the 
[Aleo SDK](https://github.com/AleoHQ/sdk) repo in the `website` folder.
