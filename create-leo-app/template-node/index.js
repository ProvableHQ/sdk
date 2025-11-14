#!/usr/bin/env ts-node
import { Account, ProgramManager, AleoKeyProvider, initThreadPool, NetworkRecordProvider, AleoNetworkClient } from '@provablehq/sdk';

async function main() {
    // Initialize multi-threading to allow WASM execution.
    await initThreadPool();
    const program = `program test_program.aleo;

function main:
    input r0 as u32.public;
    input r1 as u32.private;
    add r0 r1 into r2;
    output r2 as u32.private;

constructor:
    assert.eq edition 0u16;
`;

    const account = new Account({
        privateKey: "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH",
    });
    const networkClient = new AleoNetworkClient("http://localhost:3030");
    const keyProvider = new AleoKeyProvider();
    keyProvider.useCache(true);
    const recordProvider = new NetworkRecordProvider(account, networkClient);
    
    const programManager = new ProgramManager("http://localhost:3030", keyProvider, recordProvider);
    programManager.setAccount(account);

    const startTime = performance.now();

    const tx = await programManager.buildDeploymentTransaction(program, 0, false);
    await programManager.networkClient.submitTransaction(tx);
    console.log("Program deployed - response:", tx);

    // const tx = await programManager.buildExecutionTransaction({
    //     privateKey: account.privateKey(),
    //     // program: program.toString(),
    //     programName: "test_program.aleo",
    //     functionName: "main",
    //     privateFee: false,
    //     inputs:  ["2u32", "4u32"], 
    //     priorityFee: 0.0,
    //     edition: 0,
    //     skipProof: true,
    // });
    // await programManager.networkClient.submitTransaction(tx);
    
    const endTime = performance.now();
    console.log("Time (s):",  (endTime - startTime)/1000);
    console.log("Transaction submitted - response:", tx.toString());

}


main()
    .then(_ => {
    })
    .catch(err => {
        console.log(err)
	process.exit(1)
    });