import init, * as aleo from '@aleohq/wasm';
import { FEE_PROVER_URL, FEE_VERIFIER_URL, JOIN_PROVER_URL, JOIN_VERIFIER_URL, SPLIT_PROVER_URL, SPLIT_VERIFIER_URL,
    TRANSFER_PRIVATE_PROVER_URL, TRANSFER_PRIVATE_VERIFIER_URL, TRANSFER_PRIVATE_TO_PUBLIC_PROVER_URL,
TRANSFER_PRIVATE_TO_PUBLIC_VERIFIER_URL, TRANSFER_PUBLIC_PROVER_URL, TRANSFER_PUBLIC_VERIFIER_URL,
    TRANSFER_PUBLIC_TO_PRIVATE_PROVER_URL, TRANSFER_PUBLIC_TO_PRIVATE_VERIFIER_URL} from './keys';

let feeProvingKey = null;
let feeVerifyingKey = null;
let joinProvingKey = null;
let joinVerifyingKey = null;
let splitProvingKey = null;
let splitVerifyingKey = null;
let transferPrivateProvingKey = null;
let transferPrivateVerifyingKey = null;
let transferPrivateToPublicProvingKey = null;
let transferPrivateToPublicVerifyingKey = null;
let transferPublicProvingKey = null;
let transferPublicVerifyingKey = null;
let transferPublicToPrivateProvingKey = null;
let transferPublicToPrivateVerifyingKey = null;

await init();
await aleo.initThreadPool(10);
const aleoProgramManager = new aleo.ProgramManager();

const getFunctionKeys = async (proverUrl, verifierUrl) => {
    console.log("Downloading proving and verifying keys from: ", proverUrl, verifierUrl);
    let proofResponse = await fetch(proverUrl);
    console.log("Getting array buffer");
    let proofBuffer = await proofResponse.arrayBuffer();
    let verificationResponse = await fetch(verifierUrl);
    let verificationBuffer = await verificationResponse.arrayBuffer();
    console.log("Proving and verifying key binaries downloaded");
    console.log("Creating proving and verifying keys...");
    let provingKey = aleo.ProvingKey.fromBytes(new Uint8Array(proofBuffer));
    let verifyingKey = aleo.VerifyingKey.fromBytes(new Uint8Array(verificationBuffer));
    console.log("Proving and verifying keys created");
    return [provingKey, verifyingKey];
}

const validateProgram = (programString) => {
    try {
        return aleo.Program.fromString(programString);
    } catch (error) {
        console.log(error);
        throw (`Program input is not a valid Aleo program`);
    }
}

const programMatchesOnChain = async (programString, url) => {
    const program = validateProgram(programString);
    let onlineProgramText;
    try {
        const program_id = program.id();
        const program_url = `${url}/testnet3/program/${program_id}`;
        const programResponse = await fetch(program_url);
        onlineProgramText = await programResponse.json();
    } catch (error) {
        console.log(error);
        throw (`Program does not exist on chain`);
    }

    try {
        const onlineProgram = aleo.Program.fromString(onlineProgramText);
        return program.isEqual(onlineProgram);
    } catch (error) {
        console.log(error);
        throw (`Could not parse program from chain`);
    }
}
let lastLocalProgram = null;

self.addEventListener("message", ev => {
    if (ev.data.type === 'ALEO_EXECUTE_PROGRAM_LOCAL') {
        const {
            localProgram,
            aleoFunction,
            inputs,
            privateKey,
        } = ev.data;

        console.log('Web worker: Executing function locally...');
        let startTime = performance.now();

        try {
            validateProgram(localProgram);

            if (lastLocalProgram === null) {
                lastLocalProgram = localProgram;
            } else if (lastLocalProgram !== localProgram) {
                aleoProgramManager.clearKeyCache();
                lastLocalProgram = localProgram;
            }

            let response = aleoProgramManager.execute_local(
                aleo.PrivateKey.from_string(privateKey),
                localProgram,
                aleoFunction,
                inputs,
                true
            );

            console.log(`Web worker: Local execution completed in ${performance.now() - startTime} ms`);
            let outputs = response.getOutputs();
            console.log(`Function execution response: ${outputs}`);
            self.postMessage({type: 'OFFLINE_EXECUTION_COMPLETED', outputs});
        } catch (error) {
            console.log(error);
            self.postMessage({ type: 'ERROR', errorMessage: error.toString() });
        }
    }
    else if (ev.data.type === 'ALEO_EXECUTE_PROGRAM_ON_CHAIN') {
        const {
            remoteProgram,
            aleoFunction,
            inputs,
            privateKey,
            fee,
            feeRecord,
            url
        } = ev.data;

        console.log('Web worker: Creating execution...');
        let startTime = performance.now();

        (async function() {
            try {
                const programMatches = await programMatchesOnChain(remoteProgram, url);
                if (!programMatches) {
                    throw (`Program does not match the program deployed on the Aleo Network, cannot execute`);
                }

                if (feeProvingKey === null || feeVerifyingKey === null) {
                    [feeProvingKey, feeVerifyingKey] = await getFunctionKeys(FEE_PROVER_URL, FEE_VERIFIER_URL);
                }

                if (!aleoProgramManager.keyExists("credits.aleo", "fee")) {
                    aleoProgramManager.cacheKeypairInWasmMemory(aleo.Program.getCreditsProgram().toString(), "fee", feeProvingKey, feeVerifyingKey);
                }

                let executeTransaction = await aleoProgramManager.execute(
                    aleo.PrivateKey.from_string(privateKey),
                    remoteProgram,
                    aleoFunction,
                    inputs,
                    fee,
                    aleo.RecordPlaintext.fromString(feeRecord),
                    url,
                    true
                );

                console.log(`Web worker: On-chain execution transaction created in ${performance.now() - startTime} ms`);
                let transaction = executeTransaction.toString();
                let transaction_and_url = [transaction, url]
                console.log(transaction);
                self.postMessage({type: 'EXECUTION_TRANSACTION_COMPLETED', executeTransaction: transaction_and_url});
            } catch (error) {
                console.log(error);
                self.postMessage({ type: 'ERROR', errorMessage: error.toString() });
            }
        })();
    }
    else if (ev.data.type === 'ALEO_TRANSFER') {
        const {
            privateKey,
            amountCredits,
            recipient,
            transfer_type,
            amountRecord,
            fee,
            feeRecord,
            url
        } = ev.data;

        console.log('Web worker: Creating transfer...');
        let startTime = performance.now();

        (async function() {
            try {
                console.log("transfer type:", transfer_type);
                if (transfer_type === "public") {
                    if (transferPublicProvingKey === null || transferPublicVerifyingKey === null) {
                        [transferPublicProvingKey, transferPublicVerifyingKey] = await getFunctionKeys(TRANSFER_PUBLIC_PROVER_URL, TRANSFER_PUBLIC_VERIFIER_URL);
                        if (!aleoProgramManager.keyExists("credits.aleo", "transfer_public")) {
                            aleoProgramManager.cacheKeypairInWasmMemory(aleo.Program.getCreditsProgram().toString(), "transfer_public", transferPublicProvingKey, transferPublicVerifyingKey);
                        }
                    }
                } else if (transfer_type === "publicToPrivate") {
                    if (transferPublicToPrivateProvingKey === null || transferPublicToPrivateVerifyingKey === null) {
                        [transferPublicToPrivateProvingKey, transferPublicToPrivateVerifyingKey] = await getFunctionKeys(TRANSFER_PUBLIC_TO_PRIVATE_PROVER_URL, TRANSFER_PUBLIC_TO_PRIVATE_VERIFIER_URL);
                        if (!aleoProgramManager.keyExists("credits.aleo", "transfer_public_to_private")) {
                            aleoProgramManager.cacheKeypairInWasmMemory(aleo.Program.getCreditsProgram().toString(), "transfer_public_to_private", transferPublicToPrivateProvingKey, transferPublicToPrivateVerifyingKey);
                        }
                    }
                } else if (transfer_type === "privateToPublic") {
                    if (transferPrivateToPublicProvingKey === null || transferPrivateToPublicVerifyingKey === null) {
                        [transferPrivateToPublicProvingKey, transferPrivateToPublicVerifyingKey] = await getFunctionKeys(TRANSFER_PRIVATE_TO_PUBLIC_PROVER_URL, TRANSFER_PRIVATE_TO_PUBLIC_VERIFIER_URL);
                        if (!aleoProgramManager.keyExists("credits.aleo", "transfer_private_to_public")) {
                            aleoProgramManager.cacheKeypairInWasmMemory(aleo.Program.getCreditsProgram().toString(), "transfer_private_to_public", transferPrivateToPublicProvingKey, transferPrivateToPublicVerifyingKey);
                        }
                    }
                } else if (transfer_type === "private") {
                    if (transferPrivateProvingKey === null || transferPrivateVerifyingKey === null) {
                        [transferPrivateProvingKey, transferPrivateVerifyingKey] = await getFunctionKeys(TRANSFER_PRIVATE_PROVER_URL, TRANSFER_PRIVATE_VERIFIER_URL);
                        if (!aleoProgramManager.keyExists("credits.aleo", "transfer_private")) {
                            aleoProgramManager.cacheKeypairInWasmMemory(aleo.Program.getCreditsProgram().toString(), "transfer_private", transferPrivateProvingKey, transferPrivateVerifyingKey);
                        }
                    }
                } else {
                    throw (`Invalid transfer type`);
                }
                if (feeProvingKey === null || feeVerifyingKey === null) {
                    [feeProvingKey, feeVerifyingKey] = await getFunctionKeys(FEE_PROVER_URL, FEE_VERIFIER_URL);
                }
                if (!aleoProgramManager.keyExists("credits.aleo", "fee")) {
                    aleoProgramManager.cacheKeypairInWasmMemory(aleo.Program.getCreditsProgram().toString(), "fee", feeProvingKey, feeVerifyingKey);
                }

                let transferTransaction = await aleoProgramManager.transfer(
                    aleo.PrivateKey.from_string(privateKey),
                    amountCredits,
                    recipient,
                    transfer_type,
                    aleo.RecordPlaintext.fromString(amountRecord),
                    fee,
                    aleo.RecordPlaintext.fromString(feeRecord),
                    url,
                    true
                );

                console.log(`Web worker: Transfer transaction created in ${performance.now() - startTime} ms`);
                let transaction = transferTransaction.toString();
                let transaction_and_url = [transaction, url]
                console.log(transaction);
                self.postMessage({type: 'TRANSFER_TRANSACTION_COMPLETED', transferTransaction: transaction_and_url});
            } catch (error) {
                console.log(error);
                self.postMessage({ type: 'ERROR', errorMessage: error.toString() });
            }
        })();
    }
    else if (ev.data.type === 'ALEO_DEPLOY') {
        const {
            program,
            privateKey,
            fee,
            feeRecord,
            url
        } = ev.data;

        console.log('Web worker: Creating deployment...');

        let startTime = performance.now();
        (async function() {
            try {
                try {
                    await programMatchesOnChain(program, url);
                    throw (`A program with the same name already exists on the Aleo Network, cannot deploy`);
                } catch (e) {
                    if (e !== `Program does not exist on chain`) {
                        throw e;
                    }
                    console.log(`Program not found on the Aleo Network - proceeding with deployment...`);
                }

                if (feeProvingKey === null || feeVerifyingKey === null) {
                    [feeProvingKey, feeVerifyingKey] = await getFunctionKeys(FEE_PROVER_URL, FEE_VERIFIER_URL);
                }
                if (!aleoProgramManager.keyExists("credits.aleo", "fee")) {
                    console.log("Caching fee keys");
                    aleoProgramManager.cacheKeypairInWasmMemory(aleo.Program.getCreditsProgram().toString(), "fee", feeProvingKey, feeVerifyingKey);
                }

                console.log("Deploying program..");
                let deployTransaction = await aleoProgramManager.deploy(
                    aleo.PrivateKey.from_string(privateKey),
                    program,
                    undefined,
                    fee,
                    aleo.RecordPlaintext.fromString(feeRecord),
                    url,
                    true
                );

                console.log(`Web worker: Deployment transaction created in ${performance.now() - startTime} ms`);
                let transaction = deployTransaction.toString();
                let transaction_and_url = [transaction, url]
                console.log(transaction);
                self.postMessage({type: 'DEPLOY_TRANSACTION_COMPLETED', deployTransaction: transaction_and_url});
            } catch (error) {
                console.log(error);
                self.postMessage({ type: 'ERROR', errorMessage: error.toString() });
            }
        })();
    }
    else if (ev.data.type === 'ALEO_SPLIT') {
        const {
            splitAmount,
            record,
            privateKey,
            url
        } = ev.data;

        console.log('Web worker: Creating split...');

        let startTime = performance.now();
        (async function() {
            try {
                if (splitProvingKey === null || splitVerifyingKey === null) {
                    [splitProvingKey, splitVerifyingKey] = await getFunctionKeys(SPLIT_PROVER_URL, SPLIT_VERIFIER_URL);
                }
                if (!aleoProgramManager.keyExists("credits.aleo", "split")) {
                    aleoProgramManager.cacheKeypairInWasmMemory(aleo.Program.getCreditsProgram().toString(), "split", splitProvingKey, splitVerifyingKey);
                }
                let splitTransaction = await aleoProgramManager.split(
                    aleo.PrivateKey.from_string(privateKey),
                    splitAmount,
                    aleo.RecordPlaintext.fromString(record),
                    url,
                    true
                );

                console.log(`Web worker: Split transaction created in ${performance.now() - startTime} ms`);
                let transaction = splitTransaction.toString();
                let transaction_and_url = [transaction, url]
                console.log(transaction);
                self.postMessage({type: 'SPLIT_TRANSACTION_COMPLETED', splitTransaction: transaction_and_url});
            } catch (error) {
                console.log(error);
                self.postMessage({ type: 'ERROR', errorMessage: error.toString() });
            }
        })();
    }
    else if (ev.data.type === 'ALEO_JOIN') {
        const {
            recordOne,
            recordTwo,
            fee,
            feeRecord,
            privateKey,
            url
        } = ev.data;

        console.log('Web worker: Creating join...');

        let startTime = performance.now();
        (async function() {
            if (joinProvingKey === null || joinVerifyingKey === null) {
                [joinProvingKey, joinVerifyingKey] = await getFunctionKeys(JOIN_PROVER_URL, JOIN_VERIFIER_URL);
            }
            if (!aleoProgramManager.keyExists("credits.aleo", "join")) {
                aleoProgramManager.cacheKeypairInWasmMemory(aleo.Program.getCreditsProgram().toString(), "join", joinProvingKey, joinVerifyingKey);
            }
            if (feeProvingKey === null || feeVerifyingKey === null) {
                [feeProvingKey, feeVerifyingKey] = await getFunctionKeys(FEE_PROVER_URL, FEE_VERIFIER_URL);
            }
            if (!aleoProgramManager.keyExists("credits.aleo", "fee")) {
                aleoProgramManager.cacheKeypairInWasmMemory(aleo.Program.getCreditsProgram().toString(), "fee", feeProvingKey, feeVerifyingKey);
            }

            try {
                let joinTransaction = await aleoProgramManager.join(
                    aleo.PrivateKey.from_string(privateKey),
                    aleo.RecordPlaintext.fromString(recordOne),
                    aleo.RecordPlaintext.fromString(recordTwo),
                    fee,
                    aleo.RecordPlaintext.fromString(feeRecord),
                    url,
                    true
                );

                console.log(`Web worker: Join transaction created in ${performance.now() - startTime} ms`);
                let transaction = joinTransaction.toString();
                let transaction_and_url = [transaction, url]
                console.log(transaction);
                self.postMessage({ type: 'JOIN_TRANSACTION_COMPLETED', joinTransaction: transaction_and_url });
            } catch (error) {
                console.log(error);
                self.postMessage({ type: 'ERROR', errorMessage: error.toString() });
            }
        })();
    }
});