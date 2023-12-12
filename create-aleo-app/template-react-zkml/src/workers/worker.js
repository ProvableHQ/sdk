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
  OfflineQuery,
  FunctionExecution,
  verifyFunctionExecution
} from "@aleohq/sdk";
import { expose, proxy } from "comlink";
import {sample_inputs} from "../variables.js";
import { Execution } from "@aleohq/wasm";
import { mlp_program, decision_tree_program, decision_tree_program_even_odd, mlp_program_even_odd, test_imageData, expected_runtimes, run_JS_decision_tree_classification, run_JS_decision_tree_even_odd, run_JS_mlp_even_odd, run_JS_mlp_classification } from '../variables.js';


// Initialize the threadpool
await initThreadPool();

// Initialize a program manager with a keyprovider that will cache our keys
const keyProvider = new AleoKeyProvider();
console.log("keyProvider", keyProvider);
keyProvider.useCache(true);
console.log("keyProvider", keyProvider);

//keyProvider.fetchKeys("https://pub-65a47b199b944d48a057ca6603a415a2.r2.dev/tree_mnist_2.prover.30e265c", 
//                      "https://pub-65a47b199b944d48a057ca6603a415a2.r2.dev/tree_mnist_2.verifier.17db860",
//                      {cacheKey: `${program.id()}/${aleoFunction}`})
//    .then(() => {
//        console.log("Keys fetched successfully");
//    })
//    .catch(error => {
//        console.error("Error fetching keys: ", error);
//    });
console.log("keyProvider after fetchKeys", keyProvider);
keyProvider.useCache(true);
const programManager = new ProgramManager("https://api.explorer.aleo.org/v1", keyProvider, undefined);
const account = new Account();
programManager.setAccount(account);
var program_global = undefined;

async function synthesizeKeys(program_source, aleoFunction) {
  const program = Program.fromString(program_source);
  program_global = program;


  //const keys = await programManager.synthesizeKeys(program_source, aleoFunction, sample_inputs, new PrivateKey())
  const cacheKey = `${program.id()}/${aleoFunction}`;
  programManager.keyProvider.cacheKeys(cacheKey, keys);
  console.log(`Synthesized keys for ${cacheKey}`);
}

async function localProgramExecution(program_source, aleoFunction, inputs) {
  const program = Program.fromString(program_source);

  const keySearchParams = new AleoKeyProviderParams({proverUri: "https://pub-65a47b199b944d48a057ca6603a415a2.r2.dev/tree_mnist_2.prover.30e265c", 
  verifierUri: "https://pub-65a47b199b944d48a057ca6603a415a2.r2.dev/tree_mnist_2.verifier.17db860",
  cacheKey: `${program.id()}/${aleoFunction}`,})

  //const keySearchParams = new AleoKeyProviderParams({cacheKey: `${program.id()}/${aleoFunction}`});
  
  let cacheFunctionKeys = false;
  if (!programManager.keyProvider.containsKeys(keySearchParams.cacheKey)) {
    console.log(`No cached keys for ${keySearchParams.cacheKey}`);
    cacheFunctionKeys = true;
  }

    const latestStateRoot = "sr1p93gpsezrjzdhcd2wujznx5s07k8qa39t6vfcej35zew8vn2jyrs46te8q";
    const offlineQuery = new OfflineQuery(latestStateRoot);


  const executionResponse = await programManager.run(
    program_source,
    aleoFunction,
    inputs,
    true, // set to true to get proof
    undefined,
    keySearchParams,
    undefined,
    undefined,
    undefined,
    offlineQuery // or offlineQuery
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
  const execution = executionResponse.getExecution().toString()
  return [outputs, execution];
}

async function getPrivateKey() {
  const key = new PrivateKey();
  return proxy(key);
}

async function verifyExecution(execution) {
  console.log("in verifyExecution")
  const ex = FunctionExecution.fromString(execution);
  const verifyingKey = await keyProvider.getVerifyingKey("https://pub-65a47b199b944d48a057ca6603a415a2.r2.dev/tree_mnist_2.verifier.17db860");
  
  const program = Program.fromString(decision_tree_program_even_odd);
  
  const res = verifyFunctionExecution(ex, verifyingKey, program, "main");
  console.log("res in verifyExecution", res);
  return res;
  //const executionResponse = Execution.fromString(execution);
  //return programManager.verifyExecution(executionResponse);
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
