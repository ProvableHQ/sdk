declare const KEY_STORE = "https://testnet3.parameters.aleo.org/";
declare const CREDITS_PROGRAM_KEYS: {
    transfer_private: {
        prover: string;
        verifier: string;
    };
    transfer_private_to_public: {
        prover: string;
        verifier: string;
    };
    transfer_public: {
        prover: string;
        verifier: string;
    };
    transfer_public_to_private: {
        prover: string;
        verifier: string;
    };
    join: {
        prover: string;
        verifier: string;
    };
    split: {
        prover: string;
        verifier: string;
    };
    fee: {
        prover: string;
        verifier: string;
    };
};
declare const PRIVATE_TRANSFER_TYPES: Set<string>;
declare const VALID_TRANSFER_TYPES: Set<string>;
declare const PRIVATE_TRANSFER: Set<string>;
declare const PRIVATE_TO_PUBLIC_TRANSFER: Set<string>;
declare const PUBLIC_TRANSFER: Set<string>;
declare const PUBLIC_TO_PRIVATE_TRANSFER: Set<string>;
declare function logAndThrow(message: string): Error;
import { Account } from "./account";
import { AleoNetworkClient, ProgramImports } from "./network-client";
import { Block } from "./models/block";
import { Execution } from "./models/execution";
import { Input } from "./models/input";
import { Output } from "./models/output";
import { Transaction } from "./models/transaction";
import { Transition } from "./models/transition";
import { DevServerClient } from "./dev-server-client";
import { AleoKeyProvider, AleoKeyProviderParams, AleoKeyProviderInitParams, CachedKeyPair, FunctionKeyPair, FunctionKeyProvider, KeySearchParams } from "./function-key-provider";
import { BlockHeightSearch, NetworkRecordProvider, RecordProvider, RecordSearchParams } from "./record-provider";
/**
 * Initialize Aleo WebAssembly into the browser. The SDK requires its Wasm Instance to be initialized before operating
 * so this function must be called before any other SDK functions are called.
 */
import { Address, ExecutionResponse, PrivateKey, PrivateKeyCiphertext, Program, ProvingKey, RecordCiphertext, RecordPlaintext, Signature, Transaction as WasmTransaction, ViewKey, VerifyingKey } from '@aleohq/nodejs';
export { Account, Address, AleoKeyProvider, AleoKeyProviderParams, AleoKeyProviderInitParams, AleoNetworkClient, Block, BlockHeightSearch, CachedKeyPair, DevServerClient, Execution, ExecutionResponse, FunctionKeyPair, FunctionKeyProvider, Input, KeySearchParams, NetworkRecordProvider, PrivateKey, PrivateKeyCiphertext, Program, ProgramImports, ProvingKey, Output, RecordCiphertext, RecordPlaintext, RecordProvider, RecordSearchParams, Signature, Transaction, Transition, VerifyingKey, ViewKey, WasmTransaction, CREDITS_PROGRAM_KEYS, KEY_STORE, PRIVATE_TRANSFER, PRIVATE_TO_PUBLIC_TRANSFER, PRIVATE_TRANSFER_TYPES, PUBLIC_TRANSFER, PUBLIC_TO_PRIVATE_TRANSFER, VALID_TRANSFER_TYPES, logAndThrow };
