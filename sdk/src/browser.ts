import { ProgramManager } from "./program-manager";
import init from "@aleohq/wasm";
/**
 * Initialize Aleo WebAssembly into the browser. The SDK requires its Wasm Instance to be initialized before operating
 * so this function must be called before any other SDK functions are called.
 */
async function initializeWasm() {
    return await init();
}
import { createAleoWorker } from "./managed-worker";
import {
    Address,
    ExecutionResponse,
    PrivateKey,
    PrivateKeyCiphertext,
    Program,
    ProvingKey,
    RecordCiphertext,
    RecordPlaintext,
    ProgramManager as ProgramManagerBase,
    Signature,
    Transaction as WasmTransaction,
    ViewKey,
    VerifyingKey,
    initThreadPool,
    verifyFunctionExecution,
} from "@aleohq/wasm";
export {
    Address,
    ExecutionResponse,
    PrivateKey,
    PrivateKeyCiphertext,
    Program,
    ProgramManager,
    ProgramManagerBase,
    ProvingKey,
    RecordCiphertext,
    RecordPlaintext,
    Signature,
    VerifyingKey,
    ViewKey,
    WasmTransaction,
    initThreadPool,
    initializeWasm,
    verifyFunctionExecution,
    createAleoWorker,
};
