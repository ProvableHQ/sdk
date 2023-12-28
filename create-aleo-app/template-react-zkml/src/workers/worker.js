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
import { Execution, VerifyingKey } from "@aleohq/wasm";


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

async function localProgramExecution(program_source, aleoFunction, inputs, proving_key_link, verifying_key_link) {
  const program = Program.fromString(program_source);

  console.log("proving_key_link", proving_key_link);
  console.log("verifying_key_link", verifying_key_link);

  const keySearchParams = new AleoKeyProviderParams({proverUri: proving_key_link, 
  verifierUri: verifying_key_link,
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

  console.log("Getting outputs");
  const outputs = executionResponse.getOutputs();
  const execution = executionResponse.getExecution().toString()

  var verifyingKeyString = executionResponse.getVerifyingKey().toString();
  console.log("verifyingKeyString", verifyingKeyString);

  return [outputs, execution];
}

async function verifyExecution(execution, program_string, verifying_key_string) {
  console.log("in verifyExecution");
  const ex = FunctionExecution.fromString(execution);
  console.log("ex", ex);

  const verifyingKey = VerifyingKey.fromString(verifying_key_string)
  console.log("verifyingKey", verifying_key_string);

  const program = Program.fromString(program_string);
  
  const res = verifyFunctionExecution(ex, verifyingKey, program, "main");
  console.log("res in verifyExecution", res);
  return res;
}

const workerMethods = { localProgramExecution, verifyExecution};
expose(workerMethods);
