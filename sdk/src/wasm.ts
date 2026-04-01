export {
    Address,
    Authorization,
    Boolean,
    BHP256,
    BHP512,
    BHP768,
    BHP1024,
    Ciphertext,
    ComputeKey,
    EncryptionToolkit,
    ExecutionRequest,
    Execution,
    ExecutionResponse,
    Field,
    GraphKey,
    Group,
    I8,
    I16,
    I32,
    I64,
    I128,
    OfflineQuery,
    Metadata,
    Pedersen64,
    Pedersen128,
    Plaintext,
    Poseidon2,
    Poseidon4,
    Poseidon8,
    PrivateKey,
    PrivateKeyCiphertext,
    Program,
    ProgramManager,
    ProvingKey,
    ProvingRequest,
    RecordCiphertext,
    RecordPlaintext,
    Scalar,
    Signature,
    Transaction,
    Transition,
    U8,
    U16,
    U32,
    U64,
    U128,
    VerifyingKey,
    ViewKey,
    initThreadPool,
    getOrInitConsensusVersionTestHeights,
    verifyFunctionExecution,
} from "@provablehq/wasm/%%NETWORK%%.js";

/**
 * Legacy compatibility shim retained for hard-cutover transition.
 * These APIs are no longer provided by the wasm package and are intentionally unsupported.
 */
export class Proof {
    static fromString(_proof: string): never {
        throw new Error("Proof is no longer exported by @provablehq/wasm. Use engine-level proof handling.");
    }
}

/**
 * Legacy compatibility shim retained for hard-cutover transition.
 */
export class Value {
    static fromString(_value: string): never {
        throw new Error("Value is no longer exported by @provablehq/wasm. Use engine-level value parsing.");
    }
}

export function stringToField(_value: string): never {
    throw new Error("stringToField is no longer exported by @provablehq/wasm.");
}

export function snarkVerify(_proof: unknown, _vk: unknown, _inputs: unknown): never {
    throw new Error("snarkVerify is no longer exported by @provablehq/wasm.");
}

export function snarkVerifyBatch(_proofs: unknown, _vks: unknown, _inputs: unknown): never {
    throw new Error("snarkVerifyBatch is no longer exported by @provablehq/wasm.");
}
