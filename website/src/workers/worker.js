import init, * as aleo from '@aleohq/wasm';

await init();

await aleo.initThreadPool(10);


self.addEventListener("message", ev => {
    if (ev.data.type === 'ALEO_EXECUTE_PROGRAM_LOCAL') {
        console.log("Web worker: Received message to execute program locally");
        const {
            localProgram,
            aleoFunction,
            inputs,
            privateKey,
        } = ev.data;

        console.log('Web worker: Executing Local Function...');
        let startTime = performance.now();
        console.log(aleo);
        const aleoProgramManager = aleo.ProgramManager.new();
        console.log("Aleo program manager", aleoProgramManager);
        let key = aleo.PrivateKey.from_string(privateKey);
        console.log(key);
        console.log(localProgram);
        console.log(inputs);
        console.log(privateKey);
        console.log("return to string", key.to_string());
        console.log("ciphertext", key.toCiphertext("ass").toString());
        let response = aleoProgramManager.execute_local(
            localProgram,
            aleoFunction,
            inputs,
            key
        );

        console.log(`Web worker: Execution Completed: ${performance.now() - startTime} ms`);
        let outputs = response.getOutputs();
        console.log(`Function Execution Response: ${outputs}`);
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
        const aleoProgramManager = aleo.ProgramManager.new();
        console.log(remoteProgram);
        console.log(aleoFunction);
        console.log(inputs);
        console.log("fee in gates: ", fee*1000000);
        console.log(feeRecord);
        console.log(url);
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

            console.log(`Web worker: Transaction Verified: ${performance.now() - startTime} ms`);
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

        console.log('Web worker: Creating execution...');

        let startTime = performance.now();
        const aleoProgramManager = aleo.ProgramManager.new();
        (async function() {
            let transferTransaction = await aleoProgramManager.transfer(
                privateKey,
                amountCredits,
                recipient,
                amountRecord,
                fee,
                feeRecord,
                url,
            );

            console.log(`Web worker: Transaction Verified: ${performance.now() - startTime} ms`);
            console.log(transferTransaction);
            self.postMessage({ type: 'EXECUTION_TRANSACTION_COMPLETED', transferTransaction: transferTransaction.toString() });
        })();
    }
    else if (ev.data.type === 'ALEO_DEPLOY') {
        const {
            program,
            imports,
            privateKey,
            fee,
            feeRecord,
            url
        } = ev.data;

        console.log('Web worker: Creating execution...');

        let startTime = performance.now();
        const aleoProgramManager = aleo.ProgramManager.new();
        (async function() {
            let deployTransaction = await aleoProgramManager.deploy(
                program,
                imports,
                privateKey,
                fee,
                feeRecord,
                url,
            );

            console.log(`Web worker: Transaction Verified: ${performance.now() - startTime} ms`);
            console.log(deployTransaction);
            self.postMessage({ type: 'EXECUTION_TRANSACTION_COMPLETED', deployTransaction: deployTransaction.toString() });
        })();
    }
});