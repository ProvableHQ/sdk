import { Account } from "./account";
import { AleoNetworkClient, ProgramImports } from "./network-client";
import { Block } from "./models/block";
import { Execution } from "./models/execution";
import { Input } from "./models/input";
import { Output } from "./models/output";
import { Transaction } from "./models/transaction";
import { Transition } from "./models/transition";
import { DevServerClient } from "./dev-server-client";
import { AleoKeyProvider, FunctionKeyPair, FunctionKeyProvider } from "./function-key-provider";
import { BlockHeightSearch, NetworkRecordProvider, RecordProvider } from "./record-provider";
import { Address, ExecutionResponse, PrivateKey, PrivateKeyCiphertext, Program, ProvingKey, RecordCiphertext, RecordPlaintext, Signature, Transaction as WasmTransaction, ViewKey, VerifyingKey } from '@aleohq/wasm';
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
export { Account, Address, AleoKeyProvider, AleoNetworkClient, Block, BlockHeightSearch, DevServerClient, Execution, ExecutionResponse, FunctionKeyPair, Input, FunctionKeyProvider, NetworkRecordProvider, PrivateKey, PrivateKeyCiphertext, Program, ProgramImports, ProvingKey, Output, RecordCiphertext, RecordPlaintext, RecordProvider, Signature, Transaction, Transition, VerifyingKey, ViewKey, WasmTransaction, CREDITS_PROGRAM_KEYS, KEY_STORE };
