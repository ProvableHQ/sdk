import {
  Account,
  ProgramManager,
  PrivateKey,
  initThreadPool,
  AleoKeyProvider,
  AleoNetworkClient,
  NetworkRecordProvider,
} from "@aleohq/sdk";
import { expose, proxy } from "comlink";

await initThreadPool();

async function localProgramExecution(program, aleoFunction, inputs) {

  // Use account with existing funds
  const account = new Account({
    // privateKey: "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH",
    privateKey: "APrivateKey1zkpDH1p2331zeoQCWg7UW2E8skKWimLSxMQAM6ARBpuzMmy"
  });

  // Create a new NetworkClient, KeyProvider, and RecordProvider using official Aleo record, key, and network providers
  const networkClient = new AleoNetworkClient("https://api.explorer.aleo.org/v1");
  const keyProvider = new AleoKeyProvider();
  keyProvider.useCache = true;
  const recordProvider = new NetworkRecordProvider(account, networkClient);
  
  // Initialize a program manager with the key provider to automatically fetch keys for executions
  const programManager = new ProgramManager(
    "https://api.explorer.aleo.org/v1", 
    keyProvider, 
    recordProvider
  );
  programManager.setAccount(account);

  console.log(program);
  console.log(aleoFunction);
  console.log(inputs);

  // Build and execute the transaction
  // const transaction = await programManager.buildExecutionTransaction({
  const transaction = await programManager.run({
    programName: "helloworld.aleo",
    functionName: "main",
    fee: 0.020,
    privateFee: false,
    inputs: ["5u32", "5u32"],
    // keySearchParams: { "cacheKey": "helloworld:main" }
  });
  console.log(transaction);
  const result = await programManager.networkClient.submitTransaction(transaction);
  console.log(result);
}

async function getPrivateKey() {
  const key = new PrivateKey();
  return proxy(key);
}

async function deployProgram(program) {

  // Use existing account with funds
  const account = new Account({
    // privateKey: "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH",
    privateKey: "APrivateKey1zkpDH1p2331zeoQCWg7UW2E8skKWimLSxMQAM6ARBpuzMmy"
  });

  // Create a record provider that will be used to find records and transaction data for Aleo programs
  const networkClient = new AleoNetworkClient("https://api.explorer.aleo.org/v1");
  const keyProvider = new AleoKeyProvider();
  keyProvider.useCache(true);
  const recordProvider = new NetworkRecordProvider(account, networkClient);

  // Initialize a program manager to talk to the Aleo network with the configured key and record providers
  const programManager = new ProgramManager(
    "https://api.explorer.aleo.org/v1",
    keyProvider,
    recordProvider
  );
  programManager.setAccount(account);

  // Define a fee to pay to deploy the program
  const fee = 1.9; // 1.9 Aleo credits

  // Deploy the program to the Aleo network
  const tx_id = await programManager.deploy(program, fee);

  // // Optional: Pass in fee record manually to avoid long scan times
  // const feeRecord = "{  owner: aleo1xxx...xxx.private,  microcredits: 2000000u64.private,  _nonce: 123...789group.public}";
  // const tx_id = await programManager.deploy(program, fee, undefined, feeRecord);

  return tx_id;
}

const workerMethods = { localProgramExecution, getPrivateKey, deployProgram };
expose(workerMethods);
