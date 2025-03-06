import {
  Account,
  ProgramManager,
  PrivateKey,
  initThreadPool,
  AleoKeyProvider,
  AleoNetworkClient,
  NetworkRecordProvider,
} from "@provablehq/sdk";

await initThreadPool();

// A program name must be unique. To deploy the program, you should change the name from hello_hello.aleo to something else that is unique.
const hello_hello_program =`
program hello_hello.aleo;

function hello:
    input r0 as u32.public;
    input r1 as u32.private;
    add r0 r1 into r2;
    output r2 as u32.private;`

async function localProgramExecution(program, aleoFunction, inputs) {
    const programManager = new ProgramManager();

    // Create a temporary account for the execution of the program
    const account = new Account();
    programManager.setAccount(account);

    const executionResponse = await programManager.run(
        program,
        aleoFunction,
        inputs,
        false,
    );
    return executionResponse.getOutputs();
}

function getPrivateKey() {
    return new PrivateKey().to_string();
}

async function deployProgram(program) {
  const keyProvider = new AleoKeyProvider();
  keyProvider.useCache(true);

  // Create a record provider that will be used to find records and transaction data for Aleo programs
  const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");

  // Use existing account with funds
  const account = new Account({
    privateKey: "user1PrivateKey",
  });

  const recordProvider = new NetworkRecordProvider(account, networkClient);

  // Initialize a program manager to talk to the Aleo network with the configured key and record providers
  const programManager = new ProgramManager(
    "https://api.explorer.provable.com/v1",
    keyProvider,
    recordProvider,
  );

  programManager.setAccount(account);

  // Define a fee to pay to deploy the program
  const fee = 1.9; // 1.9 Aleo credits

  // Deploy the program to the Aleo network
  const tx_id = await programManager.deploy(program, fee);

  // Optional: Pass in fee record manually to avoid long scan times
  // const feeRecord = "{  owner: aleo1xxx...xxx.private,  microcredits: 2000000u64.private,  _nonce: 123...789group.public}";
  // const tx_id = await programManager.deploy(program, fee, undefined, feeRecord);

  return tx_id;
}

onmessage = async function (e) {
    if (e.data === "execute") {
        const result = await localProgramExecution(hello_hello_program, "hello", ["5u32", "5u32"]);
        postMessage(result);
    } else if (e.data === "key") {
        const result = getPrivateKey();
        postMessage(result);
    } else if (e.data === "deploy") {
    try {
        const result = await deployProgram(hello_hello_program);
        postMessage(result);
      } catch (error) {
        postMessage({ error: error.message });
    }
  }

};
