import {
    initDevMode as initDevModeWasm,
} from "@provablehq/wasm/%%NETWORK%%.js";

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
 * Initialize development mode by setting consensus version heights to [0..ConsensusVersion::latest()].
 * 
 * This function automatically sets up development consensus heights without requiring
 * manual specification of the number of consensus versions. It should be called before
 * initializing the thread pool when working with a local development network.
 * 
 * @returns An array of block heights at which each consensus version applies.
 * 
 * @example
 * import { initDevMode, initThreadPool } from "@provablehq/sdk";
 * 
 * // Initialize dev mode before the thread pool
 * initDevMode();
 * await initThreadPool();
 */
export function initDevMode(): number[] {
    return initDevModeWasm();
}

/**
 * Check if the ALEO_NETWORK environment variable is set to "local" and if so,
 * automatically call initDevMode() to set up development consensus heights.
 * 
 * This function is useful for Node.js applications that want to automatically
 * detect when running against a local development network.
 * 
 * @returns An array of block heights if dev mode was initialized, undefined otherwise.
 * 
 * @example
 * import { maybeInitDevMode, initThreadPool } from "@provablehq/sdk";
 * 
 * // Automatically initialize dev mode if ALEO_NETWORK=local
 * maybeInitDevMode();
 * await initThreadPool();
 */
export function maybeInitDevMode(): number[] | undefined {
    try {
        if (typeof process !== 'undefined' && process.env?.ALEO_NETWORK === 'local') {
            return initDevModeWasm();
        }
    } catch {
        // Ignore errors when process is not available (e.g., in browsers)
    }
    return undefined;
}
