import {
  Account,
  ProgramManager,
  PrivateKey,
  initThreadPool,
  AleoKeyProvider,
  AleoNetworkClient,
  NetworkRecordProvider,
} from "@aleohq/sdk";
import { expose } from 'comlink';

await initThreadPool();

async function localProgramExecution(program:string, aleoFunction:string, inputs:any) {
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
  const key = new PrivateKey();
  return key.to_string();
}

async function deployProgram(program : string) {
  const keyProvider = new AleoKeyProvider();
  keyProvider.useCache(true);

  const networkClient = new AleoNetworkClient("https://api.explorer.aleo.org/v1");

  const account = new Account({
    privateKey: "APrivateKey1zkpBvXdKZKaXXcLUnwAVFCQNp41jrX6JqTuJo1JShfPoRfx",
  });

  const recordProvider = new NetworkRecordProvider(account, networkClient);

  const programManager = new ProgramManager(
    "https://api.explorer.aleo.org/v1",
    keyProvider,
    recordProvider,
  );

  programManager.setAccount(account);
  const fee = 1.9; // 1.9 Aleo credits

  const tx_id = await programManager.deploy(program, fee, false);
  return tx_id;
}

const api = {
  localProgramExecution,
  getPrivateKey,
  deployProgram
};

expose(api);
