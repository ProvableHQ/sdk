import {
    Account,
    initThreadPool,
    ProgramManager,
    AleoKeyProvider,
    AleoKeyProviderParams
} from "@aleohq/sdk";
import { Program, PrivateKey } from "@aleohq/wasm";
import readline from 'readline';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

await initThreadPool();

const args = yargs(hideBin(process.argv))
    .env("ALEO")
    .option('program', {
        describe: 'Aleo program source code',
        type: 'string',
    })
    .option('program_path', {
        describe: 'Path to aleo program source code',
        type: 'string',
    })
    .option('function', {
        alias: 'f',
        describe: 'Function name',
        type: 'number'
    })
    .option('private_key', {
        alias: 'k',
        describe: 'Private key',
        type: 'string'
    })
    .option('fee', {
        alias: 'f',
        describe: 'Fee to pay',
        type: 'number'
    })
    .option('endpoint', {
        alias: 'e',
        describe: 'Endpoint to touch',
        type: 'string'
    })
    .option('input_file', {
        describe: 'Link to input file',
        type: 'string'
    })
    .option("inputs", {
        describe: "Array of inputs",
        type: 'array',
    })
    .option("num_executions", {
        describe: "Number of executions",
        type: 'number',
    })
    .demandOption(['program', 'function', 'private_key', 'fee', 'endpoint', 'inputs'])
    .parse();

class SingleFunctionExecutionRequest {
    constructor(args) {
        this.args = args;
        this.executions = this.args.numExecutions || 1;

        if (this.args.inputFile) {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const lines = [];

            console.log('Enter multiple lines of text (press Ctrl+D or Ctrl+Z then Enter when done):');

            rl.on('line', (line) => {
                lines.push(JSON.parse(line));
            });

            rl.on('close', () => {
                console.log('Received lines:');
                console.log(lines);
                process.exit(0);
            });
            this.inputLines = lines;
            this.executions = lines.length;
        }
    }

    endpoint() {
        return this.args.endpoint;
    }

    fee() {
        return this.args.fee;
    }

    program() {
        return this.args.program;
    }

    programId() {
        return Program.fromString(this.program()).toString();
    }

    privateKey() {
        return PrivateKey.from_string(this.args.privateKey);
    }

    functionID() {
        return this.args.function.toString();
    }

    numExecutions() {
        return this.executions;
    }

    getInput(index) {
        return this.inputLines ? this.inputLines[index] : this.args.inputs;
    }
}

const request = new SingleFunctionExecutionRequest(args);

const programManager = new ProgramManager(request.endpoint(), undefined, undefined);

const cacheKeyId = request.programId() + "/" + request.functionID();

const account = new Account();
programManager.setAccount(account);

const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);
programManager.setKeyProvider(keyProvider);

const keyPair = await programManager.synthesizeKeys(request.program(), request.functionID(), request.getInput(0), request.privateKey());
if (keyPair instanceof Error) {
    throw new Error(`Failed to synthesize keys: ${keyPair.message}`);
} else {
    programManager.keyProvider.cacheKeys(cacheKeyId, keyPair);
}
const keyProviderParams = new AleoKeyProviderParams({ cacheKey: cacheKeyId });

console.log("Starting execute!");
for (let i = 0; i < request.numExecutions(); i++) {
    const executionResponse = await programManager.execute(
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
