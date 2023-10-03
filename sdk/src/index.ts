const KEY_STORE = "https://testnet3.parameters.aleo.org/";

const CREDITS_PROGRAM_KEYS = {
    fee_private: {
        prover: KEY_STORE + "fee_private.prover.d02301c",
        verifier: "fee_private.verifier.00ae6a3",
    },
    fee_public: {
        prover: KEY_STORE + "fee_public.prover.5515650",
        verifier: "fee_public.verifier.40ea40e",
    },
    inclusion: {
        prover: KEY_STORE + "inclusion.prover.b46b287",
        verifier: "inclusion.verifier.2fae105",
    },
    join: {
        prover: KEY_STORE + "join.prover.30895cc",
        verifier: "join.verifier.5cb1e62",
    },
    split: {
        prover: KEY_STORE + "split.prover.a9784b9",
        verifier: "split.verifier.38392d9",
    },
    transfer_private: {
        prover: KEY_STORE + "transfer_private.prover.deb77db",
        verifier: "transfer_private.verifier.3088e6d",
    },
    transfer_private_to_public: {
        prover: KEY_STORE + "transfer_private_to_public.prover.7ca1421",
        verifier: "transfer_private_to_public.verifier.37dd126",
    },
    transfer_public: {
        prover: KEY_STORE + "transfer_public.prover.2941ad3",
        verifier: "transfer_public.verifier.ed98d35",
    },
    transfer_public_to_private: {
        prover: KEY_STORE + "transfer_public_to_private.prover.67f57fc",
        verifier: "transfer_public_to_private.verifier.f2aaeee",
    },
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
import { Transaction } from "./models/transaction";
import { Transition } from "./models/transition";
import {
    AleoKeyProvider,
    AleoKeyProviderParams,
    AleoKeyProviderInitParams,
    FunctionKeyPair,
    FunctionKeyProvider,
    KeySearchParams,
} from "./function-key-provider";
import {
    BlockHeightSearch,
    NetworkRecordProvider,
    RecordProvider,
    RecordSearchParams,
} from "./record-provider";

export {
    Account,
    AleoKeyProvider,
    AleoKeyProviderParams,
    AleoKeyProviderInitParams,
    AleoNetworkClient,
    Block,
    BlockHeightSearch,
    Execution,
    FunctionKeyPair,
    FunctionKeyProvider,
    Input,
    KeySearchParams,
    NetworkRecordProvider,
    ProgramImports,
    Output,
    RecordProvider,
    RecordSearchParams,
    Transaction,
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

// If using the SDK in a browser context, uncomment this line and run `npm run build:browser`
export * from './browser';

// The following imports and exports are for a NodeJS context - if using the SDK in a browser context, delete or comment out this line
//export * from './node';
