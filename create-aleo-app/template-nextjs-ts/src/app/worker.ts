import {
  Account,
  initThreadPool,
  PrivateKey,
  ProgramManager,
} from "@provablehq/sdk";

await initThreadPool();

const hello_hello_program =`
program hello_hello.aleo;

function hello:
    input r0 as u32.public;
    input r1 as u32.private;
    add r0 r1 into r2;
    output r2 as u32.private;`

async function localProgramExecution(program: string, aleoFunction: string, inputs: string[]) {
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

onmessage = async function (e) {
  if (e.data === "execute") {
    const result = await localProgramExecution(hello_hello_program, "hello", ["5u32", "5u32"]);
    postMessage({type: "execute", result: result});
  } else if (e.data === "key") {
    const result = getPrivateKey();
    postMessage({type: "key", result: result});
  }
};
