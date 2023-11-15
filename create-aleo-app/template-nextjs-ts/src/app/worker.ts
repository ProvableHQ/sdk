import {
  Account,
  initThreadPool,
  PrivateKey,
  ProgramManager,
} from "@aleohq/sdk";

await initThreadPool();

const hello_hello_program =
    "program hello_hello.aleo;\n" +
    "\n" +
    "function hello:\n" +
    "    input r0 as u32.public;\n" +
    "    input r1 as u32.private;\n" +
    "    add r0 r1 into r2;\n" +
    "    output r2 as u32.private;\n";

async function localProgramExecution() {
  const programManager = new ProgramManager(undefined, undefined, undefined);

  // Create a temporary account for the execution of the program
  const account = new Account();
  programManager.setAccount(account);

  const executionResponse = await programManager.run(
      hello_hello_program,
      "hello",
      ["5u32", "5u32"],
      false,
  );
  return executionResponse.getOutputs();
}

function getPrivateKey() {
  return new PrivateKey().to_string();
}

onmessage = async function (e) {
  if (e.data === "execute") {
    const result = await localProgramExecution();
    postMessage({type: "execute", result: result});
  } else if (e.data === "key") {
    const result = getPrivateKey();
    postMessage({type: "key", result: result});
  }
};
