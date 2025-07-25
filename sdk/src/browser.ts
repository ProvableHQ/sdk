import "./polyfill/shared.js";

import { Account } from "./account.js";
import { AleoNetworkClient, ProgramImports } from "./network-client.js";
import { BlockJSON, Header, Metadata } from "./models/blockJSON.js";
import { ConfirmedTransactionJSON } from "./models/confirmed_transaction.js";
import { DeploymentJSON, VerifyingKeys } from "./models/deployment/deploymentJSON.js";
import { DeploymentObject } from "./models/deployment/deploymentObject.js";
import { ExecutionJSON, FeeExecutionJSON } from "./models/execution/executionJSON.js";
import { ExecutionObject, FeeExecutionObject } from "./models/execution/executionObject.js";
import { FinalizeJSON } from "./models/finalizeJSON.js";
import { FunctionObject } from "./models/functionObject.js";
import { ImportedVerifyingKeys, ImportedPrograms } from "./models/imports.js";
import { InputJSON } from "./models/input/inputJSON.js";
import { InputObject } from "./models/input/inputObject.js";
import { OutputJSON } from "./models/output/outputJSON.js";
import { OutputObject } from "./models/output/outputObject.js";
import { OwnerJSON } from "./models/owner/ownerJSON.js";
import { PlaintextArray} from "./models/plaintext/array.js";
import { PlaintextLiteral} from "./models/plaintext/literal.js";
import { PlaintextObject } from "./models/plaintext/plaintext.js";
import { PlaintextStruct} from "./models/plaintext/struct.js";
import { ProvingRequestJSON } from "./models/provingRequest.js";
import { ProvingResponse } from "./models/provingResponse.js";
import { RatificationJSON } from "./models/ratification.js";
import { SolutionsJSON, SolutionJSON, PartialSolutionJSON } from "./models/solution.js";
import { TransactionJSON } from "./models/transaction/transactionJSON.js";
import { TransactionObject } from "./models/transaction/transactionObject.js";
import { TransitionJSON } from "./models/transition/transitionJSON.js";
import { TransitionObject } from "./models/transition/transitionObject.js";
import {
    AleoKeyProvider,
    AleoKeyProviderParams,
    AleoKeyProviderInitParams,
    CachedKeyPair,
    FunctionKeyPair,
    FunctionKeyProvider,
    KeySearchParams,
} from "./function-key-provider.js";
import {
    OfflineKeyProvider,
    OfflineSearchParams
} from "./offline-key-provider.js";
import {
    BlockHeightSearch,
    NetworkRecordProvider,
    RecordProvider,
    RecordSearchParams,
} from "./record-provider.js";

// @TODO: This function is no longer needed, remove it.
async function initializeWasm() {
    console.warn("initializeWasm is deprecated, you no longer need to use it");
}

export { ProgramManager, ProvingRequestOptions, ExecuteOptions, FeeAuthorizationOptions, AuthorizationOptions } from "./program-manager.js";

export { logAndThrow } from "./utils.js";

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
    Execution as FunctionExecution,
    ExecutionRequest,
    ExecutionResponse,
    EncryptionToolkit,
    Field,
    Group,
    I8,
    I16,
    I32,
    I64,
    I128,
    OfflineQuery,
    Pedersen64,
    Pedersen128,
    Plaintext,
    Poseidon2,
    Poseidon4,
    Poseidon8,
    PrivateKey,
    PrivateKeyCiphertext,
    Program,
    ProgramManager as ProgramManagerBase,
    ProvingKey,
    ProvingRequest,
    RecordCiphertext,
    RecordPlaintext,
    Signature,
    Scalar,
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
    verifyFunctionExecution,
} from "./wasm.js";

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
} from "./constants.js";

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
    ImportedPrograms,
    ImportedVerifyingKeys,
    InputJSON,
    InputObject,
    KeySearchParams,
    Metadata,
    NetworkRecordProvider,
    OfflineKeyProvider,
    OfflineSearchParams,
    OutputJSON,
    OutputObject,
    OwnerJSON,
    PartialSolutionJSON,
    PlaintextArray,
    PlaintextLiteral,
    PlaintextObject,
    PlaintextStruct,
    ProgramImports,
    ProvingRequestJSON,
    ProvingResponse,
    RatificationJSON,
    RecordProvider,
    RecordSearchParams,
    SolutionJSON,
    SolutionsJSON,
    TransactionJSON,
    TransactionObject,
    TransitionJSON,
    TransitionObject,
    VerifyingKeys,
};
