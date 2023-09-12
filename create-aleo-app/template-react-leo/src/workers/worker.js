import {
  Account,
  ProgramManager,
  PrivateKey,
  initializeWasm,
  initThreadPool,
} from "@aleohq/sdk";
import { expose, proxy } from "comlink";

await initializeWasm();
await initThreadPool(10);

async function localProgramExecution(
  program,
  aleoFunction,
  inputs
) {
  const programManager = new ProgramManager();

  // Create a temporary account for the execution of the program
  const account = new Account();
  programManager.setAccount(account);

  const executionResponse = await programManager.executeOffline(
    program,
    aleoFunction,
    inputs,
    false,
  );
  return executionResponse.getOutputs();
}

async function getPrivateKey() {
  const key = new PrivateKey();
  return proxy(key);
}

const workerMethods = { localProgramExecution, getPrivateKey };
expose(workerMethods);
