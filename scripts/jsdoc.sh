PREV=$(cat sdk/src/wasm.ts)

if [ -f "wasm/dist/mainnet/aleo_wasm.d.ts" ]; then
  echo "WASM already built, skipping..."
else
    yarn build:wasm
fi

cp wasm/dist/mainnet/aleo_wasm.d.ts sdk/src/wasm.ts

jsdoc -c sdk/jsdoc.json

echo "$PREV" > sdk/src/wasm.ts