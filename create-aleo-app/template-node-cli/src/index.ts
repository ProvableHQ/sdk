import {
    Account,
    initThreadPool,
    ProgramManager,
    AleoKeyProvider,
    AleoKeyProviderParams,
    FunctionKeyProvider,
    FunctionKeyPair
} from "@aleohq/sdk";
import {Program} from "@aleohq/wasm";
import {PrivateKey, ProvingKey} from "@aleohq/wasm/dist";
import prompts from "prompts";
import number = prompts.prompts.number;

await initThreadPool();

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

interface ExecutionRequest {
    program: string;
    programPath?: string;
    function: number;
    privateKey: string;
    fee: number;
    inputs?: string[]; // Assuming inputs are an array of strings
    endpoint: string; // Assuming endpoint is a string
    inputFile?: string; // Assuming input_file is a string
    numExecutions?: number;
}

const args = yargs(hideBin(process.argv))
    .env("ALEO")
    .option('program', {
        describe: 'Aleo program source code',
        type: 'string',
    }).option('program_path', {
        describe: 'Path to aleo program source code',
        type: 'string',
    }).option('function', {
        alias: 'f',
        describe: 'Function name',
        type: 'number'})
    .option('private_key', {
        alias: 'k',
        describe: 'Private key',
        type: 'string'
    }).option('fee', {
        alias: 'f',
        describe: 'Fee to pay',
        type: 'number'
    }).option('endpoint', {
        alias: 'e',
        describe: 'Endpoint to touch',
        type: 'string'
    }).option('input_file', {
        describe: 'Link to input file',
        type: 'string'
    }).option("inputs", {
        describe: "Array of inputs",
        type: 'string[]',
    }).option("num_executions", {
        describe: "Number of executions",
        type: 'number',
    }).demandOption(['program', 'function', 'private_key','fee','endpoint', 'inputs']).argv;

class SingleFunctionExecutionRequest {
    args: ExecutionRequest
    inputLines: Array<string[]> | undefined
    executions: number
    constructor(args) {
        this.args = args;
        if (typeof this.args.numExecutions == "number") {
            this.executions = this.args.numExecutions;
        } else {
            this.executions = 1;
        }

        if (typeof this.args.inputFile == "string") {
            const readline = require('readline');

            // Create an interface for input and output
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const lines = [];

            console.log('Enter multiple lines of text (press Ctrl+D or Ctrl+Z then Enter when done):');

            // Event listener for the 'line' event, which is emitted whenever the input stream receives an end-of-line input (\n, \r, or \r\n)
            rl.on('line', (line) => {
                lines.push(JSON.parse(line));
            });

            // Event listener for the 'close' event, which is emitted when the input stream is ended
            rl.on('close', () => {
                console.log('Received lines:');
                console.log(lines);
                process.exit(0);
            });
            this.inputLines = lines;
            this.executions = lines.length;
        }
    }

    /**
     * Get the configured endpoint
     */
    endpoint(): string {
        return this.args.endpoint;
    }

    /**
     * Get the specified fee
     */
    fee(): number {
        return this.args.fee;
    }

    /**
     * Get the specified program
     */
    program(): string {
        return this.args.program
    }

    /**
     * programID
     */
    programId(): string {
        return Program.fromString(this.program());
    }

    /**
     * Get the private key
     */
    privateKey(): PrivateKey {
        return <PrivateKey>PrivateKey.from_string(this.args.privateKey);
    }

    /**
     * Get the configured function
     */
    functionID(): string {
        return this.functionID();
    }

    /**
     * Number of executions
     */
    numExecutions(): number {
        return this.executions
    }

    getInput(index: number) {
        return this.inputLines[index];
    }
}


const request = new SingleFunctionExecutionRequest(args);

const programManager = new ProgramManager(request.endpoint(), undefined, undefined);

const cacheKeyId = request.programId() + "/" + request.functionID();

// Create a temporary account for the execution of the program
const account = new Account();
programManager.setAccount(account);


// Create a key provider in order to re-use the same key for each execution
const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);
programManager.setKeyProvider(keyProvider);

// Pre-synthesize the program keys and then cache them in memory using key provider
const keyPair = await programManager.synthesizeKeys(request.program(), request.functionID(), request.getInput(0), request.privateKey());
// Pre-synthesize the program keys and then cache them in memory using key provider
if (keyPair instanceof Error) {
    throw new Error(`Failed to synthesize keys: ${keyPair.message}`);
} else {
    programManager.keyProvider.cacheKeys(cacheKeyId, keyPair);
}

// Specify parameters for the key provider to use search for program keys. In particular specify the cache key
// that was used to cache the keys in the previous step.
const keyProviderParams = new AleoKeyProviderParams({cacheKey: cacheKeyId});

// Execute once using the key provider params defined above. This will use the cached proving keys and make
// execution significantly faster.

console.log("Starting execute!");
for (let i = 0; i=request.numExecutions(); i++) {
    let executionResponse = await programManager.execute(
        request.program(),
        request.functionID(),
        request.fee(),
        false,
        request.getInput(i),
        undefined,
        keyProviderParams
    );
}

const start = Date.now();
console.log("Execute finished!", Date.now() - start);
