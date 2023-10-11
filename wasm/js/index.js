import wasm from "../dist/wasm.js";

const {
    initThreadPool: wasmInitThreadPool,
    Address,
    ExecutionResponse,
    Private,
    PrivateKey,
    PrivateKeyCiphertext,
    Program,
    ProvingKey,
    RecordCiphertext,
    RecordPlaintext,
    ProgramManager,
    Signature,
    Transaction,
    ViewKey,
    VerifyingKey,
    verifyFunctionExecution,
} = await wasm({
    importHook: () => {
        return new URL("assets/aleo_wasm.wasm", import.meta.url);
    },
});

async function initThreadPool(threads) {
    if (threads == null) {
        threads = navigator.hardwareConcurrency;
    }

    console.info(`Spawning ${threads} threads`);

    await wasmInitThreadPool(new URL("worker.js", import.meta.url), threads);
}

export {
    initThreadPool,
    Address,
    ExecutionResponse,
    PrivateKey,
    PrivateKeyCiphertext,
    Program,
    ProvingKey,
    RecordCiphertext,
    RecordPlaintext,
    ProgramManager,
    Signature,
    Transaction,
    ViewKey,
    VerifyingKey,
    verifyFunctionExecution,
};
