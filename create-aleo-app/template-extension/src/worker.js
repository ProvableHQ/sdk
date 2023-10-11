import {Account, initThreadPool, PrivateKey, ProgramManager,} from "@aleohq/sdk";

await initThreadPool();

const hello_hello_program =
    "program hello_hello.aleo;\n" +
    "\n" +
    "function hello:\n" +
    "    input r0 as u32.public;\n" +
    "    input r1 as u32.private;\n" +
    "    add r0 r1 into r2;\n" +
    "    output r2 as u32.private;\n";

async function localProgramExecution(program, aleoFunction, inputs) {
    const programManager = new ProgramManager();

    // Create a temporary account for the execution of the program
    const account = new Account();
    programManager.setAccount(account);

    const executionResponse = await programManager.executeOffline(
        hello_hello_program,
        "hello",
        ["5u32", "5u32"],
        false,
    );
    return executionResponse.getOutputs();
}

const start = Date.now();
console.log("Starting execute!");
const result = await localProgramExecution();
console.log(result);
console.log("Execute finished!", Date.now() - start);
