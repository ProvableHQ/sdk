const KEY_STORE = "https://testnet3.parameters.aleo.org/";

const CREDITS_PROGRAM_KEYS = {
    transfer_private: {
        prover: KEY_STORE + "transfer_private.prover.2a9a6f2",
        verifier: KEY_STORE + "transfer_private.verifier.3a59762",
    },
    transfer_private_to_public: {
        prover: KEY_STORE + "transfer_private_to_public.prover.cf3b952",
        verifier: KEY_STORE + "transfer_private_to_public.verifier.5bd459b",
    },
    transfer_public: {
        prover: KEY_STORE + "transfer_public.prover.1117f0a",
        verifier: KEY_STORE + "transfer_public.verifier.d63af11",
    },
    transfer_public_to_private: {
        prover: KEY_STORE + "transfer_public_to_private.prover.7b763af",
        verifier: KEY_STORE + "transfer_public_to_private.verifier.25f6542",
    },
    join: {
        prover: KEY_STORE + "join.prover.da05baf",
        verifier: KEY_STORE + "join.verifier.1489109",
    },
    split: {
        prover: KEY_STORE + "split.prover.8c585f2",
        verifier: KEY_STORE + "split.verifier.8281688",
    },
    fee: {
        prover: KEY_STORE + "fee.prover.36542ce",
        verifier: KEY_STORE + "fee.verifier.2de311b",
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
import { DevServerClient } from "./dev-server-client";
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
    DevServerClient,
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
// export * from './browser';

// The following imports and exports are for a NodeJS context - if using the SDK in a browser context, delete or comment out this line
export * from './node';
