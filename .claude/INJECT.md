# Aleo SDK — Universal Rules

## Imports
Always use network-specific imports — never the bare package:
```ts
import { ... } from "@provablehq/sdk/testnet.js";  // ✓
import { ... } from "@provablehq/sdk";              // ✗
```

## Production API
Use `https://api.provable.com/v2` as the host. `AleoNetworkClient` appends the network
automatically — pass the base URL only:
```ts
const client = new AleoNetworkClient("https://api.provable.com/v2");
// resolves to https://api.provable.com/v2/testnet or /mainnet automatically
```
If constructing URLs manually: `https://api.provable.com/v2/testnet` or `.../mainnet`.

API docs: https://docs.provable.com/docs/api/v2/intro

## API Authentication
Register once to get an `apiKey` and `consumerId`. Use SDK methods — not raw HTTP:
```ts
// Registration — returns { consumer: { id }, key, id, created_at }
// POST https://api.provable.com/consumers  { username: "..." }

// Set credentials on the client — JWT is refreshed automatically when needed
client.apiKey = process.env.PROVABLE_API_KEY;
client.consumerId = process.env.PROVABLE_CONSUMER_ID;
// client.jwtData is populated automatically on first authenticated call
```
`RecordScanner` follows the same pattern: set `apiKey` and `consumerId` via constructor
options or `setApiKey()` / `setConsumerId()`. JWT refresh is handled internally.

## Services
- **DPS (delegated proving):** `AleoNetworkClient.submitProvingRequest()` / `submitProvingRequestSafe()`.
  Set `client.proverUri` or pass per-call. Defaults to host if not set.
- **Record scanning:** `RecordScanner` class. Register a view key with `register()` or
  `registerEncrypted()` before scanning.

## Input Processing
Always call `processInputs` before passing inputs to any execution method.
Aleo string literals like `"transfer_private_to_public"` in field-typed positions are
automatically cast to field elements — required for dynamic dispatch.

## Key Hygiene
- Construct `PrivateKey` objects immediately — never route raw key strings through logic
- Use `ViewKey` for all read-only operations; never use the private key when a view key suffices
- Never log, serialize, or transmit private key material

## WASM Initialization
Call `await initThreadPool()` before cryptographic operations. Multi-threading is not
required in all contexts — in browser extensions it must be explicitly managed
(see `aleo-browser-extension` skill).

## Local Development Node
```bash
cargo install leo-lang                                # install once
leo devnode start --private-key <FUNDED_KEY>          # start local node
# point AleoNetworkClient at http://localhost:3030
```
