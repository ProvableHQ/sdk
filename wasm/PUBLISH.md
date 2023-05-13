# Aleo Wasm

## Publish instructions

```bash
npm login
wasm-pack build --target nodejs --out-name aleo --scope aleohq
cd pkg
npm publish --access=public
```
