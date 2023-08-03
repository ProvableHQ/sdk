import { Account } from "./account";
import { AleoNetworkClient } from "./network-client";
import { DevServerClient } from "./dev-server-client";
import { AleoKeyProvider } from "./function-key-provider";
import { BlockHeightSearch, NetworkRecordProvider } from "./record-provider";
import { Address, ExecutionResponse, PrivateKey, PrivateKeyCiphertext, Program, ProvingKey, RecordCiphertext, RecordPlaintext, Signature, Transaction as WasmTransaction, ViewKey, VerifyingKey } from '@aleohq/wasm';
var KEY_STORE = "https://testnet3.parameters.aleo.org/";
var CREDITS_PROGRAM_KEYS = {
    transfer_private: { prover: KEY_STORE + "transfer_private.prover.2a9a6f2", verifier: KEY_STORE + "transfer_private.verifier.3a59762" },
    transfer_private_to_public: { prover: KEY_STORE + "transfer_private_to_public.prover.cf3b952", "verifier": KEY_STORE + "transfer_private_to_public.verifier.3a59762" },
    transfer_public: { prover: KEY_STORE + "transfer_public.prover.1117f0a", verifier: "transfer_public.verifier.5bd459b" },
    transfer_public_to_private: { prover: KEY_STORE + "transfer_public_to_private.prover.7b763af", verifier: KEY_STORE + "transfer_public_to_private.verifier.25f6542" },
    join: { prover: KEY_STORE + "join.prover.da05baf", verifier: KEY_STORE + "join.verifier.1489109" },
    split: { prover: KEY_STORE + "split.prover.8c585f2", verifier: KEY_STORE + "split.verifier.8281688" },
    fee: { prover: KEY_STORE + "fee.prover.36542ce", verifier: KEY_STORE + "fee.verifier.2de311b" }
};
export { Account, Address, AleoKeyProvider, AleoNetworkClient, BlockHeightSearch, DevServerClient, ExecutionResponse, NetworkRecordProvider, PrivateKey, PrivateKeyCiphertext, Program, ProvingKey, RecordCiphertext, RecordPlaintext, Signature, VerifyingKey, ViewKey, WasmTransaction, CREDITS_PROGRAM_KEYS, KEY_STORE };
//# sourceMappingURL=index.js.map