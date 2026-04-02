import { createWasmEngine } from '@provablehq/provable-engine-wasm';
import { ProvableKit } from '@provablehq/provablekit';

await ProvableKit.init({
  engine: createWasmEngine(),
  env: { network: 'testnet' },
});
#!/usr/bin/env ts-node
import { Account, ProgramManager, initThreadPool, NetworkRecordProvider, AleoNetworkClient, getOrInitConsensusVersionTestHeights } from '@provablehq/provable-engine-wasm/testnet.js';

const program = `program test_program.aleo;

function main:
    input r0 as u32.public;
    input r1 as u32.private;
    add r0 r1 into r2;
    output r2 as u32.private;

constructor:
    assert.eq program_owner aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px;`;

const upgraded_program = `program test_program.aleo;

function main:
    input r0 as u32.public;
    input r1 as u32.private;
    add r0 r1 into r2;
    output r2 as u32.private;

function new_transition:
    input r0 as u32.private;
    input r1 as u32.private;
    add r0 r1 into r2;
    output r2 as u32.private;

constructor:
    assert.eq program_owner aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px;`;

async function main() {
    // Initialize multi-threading to allow WASM execution.
    await initThreadPool();
    const heights = getOrInitConsensusVersionTestHeights("0,1,2,3,4,5,6,7,8,9,10,11,12,13");
    console.log(`Set development consensus heights to ${heights}`);

    const privateKey = "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH";
    const account = new Account({privateKey});
    const networkClient = new AleoNetworkClient("http://localhost:3030");
    const recordProvider = new NetworkRecordProvider(account, networkClient);
    
    const programManager = new ProgramManager("http://localhost:3030", recordProvider );
    programManager.setAccount(account);


    const tx_1 = await programManager.buildDevnodeDeploymentTransaction({program: program, priorityFee: 0, privateFee: false});
    console.log("Program deployed - response:", tx_1.toString());
    await programManager.networkClient.submitTransaction(tx_1);

    const tx_2 = await programManager.buildDevnodeUpgradeTransaction({program: upgraded_program, priorityFee: 0, privateFee: false});
    await programManager.networkClient.submitTransaction(tx_2);
    console.log("Program deployed - response:", tx_2);


    const tx_3 = await programManager.buildDevnodeExecutionTransaction({
        privateKey: account.privateKey(),
        programName: "test_program.aleo",
        functionName: "new_transition",
        privateFee: false,
        inputs:  ["2u32", "4u32"], 
        priorityFee: 0.0,
        edition: 0,
        skipProof: true,
    });
    await programManager.networkClient.submitTransaction(tx_3);
    console.log("Transaction submitted - response:", tx_3.toString());
}


main()
    .then(_ => {
    })
    .catch(err => {
        console.log(err)
	process.exit(1)
    });