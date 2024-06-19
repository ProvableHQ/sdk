import {VerifyingKey, Metadata} from "@aleohq/wasm";
const KEY_STORE = Metadata.baseUrl;

const CREDITS_PROGRAM_KEYS = {
    bond_public: Metadata.bond_public,
    claim_unbond_public: Metadata.claim_unbond_public,
    fee_private: Metadata.fee_private,
    fee_public: Metadata.fee_public,
    inclusion: Metadata.inclusion,
    join: Metadata.join,
    set_validator_state: Metadata.set_validator_state,
    split: Metadata.split,
    transfer_private: Metadata.transfer_private,
    transfer_private_to_public: Metadata.transfer_private_to_public,
    transfer_public: Metadata.transfer_public,
    transfer_public_to_private: Metadata.transfer_public_to_private,
    unbond_delegator_as_validator: Metadata.unbond_delegator_as_validator,
    unbond_public: Metadata.unbond_public,
};

const PRIVATE_TRANSFER_TYPES = new Set([
    "transfer_private",
    "private",
    "transferPrivate",
    "transfer_private_to_public",
    "privateToPublic",
    "transferPrivateToPublic",
]);
const VALID_TRANSFER_TYPES = new Set([
    "transfer_private",
    "private",
    "transferPrivate",
    "transfer_private_to_public",
    "privateToPublic",
    "transferPrivateToPublic",
    "transfer_public",
    "public",
    "transferPublic",
    "transfer_public_to_private",
    "publicToPrivate",
    "transferPublicToPrivate",
]);
const PRIVATE_TRANSFER = new Set([
    "private",
    "transfer_private",
    "transferPrivate",
]);
const PRIVATE_TO_PUBLIC_TRANSFER = new Set([
    "private_to_public",
    "privateToPublic",
    "transfer_private_to_public",
    "transferPrivateToPublic",
]);
const PUBLIC_TRANSFER = new Set([
    "public",
    "transfer_public",
    "transferPublic",
]);
const PUBLIC_TO_PRIVATE_TRANSFER = new Set([
    "public_to_private",
    "publicToPrivate",
    "transfer_public_to_private",
    "transferPublicToPrivate",
]);

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
import { TransactionModel } from "./models/transactionModel";
import { Transition } from "./models/transition";
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

export {
    Address,
    Execution as FunctionExecution,
    ExecutionResponse,
    Field,
    OfflineQuery,
    PrivateKey,
    PrivateKeyCiphertext,
    Program,
    ProgramManager as ProgramManagerBase,
    ProvingKey,
    RecordCiphertext,
    RecordPlaintext,
    Signature,
    Transaction,
    VerifyingKey,
    ViewKey,
    initThreadPool,
    verifyFunctionExecution,
} from "@aleohq/wasm";

export { initializeWasm };

export {
    Account,
    AleoKeyProvider,
    AleoKeyProviderParams,
    AleoKeyProviderInitParams,
    AleoNetworkClient,
    Block,
    BlockHeightSearch,
    CachedKeyPair,
    Execution,
    FunctionKeyPair,
    FunctionKeyProvider,
    Input,
    KeySearchParams,
    NetworkRecordProvider,
    ProgramImports,
    OfflineKeyProvider,
    OfflineSearchParams,
    Output,
    RecordProvider,
    RecordSearchParams,
    TransactionModel,
    Transition,
    CREDITS_PROGRAM_KEYS,
    KEY_STORE,
    PRIVATE_TRANSFER,
    PRIVATE_TO_PUBLIC_TRANSFER,
    PRIVATE_TRANSFER_TYPES,
    PUBLIC_TRANSFER,
    PUBLIC_TO_PRIVATE_TRANSFER,
    VALID_TRANSFER_TYPES,
    logAndThrow,
};
