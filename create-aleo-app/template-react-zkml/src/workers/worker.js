import {
  Account,
  ProgramManager,
  PrivateKey,
  initThreadPool,
  AleoKeyProvider,
  AleoNetworkClient,
  Program,
  NetworkRecordProvider,
  AleoKeyProviderParams,
  verifyFunctionExecution,
} from "@aleohq/sdk";
import { expose, proxy } from "comlink";
import {sample_inputs} from "../variables.js";

// Initialize the threadpool
await initThreadPool();

// Initialize a program manager with a keyprovider that will cache our keys
const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);
const programManager = new ProgramManager({ host: "https://api.explorer.aleo.org/v1", keyProvider: keyProvider});
const account = new Account();
programManager.setAccount(account);

async function synthesizeKeys(program_source, aleoFunction) {
  const program = Program.fromString(program_source);
  const keys = await programManager.synthesizeKeys(program_source, aleoFunction, sample_inputs, new PrivateKey())
  const cacheKey = `${program.id()}/${aleoFunction}`;
  programManager.keyProvider.cacheKeys(cacheKey, keys);
  console.log(`Synthesized keys for ${cacheKey}`);
}

async function localProgramExecution(program_source, aleoFunction, inputs) {
  const program = Program.fromString(program_source);
  const keySearchParams = new AleoKeyProviderParams({cacheKey: `${program.id()}/${aleoFunction}`});
  let cacheFunctionKeys = false;
  if (!programManager.keyProvider.containsKeys(keySearchParams.cacheKey)) {
    console.log(`No cached keys for ${keySearchParams.cacheKey}`);
    cacheFunctionKeys = true;
  }

  const executionResponse = await programManager.executeOffline(
    program_source,
    aleoFunction,
    inputs,
    true, // set to true to get proof
    undefined,
    keySearchParams,
    undefined,
      undefined,
      undefined,
      cacheFunctionKeys
  );
  console.log("executionResponse", executionResponse);

  if (cacheFunctionKeys) {
    console.log("Caching keys");
    const keys = executionResponse.getKeys(program.id(), aleoFunction);
    const verifyingKey = keys.verifyingKey();

    programManager.keyProvider.cacheKeys(keySearchParams.cacheKey, [keys.provingKey(), verifyingKey]);
    console.log(`Cached keys for ${keySearchParams.cacheKey}`);
  }

  console.log("Getting outputs");
  const outputs = executionResponse.getOutputs(); // proof: executionResponse.
  const execution = executionResponse.getExecution().toString();
  console.log("outputs", outputs);
  console.log("execution", execution);
  return [outputs, executionResponse.getExecution()];
}

async function getPrivateKey() {
  const key = new PrivateKey();
  return proxy(key);
}

async function verifyExecution(execution_string, program, aleoFunction) {
  const keySearchParams = new AleoKeyProviderParams({cacheKey: `${program.id()}/${aleoFunction}`});

  const [provingKey, verifyingKey] = programManager.keyProvider.functionKeys(keySearchParams);
  return verifyFunctionExecution(execution_string, verifyingKey, program, aleoFunction);
}

async function deployProgram(program) {
  const keyProvider = new AleoKeyProvider();
  keyProvider.useCache(true);

  // Create a record provider that will be used to find records and transaction data for Aleo programs
  const networkClient = new AleoNetworkClient("https://api.explorer.aleo.org/v1");

  // Use existing account with funds
  const account = new Account({
    privateKey: "user1PrivateKey",
  });

  const recordProvider = new NetworkRecordProvider(account, networkClient);

  // Initialize a program manager to talk to the Aleo network with the configured key and record providers
  const programManager = new ProgramManager(
    "https://api.explorer.aleo.org/v1",
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

const workerMethods = { deployProgram, getPrivateKey, localProgramExecution, synthesizeKeys, verifyExecution};
expose(workerMethods);
