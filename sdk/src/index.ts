import { Account } from "./account";
import { AleoNetworkClient } from "./aleo_network_client";
import { Block } from "./models/block";
import { Execution} from "./models/execution";
import { Input} from "./models/input";
import { Output} from "./models/output";
import { Transaction } from "./models/transaction";
import { Transition } from "./models/transition";
import { DevelopmentClient } from "./development_client";
import { Address, PrivateKey, Program, Signature, ViewKey} from '@aleohq/wasm';

const key_store = "https://testnet3.parameters.aleo.org/";
const CREDITS_PROGRAM_KEYS = {
    transfer_private: {prover: key_store + "transfer_private.prover.2a9a6f2", verifier: key_store + "transfer_private.verifier.3a59762" },
    transfer_private_to_public: {prover:key_store + "transfer_private_to_public.prover.cf3b952", "verifier":key_store + "transfer_private_to_public.verifier.3a59762"},
    transfer_public: {prover:key_store + "transfer_public.prover.1117f0a", verifier: "transfer_public.verifier.5bd459b"},
    transfer_public_to_private: {prover: key_store + "transfer_public_to_private.prover.7b763af", verifier: key_store + "transfer_public_to_private.verifier.25f6542"},
    join: {prover: key_store + "join.prover.da05baf", verifier: key_store + "join.verifier.1489109"},
    split: {prover: key_store + "split.prover.8c585f2", verifier: key_store + "split.verifier.8281688"},
    fee: {prover: key_store + "fee.prover.36542ce", verifier: key_store + "fee.verifier.2de311b"},
}

export { Account, Address, AleoNetworkClient, Block, DevelopmentClient, Execution, Input, PrivateKey, Program, Output, Signature, Transaction, Transition, ViewKey, CREDITS_PROGRAM_KEYS}
