import {VerifyingKey} from "@aleohq/wasm";
const KEY_STORE = "https://testnet3.parameters.aleo.org/";

const CREDITS_PROGRAM_KEYS = {
    bond_public: {
        locator: "credits.aleo/bond_public",
        prover: KEY_STORE + "bond_public.prover.9c3547d",
        verifier: "bond_public.verifier.10315ae",
        verifyingKey: VerifyingKey.bondPublicVerifier
    },
    claim_unbond_public: {
        locator: "credits.aleo/claim_unbond_public",
        prover: KEY_STORE + "claim_unbond_public.prover.f8b64aa",
        verifier: "claim_unbond_public.verifier.8fd7445",
        verifyingKey: VerifyingKey.claimUnbondPublicVerifier
    },
    fee_private: {
        locator: "credits.aleo/fee_private",
        prover: KEY_STORE + "fee_private.prover.43fab98",
        verifier: "fee_private.verifier.f3dfefc",
        verifyingKey: VerifyingKey.feePrivateVerifier
    },
    fee_public: {
        locator: "credits.aleo/fee_public",
        prover: KEY_STORE + "fee_public.prover.634f153",
        verifier: "fee_public.verifier.09eeb4f",
        verifyingKey: VerifyingKey.feePublicVerifier
    },
    inclusion: {
        locator: "inclusion",
        prover: KEY_STORE + "inclusion.prover.cd85cc5",
        verifier: "inclusion.verifier.e6f3add",
        verifyingKey: VerifyingKey.inclusionVerifier
    },
    join: {
        locator: "credits.aleo/join",
        prover: KEY_STORE + "join.prover.1a76fe8",
        verifier: "join.verifier.4f1701b",
        verifyingKey: VerifyingKey.joinVerifier
    },
    set_validator_state: {
        locator: "credits.aleo/set_validator_state",
        prover: KEY_STORE + "set_validator_state.prover.5ce19be",
        verifier: "set_validator_state.verifier.730d95b",
        verifyingKey: VerifyingKey.setValidatorStateVerifier
    },
    split: {
        locator: "credits.aleo/split",
        prover: KEY_STORE + "split.prover.e6d12b9",
        verifier: "split.verifier.2f9733d",
        verifyingKey: VerifyingKey.splitVerifier
    },
    transfer_private: {
        locator: "credits.aleo/transfer_private",
        prover: KEY_STORE + "transfer_private.prover.2b487c0",
        verifier: "transfer_private.verifier.3a3cbba",
        verifyingKey: VerifyingKey.transferPrivateVerifier
    },
    transfer_private_to_public: {
        locator: "credits.aleo/transfer_private_to_public",
        prover: KEY_STORE + "transfer_private_to_public.prover.1ff64cb",
        verifier: "transfer_private_to_public.verifier.d5b60de",
        verifyingKey: VerifyingKey.transferPrivateToPublicVerifier
    },
    transfer_public: {
        locator: "credits.aleo/transfer_public",
        prover: KEY_STORE + "transfer_public.prover.a74565e",
        verifier: "transfer_public.verifier.a4c2906",
        verifyingKey: VerifyingKey.transferPublicVerifier
    },
    transfer_public_to_private: {
        locator: "credits.aleo/transfer_public_to_private",
        prover: KEY_STORE + "transfer_public_to_private.prover.1bcddf9",
        verifier: "transfer_public_to_private.verifier.b094554",
        verifyingKey: VerifyingKey.transferPublicToPrivateVerifier
    },
    unbond_delegator_as_validator: {
        locator: "credits.aleo/unbond_delegator_as_validator",
        prover: KEY_STORE + "unbond_delegator_as_validator.prover.115a86b",
        verifier: "unbond_delegator_as_validator.verifier.9585609",
        verifyingKey: VerifyingKey.unbondDelegatorAsValidatorVerifier
    },
    unbond_public: {
        locator: "credits.aleo/unbond_public",
        prover: KEY_STORE + "unbond_public.prover.9547c05",
        verifier: "unbond_public.verifier.09873cd",
        verifyingKey: VerifyingKey.unbondPublicVerifier
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
