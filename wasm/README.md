## Publish instructions

```bash
npm login
wasm-pack build --scope aleohq
cd pkg
npm publish --access=public
```

## Run instructions

Running the following command would build the wasm pkg and start a local server on port 8080.

```bash
make run
```
