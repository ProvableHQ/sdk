import {initThreadPool, ProgramManager, PrivateKey, verifyFunctionExecution, FunctionKeyPair} from "./index";
import { AleoKeyProvider, AleoKeyProviderParams} from "./function-key-provider";
import { expose } from "comlink";

await initThreadPool();

const defaultHost = "https://api.explorer.aleo.org/v1";
const keyProvider = new AleoKeyProvider();
const programManager = new ProgramManager(
    defaultHost,
    keyProvider,
    undefined
);

keyProvider.useCache(true);

let lastLocalProgram: string = "";

export interface WorkerAPI {
    run: (
        localProgram: string,
        aleoFunction: string,
        inputs: string[],
        privateKey: string
    ) => Promise<{ outputs: any; execution: string } | string>;

    getPrivateKey: () => Promise<PrivateKey>;
}
async function run(
    localProgram: string,
    aleoFunction: string,
    inputs: string[],
    privateKey: string,
    proveExecution = false
) {
    console.log("Web worker: Executing function locally...");
    const startTime = performance.now();

    try {
        // Ensure the program is valid and that it contains the function specified
        const program = programManager.createProgramFromSource(localProgram);
        if (program instanceof Error) {
            throw "Error creating program from source";
        }
        const program_id = program.id();
        if (!program.hasFunction(aleoFunction)) {
            throw `Program ${program_id} does not contain function ${aleoFunction}`;
        }
        const cacheKey = `${program_id}:${aleoFunction}`;

        // Get the program imports
        const imports = await programManager.networkClient.getProgramImports(
            localProgram
        );

        if (imports instanceof Error) {
            throw "Error getting program imports";
        }
        // Get the proving and verifying keys for the function
        if (lastLocalProgram !== localProgram) {
            const keys = <FunctionKeyPair>await programManager.synthesizeKeys(
                localProgram,
                aleoFunction,
                inputs,
                PrivateKey.from_string(privateKey)
            );
            programManager.keyProvider.cacheKeys(cacheKey, keys);
            lastLocalProgram = localProgram;
        }

        // Pass the cache key to the execute function
        const keyParams = new AleoKeyProviderParams({
            cacheKey: cacheKey,
        });

        // Execute the function locally
        const response = await programManager.run(
            localProgram,
            aleoFunction,
            inputs,
            proveExecution,
            imports,
            keyParams,
            undefined,
            undefined,
            PrivateKey.from_string(privateKey),
        );

        // Return the outputs to the main thread
        console.log(
            `Web worker: Local execution completed in ${
                performance.now() - startTime
            } ms`
        );
        const outputs = response.getOutputs();
        const execution = response.getExecution();
        let executionString = "";

        const keys = keyProvider.getKeys(cacheKey);

        if (keys instanceof Error) {
            throw "Could not get verifying key";
        }

        const verifyingKey = keys[1];

        if (execution) {
            verifyFunctionExecution(
                execution,
                verifyingKey,
                program,
                "hello"
            );
            executionString = execution.toString();
            console.log("Execution verified successfully: " + execution);
        } else {
            executionString = "";
        }

        console.log(`Function execution response: ${outputs}`);

        return { outputs: outputs, execution: executionString };
    } catch (error) {
        console.error(error);
        return error ? error.toString() : "Unknown error";
    }
}

async function getPrivateKey() {
    const privateKey = new PrivateKey();
    return privateKey.to_string();
}

const workerAPI = { run, getPrivateKey };
expose(workerAPI);
