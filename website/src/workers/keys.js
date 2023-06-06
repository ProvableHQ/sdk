const FEE_PROVER_URL = "https://testnet3.parameters.aleo.org/fee.prover.0bfc24f";
const FEE_VERIFIER_URL = "https://testnet3.parameters.aleo.org/fee.verifier.44783e8";
const JOIN_PROVER_URL = "https://testnet3.parameters.aleo.org/join.prover.6856be2";
const JOIN_VERIFIER_URL = "https://testnet3.parameters.aleo.org/join.verifier.9c946a3";
const SPLIT_PROVER_URL = "https://testnet3.parameters.aleo.org/split.prover.8469bca";
const SPLIT_VERIFIER_URL = "https://testnet3.parameters.aleo.org/split.verifier.ba3bdd9";
const TRANSFER_PROVER_URL = "https://testnet3.parameters.aleo.org/transfer.prover.c3bcd1a";
const TRANSFER_VERIFIER_URL = "https://testnet3.parameters.aleo.org/transfer.verifier.2192afd";

import init, * as aleo from '@aleohq/wasm';
await init();

/// Get the proving key for an aleo program
const getFunctionKeys = async (proverUrl, verifierUrl) => {
    console.log("Downloading proving and verifying keys from: ", proverUrl, verifierUrl);
    let proofResponse = await fetch(proverUrl);
    let proofBuffer = await proofResponse.arrayBuffer();
    let verificationResponse = await fetch(verifierUrl);
    let verificationBuffer = await verificationResponse.arrayBuffer();
    let provingKey = aleo.ProvingKey.fromBytes(new Uint8Array(proofBuffer));
    let verifyingKey = aleo.VerifyingKey.fromBytes(new Uint8Array(verificationBuffer));
    console.log("provingKey is: ", provingKey);
    console.log("verifyingKey is: ", verifyingKey);
    return [provingKey, verifyingKey];
}

export {getFunctionKeys, FEE_PROVER_URL, FEE_VERIFIER_URL, JOIN_PROVER_URL, JOIN_VERIFIER_URL, SPLIT_PROVER_URL, SPLIT_VERIFIER_URL, TRANSFER_PROVER_URL, TRANSFER_VERIFIER_URL};