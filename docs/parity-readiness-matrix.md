# SDK2 Parity Readiness Matrix

This matrix locks the runtime API surface used by `shield-extension` and `shield-mobile` and maps each API to its implementation point in `sdk2`.

## Extension-Critical Surface

- `encryptRegistrationRequest(publicKey, viewKey, start)`
  - Usage: scanner registration encrypted payloads in `shield-extension` and `shield-mobile`.
  - Implementation: `packages/provable-core/src/native-bindings.ts`.
  - Exported from: `@provablehq/provable-engine-wasm/mainnet.js`, `@provablehq/provable-engine-wasm/testnet.js`.

- `ViewKey.fromString(...)` / `ViewKey.from_string(...)`
  - Usage: scanner registration payload creation.
  - Implementation: `@provablehq/provable-engine-wasm/*` exports.

- `SealanceMerkleTree`
  - Usage: compliance exclusion proof path.
  - Implementation: `packages/provable-core/src/native-bindings.ts`.
  - Exported from: `@provablehq/provable-engine-wasm/mainnet.js`, `@provablehq/provable-engine-wasm/testnet.js`.

## Mobile-Critical Surface

- `AleoNetworkClient`
  - Required methods: `setAccount`, `submitTransaction`, `getLatestHeight`, `getProgram`, `getProgramImports`, `getProgramMappingValue`.
  - Implementation: `packages/provable-core/src/native-bindings.ts`.

- `ProgramManager`
  - Required methods/signatures:
    - `constructor({ host, keyProvider, recordProvider, account })`
    - `buildExecutionTransaction(options)`
    - `provingRequest(options)`
    - `buildFeeAuthorization(options)`
    - `estimateFeeForAuthorization(...)`
    - `estimateExecutionFee(options)`
    - `estimateDeploymentFee(program, imports?)`
    - `deploy(program, priorityFee, feePrivate, _, feeRecord, privateKey)`
  - Implementation: `packages/provable-core/src/native-bindings.ts`.

- `Account`
  - Required methods: `privateKey()`, `address()`, `viewKey()`.
  - Required helper: `Account.recordPlaintextFromString(record).asString()`.
  - Implementation: `packages/provable-core/src/native-bindings.ts`.

- `encryptProvingRequest(publicKey, provingRequest)` and `encryptAuthorization(publicKey, authorization)`
  - Usage: delegated proving request and authorization encryption.
  - Implementation: `packages/provable-core/src/native-bindings.ts`.

- `parseU128(input)` and `parseU64(input)`
  - Usage: token and credits amount parsing in mobile app logic.
  - Implementation: `packages/provable-core/src/native-bindings.ts`.

- `RecordScanner` and `NetworkRecordProvider`
  - Usage: scanner-owned records flows and provider wiring from app services.
  - Implementation: `packages/provable-core/src/native-bindings.ts`.

## React Native Engine Surface (for `ProvableKit.init({ engine: createReactNativeEngine() })`)

- `engine.account.fromPrivateKey`
- `engine.crypto.encryptAuthorization`
- `engine.crypto.encryptProvingRequest`
- `engine.network.createNetworkClient`
- `engine.network.createRecordScanner`
- `engine.network.createRecordProvider`
- `engine.highLevel.createAccount`
- `engine.highLevel.createProgramManager`
- `engine.highLevel.createKeyProvider`
- `engine.highLevel.verifyProof`

Implementation: `packages/provable-engine-react-native/src/native-bindings.ts` and `packages/provable-engine-react-native/src/index.ts`.

