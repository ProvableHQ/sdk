import { ProvingKey, VerifyingKey } from "../wasm.js";

type FunctionKeyPair = [ProvingKey, VerifyingKey];
type CachedKeyPair = [Uint8Array, Uint8Array];

export { CachedKeyPair, FunctionKeyPair };
