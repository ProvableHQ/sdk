import "./polyfill/shared.js";

import { sdkWarn } from "./logger.js";
import { Account } from "./account.js";
import { AleoNetworkClient, ProgramImports } from "./network-client.js";
import { BlockJSON, Header, Metadata } from "./models/blockJSON.js";
import { CachedKeyPair, FunctionKeyPair } from "./models/keyPair.js";
import { ConfirmedTransactionJSON } from "./models/confirmed_transaction.js";
import { CryptoBoxPubKey } from "./models/cryptoBoxPubkey.js";
import { DeploymentJSON, VerifyingKeys } from "./models/deployment/deploymentJSON.js";
import { DeploymentObject } from "./models/deployment/deploymentObject.js";
import { EncryptedProvingRequest } from "./models/encryptedProvingRequest.js";
import { EncryptedRecord } from "./models/record-provider/encryptedRecord.js";
import { ExecutionJSON, FeeExecutionJSON } from "./models/execution/executionJSON.js";
import { ExecutionObject, FeeExecutionObject } from "./models/execution/executionObject.js";
import { FinalizeJSON } from "./models/finalizeJSON.js";
import { FunctionInput } from "./models/functionInput.js";
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
import { ProvingResponse, BroadcastResponse, BroadcastResult, ProvingResult, ProvingFailure, ProvingSuccess, ProveApiErrorBody, ProvingRequestError, isProvingResponse, isProveApiErrorBody } from "./models/provingResponse.js";
import { RatificationJSON } from "./models/ratification.js";
import { EncryptedRegistrationRequest } from "./models/record-scanner/encryptedRegistrationRequest.js";
import { EncryptedRecordsResult, EncryptedRecordsSuccess } from "./models/record-scanner/encryptedRecordsResult.js";
import {
    DecryptionNotEnabledError,
    RecordNotFoundError,
    RecordScannerErrorBody,
    RecordScannerFailure,
    RecordScannerRequestError,
    UUIDError,
    ViewKeyNotStoredError,
} from "./models/record-scanner/error.js";
import { OwnedRecordsResult, OwnedRecordsSuccess } from "./models/record-scanner/ownedRecordsResult.js";
import { OwnedRecordsResponseFilter } from "./models/record-scanner/ownedRecordsResponseFilter.js";
import { RegisterResult, RegisterSuccess } from "./models/record-scanner/registrationResult.js";
import { RegistrationResponse } from "./models/record-scanner/registrationResponse.js";
import { RevokeResult, RevokeSuccess, RevokeResponse } from "./models/record-scanner/revokeResult.js";
import { RecordsFilter } from "./models/record-scanner/recordsFilter.js";
import { RecordsResponseFilter } from "./models/record-scanner/recordsResponseFilter.js";
import { SerialNumbersResult, SerialNumbersSuccess } from "./models/record-scanner/serialNumbersResult.js";
import { StatusResponse } from "./models/record-scanner/statusResponse.js";
import { StatusResult, StatusSuccess } from "./models/record-scanner/statusResult.js";
import { TagsResult, TagsSuccess } from "./models/record-scanner/tagsResult.js";
import { RecordSearchParams } from "./models/record-provider/recordSearchParams.js";
import { SolutionsJSON, SolutionJSON, PartialSolutionJSON } from "./models/solution.js";
import { TransactionJSON } from "./models/transaction/transactionJSON.js";
import { TransactionObject } from "./models/transaction/transactionObject.js";
import { TransitionJSON } from "./models/transition/transitionJSON.js";
import { TransitionObject } from "./models/transition/transitionObject.js";
import {
    FunctionKeyProvider,
    KeySearchParams,
} from "./keys/provider/interface.js";
import {
    AleoKeyProvider,
    AleoKeyProviderParams,
    AleoKeyProviderInitParams,
} from "./keys/provider/memory.js";
import {
    KeyFingerprint,
    KeyMetadata,
    KeyVerificationError,
    KeyVerifier,
    sha256Hex,
} from "./keys/verifier/interface.js";
import { MemKeyVerifier } from "./keys/verifier/memory.js";
import {
    BaseFunctionKeyLocator,
    InvalidLocatorError,
    InvalidLocatorReason,
    KeyLocator,
    KeyStore,
    KeyType,
    ProvingKeyLocator,
    TranslationKeyLocator,
    VerifyingKeyLocator,
    provingKeyLocator,
    verifyingKeyLocator,
    translationKeyLocator,
} from "./keys/keystore/interface.js";
import {
    OfflineKeyProvider,
    OfflineSearchParams
} from "./keys/provider/offline.js";
import {
    BlockHeightSearch,
    NetworkRecordProvider,
    RecordProvider,
} from "./record-provider.js";
import { RecordScanner, RecordScannerJWTData, RecordScannerOptions } from "./record-scanner.js";
import { SealanceMerkleTree } from "./integrations/sealance/merkle-tree.js";

// @TODO: This function is no longer needed, remove it.
async function initializeWasm() {
    sdkWarn("initializeWasm is deprecated, you no longer need to use it");
}

export { ProgramManager, ProvingRequestOptions, ExecuteOptions, FeeAuthorizationOptions, AuthorizationOptions, VerificationOptions, BatchVerificationOptions, inputsToFields, verifyProof, verifyBatchProof, programChecksum } from "./program-manager.js";

export { logAndThrow, TransportFunction } from "./utils.js";

export { setLogLevel, getLogLevel } from "./logger.js";
export type { LogLevel } from "./logger.js";

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
    DynamicRecord,
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
    Proof,
    ProvingKey,
    ProvingRequest,
    RecordCiphertext,
    RecordPlaintext,
    Signature,
    Scalar,
    stringToField,
    Transaction,
    Transition,
    U8,
    U16,
    U32,
    U64,
    U128,
    Value,
    VerifyingKey,
    ViewKey,
    initThreadPool,
    getOrInitConsensusVersionTestHeights,
    snarkVerify,
    snarkVerifyBatch,
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
    BroadcastResponse,
    BroadcastResult,
    CachedKeyPair,
    ConfirmedTransactionJSON,
    CryptoBoxPubKey,
    DecryptionNotEnabledError,
    DeploymentJSON,
    DeploymentObject,
    EncryptedProvingRequest,
    EncryptedRecord,
    EncryptedRegistrationRequest,
    EncryptedRecordsResult,
    EncryptedRecordsSuccess,
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
    isProvingResponse,
    isProveApiErrorBody,
    ImportedPrograms,
    ImportedVerifyingKeys,
    InputJSON,
    InputObject,
    InvalidLocatorError,
    InvalidLocatorReason,
    BaseFunctionKeyLocator,
    KeyFingerprint,
    KeyLocator,
    KeyMetadata,
    KeySearchParams,
    KeyStore,
    KeyType,
    KeyVerificationError,
    ProvingKeyLocator,
    provingKeyLocator,
    TranslationKeyLocator,
    translationKeyLocator,
    VerifyingKeyLocator,
    verifyingKeyLocator,
    KeyVerifier,
    MemKeyVerifier,
    Metadata,
    NetworkRecordProvider,
    OfflineKeyProvider,
    OfflineSearchParams,
    OutputJSON,
    OutputObject,
    OwnedFilter,
    OwnedRecord,
    OwnedRecordsResult,
    OwnedRecordsResponseFilter,
    OwnedRecordsSuccess,
    OwnerJSON,
    PartialSolutionJSON,
    PlaintextArray,
    PlaintextLiteral,
    PlaintextObject,
    PlaintextStruct,
    ProgramImports,
    ProveApiErrorBody,
    ProvingFailure,
    ProvingRequestError,
    ProvingRequestJSON,
    ProvingResult,
    ProvingSuccess,
    ProvingResponse,
    RatificationJSON,
    RecordsFilter,
    RecordsResponseFilter,
    RecordProvider,
    RecordScanner,
    RecordScannerErrorBody,
    RecordScannerFailure,
    RecordScannerJWTData,
    RecordScannerOptions,
    RecordNotFoundError,
    RecordScannerRequestError,
    ViewKeyNotStoredError,
    RecordSearchParams,
    RegisterResult,
    RegisterSuccess,
    RegistrationResponse,
    RevokeResult,
    RevokeSuccess,
    RevokeResponse,
    SealanceMerkleTree,
    SerialNumbersResult,
    SerialNumbersSuccess,
    sha256Hex,
    SolutionJSON,
    SolutionsJSON,
    StatusResponse,
    StatusResult,
    StatusSuccess,
    TagsResult,
    TagsSuccess,
    TransactionJSON,
    TransactionObject,
    TransitionJSON,
    TransitionObject,
    UUIDError,
    VerifyingKeys,
};

export {
    KeyVerificationError as ChecksumMismatchError,
    KeyVerifier as FunctionKeyVerifier,
} from "./keys/verifier/interface.js";

export { encryptAuthorization, encryptProvingRequest, encryptViewKey, encryptRegistrationRequest, zeroizeBytes } from "./security.js";

export {
    // Converters
    toField,
    toGroup,
    toViewKey,
    toSignature,
    toAddress,
    // Type guards
    isViewKeyStrategy,
    isInputIdStrategy,
    isRecordViewKeyStrategy,
    // Builder
    buildExecutionRequestFromExternallySignedData,
    computeExternalSigningInputs,
} from "./external-signing.js";
export type {
    FieldLike,
    GroupLike,
    ViewKeyLike,
    SignatureLike,
    AddressLike,
    InputID,
    ExecutionRequestParams,
    RecordViewKeyStrategy,
    ViewKeyStrategy,
    InputIdStrategy,
    InputStrategy,
    ExternalSigningInput,
    ExternalSigningOptions,
    RequestSignInput,
    OutputFormat,
    FieldOutput,
} from "./external-signing.js";