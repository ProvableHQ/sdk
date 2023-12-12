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

console.log("keyProvider after fetchKeys", keyProvider);
keyProvider.useCache(true);
const programManager = new ProgramManager("https://api.explorer.aleo.org/v1", keyProvider, undefined);
const account = new Account();
programManager.setAccount(account);
var program_global = undefined;

async function localProgramExecution(program_source, aleoFunction, inputs) {
  const program = Program.fromString(program_source);

  const keySearchParams = new AleoKeyProviderParams({proverUri: "https://pub-65a47b199b944d48a057ca6603a415a2.r2.dev/tree_mnist_2.prover.30e265c", 
  verifierUri: "https://pub-65a47b199b944d48a057ca6603a415a2.r2.dev/tree_mnist_2.verifier.17db860",
  cacheKey: `${program.id()}/${aleoFunction}`,})
  
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
    offlineQuery
  );
  console.log("executionResponse", executionResponse);

  if (cacheFunctionKeys) {
    console.log("Caching keys");
    console.log("hi0");
    const keys = executionResponse.getKeys(program.id(), aleoFunction);
    console.log("hi1");
    const verifyingKey = keys.verifyingKey();

    programManager.keyProvider.cacheKeys(keySearchParams.cacheKey, [keys.provingKey(), verifyingKey]);
    console.log(`Cached keys for ${keySearchParams.cacheKey}`);
  }

  console.log("Getting outputs");
  const outputs = executionResponse.getOutputs();
  const execution = executionResponse.getExecution().toString()
  return [outputs, execution];
}

async function verifyExecution(execution) {
  console.log("in verifyExecution")
  const ex = FunctionExecution.fromString(execution);
  const verifyingKey = await keyProvider.getVerifyingKey("https://pub-65a47b199b944d48a057ca6603a415a2.r2.dev/tree_mnist_2.verifier.17db860");
  
  const program = Program.fromString(decision_tree_program_even_odd);
  
  const res = verifyFunctionExecution(ex, verifyingKey, program, "main");
  console.log("res in verifyExecution", res);
  return res;
}

const workerMethods = { localProgramExecution, verifyExecution};
expose(workerMethods);
