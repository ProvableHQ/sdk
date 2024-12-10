import "./polyfill/shared";

import { Account } from "./account";
import { AleoNetworkClient, ProgramImports } from "./network-client";
import { BlockJSON } from "./models/blockJSON";
import { ExecutionJSON } from "./models/executionJSON";
import { FunctionObject } from "./models/functionObject";
import { InputJSON } from "./models/input/inputJSON";
import { InputObject } from "./models/input/inputObject";
import { OutputJSON } from "./models/output/outputJSON";
import { OutputObject } from "./models/output/outputObject";
import { PlaintextArray} from "./models/plaintext/array";
import { PlaintextLiteral} from "./models/plaintext/literal";
import { PlaintextStruct} from "./models/plaintext/struct";
import { TransactionJSON } from "./models/transaction/transactionJSON";
import { TransactionSummary } from "./models/transaction/transactionSummary";
import { TransitionJSON } from "./models/transition/transitionJSON";
import { TransitionObject } from "./models/transition/transitionObject";
import {
    AleoKeyProvider,
    AleoKeyProviderParams,
    AleoKeyProviderInitParams,
    CachedKeyPair,
    FunctionKeyPair,
    FunctionKeyProvider,
    KeySearchParams,
} from "./function-key-provider";
import {
    OfflineKeyProvider,
    OfflineSearchParams
} from "./offline-key-provider";
import {
    BlockHeightSearch,
    NetworkRecordProvider,
    RecordProvider,
    RecordSearchParams,
} from "./record-provider";

// @TODO: This function is no longer needed, remove it.
async function initializeWasm() {
    console.warn("initializeWasm is deprecated, you no longer need to use it");
}

export { createAleoWorker } from "./managed-worker";

export { ProgramManager } from "./program-manager";

export { logAndThrow } from "./utils";

export {
    Address,
    Ciphertext,
    Execution as FunctionExecution,
    ExecutionResponse,
    Field,
    Group,
    OfflineQuery,
    Plaintext,
    PrivateKey,
    PrivateKeyCiphertext,
    Program,
    ProgramManager as ProgramManagerBase,
    ProvingKey,
    RecordCiphertext,
    RecordPlaintext,
    Signature,
    Scalar,
    Transaction,
    Transition,
    VerifyingKey,
    ViewKey,
    initThreadPool,
    verifyFunctionExecution,
} from "./wasm";

export { initializeWasm };

export {
    Key,
    CREDITS_PROGRAM_KEYS,
    KEY_STORE,
    PRIVATE_TRANSFER,
    PRIVATE_TO_PUBLIC_TRANSFER,
    PRIVATE_TRANSFER_TYPES,
    PUBLIC_TRANSFER,
    PUBLIC_TRANSFER_AS_SIGNER,
    PUBLIC_TO_PRIVATE_TRANSFER,
    VALID_TRANSFER_TYPES,
} from "./constants";

export {
    Account,
    AleoKeyProvider,
    AleoKeyProviderParams,
    AleoKeyProviderInitParams,
    AleoNetworkClient,
    BlockJSON,
    BlockHeightSearch,
    CachedKeyPair,
    ExecutionJSON,
    FunctionObject,
    FunctionKeyPair,
    FunctionKeyProvider,
    InputJSON,
    InputObject,
    KeySearchParams,
    NetworkRecordProvider,
    ProgramImports,
    OfflineKeyProvider,
    OfflineSearchParams,
    PlaintextArray,
    PlaintextLiteral,
    PlaintextStruct,
    OutputJSON,
    OutputObject,
    RecordProvider,
    RecordSearchParams,
    TransactionJSON,
    TransactionSummary,
};
