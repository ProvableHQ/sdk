import {VerifyingKey, Metadata} from "@provablehq/wasm";

const KEY_STORE = Metadata.baseUrl();

interface Key {
    name: string,
    locator: string,
    prover: string,
    verifier: string,
    verifyingKey: () => VerifyingKey,
}

function convert(metadata: Metadata): Key {
    // This looks up the method name in VerifyingKey
    const verifyingKey = (VerifyingKey as any)[metadata.verifyingKey];

    if (!verifyingKey) {
        throw new Error("Invalid method name: " + metadata.verifyingKey);
    }

    return {
        name: metadata.name,
        locator: metadata.locator,
        prover: metadata.prover,
        verifier: metadata.verifier,
        verifyingKey,
    };
}

const CREDITS_PROGRAM_KEYS = {
    bond_public: convert(Metadata.bond_public()),
    bond_validator: convert(Metadata.bond_validator()),
    claim_unbond_public: convert(Metadata.claim_unbond_public()),
    fee_private: convert(Metadata.fee_private()),
    fee_public: convert(Metadata.fee_public()),
    inclusion: convert(Metadata.inclusion()),
    join: convert(Metadata.join()),
    set_validator_state: convert(Metadata.set_validator_state()),
    split: convert(Metadata.split()),
    transfer_private: convert(Metadata.transfer_private()),
    transfer_private_to_public: convert(Metadata.transfer_private_to_public()),
    transfer_public: convert(Metadata.transfer_public()),
    transfer_public_as_signer: convert(Metadata.transfer_public_as_signer()),
    transfer_public_to_private: convert(Metadata.transfer_public_to_private()),
    unbond_public: convert(Metadata.unbond_public()),
    getKey: function(key: string): Key | Error {
        if (this.hasOwnProperty(key)) {
            return (this as any)[key] as Key;
        } else {
            return new Error(`Key "${key}" not found.`);
        }
    }
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
    "transfer_public_as_signer",
    "public",
    "public_as_signer",
    "transferPublic",
    "transferPublicAsSigner",
    "transfer_public_to_private",
    "publicToPrivate",
    "publicAsSigner",
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
const PUBLIC_TRANSFER_AS_SIGNER = new Set([
    "public_as_signer",
    "transfer_public_as_signer",
    "transferPublicAsSigner",
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
} from "@provablehq/wasm";

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
    Key,
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
    PUBLIC_TRANSFER_AS_SIGNER,
    PUBLIC_TO_PRIVATE_TRANSFER,
    VALID_TRANSFER_TYPES,
    logAndThrow,
};
