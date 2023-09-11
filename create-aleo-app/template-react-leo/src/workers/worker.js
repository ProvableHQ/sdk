import {
  Account,
  Program,
  ProgramManager,
  PrivateKey,
  initializeWasm,
  initThreadPool,
} from "@aleohq/sdk";
import { expose, proxy } from "comlink";

await initializeWasm();
await initThreadPool(10);

// const defaultHost = "https://vm.aleo.org/api";
// const keyProvider = new aleo.AleoKeyProvider();
// const programManager = new aleo.ProgramManager(
//   defaultHost,
//   keyProvider,
//   undefined,
// );
//
// keyProvider.useCache(true);

async function localProgramExecution(program) {
  const programManager = new ProgramManager();

  const account = new Account();
  programManager.setAccount(account);

  const executionResponse = await programManager.executeOffline(
    program,
    "main",
    ["5u32", "5u32"],
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
