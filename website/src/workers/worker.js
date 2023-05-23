import init, * as aleo from '@aleohq/wasm';

await init();

aleo.initThreadPool(8);

const aleoProgramManager = aleo.ProgramManager.new();
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

        let response = aleoProgramManager.execute_local(
            localProgram,
            aleoFunction,
            inputs,
            aleo.PrivateKey.from_string(privateKey),
            true
        );

        console.log(`Web worker: Local execution completed in ${performance.now() - startTime} ms`);
        let outputs = response.getOutputs();
        console.log(`Function execution response: ${outputs}`);
        self.postMessage({ type: 'OFFLINE_EXECUTION_COMPLETED',  outputs });
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
            let executeTransaction = await aleoProgramManager.execute(
                remoteProgram,
                aleoFunction,
                inputs,
                aleo.PrivateKey.from_string(privateKey),
                fee,
                aleo.RecordPlaintext.fromString(feeRecord),
                url
            );

            console.log(`Web worker: On-chain execution transaction created in ${performance.now() - startTime} ms`);
            console.log(executeTransaction.toString());
            self.postMessage({ type: 'EXECUTION_TRANSACTION_COMPLETED', executeTransaction: executeTransaction.toString() });
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
            let transferTransaction = await aleoProgramManager.transfer(
                aleo.PrivateKey.from_string(privateKey),
                amountCredits,
                recipient,
                aleo.RecordPlaintext.fromString(amountRecord),
                fee,
                aleo.RecordPlaintext.fromString(feeRecord),
                url
            );

            console.log(`Web worker: Transfer transaction created in ${performance.now() - startTime} ms`);
            console.log(transferTransaction.toString());
            self.postMessage({ type: 'TRANSFER_TRANSACTION_COMPLETED', transferTransaction: transferTransaction.toString() });
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
            let deployTransaction = await aleoProgramManager.deploy(
                program,
                undefined,
                aleo.PrivateKey.from_string(privateKey),
                fee,
                aleo.RecordPlaintext.fromString(feeRecord),
                url,
            );

            console.log(`Web worker: Deployment transaction created in ${performance.now() - startTime} ms`);
            console.log(deployTransaction.toString());
            self.postMessage({ type: 'DEPLOY_TRANSACTION_COMPLETED', deployTransaction: deployTransaction.toString() });
        })();
    }
});