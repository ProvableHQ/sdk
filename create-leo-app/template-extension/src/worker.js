import {Account, initThreadPool, PrivateKey, ProgramManager,} from "@provablehq/sdk";

await initThreadPool();

const hello_hello_program =`
program hello_hello.aleo;

function hello:
    input r0 as u32.public;
    input r1 as u32.private;
    add r0 r1 into r2;
    output r2 as u32.private;`

async function localProgramExecution(program, aleoFunction, inputs) {
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

const start = Date.now();
console.log("Starting execute!");
const result = await localProgramExecution(hello_hello_program, "hello", ["5u32", "5u32"]);
console.log(result);
console.log("Execute finished!", Date.now() - start);
