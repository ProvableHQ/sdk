# Aleo Wasm

## Publish instructions

```bash
npm login
export RUSTFLAGS='-C target-feature=+atomics,+bulk-memory,+mutable-globals -C link-arg=--max-memory=4294967296' && rustup run nightly-2023-05-24 wasm-pack build --release --target web --scope aleohq --out-dir pkg-parallel -- --features "parallel, browser" --no-default-features -Z build-std=panic_abort,std
node prepublish
cd pkg-parallel
npm publish --access=public
```