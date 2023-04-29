# Aleo Wasm

Aleo low-level utilities for account and record management in Rust - packaged to be Wasm-compatible.

For more general utilities to help with program compilation and node connectivity, check out https://crates.io/crates/aleo.

Happy hacking!

## Build Guide
```bash
wasm-pack build --target nodejs
```

To build with threading enabled
```bash
RUSTFLAGS='-C target-feature=+atomics,+bulk-memory,+mutable-globals' \
	rustup run nightly-2022-12-12 \
	wasm-pack build --target web \
	-- -Z build-std=panic_abort,std
```

## Testing
```bash
wasm-pack test --node
```

## Aleo Tools

[Aleo SDK account generator](https://aleohq.github.io/aleo/)

[Aleo Home](https://www.aleo.org/)

You can visit the [SnarkVM repo](https://github.com/AleoHQ/snarkVM) and [SnarkOS repo](https://github.com/AleoHQ/snarkOS) to go deep into the code of aleo infrastructure
