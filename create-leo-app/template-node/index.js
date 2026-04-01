import { createWasmEngine } from "@provablehq/provable-engine-wasm";
import { ProvableSDK } from "@provablehq/provablekit";
import {Account, AleoKeyProvider, AleoKeyProviderParams, initThreadPool, ProgramManager, PrivateKey} from "@provablehq/provablekit/testnet.js";

import * as process from "node:process";

// await initThreadPool();


await ProvableSDK.init({
  engine: createWasmEngine(),
  env: { network: "testnet" },
});
const programName = "hello_hello.aleo"

const hello_hello_program =`
program ${programName};

function hello:
    input r0 as u32.public;
    input r1 as u32.private;
    add r0 r1 into r2;
    output r2 as u32.private;`

async function localProgramExecution(program, programName, functionName, inputs) {
    const programManager = new ProgramManager();

    // Create a temporary account for the execution of the program
    const account = new Account();
    programManager.setAccount(account);

    // Create a key provider in order to re-use the same key for each execution
    const keyProvider = new AleoKeyProvider();
    keyProvider.useCache(true);
    programManager.setKeyProvider(keyProvider);

    // Pre-synthesize the program keys and then cache them in memory using key provider.
    console.log("Synthesizing hello_hello/hello keys");
    const keyPair = await programManager.synthesizeKeys(hello_hello_program, functionName, inputs);
    programManager.keyProvider.cacheKeys(`${programName}:${functionName}`, keyPair);

    // Specify parameters for the key provider to use search for program keys. In particular specify the cache key
    // that was used to cache the keys in the previous step.
    const keyProviderParams = new AleoKeyProviderParams({cacheKey: `${programName}:${functionName}`});

    // Execute once using the key provider params defined above. This will use the cached proving keys and make
    // execution significantly faster.
    console.log("Executing hello_hello/hello");
    let executionResponse = await programManager.run(
        program,
        functionName,
        inputs,
        true,
        undefined,
        keyProviderParams,
    );
    console.log("hello_hello/hello executed - result:", executionResponse.getOutputs());

    // Verify the execution using the verifying key that was generated earlier.
    if (programManager.verifyExecution(executionResponse, 9_000_000)) {
        console.log("hello_hello/hello execution verified!");
    } else {
        throw("Execution failed verification!");
    }
}

// Create a remote program execution transaction.
async function remoteProgramExecution(programName, functionName, inputs) {
    // Create a key provider in order to re-use the same key for each execution
    const keyProvider = new AleoKeyProvider();
    keyProvider.useCache(true);

    const programManager = new ProgramManager("http://34.169.215.4:3030", keyProvider);

    const tx = await programManager.buildExecutionTransaction(
        {
            programName,
            functionName,
            priorityFee: 0,
            privateFee: false,
            inputs,
            privateKey: PrivateKey.from_string(process.env["PUZZLE_PK"])
        }
    );
    console.log("Resulting transaction")
}

// const start = Date.now();
// console.log("Starting local execute!");
// await localProgramExecution(hello_hello_program, programName, "hello", ["5u32", "5u32"]);
// console.log("Local execute finished!", Date.now() - start);
//
// console.log("Starting remote execute");
// const auctionTicket = "{\n  owner: aleo12a4wll9ax6w5355jph0dr5wt2vla5sss2t4cnch0tc3vzh643v8qcfvc7a.private,\n  auction: {\n    starting_bid: 1000u64.private,\n    name: 35399035103896773146887283777field.private,\n    item: {\n      id: 2711777270856651361584090827715149911900945757872672230578290769243507539617field.private,\n      offchain_data: [\n        988474637487226873250021955104421895943605632761729320744454284792013483886field.private,\n        1018595503607749325560812785092303652308909717269501712857428145700763090203field.private,\n        1866354748676879328546224733327549476838379876255164483333908854380501015560field.private,\n        17649382157field.private\n      ]\n    }\n  },\n  auction_id: 4494702806735512695876583707511065751304542460719196393147692059573188109243field.private,\n  settings: {\n    auction_privacy: 1field.private,\n    bid_types_accepted: 2field.private\n  },\n  _nonce: 3369967065799891136255379173673996324404175734426175774361522329924029135340group.public,\n  _version: 0u8.public\n}";
// const privateBid = "{\n  owner: aleo12a4wll9ax6w5355jph0dr5wt2vla5sss2t4cnch0tc3vzh643v8qcfvc7a.private,\n  bid: {\n    amount: 50000u64.private,\n    auction_id: 4494702806735512695876583707511065751304542460719196393147692059573188109243field.private,\n    bid_public_key: 7957235921075215080384898776027711008106448988910535634014947882222019778701group.private\n  },\n  bid_id: 7560059211950188901208146469854635725646381155467709838136796808753178551929field.private,\n  _nonce: 6603986437928263590097393830337419611438422585243442121397081002092267314422group.public,\n  _version: 0u8.public\n}";
// await remoteProgramExecution("private_auction_test_3.aleo", "select_winner_private", [auctionTicket, privateBid]);