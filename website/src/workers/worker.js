import init, * as aleo from '@aleohq/wasm';
import { FEE_PROVER_URL, FEE_VERIFIER_URL, JOIN_PROVER_URL, JOIN_VERIFIER_URL, SPLIT_PROVER_URL, SPLIT_VERIFIER_URL, TRANSFER_PROVER_URL, TRANSFER_VERIFIER_URL, getFunctionKeys } from './keys';

let feeProvingKey = null;
let feeVerifyingKey = null;
let joinProvingKey = null;
let joinVerifyingKey = null;
let splitProvingKey = null;
let splitVerifyingKey = null;
let transferProvingKey = null;
let transferVerifyingKey = null;

await init();
await aleo.initThreadPool(8);
const aleoProgramManager = new aleo.ProgramManager();

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
                if (feeProvingKey === null || feeVerifyingKey === null) {
                    [feeProvingKey, feeVerifyingKey] = await getFunctionKeys(FEE_PROVER_URL, FEE_VERIFIER_URL);
                    console.log("provingKey is: ", feeProvingKey);
                    console.log("verifyingKey is: ", feeVerifyingKey);
                }

                if (!aleoProgramManager.keyExists("credits.aleo", "fee")) {
                    console.log("fee_proving_key", feeProvingKey);
                    aleoProgramManager.cacheKeypairInWasmMemory("credits.aleo", "fee", feeProvingKey, feeVerifyingKey);
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
                console.log(transaction);
                self.postMessage({type: 'EXECUTION_TRANSACTION_COMPLETED', executeTransaction: transaction});
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
            amountRecord,
            fee,
            feeRecord,
            url
        } = ev.data;

        console.log('Web worker: Creating transfer...');
        let startTime = performance.now();

        (async function() {
            try {
                if (transferProvingKey === null || transferVerifyingKey === null) {
                    ({transferProvingKey, transferVerifyingKey} = await getFunctionKeys(TRANSFER_PROVER_URL, TRANSFER_VERIFIER_URL));
                }
                if (feeProvingKey === null || feeVerifyingKey === null) {
                    ({feeProvingKey, feeVerifyingKey} = await getFunctionKeys(FEE_PROVER_URL, FEE_VERIFIER_URL));
                    aleoProgramManager.cacheKeypairInWasmMemory("credits.aleo", "fee", feeProvingKey, feeVerifyingKey);
                }

                let transferTransaction = await aleoProgramManager.transfer(
                    aleo.PrivateKey.from_string(privateKey),
                    amountCredits,
                    recipient,
                    aleo.RecordPlaintext.fromString(amountRecord),
                    fee,
                    aleo.RecordPlaintext.fromString(feeRecord),
                    url,
                    false,
                    transferProvingKey,
                    transferVerifyingKey,
                    feeProvingKey,
                    feeVerifyingKey
                );

                console.log(`Web worker: Transfer transaction created in ${performance.now() - startTime} ms`);
                let transaction = transferTransaction.toString();
                console.log(transaction);
                self.postMessage({type: 'TRANSFER_TRANSACTION_COMPLETED', transferTransaction: transaction});
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
                if (feeProvingKey === null || feeVerifyingKey === null) {
                    ({feeProvingKey, feeVerifyingKey} = await getFunctionKeys(FEE_PROVER_URL, FEE_VERIFIER_URL));
                }

                if (!aleoProgramManager.keyExists("credits.aleo", "fee")) {
                    aleoProgramManager.cacheKeypairInWasmMemory("credits.aleo", "fee", feeProvingKey, feeVerifyingKey);
                }

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
                console.log(transaction);
                self.postMessage({type: 'DEPLOY_TRANSACTION_COMPLETED', deployTransaction: transaction});
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
                    ({splitProvingKey, splitVerifyingKey} = await getFunctionKeys(SPLIT_PROVER_URL, SPLIT_VERIFIER_URL));
                }
                let splitTransaction = await aleoProgramManager.split(
                    aleo.PrivateKey.from_string(privateKey),
                    splitAmount,
                    aleo.RecordPlaintext.fromString(record),
                    url,
                    false,
                    splitProvingKey,
                    splitVerifyingKey
                );

                console.log(`Web worker: Split transaction created in ${performance.now() - startTime} ms`);
                let transaction = splitTransaction.toString();
                console.log(transaction);
                self.postMessage({type: 'SPLIT_TRANSACTION_COMPLETED', splitTransaction: transaction});
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
            if (feeProvingKey === null || feeVerifyingKey === null) {
                ({feeProvingKey, feeVerifyingKey} = await getFunctionKeys(FEE_PROVER_URL, FEE_VERIFIER_URL));
            }
            if (joinProvingKey === null || joinVerifyingKey === null) {
                ({joinProvingKey, joinVerifyingKey} = await getFunctionKeys(JOIN_PROVER_URL, JOIN_VERIFIER_URL));
            }

            try {
                let joinTransaction = await aleoProgramManager.join(
                    aleo.PrivateKey.from_string(privateKey),
                    aleo.RecordPlaintext.fromString(recordOne),
                    aleo.RecordPlaintext.fromString(recordTwo),
                    fee,
                    aleo.RecordPlaintext.fromString(feeRecord),
                    url,
                    false,
                    joinProvingKey,
                    joinVerifyingKey,
                );

                console.log(`Web worker: Join transaction created in ${performance.now() - startTime} ms`);
                let transaction = joinTransaction.toString();
                console.log(transaction);
                self.postMessage({ type: 'JOIN_TRANSACTION_COMPLETED', joinTransaction: transaction });
            } catch (error) {
                console.log(error);
                self.postMessage({ type: 'ERROR', errorMessage: error.toString() });
            }
        })();
    }
});