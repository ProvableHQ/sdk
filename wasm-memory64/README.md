# Aleo Wasm (Memory64)

Threaded Memory64 builds of the [`@provablehq/wasm`](https://www.npmjs.com/package/@provablehq/wasm)
bindings. They compile the same Rust sources and snarkVM version for
`wasm64-unknown-unknown`, with shared memory, atomics, the Rayon thread pool and
an 8 GiB linear-memory maximum. Use them when an application needs more than the
4 GiB that wasm32 allows.

This package is versioned in lockstep with `@provablehq/wasm`. Most applications
use it through the SDK:

```bash
npm install @provablehq/sdk @provablehq/wasm-memory64
```

```js
import { Account, initThreadPool } from "@provablehq/sdk/wasm64/mainnet.js";

await initThreadPool(6);
```

The low-level bindings are `@provablehq/wasm-memory64/mainnet.js` and
`@provablehq/wasm-memory64/testnet.js`. Their workers are
`@provablehq/wasm-memory64/mainnet/worker.js` and
`@provablehq/wasm-memory64/testnet/worker.js`. Keep the JS, WASM and workers
from the same build together, and do not pass objects between this package and
`@provablehq/wasm`.

The runtime needs 64-bit shared WebAssembly memory and atomics, for example
Node.js 24+, Chrome/Edge 133+ or Firefox 134+. Safari does not support it. The
entry points throw on unsupported runtimes. See
[Selecting the Memory64 build](https://github.com/ProvableHQ/sdk#selecting-the-memory64-build)
for runtime detection and the runtime support table, and the
[build instructions](https://github.com/ProvableHQ/sdk/blob/mainnet/wasm/README.md#memory64-build)
to build from source.
