import { createWasmEngine } from "@provablehq/provable-engine-wasm";
import { ProvableSDK } from "@provablehq/provablekit";
import {
    Account,
    AleoKeyProvider,
    AleoKeyProviderParams,
    ConfirmedTransactionJSON,
    initThreadPool,
    Proof,
    ProgramManager,
    Transaction,
    VerifyingKey,
} from "@provablehq/provablekit/testnet.js";

// Initialize the thread pool in order to prove faster.

await ProvableSDK.init({
  engine: createWasmEngine(),
  env: { network: "testnet" },
});
await initThreadPool();

function generateHelloHelloSource(programName: string) {
    const hello_hello_program =`
program ${programName};

function hello:
    input r0 as u32.public;
    input r1 as u32.private;
    add r0 r1 into r2;
    output r2 as u32.private;

constructor:
    assert.eq edition 0u16;
`;
    return hello_hello_program;
}

// Sample SNARK proof fixtures from a simple test circuit with 2 public inputs, both equal to 1field.
// These are used to demonstrate standalone proof verification with snarkVerify/snarkVerifyBatch.
const SAMPLE_VERIFYING_KEY = "verifier1qypqqqqqqqqqqqyxqqqqqqqqqqqyzqqqqqqqqqqqgyqqqqqqqqqqqsgqqqqqqqqqqpqsqqqqqqqqqqqvqqqqqqqqqqqgh4c0dzjasutflzxx36ckaea0zr5xqu0ydpaascrhacjlftlvnt99yg003w45g0mj4qepazsl5w5qfl5dm9y3sfq87376ynfyync09xyaz05ggfh79lkpx6yzunrz06zdwsu4klsj9z3933wpeggqj2msqs5xeul99lvzyd98mfmqm34nud4z7qjkxk708d9mvgqqw9hwkes726yl5nla6mr7s56p2a2c36csqpl0qe39wd8rswunurla70pqes7fay5kzh7jv5l5plpc82yu5p8thnxavejw3kwxz038sdmf34n9uqt77pnz2u6w8qae8c8lmu7zpnpun6ffv90ayeflgr7rsw5fegzwh0xd6enyarvuvylz0qmknrtxtcqhaurxy4e5uwpmj0s0lheuyrxre85jjc2l6fjn7s8u8qagnjsyaw7vm4nxf6xeccf7y7phdxxkvhspj4chhza3rsj4v66lfc00u27y9g2mlg7ttgdx8m9d09lns7lcjqmcs9lraqk9wac52hwc0th9g3qsrrsk2xszjn0qyuwcas5g76c4l8u8zycc5n4uslf6kajp0c4aq6ea7d8u3rvxkql5l8njthv82ygpsqmd034693yathl585th5rh29c0yf29l7yk4nry7daf3ndm7lhv8nvy546sa0uysqcvdy5tlxzqq3q8swlatmy33h6zn7ychqcnjjvfc8a4q0szr70k9l2qa8my76c0ud5e5t5yksd78ytlhey426p2xdxq2vfrtuhduyjjh5wgwn35fxz2rvhgaysyhgph4at920ykfrjqph8gjp47vl77zlzqhnwljkxnz6guqmh8xy62966f0sw505l07m64r2qvxd9ggzng7naawtsran2yj77fts7e7mccf25svwdhzt998ee7cruwc6gx9krqpj4ll7x5jw0l3sw8kwjfgck0an2dwcp4dz9yfq272svqqqqqqqqqqqhzxq3v";
const SAMPLE_PROOF = "proof1qyqsqqqqqqqqqqqpqqqqqqqqqqqg4v4ffaewfrdfyl442hd2jryku27u9cajphqaqa5keztfzy75mxctwth0w9599r2ra0awu9jfmj5qq9n6ufwrq0r68g2wcse7avhuy2t37mp35s39wtl0z9f53qhatkl4gqpyzheggtkj2gxzl45jwjtx8qtsx5wh09f286p866gzc6x292u773zhtgzvxucw5jv397ngkh5wcwtjzwy8qsxhtywz5egx5hzg6wqyayt8ernlmgdy7d6ytmxyx3azdvy6qsjfcqjdmvr3ycaqmzaz20umm3zu4jzunjkwfsm3ry9nu7vqfypg567n33m3226l797v7pqltuw8yl8xwh5jrkgpgjvl8uqp2fttyvs7k0ye5eeeswnl0506aw0qrnxpc687002ukjxdd222ffw6lk8gleuf0tvq4lxkskmhrlqaj95zvp2w9aeza4sdt7hdecy29er3s84skdxq5uf0m767ecpa60tm0krx4vdp2umvdy6aaddy7xxpvtwmwfan8z23yud27z8pan8msgr3zq2s2qnfnqhg8cltzl7v9fewna69kavvy570l62k55x2wayjvvhha2uk6vje5zsgvqw67cskce4dxcqtrdpvkkl3n7yt2v4pwexhw8ftgnv0kkvumgha2cfyn84yp7v2ztysawmt65y2z28auutxlh05nvcqlhaj2a3wd3gqw6tc02z0s67v4x5kh3st28v30nf9cv9k6g5jnc89z4hmu32nnnm9j625q75nfcr99hjpqu50rhqpu57lqnjdwhfu2pvstze2c0qj0a2d4zkcg88ep79eyqe7e399hx86e6p4qswjk32dpg45r7jtzhse8szcaxu7md99u7luj2afl07jzp5zqut05a85qg5qkd8syclvv5sqf4xtfqca4c9r6ffptmv2l587qx8knn7qpukt4hqqpkw27z7tf0xk9z7esermt8hmr2auefw3c0drel890ep6rujt3uff504q744z5s9v2krxkvh3vqjjr48dnuzx5vzpymcz0sdvvt7v7p5pymj82a5p33fd4xup79muz3zvn8tq09mlfujr2nyv99ad80u4qvutsca8g63aw7dsq0hvql3c07l0lxl39lwr8gqwqpvfx85tjpyq3wgn3c7az3xvnj22h2c4qq356zgxjwl69wn4jx4srjsczanm9sqdqvqqqqqqqqqqq2ku9a56rnzvm4zchvwea5dt9qnwjl789zar0dvjmze3aft5d567q2ntdw85p6ep925xx3hymjgwqyqtnxjhxr50cp8tqvpwlexzyajld9z2gu3zzy6cvllnh2kmzr4ctdz78wyprdvxyf2aqs8apz866aspq9qdtd535z8uqaacz6d9v7jahs87gav0388kg0ctdup7h93pphqs27m5jud96f2pnwclyhvk3lv9pgl57l7mqzgljm9qc2kdy39j8eyhq8guca5ytphd7cnjl9u8nurcqqqqw7lyxe";
const SAMPLE_INPUTS = ["1field", "1field"];

const programManager = new ProgramManager();

// Create a temporary account for the execution of the program
const account = new Account();
programManager.setAccount(account);

// Create a key provider in order to re-use the same key for each execution
const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);
programManager.setKeyProvider(keyProvider);

async function localProgramExecution(program: string, programName: string, aleoFunction: string, inputs: string[]) {
    // Pre-synthesize the program keys and then cache them in memory using the key provider.
    try {
        const keyPair = await programManager.synthesizeKeys(program, aleoFunction, inputs);

        programManager.keyProvider.cacheKeys(`${programName}:${aleoFunction}`, keyPair);

    } catch (e) {
        throw new Error(`Failed to synthesize keys: ${e.message}`);
    }

    // Specify parameters for the key provider to use search for program keys. In particular specify the cache key
    // that was used to cache the keys in the previous step.
    const keyProviderParams = new AleoKeyProviderParams({cacheKey: `${programName}:${aleoFunction}`});

    // Execute once using the key provider params defined above. This will use the cached proving keys and make
    // execution significantly faster.
    let executionResponse = await programManager.run(
        program,
        aleoFunction,
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

// Demonstrate standalone SNARK proof verification. This verifies a proof from a circuit that is
// not necessarily an Aleo program execution. Useful for verifying proofs received from external
// sources (e.g. another party proved a computation and you want to verify it).
function snarkProofVerification() {
    // Parse the verifying key and proof from their string representations.
    const verifyingKey = VerifyingKey.fromString(SAMPLE_VERIFYING_KEY);
    const proof = Proof.fromString(SAMPLE_PROOF);

    // Verify the proof with the correct public inputs.
    const isValid = verifyingKey.verify(SAMPLE_INPUTS, proof);
    console.log(`  VerifyingKey.verify with valid inputs: ${isValid}`); // true

    // Verify the proof with wrong inputs — this should return false.
    const isInvalid = verifyingKey.verify(["1field", "2field"], proof);
    console.log(`  VerifyingKey.verify with wrong inputs: ${isInvalid}`); // false

    // Batch verification: verify the same proof with its verifying key and inputs in a batch context.
    // VerifyingKey.verifyBatch takes arrays of verifying key strings and a 3D inputs array:
    // [circuit_index][instance_index][field_index]
    const batchResult = VerifyingKey.verifyBatch(
        [SAMPLE_VERIFYING_KEY],
        [[SAMPLE_INPUTS]],
        proof,
    );
    console.log(`  VerifyingKey.verifyBatch result: ${batchResult}`); // true
}

// Run a deployment and both online and offline executions.
async function run(online: boolean = false) {
    // Generate the hello_hello.aleo program source code and inputs.
    let programName = `hello_hello.aleo`;
    let hello_hello_program = generateHelloHelloSource(programName);
    const functionName = "hello";
    const inputs = ["5u32", "5u32"];

    console.log("");
    console.log("// --- STEP 1: Execute the program offline to test it gives the expected results. --- //");
    // Execute the program locally.
    console.log(`Executing ${programName}/hello offline`);
    let start = Date.now();
    const result = await localProgramExecution(hello_hello_program, programName, functionName, inputs);
    console.log(`✅ Local execute finished in ${(Date.now() - start)/1000}s`);

    console.log("");
    console.log("// --- STEP 2: Build the deployment transaction. --- //");
    start = Date.now();
    programName = `hello_hello_${Math.floor(Math.random() * 65536)}.aleo`;
    hello_hello_program = generateHelloHelloSource(programName);
    const deploymentTx: Transaction = await programManager.buildDeploymentTransaction(
        hello_hello_program,
        0,
        false,
    )
    console.log(`✅ Deployment transaction built in ${(Date.now() - start)/1000}s`);

    // If the deployment flag is set to true, deploy the program on testnet (requires aleo credits).
    if (online) {
        const txId: string = await programManager.networkClient.submitTransaction(deploymentTx);
        const confirmedTx: ConfirmedTransactionJSON = await programManager.networkClient.waitForTransactionConfirmation(txId);
        if (txId === confirmedTx.transaction.id) {
            console.log(`Program ${programName} deployed to Aleo Testnet successfully!`);
        }
    } else {
        programName = `hello_hello.aleo`;
        hello_hello_program = generateHelloHelloSource(programName);
    }

    console.log("");
    console.log("// --- STEP 3: Execute the program ONLINE. --- //");

    // If the program was actually deployed, execute it online. Otherwise, execute an equivalent
    // program with the same logic.
    console.log(`Executing ${programName}/hello online on the aleo network`);
    start = Date.now();
    const keySearchParams = new AleoKeyProviderParams({cacheKey: `${programName}:${functionName}`});
    const executionTx: Transaction = await programManager.buildExecutionTransaction(
        {
            programName,
            functionName,
            priorityFee: 0,
            privateFee: false,
            inputs: inputs,
            keySearchParams,
            program: hello_hello_program
        }
    )
    console.log(`✅ Online execution of ${programName} built in ${(Date.now() - start)/1000}s`);

    // If the online option is specified, submit the transaction to the network.
    if (online) {
        const txId: string = await programManager.networkClient.submitTransaction(executionTx);
        const confirmedTx: ConfirmedTransactionJSON = await programManager.networkClient.waitForTransactionConfirmation(txId);
        if (txId === confirmedTx.transaction.id) {
            console.log(`Program ${programName}/hello executed successfully!`);
        }
    }

    console.log("");
    console.log("// --- STEP 4: Verify a standalone SNARK proof. --- //");
    // snarkVerify and snarkVerifyBatch let you verify a proof from any Varuna circuit directly,
    // without requiring an on-chain program execution. This is useful when you receive a proof
    // from an external source and want to verify it independently.
    start = Date.now();
    snarkProofVerification();
    console.log(`✅ SNARK proof verification finished in ${(Date.now() - start)/1000}s`);
}

// Run the offline execution, deployment, and online execution of hello_hello.aleo.
await run(false);
