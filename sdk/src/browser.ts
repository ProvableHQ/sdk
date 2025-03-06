import "./polyfill/shared";

import { Account } from "./account";
import { AleoNetworkClient, ProgramImports } from "./network-client";
import { BlockJSON, Header, Metadata } from "./models/blockJSON";
import { ConfirmedTransactionJSON } from "./models/confirmed_transaction";
import { DeploymentJSON, VerifyingKeys } from "./models/deployment/deploymentJSON";
import { DeploymentObject } from "./models/deployment/deploymentObject";
import { ExecutionJSON, FeeExecutionJSON } from "./models/execution/executionJSON";
import { ExecutionObject, FeeExecutionObject } from "./models/execution/executionObject";
import { FinalizeJSON } from "./models/finalizeJSON";
import { FunctionObject } from "./models/functionObject";
import { InputJSON } from "./models/input/inputJSON";
import { InputObject } from "./models/input/inputObject";
import { OutputJSON } from "./models/output/outputJSON";
import { OutputObject } from "./models/output/outputObject";
import { OwnerJSON } from "./models/owner/ownerJSON";
import { PlaintextArray} from "./models/plaintext/array";
import { PlaintextLiteral} from "./models/plaintext/literal";
import { PlaintextObject } from "./models/plaintext/plaintext";
import { PlaintextStruct} from "./models/plaintext/struct";
import { TransactionJSON } from "./models/transaction/transactionJSON";
import { TransactionObject } from "./models/transaction/transactionObject";
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
    ConfirmedTransactionJSON,
    DeploymentJSON,
    DeploymentObject,
    ExecutionJSON,
    ExecutionObject,
    FeeExecutionJSON,
    FeeExecutionObject,
    FinalizeJSON,
    FunctionObject,
    FunctionKeyPair,
    FunctionKeyProvider,
    Header,
    InputJSON,
    InputObject,
    KeySearchParams,
    Metadata,
    NetworkRecordProvider,
    ProgramImports,
    OfflineKeyProvider,
    OfflineSearchParams,
    OwnerJSON,
    PlaintextArray,
    PlaintextLiteral,
    PlaintextObject,
    PlaintextStruct,
    OutputJSON,
    OutputObject,
    RecordProvider,
    RecordSearchParams,
    TransactionJSON,
    TransactionObject,
    TransitionJSON,
    TransitionObject,
    VerifyingKeys,
};
