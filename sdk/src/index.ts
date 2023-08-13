const KEY_STORE = "https://testnet3.parameters.aleo.org/";
const CREDITS_PROGRAM_KEYS = {
    transfer_private: {prover: KEY_STORE + "transfer_private.prover.2a9a6f2", verifier: KEY_STORE + "transfer_private.verifier.3a59762" },
    transfer_private_to_public: {prover:KEY_STORE + "transfer_private_to_public.prover.cf3b952", "verifier":KEY_STORE + "transfer_private_to_public.verifier.3a59762"},
    transfer_public: {prover:KEY_STORE + "transfer_public.prover.1117f0a", verifier: "transfer_public.verifier.5bd459b"},
    transfer_public_to_private: {prover: KEY_STORE + "transfer_public_to_private.prover.7b763af", verifier: KEY_STORE + "transfer_public_to_private.verifier.25f6542"},
    join: {prover: KEY_STORE + "join.prover.da05baf", verifier: KEY_STORE + "join.verifier.1489109"},
    split: {prover: KEY_STORE + "split.prover.8c585f2", verifier: KEY_STORE + "split.verifier.8281688"},
    fee: {prover: KEY_STORE + "fee.prover.36542ce", verifier: KEY_STORE + "fee.verifier.2de311b"},
}

function logAndThrow(message: string): Error {
    console.error(message);
    throw message;
}

import { Account } from "./account";
import { AleoNetworkClient, ProgramImports } from "./network-client";
import { Block } from "./models/block";
import { Execution } from "./models/execution";
import { Input } from "./models/input";
import { Output } from "./models/output";
import { Transaction } from "./models/transaction";
import { Transition } from "./models/transition";
import { DevServerClient } from "./dev-server-client";
import { AleoKeyProvider, AleoKeyProviderParams, AleoKeyProviderInitParams, CachedKeyPair, FunctionKeyPair, FunctionKeyProvider, KeySearchParams } from "./function-key-provider"
import { BlockHeightSearch, NetworkRecordProvider, RecordProvider, RecordSearchParams } from "./record-provider";

// If using the SDK in a browser context, uncomment these lines
// import { ProgramManager } from "./program-manager";
// import init from '@aleohq/wasm';
/**
 * Initialize Aleo WebAssembly into the browser. The SDK requires its Wasm Instance to be initialized before operating
 * so this function must be called before any other SDK functions are called.
 */
// async function initializeWasm() {
//    return await init();
// }
// import { Address, ExecutionResponse, PrivateKey, PrivateKeyCiphertext, Program, ProvingKey, RecordCiphertext, RecordPlaintext, ProgramManager as ProgramManagerBase, Signature, Transaction as WasmTransaction, ViewKey, VerifyingKey, initThreadPool } from '@aleohq/wasm';
// export { Account, Address, AleoKeyProvider, AleoKeyProviderParams, AleoKeyProviderInitParams, AleoNetworkClient, Block, BlockHeightSearch, DevServerClient, Execution, ExecutionResponse, FunctionKeyPair, FunctionKeyProvider, Input, KeySearchParams, NetworkRecordProvider, PrivateKey, PrivateKeyCiphertext, Program, ProgramImports, ProgramManager, ProgramManagerBase, ProvingKey, Output, RecordCiphertext, RecordPlaintext, RecordProvider, RecordSearchParams, Signature, Transaction, Transition, VerifyingKey, ViewKey, WasmTransaction, CREDITS_PROGRAM_KEYS, KEY_STORE, initThreadPool, initializeWasm, logAndThrow};

// The following imports and exports are for a NodeJS context - if using the SDK in a browser context, delete or comment out these lines
import { Address, ExecutionResponse, PrivateKey, PrivateKeyCiphertext, Program, ProvingKey, RecordCiphertext, RecordPlaintext, Signature, Transaction as WasmTransaction, ViewKey, VerifyingKey} from '@aleohq/nodejs';
export { Account, Address, AleoKeyProvider, AleoKeyProviderParams, AleoKeyProviderInitParams, AleoNetworkClient, Block, BlockHeightSearch, CachedKeyPair, DevServerClient, Execution, ExecutionResponse, FunctionKeyPair, FunctionKeyProvider, Input, KeySearchParams, NetworkRecordProvider, PrivateKey, PrivateKeyCiphertext, Program, ProgramImports, ProvingKey, Output, RecordCiphertext, RecordPlaintext, RecordProvider, RecordSearchParams, Signature, Transaction, Transition, VerifyingKey, ViewKey, WasmTransaction, CREDITS_PROGRAM_KEYS, KEY_STORE, logAndThrow}
