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
The [wasm-pack](https://crates.io/crates/wasm-pack) tool is used to compile the Rust code in this crate into JavaScript
modules which can be imported into other JavaScript projects.

#### Install Wasm-Pack
```bash
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
```

### Build Instructions
The general syntax for compiling rust into WebAssembly based JavaScript modules with 
[wasm-pack](https://crates.io/crates/wasm-pack) is as follows:
```bash
wasm-pack build --target <target> --out-dir <out-dir> -- --features <crate-features>
```

Invoking this command will build a JavaScript module in the current directory with the default name `pkg` (which can 
be changed as necessary using the `--out-dir` flag). This folder can then be imported directly as a JavaScript module
by other JavaScript modules.

There are 3 possible JavaScript modules that [wasm-pack](https://crates.io/crates/wasm-pack) can be used to generate 
when run within this crate:
1. **NodeJS module:** Used to build NodeJS applications.
2. **Single-Threaded browser module:** Used to build browser-based web applications.
3. **Multi-Threaded browser module:** Used to build browser-based web applications which use web-worker based 
multi-threading to achieve significant performance increases.

These 3 modules and how to build them are explained in more detail below.

### 1. NodeJS Module

This module has the features of the NodeJS environment built-in. It is single-threaded and unfortunately cannot yet be 
used to generate Aleo program executions or deployments due to current Aleo protocol limitations. It can however still
be used to perform Aleo account, record, and program management tasks.

#### Build Instructions
```bash
wasm-pack build --release --target nodejs -- --features "serial" --no-default-features
```

### 2. Single-Threaded browser module

This module is very similar to the NodeJS module, however it is built to make use browser-based JavaScript environments 
and can be used for program execution and deployment. 

If used for program execution or deployment, it suggested to do so on a web-worker as these operations are long-running
and will cause a browser window to hang if run in the main thread.

#### Build Instructions
```bash
wasm-pack build --release --target web
```

If you are intending to use this for program execution or deployment, it is recommended to build
with maximum or close to maximum memory allocation (which is 4 gigabytes for wasm).

```bash
RUSTFLAGS='-C link-arg=--max-memory=4294967296' wasm-pack build --release --target web
````

### 3. Multi-Threaded browser module

This module is also built for browser-based JavaScript environments, however it is built to make use of Rust-native
threading via web-workers (using the approach outlined in the `rayon-wasm-bindgen` crate). It is the most complex to use,
but it will run significantly faster when performing Aleo program executions and deployments and should be the choice for
performance-critical applications.

To build with threading enabled, it is necessary to use `nightly Rust` and set certain `RUSTFLAGS` to enable the
necessary threading features. The `wasm-pack` build command is shown below.
```bash
# Set rustflags to enable atomics, 
# bulk-memory, and mutable-globals. 
# Also, set the maximum memory to 
# 4294967296 bytes (4GB).
export RUSTFLAGS='-C target-feature=+atomics,+bulk-memory,+mutable-globals -C link-arg=--max-memory=4294967296'

# Use rustup to run the following commands 
# with the nightly version of Rust.
rustup run nightly \

# Use wasm-pack to build the project. 
# Specify the 'parallel' feature for 
# multi-threading and the 'browser' 
# feature to enable program execution
# and include necessary unstable options
# using -Z
wasm-pack build --release --target web --out-dir pkg-parallel \
-- --features "parallel, browser" --no-default-features -Z build-std=panic_abort,std
```

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
