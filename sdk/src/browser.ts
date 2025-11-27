import "./polyfill/shared.js";

import { Account } from "./account.js";
import { AleoNetworkClient, ProgramImports } from "./network-client.js";
import { BlockJSON, Header, Metadata } from "./models/blockJSON.js";
import { ConfirmedTransactionJSON } from "./models/confirmed_transaction.js";
import { DeploymentJSON, VerifyingKeys } from "./models/deployment/deploymentJSON.js";
import { DeploymentObject } from "./models/deployment/deploymentObject.js";
import { EncryptedRecord } from "./models/record-provider/encryptedRecord.js";
import { ExecutionJSON, FeeExecutionJSON } from "./models/execution/executionJSON.js";
import { ExecutionObject, FeeExecutionObject } from "./models/execution/executionObject.js";
import { FinalizeJSON } from "./models/finalizeJSON.js";
import { FunctionInput } from "./models/functionInput";
import { FunctionObject } from "./models/functionObject.js";
import { ImportedVerifyingKeys, ImportedPrograms } from "./models/imports.js";
import { InputJSON } from "./models/input/inputJSON.js";
import { InputObject } from "./models/input/inputObject.js";
import { OutputJSON } from "./models/output/outputJSON.js";
import { OutputObject } from "./models/output/outputObject.js";
import { OwnedFilter } from "./models/record-scanner/ownedFilter.js";
import { OwnedRecord } from "./models/record-provider/ownedRecord.js";
import { OwnerJSON } from "./models/owner/ownerJSON.js";
import { PlaintextArray} from "./models/plaintext/array.js";
import { PlaintextLiteral} from "./models/plaintext/literal.js";
import { PlaintextObject } from "./models/plaintext/plaintext.js";
import { PlaintextStruct} from "./models/plaintext/struct.js";
import { ProvingRequestJSON } from "./models/provingRequest.js";
import { ProvingResponse } from "./models/provingResponse.js";
import { RatificationJSON } from "./models/ratification.js";
import { RecordsFilter } from "./models/record-scanner/recordsFilter.js";
import { RecordsResponseFilter } from "./models/record-scanner/recordsResponseFilter.js";
import { RecordSearchParams } from "./models/record-provider/recordSearchParams.js";
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
} from "./record-provider.js";
import { RecordScanner } from "./record-scanner.js";
import { SealanceMerkleTree } from "./integrations/sealance/merkle-tree.js";

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
    GraphKey,
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
    initDevMode,
    maybeInitDevMode,
    getOrInitConsensusVersionTestHeights,
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
    RECORD_DOMAIN,
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
    EncryptedRecord,
    ExecutionJSON,
    ExecutionObject,
    FeeExecutionJSON,
    FeeExecutionObject,
    FinalizeJSON,
    FunctionInput,
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
    OwnedFilter,
    OwnedRecord,
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
    RecordsFilter,
    RecordsResponseFilter,
    RecordProvider,
    RecordScanner,
    RecordSearchParams,
    SealanceMerkleTree,
    SolutionJSON,
    SolutionsJSON,
    TransactionJSON,
    TransactionObject,
    TransitionJSON,
    TransitionObject,
    VerifyingKeys,
};
