import init, * as aleo from '@aleohq/wasm';

await init();

await aleo.initThreadPool(navigator.hardwareConcurrency);

self.addEventListener("message", ev => {
    if (ev.data.type === 'ALEO_EXECUTE_PROGRAM_LOCAL') {
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
        console.log(`Function Execution Response: ${response}`);
        self.postMessage({ type: 'OFFLINE_EXECUTION_COMPLETED', response });
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
        const aleoProgramManager = new aleo.ProgramManager();
        (async function() {
            let executeTransaction = await aleoProgramManager.execute(
                remoteProgram,
                aleoFunction,
                inputs,
                aleo.PrivateKey.from_string(privateKey),
                fee,
                aleo.RecordPlaintext.fromString("{  owner: aleo184vuwr5u7u0ha5f5k44067dd2uaqewxx6pe5ltha5pv99wvhfqxqv339h4.private,  microcredits: 50200000u64.private,  _nonce: 4201158309645146813264939404970515915909115816771965551707972399526559622583group.public}"),
                url
            );

            console.log(`Web worker: Transaction Verified: ${performance.now() - startTime} ms`);
            console.log(executeTransaction);
            self.postMessage({ type: 'EXECUTION_TRANSACTION_COMPLETED', executeTransaction });
        })();
    }
});