import { Account } from "./account";
import { AleoNetworkClient } from "./aleo_network_client";
import { Block } from "./models/block";
import { Execution } from "./models/execution";
import { Input } from "./models/input";
import { Output } from "./models/output";
import { Transaction } from "./models/transaction";
import { Transition } from "./models/transition";
import { DevelopmentClient } from "./development_client";
import { AleoKeyProvider, KeyProvider } from "./key-provider"
import { Address, PrivateKey, Program, Signature, ViewKey } from '@aleohq/wasm';

const KEY_STORE = "https://testnet3.parameters.aleo.org/";
const CREDITS_PROGRAM_KEYS = {
    transfer_private: {prover: KEY_STORE + "transfer_private.prover.2a9a6f2", verifier: KEY_STORE + "transfer_private.verifier.3a59762" },
    transfer_private_to_public: {prover:KEY_STORE + "transfer_private_to_public.prover.cf3b952", "verifier":KEY_STORE + "transfer_private_to_public.verifier.3a59762"},
    transfer_public: {prover:KEY_STORE + "transfer_public.prover.1117f0a", verifier: "transfer_public.verifier.5bd459b"},
    transfer_public_to_private: {prover: KEY_STORE + "transfer_public_to_private.prover.7b763af", verifier: KEY_STORE + "transfer_public_to_private.verifier.25f6542"},
    join: {prover: KEY_STORE + "join.prover.da05baf", verifier: KEY_STORE + "join.verifier.1489109"},
    split: {prover: KEY_STORE + "split.prover.8c585f2", verifier: KEY_STORE + "split.verifier.8281688"},
    fee: {prover: KEY_STORE + "fee.prover.36542ce", verifier: KEY_STORE + "fee.verifier.2de311b"},
}

export { Account, Address, AleoKeyProvider, AleoNetworkClient, Block, DevelopmentClient, Execution, Input, KeyProvider, PrivateKey, Program, Output, Signature, Transaction, Transition, ViewKey, CREDITS_PROGRAM_KEYS, KEY_STORE}
