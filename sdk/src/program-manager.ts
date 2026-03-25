import { Account } from "./account.js";
import { AleoNetworkClient, AleoNetworkClientOptions, ProgramImports } from "./network-client.js";
import { ImportedPrograms, ImportedVerifyingKeys } from "./models/imports.js";
import { RecordProvider } from "./record-provider.js";
import { RecordSearchParams } from "./models/record-provider/recordSearchParams.js";

import {
    FunctionKeyProvider,
    KeySearchParams,
} from "./keys/provider/interface.js";
import {
    AleoKeyProvider,
    AleoKeyProviderParams,
} from "./keys/provider/memory.js";

import {
    FunctionKeyPair
} from "./models/keyPair.js";

import {
    Address,
    Authorization,
    ExecutionRequest,
    ExecutionResponse,
    Execution as FunctionExecution,
    Field,
    OfflineQuery,
    RecordPlaintext,
    PrivateKey,
    Program,
    ProvingKey,
    ProvingRequest,
    VerifyingKey,
    Transaction,
    ProgramManager as WasmProgramManager,
    verifyFunctionExecution,
} from "./wasm.js";

import {
    CREDITS_PROGRAM_KEYS,
    PRIVATE_TRANSFER_TYPES,
    VALID_TRANSFER_TYPES,
} from "./constants.js";

import { logAndThrow } from "./utils.js";
import { ExternalSigningOptions } from "./models/external-signing.js";

/**
 * Represents the options for deploying and upgrading a transaction in the Aleo network.
 * This interface is used to specify the parameters required for building and submitting an deployment transaction.
 *
 * @property {string} program - The program source code to be deployed.
 * @property {number} priorityFee - The priority fee to be paid for the transaction.
 * @property {boolean} privateFee - If true, uses a private record to pay the fee; otherwise, uses the account's public credit balance.
 * @property {RecordSearchParams} [recordSearchParams] - Parameters for searching for a record to pay the execution transaction fee.
 * @property {string | RecordPlaintext} [feeRecord] - Fee record to use for the transaction.
 * @property {PrivateKey} [privateKey] - Private key to use for the transaction.
 */
interface DeployOptions {
    program: string;
    priorityFee: number;
    privateFee: boolean;
    recordSearchParams?: RecordSearchParams;
    feeRecord?: string | RecordPlaintext;
    privateKey?: PrivateKey;
}

/**
 * Represents the options for executing a transaction in the Aleo network.
 * This interface is used to specify the parameters required for building and submitting an execution transaction.
 *
 * @property {string} programName - The name of the program containing the function to be executed.
 * @property {string} functionName - The name of the function to execute within the program.
 * @property {number} priorityFee - The priority fee to be paid for the transaction.
 * @property {boolean} privateFee - If true, uses a private record to pay the fee; otherwise, uses the account's public credit balance.
 * @property {string[]} inputs - The inputs to the function being executed.
 * @property {RecordSearchParams} [recordSearchParams] - Parameters for searching for a record to pay the execution transaction fee.
 * @property {KeySearchParams} [keySearchParams] - Parameters for finding the matching proving & verifying keys for the function.
 * @property {string | RecordPlaintext} [feeRecord] - Fee record to use for the transaction.
 * @property {ProvingKey} [provingKey] - Proving key to use for the transaction.
 * @property {VerifyingKey} [verifyingKey] - Verifying key to use for the transaction.
 * @property {PrivateKey} [privateKey] - Private key to use for the transaction.
 * @property {OfflineQuery} [offlineQuery] - Offline query if creating transactions in an offline environment.
 * @property {string | Program} [program] - Program source code to use for the transaction.
 * @property {ProgramImports} [imports] - Programs that the program being executed imports.
 * @property {number} [edition] - Edition of the program to execute the function in.
 */
interface ExecuteOptions {
    programName: string;
    functionName: string;
    priorityFee: number;
    privateFee: boolean;
    inputs: string[];
    recordSearchParams?: RecordSearchParams;
    keySearchParams?: KeySearchParams;
    feeRecord?: string | RecordPlaintext;
    provingKey?: ProvingKey;
    verifyingKey?: VerifyingKey;
    privateKey?: PrivateKey;
    offlineQuery?: OfflineQuery;
    program?: string | Program;
    imports?: ProgramImports;
    edition?: number,
}

/**
 * Options for building an Authorization for a function.
 *
 * @property {string} programName Name of the program containing the function to build the authorization for.
 * @property {string} functionName Name of the function name to build the authorization for.
 * @property {string[]} inputs The inputs to the function.
 * @property {string | Program} [programSource] The optional source code for the program to build an execution for.
 * @property {PrivateKey} [privateKey] Optional private key to use to build the authorization.
 * @property {ProgramImports} [programImports] The other programs the program imports.
 * @property {edition} [edition]
 */
interface AuthorizationOptions {
    programName: string;
    functionName: string;
    inputs: string[];
    programSource?: string | Program;
    privateKey?: PrivateKey;
    programImports?: ProgramImports;
    edition?: number,
}

/**
 * Options for executing a fee authorization.
 *
 * @property {string} deploymentOrExecutionId The id of a previously built Execution or Authorization.
 * @property {number} baseFeeCredits The number of Aleo Credits to pay for the base fee.
 * @property {number} [priorityFeeCredits] The number of Aleo Credits to pay for the priority fee.
 * @property {PrivateKey} [privateKey]  Optional private key to specify for the authorization.
 * @property {RecordPlaintext} [feeRecord]  A record to specify to pay the private fee. If this is specified a `fee_private` authorization will be built.
 */
interface FeeAuthorizationOptions {
    deploymentOrExecutionId: string,
    baseFeeCredits: number,
    priorityFeeCredits?: number,
    privateKey?: PrivateKey,
    feeRecord?: RecordPlaintext,
}

/**
 * Represents the options for executing a transaction on the Aleo Network from an authorization.
 *
 * @property {string} programName - The name of the program containing the function to be executed.
 * @property {KeySearchParams} [keySearchParams] - Optional parameters for finding the matching proving & verifying keys for the function.
 * @property {ProvingKey} [provingKey] - Optional proving key to use for the transaction.
 * @property {VerifyingKey} [verifyingKey] - Optional verifying key to use for the transaction.
 * @property {OfflineQuery} [offlineQuery] - Optional offline query if creating transactions in an offline environment.
 * @property {string | Program} [program] - Optional program source code to use for the transaction.
 * @property {ProgramImports} [imports] - Optional programs that the program being executed imports.
 */
interface ExecuteAuthorizationOptions {
    programName: string;
    authorization: Authorization,
    feeAuthorization?: Authorization,
    keySearchParams?: KeySearchParams;
    provingKey?: ProvingKey;
    verifyingKey?: VerifyingKey;
    offlineQuery?: OfflineQuery;
    program?: string | Program;
    imports?: ProgramImports;
}

/**
 * Represents the options for executing a transaction in the Aleo network.
 * This interface is used to specify the parameters required for building and submitting an execution transaction.
 *
 * @property {string} programName - The name of the program containing the function to be executed.
 * @property {string} functionName - The name of the function to execute within the program.
 * @property {number} [baseFee] - The base fee to be paid for the transaction.
 * @deprecated Base fee is now estimated automatically; this option is ignored and will be removed in a future version.
 * @property {number} priorityFee - The optional priority fee to be paid for the transaction.
 * @property {boolean} privateFee - If true, uses a private record to pay the fee; otherwise, uses the account's public credit balance.
 * @property {string[]} inputs - The inputs to the function being executed.
 * @property {RecordSearchParams} [recordSearchParams] - Optional parameters for searching for a record to pay the execution transaction fee.
 * @property {string | RecordPlaintext} [feeRecord] - Optional fee record to use for the transaction.
 * @property {PrivateKey} [privateKey] - Optional private key to use for the transaction.
 * @property {string | Program} [program] - Optional program source code to use for the transaction.
 * @property {string} uri - The URI send the ProvingRequest to.
 * @property {ProgramImports} [imports] - Optional programs that the program being executed imports.
 * @property {boolean} broadcast - Whether to broadcast the Transaction generated by the remove prover to the Aleo network.
 * @property {boolean} unchecked - Whether to execute the transaction without checking the validity of the authorization (faster but may fail).
 * @property {number} [edition] - Edition of the program to execute the function in.
 * @property {boolean} [useFeeMaster] - Whether to use the FeeMaster account to execute the transaction.
 */
interface ProvingRequestOptions {
    programName: string;
    functionName: string;
    priorityFee: number;
    privateFee: boolean;
    inputs?: string[];
    baseFee?: number;
    recordSearchParams?: RecordSearchParams;
    feeRecord?: string | RecordPlaintext;
    privateKey?: PrivateKey;
    programSource?: string | Program;
    programImports?: ProgramImports;
    broadcast?: boolean;
    unchecked?: boolean;
    edition?: number;
    useFeeMaster?: boolean;
    executionRequest?: ExecutionRequest,
}

/**
 * Fee estimate options.
 *
 * @property {string} programName - The name of the program containing the function to estimate the fee for.
 * @property {string} functionName - The name of the function to execute within the program to estimate the fee for.
 * @property {string} [program] - Program source code to use for the fee estimate.
 * @property {ProgramImports} [imports] - Programs that the program imports.
 * @property {number} [edition] - Edition of the program to estimate the fee for.
 * @property {Authorization} authorization - An authorization to estimate the fee for.
 */
interface FeeEstimateOptions {
    programName: string;
    functionName?: string;
    program?: string | Program;
    imports?: ProgramImports;
    edition?: number,
    authorization?: Authorization;
}

/**
 * The ProgramManager class is used to execute and deploy programs on the Aleo network and create value transfers.
 */
class ProgramManager {
    account: Account | undefined;
    keyProvider: FunctionKeyProvider;
    host: string;
    networkClient: AleoNetworkClient;
    recordProvider: RecordProvider | undefined;
    inclusionKeysLoaded: boolean = false;

    /** Create a new instance of the ProgramManager
     *
     * @param { string | undefined } host A host uri running the official Aleo API
     * @param { FunctionKeyProvider | undefined } keyProvider A key provider that implements {@link FunctionKeyProvider} interface
     * @param { RecordProvider | undefined } recordProvider A record provider that implements {@link RecordProvider} interface
     */
    constructor(
        host?: string | undefined,
        keyProvider?: FunctionKeyProvider | undefined,
        recordProvider?: RecordProvider | undefined,
        networkClientOptions?: AleoNetworkClientOptions | undefined,
    ) {
        this.host = host ? host : "https://api.provable.com/v2";
        this.networkClient = new AleoNetworkClient(this.host, networkClientOptions);

        this.keyProvider = keyProvider ? keyProvider : new AleoKeyProvider();
        this.recordProvider = recordProvider;
    }

    /**
     * Check if the fee is sufficient to pay for the transaction
     */
    async checkFee(address: string, feeAmount: bigint) {
        const balance =
            BigInt(await this.networkClient.getPublicBalance(address));
        if (feeAmount > balance) {
            throw Error(
                `The desired execution requires a fee of ${feeAmount} microcredits, but the account paying the fee has ${balance} microcredits available.`,
            );
        }
    }

    /**
     * Set the account to use for transaction submission to the Aleo network
     *
     * @param {Account} account Account to use for transaction submission
     */
    setAccount(account: Account) {
        this.account = account;
    }

    /**
     * Set the key provider that provides the proving and verifying keys for programs
     *
     * @param {FunctionKeyProvider} keyProvider
     */
    setKeyProvider(keyProvider: FunctionKeyProvider) {
        this.keyProvider = keyProvider;
    }

    /**
     * Set the host peer to use for transaction submission to the Aleo network
     *
     * @param host {string} Peer url to use for transaction submission
     */
    setHost(host: string) {
        this.host = host;
        this.networkClient.setHost(host);
    }

    /**
     * Set the record provider that provides records for transactions
     *
     * @param {RecordProvider} recordProvider
     */
    setRecordProvider(recordProvider: RecordProvider) {
        this.recordProvider = recordProvider;
    }

    /**
     * Set a header in the `AleoNetworkClient`s header map
     *
     * @param {string} headerName The name of the header to set
     * @param {string} value The header value
     *
     * @example
     * import { ProgramManager } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a ProgramManager
     * const programManager = new ProgramManager("https://api.provable.com/v2");
     *
     * // Set the value of the `Accept-Language` header to `en-US`
     * programManager.setHeader('Accept-Language', 'en-US');
     */
    setHeader(headerName: string, value: string) {
        this.networkClient.headers[headerName] = value;
    }

    /**
     * Set the inclusion prover into the wasm memory. This should be done prior to any execution of a function with a
     * private record.
     *
     * @param {ProvingKey} [provingKey]
     *
     * @example
     * import { ProgramManager, AleoKeyProvider } from "@provablehq/sdk/mainnet.js";
     *
     * const keyProvider = new AleoKeyProvider();
     * keyProvider.useCache(true);
     *
     * // Create a ProgramManager
     * const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider);
     *
     * // Set the inclusion keys.
     * programManager.setInclusionProver();
     */
    async setInclusionProver(provingKey?: ProvingKey) {
        if (this.inclusionKeysLoaded) {
            return
        }
        try {
            if (provingKey) {
                WasmProgramManager.loadInclusionProver(provingKey)
                this.inclusionKeysLoaded = true;
            } else {
                const inclusionKeys = await this.keyProvider.inclusionKeys();
                WasmProgramManager.loadInclusionProver(inclusionKeys[0])
                this.inclusionKeysLoaded = true;
            }
            return;
        } catch {
            console.log("Setting the inclusion prover requires either a key provider to be configured for the ProgramManager OR to pass the inclusion prover directly");
        }
    }

    /**
     * Remove a header from the `AleoNetworkClient`s header map
     *
     * @param {string} headerName The name of the header to be removed
     *
     * @example
     * import { ProgramManager } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a ProgramManager
     * const programManager = new ProgramManager("https://api.provable.com/v2");
     *
     * // Remove the default `X-Aleo-SDK-Version` header
     * programManager.removeHeader('X-Aleo-SDK-Version');
     */
    removeHeader(headerName: string) {
        delete this.networkClient.headers[headerName]
    }

    /**
     * Builds a deployment transaction for submission to the Aleo network.
     *
     * @param {string} program Program source code
     * @param {number} priorityFee The optional priority fee to be paid for that transaction.
     * @param {boolean} privateFee Use a private record to pay the fee. If false this will use the account's public credit balance
     * @param {RecordSearchParams | undefined} recordSearchParams Optional parameters for searching for a record to use pay the deployment fee
     * @param {string | RecordPlaintext | undefined} feeRecord Optional Fee record to use for the transaction
     * @param {PrivateKey | undefined} privateKey Optional private key to use for the transaction
     * @returns {string} The transaction id of the deployed program or a failure message from the network
     *
     * @example
     * /// Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a new NetworkClient, KeyProvider, and RecordProvider
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     * keyProvider.useCache(true);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for deployments
     * const program = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
     * const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
     * programManager.setAccount(Account);
     *
     * // Define a fee in credits
     * const priorityFee = 0.0;
     *
     * // Create the deployment transaction.
     * const tx = await programManager.buildDeploymentTransaction(program, fee, false);
     * await programManager.networkClient.submitTransaction(tx);
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx.id());
     *  assert(transaction.id() === tx.id());
     * }, 20000);
     */
    async buildDeploymentTransaction(
        program: string,
        priorityFee: number,
        privateFee: boolean,
        recordSearchParams?: RecordSearchParams,
        feeRecord?: string | RecordPlaintext,
        privateKey?: PrivateKey,
    ): Promise<Transaction> {
        // Ensure the program is valid.
        let programObject;
        try {
            programObject = Program.fromString(program);
        } catch (e: any) {
            logAndThrow(
                `Error parsing program: '${e.message}'. Please ensure the program is valid.`,
            );
        }

        // Ensure the program is valid and does not exist on the network
        try {
            let programSource;
            try {
                programSource = await this.networkClient.getProgram(
                    programObject.id(),
                );
            } catch (e) {
                // Program does not exist on the network, deployment can proceed
                console.log(
                    `Program ${programObject.id()} does not exist on the network, deploying...`,
                );
            }
            if (typeof programSource === "string") {
                throw Error(`Program ${programObject.id()} already exists on the network, please rename your program`);
            }
        } catch (e: any) {
            logAndThrow(`Error validating program: ${e.message}`);
        }

        // Get the private key from the account if it is not provided in the parameters
        let deploymentPrivateKey = privateKey;
        if (
            typeof privateKey === "undefined" &&
            typeof this.account !== "undefined"
        ) {
            deploymentPrivateKey = this.account.privateKey();
        }

        if (typeof deploymentPrivateKey === "undefined") {
            throw "No private key provided and no private key set in the ProgramManager";
        }

        // Get the fee record from the account if it is not provided in the parameters
        try {
            if (privateFee) {
                let fee = priorityFee;
                // If a private fee is specified, but no fee record is provided, estimate the fee and find a matching record.
                if (!feeRecord) {
                    console.log("Private fee specified, but no private fee record provided, estimating fee and finding a matching fee record.")
                    const programString = programObject.toString();
                    const imports = await this.networkClient.getProgramImports(programString);
                    const baseFee = Number(WasmProgramManager.estimateDeploymentFee(programString, imports));
                    fee = baseFee + priorityFee;
                }

                // Get a credits.aleo record for the fee.
                feeRecord = await this.getCreditsRecord(
                    fee,
                    [],
                    feeRecord,
                    recordSearchParams
                )
            } else {
                // If it's specified NOT to use a privateFee, use a public fee.
                feeRecord = undefined
            }
        } catch (e: any) {
            logAndThrow(
                `Error finding fee record. Record finder response: '${e.message}'. Please ensure you're connected to a valid Aleo network and a record with enough balance exists.`,
            );
        }

        // Get the proving and verifying keys from the key provider
        let feeKeys;
        try {
            feeKeys = privateFee
                ? <FunctionKeyPair>await this.keyProvider.feePrivateKeys()
                : <FunctionKeyPair>await this.keyProvider.feePublicKeys();
        } catch (e: any) {
            logAndThrow(
                `Error finding fee keys. Key finder response: '${e.message}'. Please ensure your key provider is configured correctly.`,
            );
        }
        const [feeProvingKey, feeVerifyingKey] = feeKeys;

        // Resolve the program imports if they exist
        let imports;
        try {
            imports = await this.networkClient.getProgramImports(program);
        } catch (e: any) {
            logAndThrow(
                `Error finding program imports. Network response: '${e.message}'. Please ensure you're connected to a valid Aleo network and the program is deployed to the network.`,
            );
        }

        // Build a deployment transaction
        return await WasmProgramManager.buildDeploymentTransaction(
            deploymentPrivateKey,
            program,
            priorityFee,
            feeRecord,
            this.host,
            imports,
            feeProvingKey,
            feeVerifyingKey,
        );
    }

    /**
     * Builds a deployment transaction for submission to the Aleo network that upgrades an existing program.
     *
     * @param {DeployOptions} options The deployment options.
     *
     * @example
     * /// Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a new NetworkClient, KeyProvider, and RecordProvider
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     * keyProvider.useCache(true);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for deployments
     * const program = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
     * const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
     * programManager.setAccount(Account);
     *
     * // Define a fee in credits
     * const priorityFee = 0.0;
     *
     * // Create the deployment transaction.
     * const tx = await programManager.buildUpgradeTransaction({program: program, priorityFee: fee, privateFee: false});
     * await programManager.networkClient.submitTransaction(tx);
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx.id());
     *  assert(transaction.id() === tx.id());
     * }, 20000);
     */
    async buildUpgradeTransaction(
        options: DeployOptions
    ): Promise<Transaction> {
        const { program, priorityFee, privateFee, recordSearchParams } = options;
        let feeRecord = options.feeRecord;
        let privateKey = options.privateKey;

        // Ensure the program is valid.
        let programObject;
        try {
            programObject = Program.fromString(program);
        } catch (e: any) {
            logAndThrow(
                `Error parsing program: '${e.message}'. Please ensure the program is valid.`,
            );
        }

        // Ensure the program is valid and does not exist on the network
        try {
            let programSource;
            try {
                programSource = await this.networkClient.getProgram(
                    programObject.id(),
                );
            } catch (e) {
                // Program does not exist on the network, deployment can proceed
                console.log(
                    `Program ${programObject.id()} does not exist on the network...`,
                );
            }
        } catch (e: any) {
            logAndThrow(`Error validating program: ${e.message}`);
        }

        // Get the private key from the account if it is not provided in the parameters
        let deploymentPrivateKey = privateKey;
        if (
            typeof privateKey === "undefined" &&
            typeof this.account !== "undefined"
        ) {
            deploymentPrivateKey = this.account.privateKey();
        }

        if (typeof deploymentPrivateKey === "undefined") {
            throw "No private key provided and no private key set in the ProgramManager";
        }

        // Get the fee record from the account if it is not provided in the parameters
        try {
            if (privateFee) {
                let fee = priorityFee;
                // If a private fee is specified, but no fee record is provided, estimate the fee and find a matching record.
                if (!feeRecord) {
                    console.log("Private fee specified, but no private fee record provided, estimating fee and finding a matching fee record.")
                    const programString = programObject.toString();
                    const imports = await this.networkClient.getProgramImports(programString);
                    const baseFee = Number(WasmProgramManager.estimateDeploymentFee(programString, imports));
                    fee = baseFee + priorityFee;
                }

                // Get a credits.aleo record for the fee.
                feeRecord = await this.getCreditsRecord(
                    fee,
                    [],
                    feeRecord,
                    recordSearchParams
                )
            } else {
                // If it's specified NOT to use a privateFee, use a public fee.
                feeRecord = undefined
            }
        } catch (e: any) {
            logAndThrow(
                `Error finding fee record. Record finder response: '${e.message}'. Please ensure you're connected to a valid Aleo network and a record with enough balance exists.`,
            );
        }

        // Get the proving and verifying keys from the key provider
        let feeKeys;
        try {
            feeKeys = privateFee
                ? <FunctionKeyPair>await this.keyProvider.feePrivateKeys()
                : <FunctionKeyPair>await this.keyProvider.feePublicKeys();
        } catch (e: any) {
            logAndThrow(
                `Error finding fee keys. Key finder response: '${e.message}'. Please ensure your key provider is configured correctly.`,
            );
        }
        const [feeProvingKey, feeVerifyingKey] = feeKeys;

        // Resolve the program imports if they exist
        let imports;
        try {
            imports = await this.networkClient.getProgramImports(program);
        } catch (e: any) {
            logAndThrow(
                `Error finding program imports. Network response: '${e.message}'. Please ensure you're connected to a valid Aleo network and the program is deployed to the network.`,
            );
        }

        // Build a deployment transaction
        return await WasmProgramManager.buildUpgradeTransaction(
            deploymentPrivateKey,
            program,
            priorityFee,
            feeRecord,
            this.host,
            imports,
            feeProvingKey,
            feeVerifyingKey,
        );
    }

    /**
     * Deploy an Aleo program to the Aleo network
     *
     * @param {string} program Program source code
     * @param {number} priorityFee The optional fee to be paid for the transaction
     * @param {boolean} privateFee Use a private record to pay the fee. If false this will use the account's public credit balance
     * @param {RecordSearchParams | undefined} recordSearchParams Optional parameters for searching for a record to used pay the deployment fee
     * @param {string | RecordPlaintext | undefined} feeRecord Optional Fee record to use for the transaction
     * @param {PrivateKey | undefined} privateKey Optional private key to use for the transaction
     * @returns {string} The transaction id of the deployed program or a failure message from the network
     *
     * @example
     * /// Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a new NetworkClient, KeyProvider, and RecordProvider.
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     * keyProvider.useCache(true);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for deployments
     * const program = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
     * const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
     *
     * // Define a fee in credits
     * const priorityFee = 0.0;
     *
     * // Deploy the program
     * const tx_id = await programManager.deploy(program, fee, false);
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx_id);
     *  assert(transaction.id() === tx_id);
     * }, 20000);
     */
    async deploy(
        program: string,
        priorityFee: number,
        privateFee: boolean,
        recordSearchParams?: RecordSearchParams,
        feeRecord?: string | RecordPlaintext,
        privateKey?: PrivateKey,
    ): Promise<string> {
        const tx = <Transaction>(
            await this.buildDeploymentTransaction(
                program,
                priorityFee,
                privateFee,
                recordSearchParams,
                feeRecord,
                privateKey,
    )
        );

        let feeAddress;

        if (typeof privateKey !== "undefined") {
            feeAddress = Address.from_private_key(privateKey);
        } else if (this.account !== undefined) {
            feeAddress = this.account?.address();
        } else {
            throw Error(
                "No private key provided and no private key set in the ProgramManager. Please set an account or provide a private key.",
            );
        }

        // Check if the account has sufficient credits to pay for the transaction
        if (!privateFee) {
            await this.checkFee(feeAddress.to_string(), tx.feeAmount());
        }

        return await this.networkClient.submitTransaction(tx);
    }

    /**
     * Builds an execution transaction for submission to the Aleo network.
     *
     * @param {ExecuteOptions} options - The options for the execution transaction.
     * @returns {Promise<Transaction>} - A promise that resolves to the transaction or an error.
     *
     * @example
     * /// Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a new NetworkClient, KeyProvider, and RecordProvider.
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     * keyProvider.useCache(true);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for executions
     * const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
     *
     * // Build and execute the transaction
     * const tx = await programManager.buildExecutionTransaction({
     *   programName: "hello_hello.aleo",
     *   functionName: "hello_hello",
     *   priorityFee: 0.0,
     *   privateFee: false,
     *   inputs: ["5u32", "5u32"],
     *   keySearchParams: { "cacheKey": "hello_hello:hello" }
     * });
     *
     * // Submit the transaction to the network
     * await programManager.networkClient.submitTransaction(tx.toString());
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx.id());
     *  assert(transaction.id() === tx.id());
     * }, 10000);
     */
    async buildExecutionTransaction(
        options: ExecuteOptions,
    ): Promise<Transaction> {
        // Destructure the options object to access the parameters
        const {
            functionName,
            priorityFee,
            privateFee,
            inputs,
            recordSearchParams,
            keySearchParams,
            privateKey,
            offlineQuery,
        } = options;

        let feeRecord = options.feeRecord;
        let provingKey = options.provingKey;
        let verifyingKey = options.verifyingKey;
        let program = options.program;
        let programName = options.programName;
        let imports = options.imports;
        let edition = options.edition;

        let programObject;
        // Ensure the function exists on the network
        if (program === undefined) {
            try {
                programObject = await this.networkClient.getProgramObject(programName);
                program = <string>programObject.toString();
            } catch (e: any) {
                logAndThrow(
                    `Error finding ${programName}. Network response: '${e.message}'. Please ensure you're connected to a valid Aleo network the program is deployed to the network.`,
                );
            }
        } else if (typeof program == "string") {
            try {
                programObject = Program.fromString(program);
            } catch (e: any) {
                logAndThrow(`Program sources passed for ${programName} were invalid: ${e}`);
            }
        } else if (program instanceof Program) {
            programObject = program;
            program = program.toString();
        }

        if (!(programObject instanceof Program)) {
            logAndThrow(`Failed to validate program ${programName}`);
        }

        // Get the program name if it is not provided in the parameters.
        if (programName === undefined) {
            programName = programObject.id();
        }

        if (edition == undefined) {
            try {
                edition = await this.networkClient.getLatestProgramEdition(programName);
            } catch (e: any) {
                console.warn(`Error finding edition for ${programName}. Network response: '${e.message}'. Assuming edition 0.`);
                edition = 0;
            }
        }

        // Get the private key from the account if it is not provided in the parameters
        let executionPrivateKey = privateKey;
        if (
            typeof privateKey === "undefined" &&
            typeof this.account !== "undefined"
        ) {
            executionPrivateKey = this.account.privateKey();
        }

        if (typeof executionPrivateKey === "undefined") {
            throw "No private key provided and no private key set in the ProgramManager";
        }

        // Get the fee proving and verifying keys from the key provider
        let feeKeys;
        try {
            feeKeys = privateFee
                ? <FunctionKeyPair>await this.keyProvider.feePrivateKeys()
                : <FunctionKeyPair>await this.keyProvider.feePublicKeys();
        } catch (e: any) {
            logAndThrow(
                `Error finding fee keys. Key finder response: '${e.message}'. Please ensure your key provider is configured correctly.`,
            );
        }
        const [feeProvingKey, feeVerifyingKey] = feeKeys;

        // If the function proving and verifying keys are not provided, attempt to find them using the key provider
        if (!provingKey || !verifyingKey) {
            try {
                [provingKey, verifyingKey] = <FunctionKeyPair>(
                    await this.keyProvider.functionKeys(keySearchParams)
                );
            } catch (e) {
                console.log(
                    `Function keys not found. Key finder response: '${e}'. The function keys will be synthesized`,
                );
            }
        }

        // Resolve the program imports if they exist
        const numberOfImports = programObject.getImports().length;
        if (numberOfImports > 0 && !imports) {
            try {
                imports = <ProgramImports>(
                    await this.networkClient.getProgramImports(programName)
                );
            } catch (e: any) {
                logAndThrow(
                    `Error finding program imports. Network response: '${e.message}'. Please ensure you're connected to a valid Aleo network and the program is deployed to the network.`,
                );
            }
        }

        // Get the fee record from the account if it is not provided in the parameters
        try {
            if (privateFee) {
                let fee = priorityFee;
                // If a fee record wasn't provided, estimate the fee that needs to be paid.
                if (!feeRecord) {
                    const baseFee = Number(await this.estimateExecutionFee({programName, functionName, program, imports}));
                    fee = baseFee + priorityFee;
                }

                // Get a credits.aleo record for the fee.
                feeRecord = await this.getCreditsRecord(
                    fee,
                    [],
                    feeRecord,
                    recordSearchParams
                )
            } else {
                // If it's specified NOT to use a privateFee, use a public fee.
                feeRecord = undefined
            }
        } catch (e: any) {
            logAndThrow(
                `Error finding fee record. Record finder response: '${e.message}'. Please ensure you're connected to a valid Aleo network and a record with enough balance exists.`,
            );
        }

        if (offlineQuery && !this.inclusionKeysLoaded) {
            try {
                const inclusionKeys = await this.keyProvider.inclusionKeys();
                WasmProgramManager.loadInclusionProver(inclusionKeys[0])
                this.inclusionKeysLoaded = true;
                console.log("Successfully loaded inclusion key");
            } catch {
                logAndThrow(`Inclusion key bytes not loaded, please ensure the program manager is initialized with a KeyProvider that includes the inclusion key.`)
            }
        }

        // Build an execution transaction
        return await WasmProgramManager.buildExecutionTransaction(
            executionPrivateKey,
            program,
            functionName,
            inputs,
            priorityFee,
            feeRecord,
            this.host,
            imports,
            provingKey,
            verifyingKey,
            feeProvingKey,
            feeVerifyingKey,
            offlineQuery,
            edition
        );
    }

    /**
     * Builds an execution transaction for submission to the Aleo network from an Authorization and Fee Authorization.
     * This method is helpful if signing and authorization needs to be done in a secure environment separate from where
     * transactions are built.
     *
     * @param {ExecuteAuthorizationOptions} options - The options for executing the authorizations.
     * @returns {Promise<Transaction>} - A promise that resolves to the transaction or an error.
     *
     * @example
     * import { AleoKeyProvider, PrivateKey, initThreadPool, ProgramManager } from "@provablehq/sdk";
     *
     * await initThreadPool();
     *
     * // Create a new KeyProvider.
     * const keyProvider = new AleoKeyProvider();
     * keyProvider.useCache(true);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for executions.
     * const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider);
     *
     * // Build the `Authorization`.
     * const privateKey = new PrivateKey(); // Change this to a private key that has an aleo credit balance.
     * const authorization = await programManager.buildAuthorization({
     *     programName: "credits.aleo",
     *     functionName: "transfer_public",
     *     privateKey,
     *     inputs: [
     *         "aleo1vwls2ete8dk8uu2kmkmzumd7q38fvshrht8hlc0a5362uq8ftgyqnm3w08",
     *         "10000000u64",
     *     ],
     * });
     *
     * console.log("Getting execution id");
     *
     * // Derive the execution ID and base fee.
     * const executionId = authorization.toExecutionId().toString();
     *
     * console.log("Estimating fee");
     *
     * // Get the base fee in microcredits.
     * const baseFeeMicrocredits = await programManager.estimateFeeForAuthorization(authorization, "credits.aleo");
     * const baseFeeCredits = Number(baseFeeMicrocredits)/1000000;
     *
     * console.log("Building fee authorization");
     *
     * // Build a credits.aleo/fee_public `Authorization`.
     * const feeAuthorization = await programManager.buildFeeAuthorization({
     *     deploymentOrExecutionId: executionId,
     *     baseFeeCredits,
     *     privateKey
     * });
     *
     * console.log("Executing authorizations");
     *
     * // Build and execute the transaction.
     * const tx = await programManager.buildTransactionFromAuthorization({
     *     programName: "credits.aleo",
     *     authorization,
     *     feeAuthorization,
     * });
     *
     * // Submit the transaction to the network.
     * await programManager.networkClient.submitTransaction(tx.toString());
     *
     * // Verify the transaction was successful.
     * setTimeout(async () => {
     *     const transaction = await programManager.networkClient.getTransaction(tx.id());
     *     console.log(transaction);
     * }, 10000);
     */
    async buildTransactionFromAuthorization(
        options: ExecuteAuthorizationOptions,
    ): Promise<Transaction> {
        // Destructure the options object to access the parameters.
        const {
            programName,
            authorization,
        } = options;

        const feeAuthorization = options.feeAuthorization;
        const keySearchParams = options.keySearchParams;
        const offlineQuery = options.offlineQuery;
        let provingKey = options.provingKey;
        let verifyingKey = options.verifyingKey;
        let program = options.program;
        let imports = options.imports;

        // Ensure the function exists on the network.
        if (program === undefined) {
            try {
                program = <string>(
                    await this.networkClient.getProgram(programName)
                );
            } catch (e: any) {
                logAndThrow(
                    `Error finding ${programName}. Network response: '${e.message}'. Please ensure you're connected to a valid Aleo network the program is deployed to the network.`,
                );
            }
        } else if (program instanceof Program) {
            program = program.toString();
        }

        // Get the fee proving and verifying keys from the key provider.
        let feeKeys;
        const privateFee = feeAuthorization ? feeAuthorization.isFeePrivate() : false;
        try {
            feeKeys = privateFee
                ? <FunctionKeyPair>await this.keyProvider.feePrivateKeys()
                : <FunctionKeyPair>await this.keyProvider.feePublicKeys();
        } catch (e: any) {
            logAndThrow(
                `Error finding fee keys. Key finder response: '${e.message}'. Please ensure your key provider is configured correctly.`,
            );
        }
        const [feeProvingKey, feeVerifyingKey] = feeKeys;

        // If the function proving and verifying keys are not provided, attempt to find them using the key provider.
        if (!provingKey || !verifyingKey) {
            try {
                [provingKey, verifyingKey] = <FunctionKeyPair>(
                    await this.keyProvider.functionKeys(keySearchParams)
                );
            } catch (e) {
                console.log(
                    `Function keys not found. Key finder response: '${e}'. The function keys will be synthesized`,
                );
            }
        }

        // Resolve the program imports if they exist.
        console.log("Resolving program imports");
        const numberOfImports = Program.fromString(program).getImports().length;
        if (numberOfImports > 0 && !imports) {
            try {
                imports = <ProgramImports>(
                    await this.networkClient.getProgramImports(programName)
                );
            } catch (e: any) {
                logAndThrow(
                    `Error finding program imports. Network response: '${e.message}'. Please ensure you're connected to a valid Aleo network and the program is deployed to the network.`,
                );
            }
        }

        // If the offline query exists, add the inclusion key.
        if (offlineQuery && !this.inclusionKeysLoaded) {
            console.log("Loading inclusion keys for offline proving.");
            try {
                const inclusionKeys = await this.keyProvider.inclusionKeys();
                WasmProgramManager.loadInclusionProver(inclusionKeys[0])
                this.inclusionKeysLoaded = true;
                console.log("Successfully loaded inclusion key");
            } catch {
                logAndThrow(`Inclusion key bytes not loaded, please ensure the program manager is initialized with a KeyProvider that includes the inclusion key.`)
            }
        }

        // Build an execution transaction from the authorization.
        console.log("Executing authorizations")
        return await WasmProgramManager.executeAuthorization(
            authorization,
            feeAuthorization,
            program,
            provingKey,
            verifyingKey,
            feeProvingKey,
            feeVerifyingKey,
            imports,
            this.host,
            offlineQuery
        )
    }

    /**
     * Builds a SnarkVM `Authorization` for a specific function.
     *
     * @param {AuthorizationOptions} options - The options for building the `Authorization`
     * @returns {Promise<Authorization>} - A promise that resolves to an `Authorization` or throws an Error.
     *
     * @example
     * /// Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a new NetworkClient, KeyProvider, and RecordProvider.
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     * keyProvider.useCache(true);
     *
     * // Initialize a ProgramManager with the key and record providers.
     * const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
     *
     * // Build the `Authorization`.
     * const authorization = await programManager.buildAuthorization({
     *   programName: "credits.aleo",
     *   functionName: "transfer_public",
     *   inputs: [
     *     "aleo1vwls2ete8dk8uu2kmkmzumd7q38fvshrht8hlc0a5362uq8ftgyqnm3w08",
     *     "10000000u64",
     *   ],
     * });
     */
    async buildAuthorization(
        options: AuthorizationOptions,
    ): Promise<Authorization> {
        // Destructure the options object to access the parameters.
        const {
            functionName,
            inputs,
        } = options;

        const privateKey = options.privateKey;
        let program = options.programSource;
        let programName = options.programName;
        let imports = options.programImports;
        let edition = options.edition;

        // Ensure the function exists on the network.
        if (program === undefined) {
            try {
                program = <string>(
                    await this.networkClient.getProgram(programName)
                );
            } catch (e: any) {
                logAndThrow(
                    `Error finding ${programName}. Network response: '${e.message}'. Please ensure you're connected to a valid Aleo network the program is deployed to the network.`,
                );
            }
        } else if (program instanceof Program) {
            program = program.toString();
        }

        // Get the program name if it is not provided in the parameters.
        if (programName === undefined) {
            programName = Program.fromString(program).id();
        }

        // Get the private key from the account if it is not provided in the parameters.
        let executionPrivateKey = privateKey;
        if (
            typeof privateKey === "undefined" &&
            typeof this.account !== "undefined"
        ) {
            executionPrivateKey = this.account.privateKey();
        }

        if (typeof executionPrivateKey === "undefined") {
            throw "No private key provided and no private key set in the ProgramManager";
        }

        if (edition == undefined) {
            try {
                edition = await this.networkClient.getLatestProgramEdition(programName);
            } catch (e: any) {
                console.warn(`Error finding edition for ${programName}. Network response: '${e.message}'. Assuming edition 0.`);
                edition = 0;
            }
        }

        // Resolve the program imports if they exist.
        const numberOfImports = Program.fromString(program).getImports().length;
        if (numberOfImports > 0 && !imports) {
            try {
                imports = <ProgramImports>(
                    await this.networkClient.getProgramImports(programName)
                );
            } catch (e: any) {
                logAndThrow(
                    `Error finding program imports. Network response: '${e.message}'. Please ensure you're connected to a valid Aleo network and the program is deployed to the network.`,
                );
            }
        }

        // Build and return an `Authorization` for the desired function.
        return await WasmProgramManager.authorize(
            executionPrivateKey,
            program,
            functionName,
            inputs,
            imports,
            edition
        );
    }

    /**
     * Builds a SnarkVM `Authorization` for a specific function without building a circuit first. This should be used when fast authorization generation is needed and the invoker is confident inputs are coorect.
     *
     * @param {AuthorizationOptions} options - The options for building the `Authorization`
     * @returns {Promise<Authorization>} - A promise that resolves to an `Authorization` or throws an Error.
     *
     * @example
     * /// Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a new NetworkClient, KeyProvider, and RecordProvider.
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     * keyProvider.useCache(true);
     *
     * // Initialize a ProgramManager with the key and record providers.
     * const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
     *
     * // Build the unchecked `Authorization`.
     * const authorization = await programManager.buildAuthorizationUnchecked({
     *   programName: "credits.aleo",
     *   functionName: "transfer_public",
     *   inputs: [
     *     "aleo1vwls2ete8dk8uu2kmkmzumd7q38fvshrht8hlc0a5362uq8ftgyqnm3w08",
     *     "10000000u64",
     *   ],
     * });
     */
    async buildAuthorizationUnchecked(
        options: AuthorizationOptions,
    ): Promise<Authorization> {
        // Destructure the options object to access the parameters.
        const {
            functionName,
            inputs,
        } = options;

        const privateKey = options.privateKey;
        let program = options.programSource;
        let programName = options.programName;
        let imports = options.programImports;
        let edition = options.edition;

        // Ensure the function exists on the network.
        if (program === undefined) {
            try {
                program = <string>(
                    await this.networkClient.getProgram(programName)
                );
            } catch (e: any) {
                logAndThrow(
                    `Error finding ${programName}. Network response: '${e.message}'. Please ensure you're connected to a valid Aleo network the program is deployed to the network.`,
                );
            }
        } else if (program instanceof Program) {
            program = program.toString();
        }

        // Get the program name if it is not provided in the parameters.
        if (programName === undefined) {
            programName = Program.fromString(program).id();
        }

        // Get the private key from the account if it is not provided in the parameters.
        let executionPrivateKey = privateKey;
        if (
            typeof privateKey === "undefined" &&
            typeof this.account !== "undefined"
        ) {
            executionPrivateKey = this.account.privateKey();
        }

        if (typeof executionPrivateKey === "undefined") {
            throw "No private key provided and no private key set in the ProgramManager";
        }

        // Resolve the program imports if they exist.
        const numberOfImports = Program.fromString(program).getImports().length;
        if (numberOfImports > 0 && !imports) {
            try {
                imports = <ProgramImports>(
                    await this.networkClient.getProgramImports(programName)
                );
            } catch (e: any) {
                logAndThrow(
                    `Error finding program imports. Network response: '${e.message}'. Please ensure you're connected to a valid Aleo network and the program is deployed to the network.`,
                );
            }
        }

        if (edition == undefined) {
            try {
                edition = await this.networkClient.getLatestProgramEdition(programName);
            } catch (e: any) {
                console.warn(`Error finding edition for ${programName}. Network response: '${e.message}'. Assuming edition 0.`);
                edition = 0;
            }
        }

        // Build and return an `Authorization` for the desired function.
        return await WasmProgramManager.buildAuthorizationUnchecked(
            executionPrivateKey,
            program,
            functionName,
            inputs,
            imports,
            edition
        );
    }

    /**
     * Builds a `ProvingRequest` for submission to a prover for execution. If building a proving request with an ExecutionRequest, a private key must be explicitly provided.
     *
     * @param {ProvingRequestOptions} options - The options for building the proving request
     * @returns {Promise<ProvingRequest>} - A promise that resolves to the transaction or an error.
     *
     * @example
     * /// Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a new NetworkClient, KeyProvider, and RecordProvider.
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     * keyProvider.useCache(true);
     *
     * // Initialize a ProgramManager with the key and record providers.
     * const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
     *
     * // Build the proving request.
     * const provingRequest = await programManager.provingRequest({
     *   programName: "credits.aleo",
     *   functionName: "transfer_public",
     *   priorityFee: 0,
     *   privateFee: false,
     *   inputs: [
     *     "aleo1vwls2ete8dk8uu2kmkmzumd7q38fvshrht8hlc0a5362uq8ftgyqnm3w08",
     *     "10000000u64",
     *   ],
     *   broadcast: false,
     * });
     */
    async provingRequest(
        options: ProvingRequestOptions,
    ): Promise<ProvingRequest> {
        // Destructure the options object to access the parameters.
        const {
            functionName,
            priorityFee,
            privateFee,
            inputs,
            recordSearchParams,
            broadcast = false,
            unchecked = false,
        } = options;

        const baseFee = options.baseFee ? options.baseFee : 0;
        const privateKey = options.privateKey;
        const useFeeMaster = options.useFeeMaster ? options.useFeeMaster : false;
        let program = options.programSource;
        let programName = options.programName;
        let feeRecord = options.feeRecord;
        let imports = options.programImports;
        let edition = options.edition;

        if (!inputs && !options.executionRequest) {
            throw new Error("Either function inputs or an execution request must be provided to form a proving request");
        }

        // Ensure the function exists on the network.
        if (program === undefined) {
            try {
                program = <string>(
                    await this.networkClient.getProgram(programName)
                );
            } catch (e: any) {
                logAndThrow(
                    `Error finding ${programName}. Network response: '${e.message}'. Please ensure you're connected to a valid Aleo network the program is deployed to the network.`,
                );
            }
        } else if (program instanceof Program) {
            program = program.toString();
        }

        // Get the program name if it is not provided in the parameters.
        if (programName === undefined) {
            programName = Program.fromString(program).id();
        }

        if (edition == undefined) {
            try {
                edition = await this.networkClient.getLatestProgramEdition(programName);
            } catch (e: any) {
                console.warn(`Error finding edition for ${programName}. Network response: '${e.message}'. Assuming edition 0.`);
                edition = 0;
            }
        }

        // Get the private key from the account if it is not provided in the parameters.
        let executionPrivateKey = privateKey;
        if (
            typeof privateKey === "undefined" &&
            typeof this.account !== "undefined" &&
            typeof options.executionRequest === "undefined"
        ) {
            executionPrivateKey = this.account.privateKey();
        }

        // Resolve the program imports if they exist.
        const numberOfImports = Program.fromString(program).getImports().length;
        if (numberOfImports > 0 && !imports) {
            try {
                imports = <ProgramImports>(
                    await this.networkClient.getProgramImports(programName)
                );
            } catch (e: any) {
                logAndThrow(
                    `Error finding program imports. Network response: '${e.message}'. Please ensure you're connected to a valid Aleo network and the program is deployed to the network.`,
                );
            }
        }

        // Get the fee record from the account if it is not provided in the parameters
        try {
            if (privateFee && !useFeeMaster && !options.executionRequest) {
                let fee = priorityFee;
                // If a fee record wasn't provided, estimate the fee that needs to be paid.
                if (!feeRecord) {
                    const baseFee = Number(await this.estimateExecutionFee({programName, functionName, program: program.toString(), imports}));
                    fee = baseFee + priorityFee;
                }

                // Get a credits.aleo record for the fee.
                feeRecord = await this.getCreditsRecord(
                    fee,
                    [],
                    feeRecord,
                    recordSearchParams
                )
            } else {
                // If it's specified NOT to use a privateFee, use a public fee.
                feeRecord = undefined
            }
        } catch (e: any) {
            logAndThrow(
                `Error finding fee record. Record finder response: '${e.message}'. Please ensure you're connected to a valid Aleo network and a record with enough balance exists.`,
            );
        }

        if (options.executionRequest instanceof ExecutionRequest) {
            return await WasmProgramManager.buildProvingRequestFromExecutionRequest(
                options.executionRequest,
                program,
                unchecked,
                broadcast,
                edition,
                imports,
                executionPrivateKey,
            )
        } else {
            // Ensure the private key exists.
            if (!executionPrivateKey) {
                throw new Error("No private key provided and no private key set in the ProgramManager");
            }

            // Ensure the inputs exist.
            if (!inputs) {
                throw new Error("No inputs provided to build a proving request");
            }

            // Build and return the `ProvingRequest`.
            return await WasmProgramManager.buildProvingRequest(
                executionPrivateKey,
                program,
                functionName,
                inputs,
                baseFee,
                priorityFee,
                feeRecord,
                imports,
                broadcast,
                unchecked,
                edition,
                useFeeMaster
            );
        }
    }

    /**
     * Builds a SnarkVM fee `Authorization` for `credits.aleo/fee_private` or `credits.aleo/fee_public`. If a record is provided `fee_private` will be executed, otherwise `fee_public` will be executed.
     *
     * @param {FeeAuthorizationOptions} options - The options for building the `Authorization`.
     * @returns {Promise<Authorization>} - A promise that resolves to an `Authorization` or throws an Error.
     *
     * @example
     * /// Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a new NetworkClient, KeyProvider, and RecordProvider.
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     * keyProvider.useCache(true);
     *
     * // Initialize a ProgramManager with the key and record providers.
     * const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
     *
     * // Build a credits.aleo/fee_public `Authorization`.
     * const feePublicAuthorization = await programManager.buildFeeAuthorization({
     *   deploymentOrExecutionId: "2423957656946557501636078245035919227529640894159332581642187482178647335171field",
     *   baseFeeCredits: 0.1,
     * });
     *
     * // Build a credits.aleo/fee_private `Authorization`.
     * const record = "{ owner: aleo1j7qxyunfldj2lp8hsvy7mw5k8zaqgjfyr72x2gh3x4ewgae8v5gscf5jh3.private, microcredits: 1500000000000000u64.private, _nonce: 3077450429259593211617823051143573281856129402760267155982965992208217472983group.public }";
     * const feePrivateAuthorization = await programManager.buildFeeAuthorization({
     *   deploymentOrExecutionId: "2423957656946557501636078245035919227529640894159332581642187482178647335171field",
     *   baseFeeCredits: 0.1,
     *   feeRecord: record,
     * });
     */
    async buildFeeAuthorization(
        options: FeeAuthorizationOptions,
    ): Promise<Authorization> {
        // Destructure the options object to access the parameters.
        const {
            privateKey,
            deploymentOrExecutionId,
            baseFeeCredits,
            priorityFeeCredits,
            feeRecord,
        } = options;

        // Get the private key from the account if it is not provided in the parameters.
        let executionPrivateKey = privateKey;
        if (
            typeof privateKey === "undefined" &&
            typeof this.account !== "undefined"
        ) {
            executionPrivateKey = this.account.privateKey();
        }

        if (typeof executionPrivateKey === "undefined") {
            throw "No private key provided and no private key set in the ProgramManager";
        }

        // Build and return the fee `Authorization`.
        return await WasmProgramManager.authorizeFee(
            executionPrivateKey,
            deploymentOrExecutionId,
            baseFeeCredits,
            priorityFeeCredits || 0,
            feeRecord,
        );
    }

    /**
     * Builds an execution transaction for submission to the Aleo network.
     *
     * @param {ExecuteOptions} options - The options for the execution transaction.
     * @returns {Promise<string>} - The transaction id
     *
     * @example
     * /// Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a new NetworkClient, KeyProvider, and RecordProvider using official Aleo record, key, and network providers
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     * keyProvider.useCache(true);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for executions
     * const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
     *
     * // Build and execute the transaction
     * const tx_id = await programManager.execute({
     *   programName: "hello_hello.aleo",
     *   functionName: "hello_hello",
     *   priorityFee: 0.0,
     *   privateFee: false,
     *   inputs: ["5u32", "5u32"],
     *   keySearchParams: { "cacheKey": "hello_hello:hello" }
     * });
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx_id);
     *  assert(transaction.id() === tx_id);
     * }, 10000);
     */
    async execute(options: ExecuteOptions): Promise<string> {
        const tx = <Transaction>await this.buildExecutionTransaction(options);

        let feeAddress;

        if (typeof options.privateKey !== "undefined") {
            feeAddress = Address.from_private_key(options.privateKey);
        } else if (this.account !== undefined) {
            feeAddress = this.account?.address();
        } else {
            throw Error(
                "No private key provided and no private key set in the ProgramManager. Please set an account or provide a private key.",
            );
        }

        // Check if the account has sufficient credits to pay for the transaction
        if (!options.privateFee) {
            await this.checkFee(feeAddress.to_string(), tx.feeAmount());
        }

        return await this.networkClient.submitTransaction(tx);
    }

    /**
     * Run an Aleo program in offline mode
     *
     * @param {string} program Program source code containing the function to be executed
     * @param {string} function_name Function name to execute
     * @param {string[]} inputs Inputs to the function
     * @param {number} proveExecution Whether to prove the execution of the function and return an execution transcript that contains the proof.
     * @param {string[] | undefined} imports Optional imports to the program
     * @param {KeySearchParams | undefined} keySearchParams Optional parameters for finding the matching proving & verifying keys for the function
     * @param {ProvingKey | undefined} provingKey Optional proving key to use for the transaction
     * @param {VerifyingKey | undefined} verifyingKey Optional verifying key to use for the transaction
     * @param {PrivateKey | undefined} privateKey Optional private key to use for the transaction
     * @param {OfflineQuery | undefined} offlineQuery Optional offline query if creating transactions in an offline environment
     * @returns {Promise<ExecutionResponse>} The execution response containing the outputs of the function and the proof if the program is proved.
     *
     * @example
     * /// Import the mainnet version of the sdk used to build executions.
     * import { Account, ProgramManager } from "@provablehq/sdk/mainnet.js";
     *
     * /// Create the source for the "helloworld" program
     * const program = "program helloworld.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
     * const programManager = new ProgramManager(undefined, undefined, undefined);
     *
     * /// Create a temporary account for the execution of the program
     * const account = new Account();
     * programManager.setAccount(account);
     *
     * /// Get the response and ensure that the program executed correctly
     * const executionResponse = await programManager.run(program, "hello", ["5u32", "5u32"]);
     * const result = executionResponse.getOutputs();
     * assert(result === ["10u32"]);
     */
    async run(
        program: string,
        function_name: string,
        inputs: string[],
        proveExecution: boolean,
        imports?: ProgramImports,
        keySearchParams?: KeySearchParams,
        provingKey?: ProvingKey,
        verifyingKey?: VerifyingKey,
        privateKey?: PrivateKey,
        offlineQuery?: OfflineQuery,
        edition?: number
    ): Promise<ExecutionResponse> {
        // Get the private key from the account if it is not provided in the parameters
        let executionPrivateKey = privateKey;
        if (
            typeof privateKey === "undefined" &&
            typeof this.account !== "undefined"
        ) {
            executionPrivateKey = this.account.privateKey();
        }

        if (typeof executionPrivateKey === "undefined") {
            throw "No private key provided and no private key set in the ProgramManager";
        }

        // If the function proving and verifying keys are not provided, attempt to find them using the key provider
        if (!provingKey || !verifyingKey) {
            try {
                [provingKey, verifyingKey] = <FunctionKeyPair>(
                    await this.keyProvider.functionKeys(keySearchParams)
                );
            } catch (e) {
                console.log(
                    `Function keys not found. Key finder response: '${e}'. The function keys will be synthesized`,
                );
            }
        }

        // Run the program offline and return the result
        console.log("Running program offline");
        console.log("Proving key: ", provingKey);
        console.log("Verifying key: ", verifyingKey);
        return WasmProgramManager.executeFunctionOffline(
            executionPrivateKey,
            program,
            function_name,
            inputs,
            proveExecution,
            false,
            imports,
            provingKey,
            verifyingKey,
            this.host,
            offlineQuery,
            edition
        );
    }

    /**
     * Join two credits records into a single credits record
     *
     * @param {RecordPlaintext | string} recordOne First credits record to join
     * @param {RecordPlaintext | string} recordTwo Second credits record to join
     * @param {number} priorityFee The optional priority fee to be paid for the transaction
     * @param {boolean} privateFee Use a private record to pay the fee. If false this will use the account's public credit balance
     * @param {RecordSearchParams | undefined} recordSearchParams Optional parameters for finding the fee record to use to pay the fee for the join transaction
     * @param {RecordPlaintext | string | undefined} feeRecord Fee record to use for the join transaction
     * @param {PrivateKey | undefined} privateKey Private key to use for the join transaction
     * @param {OfflineQuery | undefined} offlineQuery Optional offline query if creating transactions in an offline environment
     * @returns {Promise<string>} The transaction id
     *
     * @example
     * /// Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a new NetworkClient, KeyProvider, and RecordProvider
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     * keyProvider.useCache(true);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for executions
     * const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
     * const record_1 = "{  owner: aleo184vuwr5u7u0ha5f5k44067dd2uaqewxx6pe5ltha5pv99wvhfqxqv339h4.private,  microcredits: 45000000u64.private,  _nonce: 4106205762862305308495708971985748592380064201230396559307556388725936304984group.public}"
     * const record_2 = "{  owner: aleo184vuwr5u7u0ha5f5k44067dd2uaqewxx6pe5ltha5pv99wvhfqxqv339h4.private,  microcredits: 45000000u64.private,  _nonce: 1540945439182663264862696551825005342995406165131907382295858612069623286213group.public}"
     * const tx_id = await programManager.join(record_1, record_2, 0.05, false);
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx_id);
     *  assert(transaction.id() === tx_id);
     * }, 10000);
     */
    async join(
        recordOne: RecordPlaintext | string,
        recordTwo: RecordPlaintext | string,
        priorityFee: number,
        privateFee: boolean,
        recordSearchParams?: RecordSearchParams | undefined,
        feeRecord?: RecordPlaintext | string | undefined,
        privateKey?: PrivateKey,
        offlineQuery?: OfflineQuery,
    ): Promise<string> {
        // Get the private key from the account if it is not provided in the parameters and assign the fee address
        let executionPrivateKey = privateKey;
        let feeAddress;
        if (
            typeof privateKey === "undefined" &&
            typeof this.account !== "undefined"
        ) {
            executionPrivateKey = this.account.privateKey();
            feeAddress = this.account?.address();
        }
        else if (typeof executionPrivateKey === "undefined") {
            throw "No private key provided and no private key set in the ProgramManager";
        }
        else {
            feeAddress = Address.from_private_key(executionPrivateKey);
        }

        // Get the proving and verifying keys from the key provider
        let feeKeys;
        let joinKeys;
        try {
            feeKeys = privateFee
                ? <FunctionKeyPair>await this.keyProvider.feePrivateKeys()
                : <FunctionKeyPair>await this.keyProvider.feePublicKeys();
            joinKeys = <FunctionKeyPair>await this.keyProvider.joinKeys();
        } catch (e: any) {
            logAndThrow(
                `Error finding fee keys. Key finder response: '${e.message}'. Please ensure your key provider is configured correctly.`,
            );
        }
        const [feeProvingKey, feeVerifyingKey] = feeKeys;
        const [joinProvingKey, joinVerifyingKey] = joinKeys;

        // Get the fee record from the account if it is not provided in the parameters
        try {
            if (privateFee) {
                let fee = priorityFee;
                // If a fee record wasn't provided, estimate the fee that needs to be paid.
                if (!feeRecord) {
                    const baseFee = Number(await this.estimateExecutionFee({programName: "credits.aleo", functionName: "join"}));
                    fee = baseFee + priorityFee;
                }

                // Get a credits.aleo record for the fee.
                feeRecord = await this.getCreditsRecord(
                    fee,
                    [],
                    feeRecord,
                    recordSearchParams
                )
            } else {
                // If it's specified NOT to use a privateFee, use a public fee.
                feeRecord = undefined
            }
        } catch (e: any) {
            logAndThrow(
                `Error finding fee record. Record finder response: '${e.message}'. Please ensure you're connected to a valid Aleo network and a record with enough balance exists.`,
            );
        }

        // Validate the records provided are valid plaintext records
        try {
            recordOne =
                recordOne instanceof RecordPlaintext
                    ? recordOne
                    : RecordPlaintext.fromString(recordOne);
            recordTwo =
                recordTwo instanceof RecordPlaintext
                    ? recordTwo
                    : RecordPlaintext.fromString(recordTwo);
        } catch (e: any) {
            logAndThrow(
                "Records provided are not valid. Please ensure they are valid plaintext records.",
            );
        }

        // Load the inclusion prover offline.
        if (offlineQuery && !this.inclusionKeysLoaded) {
            try {
                const inclusionKeys = await this.keyProvider.inclusionKeys();
                WasmProgramManager.loadInclusionProver(inclusionKeys[0])
                this.inclusionKeysLoaded = true;
                console.log("Successfully loaded inclusion key");
            } catch {
                logAndThrow(`Inclusion key bytes not loaded, please ensure the program manager is initialized with a KeyProvider that includes the inclusion key.`)
            }
        }

        // Build an execution transaction and submit it to the network
        const tx = await WasmProgramManager.buildJoinTransaction(
            executionPrivateKey,
            recordOne,
            recordTwo,
            priorityFee,
            feeRecord,
            this.host,
            joinProvingKey,
            joinVerifyingKey,
            feeProvingKey,
            feeVerifyingKey,
            offlineQuery,
        );

        // Check if the account has sufficient credits to pay for the transaction
        if (!privateFee) {
            await this.checkFee(feeAddress.to_string(), tx.feeAmount());
        }

        return await this.networkClient.submitTransaction(tx);
    }

    /**
     * Split credits into two new credits records
     *
     * @param {number} splitAmount Amount in microcredits to split from the original credits record
     * @param {RecordPlaintext | string} amountRecord Amount record to use for the split transaction
     * @param {PrivateKey | undefined} privateKey Optional private key to use for the split transaction
     * @param {OfflineQuery | undefined} offlineQuery Optional offline query if creating transactions in an offline environment
     * @returns {Promise<string>} The transaction id
     *
     * @example
     * /// Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a new NetworkClient, KeyProvider, and RecordProvider
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     * keyProvider.useCache(true);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for executions
     * const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
     * const record = "{  owner: aleo184vuwr5u7u0ha5f5k44067dd2uaqewxx6pe5ltha5pv99wvhfqxqv339h4.private,  microcredits: 45000000u64.private,  _nonce: 4106205762862305308495708971985748592380064201230396559307556388725936304984group.public}"
     * const tx_id = await programManager.split(25000000, record);
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx_id);
     *  assert(transaction.id() === tx_id);
     * }, 10000);
     */
    async split(
        splitAmount: number,
        amountRecord: RecordPlaintext | string,
        privateKey?: PrivateKey,
        offlineQuery?: OfflineQuery,
    ): Promise<string> {
        // Get the private key from the account if it is not provided in the parameters
        let executionPrivateKey = privateKey;
        if (
            typeof privateKey === "undefined" &&
            typeof this.account !== "undefined"
        ) {
            executionPrivateKey = this.account.privateKey();
        }

        if (typeof executionPrivateKey === "undefined") {
            throw "No private key provided and no private key set in the ProgramManager";
        }

        // Get the split keys from the key provider
        let splitKeys;
        try {
            splitKeys = <FunctionKeyPair>await this.keyProvider.splitKeys();
        } catch (e: any) {
            logAndThrow(
                `Error finding fee keys. Key finder response: '${e.message}'. Please ensure your key provider is configured correctly.`,
            );
        }
        const [splitProvingKey, splitVerifyingKey] = splitKeys;

        // Validate the record to be split
        try {
            amountRecord =
                amountRecord instanceof RecordPlaintext
                    ? amountRecord
                    : RecordPlaintext.fromString(amountRecord);
        } catch (e: any) {
            logAndThrow(
                "Record provided is not valid. Please ensure it is a valid plaintext record.",
            );
        }

        // Load the inclusion prover offline.
        if (offlineQuery && !this.inclusionKeysLoaded) {
            try {
                const inclusionKeys = await this.keyProvider.inclusionKeys();
                WasmProgramManager.loadInclusionProver(inclusionKeys[0])
                this.inclusionKeysLoaded = true;
                console.log("Successfully loaded inclusion key");
            } catch {
                logAndThrow(`Inclusion key bytes not loaded, please ensure the program manager is initialized with a KeyProvider that includes the inclusion key.`)
            }
        }

        // Build an execution transaction and submit it to the network
        const tx = await WasmProgramManager.buildSplitTransaction(
            executionPrivateKey,
            splitAmount,
            amountRecord,
            this.host,
            splitProvingKey,
            splitVerifyingKey,
            offlineQuery,
        );

        return await this.networkClient.submitTransaction(tx);
    }

    /**
     * Pre-synthesize proving and verifying keys for a program
     *
     * @param program {string} The program source code to synthesize keys for
     * @param function_id {string} The function id to synthesize keys for
     * @param inputs {Array<string>}  Sample inputs to the function
     * @param privateKey {PrivateKey | undefined} Optional private key to use for the key synthesis
     *
     * @returns {Promise<FunctionKeyPair>}
     */
    async synthesizeKeys(
        program: string,
        function_id: string,
        inputs: Array<string>,
        privateKey?: PrivateKey,
    ): Promise<FunctionKeyPair> {
        // Resolve the program imports if they exist
        let imports;

        let executionPrivateKey = privateKey;
        if (typeof executionPrivateKey === "undefined") {
            if (typeof this.account !== "undefined") {
                executionPrivateKey = this.account.privateKey();
            } else {
                executionPrivateKey = new PrivateKey();
            }
        }

        // Attempt to run an offline execution of the program and extract the proving and verifying keys
        try {
            imports = await this.networkClient.getProgramImports(program);
            const keyPair = await WasmProgramManager.synthesizeKeyPair(
                executionPrivateKey,
                program,
                function_id,
                inputs,
                imports,
            );
            return [
                <ProvingKey>keyPair.provingKey(),
                <VerifyingKey>keyPair.verifyingKey(),
            ];
        } catch (e: any) {
            logAndThrow(
                `Could not synthesize keys - error ${e.message}. Please ensure the program is valid and the inputs are correct.`,
            );
        }
    }

    /**
     * Build a transaction to transfer credits to another account for later submission to the Aleo network
     *
     * @param {number} amount The amount of credits to transfer
     * @param {string} recipient The recipient of the transfer
     * @param {string} transferType The type of transfer to perform - options: 'private', 'privateToPublic', 'public', 'publicToPrivate'
     * @param {number} priorityFee The optional priority fee to be paid for the transaction
     * @param {boolean} privateFee Use a private record to pay the fee. If false this will use the account's public credit balance
     * @param {RecordSearchParams | undefined} recordSearchParams Optional parameters for finding the amount and fee records for the transfer transaction
     * @param {RecordPlaintext | string} amountRecord Optional amount record to use for the transfer
     * @param {RecordPlaintext | string} feeRecord Optional fee record to use for the transfer
     * @param {PrivateKey | undefined} privateKey Optional private key to use for the transfer transaction
     * @param {OfflineQuery | undefined} offlineQuery Optional offline query if creating transactions in an offline environment
     * @returns {Promise<Transaction>} The transaction object
     *
     * @example
     * /// Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a new NetworkClient, KeyProvider, and RecordProvider
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     * keyProvider.useCache(true);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for executions
     * const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
     * const tx = await programManager.buildTransferTransaction(1, "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", "public", 0.2, false);
     * await programManager.networkClient.submitTransaction(tx.toString());
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx.id());
     *  assert(transaction.id() === tx.id());
     * }, 10000);
     */
    async buildTransferTransaction(
        amount: number,
        recipient: string,
        transferType: string,
        priorityFee: number,
        privateFee: boolean,
        recordSearchParams?: RecordSearchParams,
        amountRecord?: RecordPlaintext | string,
        feeRecord?: RecordPlaintext | string,
        privateKey?: PrivateKey,
        offlineQuery?: OfflineQuery,
    ): Promise<Transaction> {
        // Validate the transfer type
        transferType = <string>validateTransferType(transferType);

        // Get the private key from the account if it is not provided in the parameters
        let executionPrivateKey = privateKey;
        if (
            typeof executionPrivateKey === "undefined" &&
            typeof this.account !== "undefined"
        ) {
            executionPrivateKey = this.account.privateKey();
        }

        if (typeof executionPrivateKey === "undefined") {
            throw "No private key provided and no private key set in the ProgramManager";
        }

        // Get the proving and verifying keys from the key provider
        let feeKeys;
        let transferKeys;
        try {
            feeKeys = privateFee
                ? <FunctionKeyPair>await this.keyProvider.feePrivateKeys()
                : <FunctionKeyPair>await this.keyProvider.feePublicKeys();
            transferKeys = <FunctionKeyPair>(
                await this.keyProvider.transferKeys(transferType)
            );
        } catch (e: any) {
            logAndThrow(
                `Error finding fee keys. Key finder response: '${e.message}'. Please ensure your key provider is configured correctly.`,
            );
        }
        const [feeProvingKey, feeVerifyingKey] = feeKeys;
        const [transferProvingKey, transferVerifyingKey] = transferKeys;

        // Get the amount and fee record from the account if it is not provided in the parameters
        try {
            // Track the nonces of the records found so no duplicate records are used
            const nonces: string[] = [];
            if (requiresAmountRecord(transferType)) {
                // If the transfer type is private and requires an amount record, get it from the record provider
                amountRecord = await this.getCreditsRecord(
                        priorityFee,
                        [],
                        amountRecord,
                        recordSearchParams,
                    );
                nonces.push(amountRecord.nonce());
            } else {
                amountRecord = undefined;
            }
            if (privateFee) {
                // Get a credits.aleo record for the fee.
                feeRecord = await this.getCreditsRecord(
                    priorityFee,
                    [],
                    feeRecord,
                    recordSearchParams
                )
            } else {
                // If it's specified NOT to use a privateFee, use a public fee.
                feeRecord = undefined
            }
        } catch (e: any) {
            logAndThrow(
                `Error finding fee record. Record finder response: '${e.message}'. Please ensure you're connected to a valid Aleo network and a record with enough balance exists.`,
            );
        }

        // Load the inclusion prover offline.
        if (offlineQuery && !this.inclusionKeysLoaded) {
            const inclusionKeys = await this.keyProvider.inclusionKeys();
            WasmProgramManager.loadInclusionProver(inclusionKeys[0])
            try {
                const inclusionKeys = await this.keyProvider.inclusionKeys();
                WasmProgramManager.loadInclusionProver(inclusionKeys[0])
                this.inclusionKeysLoaded = true;
                console.log("Successfully loaded inclusion key");
            } catch {
                logAndThrow(`Inclusion key bytes not loaded, please ensure the program manager is initialized with a KeyProvider that includes the inclusion key.`)
            }
        }

        // Build an execution transaction
        return await WasmProgramManager.buildTransferTransaction(
            executionPrivateKey,
            amount,
            recipient,
            transferType,
            amountRecord,
            priorityFee,
            feeRecord,
            this.host,
            transferProvingKey,
            transferVerifyingKey,
            feeProvingKey,
            feeVerifyingKey,
            offlineQuery,
        );
    }

    /**
     * Build a transfer_public transaction to transfer credits to another account for later submission to the Aleo network
     *
     * @param {number} amount The amount of credits to transfer
     * @param {string} recipient The recipient of the transfer
     * @param {number} priorityFee The optional priority fee to be paid for the transfer
     * @param {PrivateKey | undefined} privateKey Optional private key to use for the transfer transaction
     * @param {OfflineQuery | undefined} offlineQuery Optional offline query if creating transactions in an offline environment
     * @returns {Promise<Transaction>} The transaction object
     *
     * @example
     * /// Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a new NetworkClient, KeyProvider, and RecordProvider
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     * keyProvider.useCache(true);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for executions
     * const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
     * const tx = await programManager.buildTransferPublicTransaction(1, "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", 0.2);
     * await programManager.networkClient.submitTransaction(tx.toString());
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx.id());
     *  assert(transaction.id() === tx.id());
     * }, 10000);
     */
    async buildTransferPublicTransaction(
        amount: number,
        recipient: string,
        priorityFee: number,
        privateKey?: PrivateKey,
        offlineQuery?: OfflineQuery,
    ): Promise<Transaction> {
        return this.buildTransferTransaction(
            amount,
            recipient,
            "public",
            priorityFee,
            false,
            undefined,
            undefined,
            undefined,
            privateKey,
            offlineQuery,
        );
    }

    /**
     * Build a transfer_public_as_signer transaction to transfer credits to another account for later submission to the Aleo network
     *
     * @param {number} amount The amount of credits to transfer
     * @param {string} recipient The recipient of the transfer
     * @param {number} priorityFee The optional priority fee to be paid for the transfer
     * @param {PrivateKey | undefined} privateKey Optional private key to use for the transfer transaction
     * @param {OfflineQuery | undefined} offlineQuery Optional offline query if creating transactions in an offline environment
     * @returns {Promise<Transaction>} The transaction object
     *
     * @example
     * /// Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a new NetworkClient, KeyProvider, and RecordProvider
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     * keyProvider.useCache(true);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for executions
     * const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
     * const tx = await programManager.buildTransferPublicAsSignerTransaction(1, "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", 0.2);
     * await programManager.networkClient.submitTransaction(tx.toString());
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx.id());
     *  assert(transaction.id() === tx.id());
     * }, 10000);
     */
    async buildTransferPublicAsSignerTransaction(
        amount: number,
        recipient: string,
        priorityFee: number,
        privateKey?: PrivateKey,
        offlineQuery?: OfflineQuery,
    ): Promise<Transaction> {
        return this.buildTransferTransaction(
            amount,
            recipient,
            "public",
            priorityFee,
            false,
            undefined,
            undefined,
            undefined,
            privateKey,
            offlineQuery,
        );
    }

    /**
     * Transfer credits to another account
     *
     * @param {number} amount The amount of credits to transfer
     * @param {string} recipient The recipient of the transfer
     * @param {string} transferType The type of transfer to perform - options: 'private', 'privateToPublic', 'public', 'publicToPrivate'
     * @param {number} priorityFee The optional priority fee to be paid for the transfer
     * @param {boolean} privateFee Use a private record to pay the fee. If false this will use the account's public credit balance
     * @param {RecordSearchParams | undefined} recordSearchParams Optional parameters for finding the amount and fee records for the transfer transaction
     * @param {RecordPlaintext | string} amountRecord Optional amount record to use for the transfer
     * @param {RecordPlaintext | string} feeRecord Optional fee record to use for the transfer
     * @param {PrivateKey | undefined} privateKey Optional private key to use for the transfer transaction
     * @param {OfflineQuery | undefined} offlineQuery Optional offline query if creating transactions in an offline environment
     * @returns {Promise<string>} The transaction id
     *
     * @example
     * /// Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a new NetworkClient, KeyProvider, and RecordProvider
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     * keyProvider.useCache(true);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for executions
     * const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
     * const tx_id = await programManager.transfer(1, "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", "public", 0.2, false);
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx_id);
     *  assert(transaction.id() === tx_id);
     * }, 10000);
     */
    async transfer(
        amount: number,
        recipient: string,
        transferType: string,
        priorityFee: number,
        privateFee: boolean,
        recordSearchParams?: RecordSearchParams,
        amountRecord?: RecordPlaintext | string,
        feeRecord?: RecordPlaintext | string,
        privateKey?: PrivateKey,
        offlineQuery?: OfflineQuery,
    ): Promise<string> {
        const tx = <Transaction>(
            await this.buildTransferTransaction(
                amount,
                recipient,
                transferType,
                priorityFee,
                privateFee,
                recordSearchParams,
                amountRecord,
                feeRecord,
                privateKey,
                offlineQuery,
            )
        );

        let feeAddress;

        if (typeof privateKey !== "undefined") {
            feeAddress = Address.from_private_key(privateKey);
        } else if (this.account !== undefined) {
            feeAddress = this.account?.address();
        } else {
            throw Error(
                "No private key provided and no private key set in the ProgramManager. Please set an account or provide a private key.",
            );
        }

        // Check if the account has sufficient credits to pay for the transaction
        if (!privateFee) {
            await this.checkFee(feeAddress.to_string(), tx.feeAmount());
        }

        return await this.networkClient.submitTransaction(tx);
    }

    /**
     * Build transaction to bond credits to a validator for later submission to the Aleo Network
     *
     * @param {string} validator_address Address of the validator to bond to, if this address is the same as the staker (i.e. the executor of this function), it will attempt to bond the credits as a validator. Bonding as a validator currently requires a minimum of 10,000,000 credits to bond (subject to change). If the address is specified is an existing validator and is different from the address of the executor of this function, it will bond the credits to that validator's staking committee as a delegator. A minimum of 10 credits is required to bond as a delegator.
     * @param {string} withdrawal_address Address to withdraw the staked credits to when unbond_public is called.
     * @param {number} amount The amount of credits to bond
     * @param {Partial<ExecuteOptions>} options - Override default execution options.
     * @returns {Promise<Transaction>} The transaction object
     *
     * @example
     * // Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a keyProvider to handle key management
     * const keyProvider = new AleoKeyProvider();
     * keyProvider.useCache(true);
     *
     * // Create a new ProgramManager with the key that will be used to bond credits
     * const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, undefined);
     * programManager.setAccount(new Account("YourPrivateKey"));
     *
     * // Create the bonding transaction object for later submission
     * const tx = await programManager.buildBondPublicTransaction("aleo1jx8s4dvjepculny4wfrzwyhs3tlyv65r58ns3g6q2gm2esh7ps8sqy9s5j", "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", "aleo1feya8sjy9k2zflvl2dx39pdsq5tju28elnp2ektnn588uu9ghv8s84msv9", 2000000);
     *
     * // The transaction can be later submitted to the network using the network client.
     * await programManager.networkClient.submitTransaction(tx.toString());
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx.id());
     *  assert(transaction.id() === tx.id());
     * }, 10000);
     */
    async buildBondPublicTransaction(
        validator_address: string,
        withdrawal_address: string,
        amount: number,
        options: Partial<ExecuteOptions> = {},
    ) {
        const scaledAmount = Math.trunc(amount * 1000000);

        const {
            programName = "credits.aleo",
            functionName = "bond_public",
            priorityFee = options.priorityFee || 0,
            privateFee = false,
            inputs = [
                validator_address,
                withdrawal_address,
                `${scaledAmount.toString()}u64`,
            ],
            keySearchParams = new AleoKeyProviderParams({
                proverUri: CREDITS_PROGRAM_KEYS.bond_public.prover,
                verifierUri: CREDITS_PROGRAM_KEYS.bond_public.verifier,
                cacheKey: "credits.aleo/bond_public",
            }),
            program = this.creditsProgram(),
            ...additionalOptions
        } = options;

        const executeOptions: ExecuteOptions = {
            programName,
            functionName,
            priorityFee,
            privateFee,
            inputs,
            keySearchParams,
            program,
            ...additionalOptions,
        };

        return await this.buildExecutionTransaction(executeOptions);
    }

    /**
     * Bond credits to validator.
     *
     * @param {string} validator_address Address of the validator to bond to, if this address is the same as the signer (i.e. the executor of this function), it will attempt to bond the credits as a validator. Bonding as a validator currently requires a minimum of 1,000,000 credits to bond (subject to change). If the address is specified is an existing validator and is different from the address of the executor of this function, it will bond the credits to that validator's staking committee as a delegator. A minimum of 10 credits is required to bond as a delegator.
     * @param {string} withdrawal_address Address to withdraw the staked credits to when unbond_public is called.
     * @param {number} amount The amount of credits to bond
     * @param {Options} options Options for the execution
     * @returns {Promise<string>} The transaction id
     *
     * @example
     * // Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a keyProvider to handle key management
     * const keyProvider = new AleoKeyProvider();
     * keyProvider.useCache(true);
     *
     * // Create a new ProgramManager with the key that will be used to bond credits
     * const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, undefined);
     *
     * // Create the bonding transaction
     * tx_id = await programManager.bondPublic("aleo1jx8s4dvjepculny4wfrzwyhs3tlyv65r58ns3g6q2gm2esh7ps8sqy9s5j", "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", "aleo1feya8sjy9k2zflvl2dx39pdsq5tju28elnp2ektnn588uu9ghv8s84msv9", 2000000);
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx_id);
     *  assert(transaction.id() === tx_id);
     * }, 10000);
     */
    async bondPublic(
        validator_address: string,
        withdrawal_address: string,
        amount: number,
        options: Partial<ExecuteOptions> = {},
    ) {
        const tx = <Transaction>(
            await this.buildBondPublicTransaction(
                validator_address,
                withdrawal_address,
                amount,
                options,
            )
        );

        let feeAddress;

        if (typeof options.privateKey !== "undefined") {
            feeAddress = Address.from_private_key(options.privateKey);
        } else if (this.account !== undefined) {
            feeAddress = this.account?.address();
        } else {
            throw Error(
                "No private key provided and no private key set in the ProgramManager. Please set an account or provide a private key.",
            );
        }

        // Check if the account has sufficient credits to pay for the transaction
        if (!options.privateFee) {
            await this.checkFee(feeAddress.to_string(), tx.feeAmount());
        }

        return await this.networkClient.submitTransaction(tx);
    }

    /**
     * Build a bond_validator transaction for later submission to the Aleo Network.
     *
     * @param {string} validator_address Address of the validator to bond to, if this address is the same as the staker (i.e. the executor of this function), it will attempt to bond the credits as a validator. If the address is specified is an existing validator and is different from the address of the executor of this function, it will bond the credits to that validator's staking committee as a delegator.
     * @param {string} withdrawal_address Address to withdraw the staked credits to when unbond_public is called.
     * @param {number} amount The amount of credits to bond. A minimum of 10000 credits is required to bond as a delegator.
     * @param {number} commission The commission rate for the validator (must be between 0 and 100 - an error will be thrown if it is not)
     * @param {Partial<ExecuteOptions>} options - Override default execution options.
     * @returns {Promise<Transaction>} The transaction object
     *
     * @example
     * // Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a keyProvider to handle key management
     * const keyProvider = new AleoKeyProvider();
     * keyProvider.useCache(true);
     *
     * // Create a new ProgramManager with the key that will be used to bond credits
     * const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, undefined);
     * programManager.setAccount(new Account("YourPrivateKey"));
     *
     * // Create the bond validator transaction object for later use.
     * const tx = await programManager.buildBondValidatorTransaction("aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", "aleo1feya8sjy9k2zflvl2dx39pdsq5tju28elnp2ektnn588uu9ghv8s84msv9", 2000000);
     *
     * // The transaction can later be submitted to the network using the network client.
     * const tx_id = await programManager.networkClient.submitTransaction(tx.toString());
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx_id);
     *  assert(transaction.id() === tx_id);
     * }, 10000);
     */
    async buildBondValidatorTransaction(
        validator_address: string,
        withdrawal_address: string,
        amount: number,
        commission: number,
        options: Partial<ExecuteOptions> = {},
    ) {
        const scaledAmount = Math.trunc(amount * 1000000);

        const adjustedCommission = Math.trunc(commission);

        const {
            programName = "credits.aleo",
            functionName = "bond_validator",
            priorityFee = options.priorityFee || 0,
            privateFee = false,
            inputs = [
                validator_address,
                withdrawal_address,
                `${scaledAmount.toString()}u64`,
                `${adjustedCommission.toString()}u8`,
            ],
            keySearchParams = new AleoKeyProviderParams({
                proverUri: CREDITS_PROGRAM_KEYS.bond_validator.prover,
                verifierUri: CREDITS_PROGRAM_KEYS.bond_validator.verifier,
                cacheKey: "credits.aleo/bond_validator",
            }),
            program = this.creditsProgram(),
            ...additionalOptions
        } = options;

        const executeOptions: ExecuteOptions = {
            programName,
            functionName,
            priorityFee,
            privateFee,
            inputs,
            keySearchParams,
            program,
            ...additionalOptions,
        };

        return await this.buildExecutionTransaction(executeOptions);
    }

    /**
     * Build transaction to bond a validator.
     *
     * @param {string} validator_address Address of the validator to bond to, if this address is the same as the staker (i.e. the executor of this function), it will attempt to bond the credits as a validator. Bonding as a validator currently requires a minimum of 10,000,000 credits to bond (subject to change). If the address is specified is an existing validator and is different from the address of the executor of this function, it will bond the credits to that validator's staking committee as a delegator. A minimum of 10 credits is required to bond as a delegator.
     * @param {string} withdrawal_address Address to withdraw the staked credits to when unbond_public is called.
     * @param {number} amount The amount of credits to bond
     * @param {number} commission The commission rate for the validator (must be between 0 and 100 - an error will be thrown if it is not)
     * @param {Partial<ExecuteOptions>} options - Override default execution options.
     * @returns {Promise<string>} The transaction id
     *
     * @example
     * // Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a keyProvider to handle key management
     * const keyProvider = new AleoKeyProvider();
     * keyProvider.useCache(true);
     *
     * // Create a new ProgramManager with the key that will be used to bond credits
     * const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, undefined);
     * programManager.setAccount(new Account("YourPrivateKey"));
     *
     * // Create the bonding transaction
     * const tx_id = await programManager.bondValidator("aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", "aleo1feya8sjy9k2zflvl2dx39pdsq5tju28elnp2ektnn588uu9ghv8s84msv9", 2000000);
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx_id);
     *  assert(transaction.id() === tx_id);
     * }, 10000);
     */
    async bondValidator(
        validator_address: string,
        withdrawal_address: string,
        amount: number,
        commission: number,
        options: Partial<ExecuteOptions> = {},
    ) {
        const tx = <Transaction>(
            await this.buildBondValidatorTransaction(
                validator_address,
                withdrawal_address,
                amount,
                commission,
                options,
            )
        );

        let feeAddress;

        if (typeof options.privateKey !== "undefined") {
            feeAddress = Address.from_private_key(options.privateKey);
        } else if (this.account !== undefined) {
            feeAddress = this.account?.address();
        } else {
            throw Error(
                "No private key provided and no private key set in the ProgramManager. Please set an account or provide a private key.",
            );
        }

        // Check if the account has sufficient credits to pay for the transaction
        if (!options.privateFee) {
            await this.checkFee(feeAddress.to_string(), tx.feeAmount());
        }

        return await this.networkClient.submitTransaction(tx);
    }

    /**
     * Build an unbond_public execution transaction to unbond credits from a validator in the Aleo network.
     *
     * @param {string} staker_address - The address of the staker who is unbonding the credits.
     * @param {number} amount - The amount of credits to unbond (scaled by 1,000,000).
     * @param {Partial<ExecuteOptions>} options - Override default execution options.
     * @returns {Promise<Transaction>} - A promise that resolves to the transaction or an error message.
     *
     * @example
     * // Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a keyProvider to handle key management.
     * const keyProvider = new AleoKeyProvider();
     * keyProvider.useCache(true);
     *
     * // Create a new ProgramManager with the key that will be used to unbond credits.
     * const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, undefined);
     * const tx = await programManager.buildUnbondPublicTransaction("aleo1jx8s4dvjepculny4wfrzwyhs3tlyv65r58ns3g6q2gm2esh7ps8sqy9s5j", 2000000);
     *
     * // The transaction can be submitted later to the network using the network client.
     * programManager.networkClient.submitTransaction(tx.toString());
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx.id());
     *  assert(transaction.id() === tx.id());
     * }, 10000);
     */
    async buildUnbondPublicTransaction(
        staker_address: string,
        amount: number,
        options: Partial<ExecuteOptions> = {},
    ): Promise<Transaction> {
        const scaledAmount = Math.trunc(amount * 1000000);

        const {
            programName = "credits.aleo",
            functionName = "unbond_public",
            priorityFee = options.priorityFee || 0,
            privateFee = false,
            inputs = [staker_address, `${scaledAmount.toString()}u64`],
            keySearchParams = new AleoKeyProviderParams({
                proverUri: CREDITS_PROGRAM_KEYS.unbond_public.prover,
                verifierUri: CREDITS_PROGRAM_KEYS.unbond_public.verifier,
                cacheKey: "credits.aleo/unbond_public",
            }),
            program = this.creditsProgram(),
            ...additionalOptions
        } = options;

        const executeOptions: ExecuteOptions = {
            programName,
            functionName,
            priorityFee,
            privateFee,
            inputs,
            keySearchParams,
            program,
            ...additionalOptions,
        };

        return this.buildExecutionTransaction(executeOptions);
    }

    /**
     * Unbond a specified amount of staked credits. If the address of the executor of this function is an existing
     * validator, it will subtract this amount of credits from the validator's staked credits. If there are less than
     * 1,000,000 credits staked pool after the unbond, the validator will be removed from the validator set. If the
     * address of the executor of this function is not a validator and has credits bonded as a delegator, it will
     * subtract this amount of credits from the delegator's staked credits. If there are less than 10 credits bonded
     * after the unbond operation, the delegator will be removed from the validator's staking pool.
     *
     * @param {string} staker_address Address of the staker who is unbonding the credits
     * @param {number} amount Amount of credits to unbond.
     * @param {ExecuteOptions} options Options for the execution
     * @returns {Promise<string>} The transaction id
     *
     * @example
     * // Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a keyProvider to handle key management
     * const keyProvider = new AleoKeyProvider();
     * keyProvider.useCache(true);
     *
     * // Create a new ProgramManager with the key that will be used to bond credits
     * const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, undefined);
     * programManager.setAccount(new Account("YourPrivateKey"));
     *
     * // Create the unbond_public transaction and send it to the network
     * const tx_id = await programManager.unbondPublic("aleo1jx8s4dvjepculny4wfrzwyhs3tlyv65r58ns3g6q2gm2esh7ps8sqy9s5j", 10);
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx_id);
     *  assert(transaction.id() === tx_id);
     * }, 10000);
     */
    async unbondPublic(
        staker_address: string,
        amount: number,
        options: Partial<ExecuteOptions> = {},
    ): Promise<string> {
        const tx = <Transaction>(
            await this.buildUnbondPublicTransaction(
                staker_address,
                amount,
                options,
            )
        );

        let feeAddress;

        if (typeof options.privateKey !== "undefined") {
            feeAddress = Address.from_private_key(options.privateKey);
        } else if (this.account !== undefined) {
            feeAddress = this.account?.address();
        } else {
            throw Error(
                "No private key provided and no private key set in the ProgramManager. Please set an account or provide a private key.",
            );
        }

        // Check if the account has sufficient credits to pay for the transaction
        if (!options.privateFee) {
            await this.checkFee(feeAddress.to_string(), tx.feeAmount());
        }

        return await this.networkClient.submitTransaction(tx);
    }

    /**
     * Build a transaction to claim unbonded public credits in the Aleo network.
     *
     * @param {string} staker_address - The address of the staker who is claiming the credits.
     * @param {Partial<ExecuteOptions>} options - Override default execution options.
     * @returns {Promise<Transaction>} - A promise that resolves to the transaction or an error message.
     *
     * @example
     * // Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a keyProvider to handle key management
     * const keyProvider = new AleoKeyProvider();
     * keyProvider.useCache(true);
     *
     * // Create a new ProgramManager with the key that will be used to claim unbonded credits.
     * const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, undefined);
     *
     * // Create the claim_unbond_public transaction object for later use.
     * const tx = await programManager.buildClaimUnbondPublicTransaction("aleo1jx8s4dvjepculny4wfrzwyhs3tlyv65r58ns3g6q2gm2esh7ps8sqy9s5j");
     *
     * // The transaction can be submitted later to the network using the network client.
     * programManager.networkClient.submitTransaction(tx.toString());
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx.id());
     *  assert(transaction.id() === tx.id());
     * }, 10000);
     */
    async buildClaimUnbondPublicTransaction(
        staker_address: string,
        options: Partial<ExecuteOptions> = {},
    ): Promise<Transaction> {
        const {
            programName = "credits.aleo",
            functionName = "claim_unbond_public",
            priorityFee = options.priorityFee || 0,
            privateFee = false,
            inputs = [staker_address],
            keySearchParams = new AleoKeyProviderParams({
                proverUri: CREDITS_PROGRAM_KEYS.claim_unbond_public.prover,
                verifierUri: CREDITS_PROGRAM_KEYS.claim_unbond_public.verifier,
                cacheKey: "credits.aleo/claim_unbond_public",
            }),
            program = this.creditsProgram(),
            ...additionalOptions
        } = options;

        const executeOptions: ExecuteOptions = {
            programName,
            functionName,
            priorityFee,
            privateFee,
            inputs,
            keySearchParams,
            program,
            ...additionalOptions,
        };

        // Check if the account has sufficient credits to pay for the transaction
        return await this.buildExecutionTransaction(executeOptions);
    }

    /**
     * Claim unbonded credits. If credits have been unbonded by the account executing this function, this method will
     * claim them and add them to the public balance of the account.
     *
     * @param {string} staker_address Address of the staker who is claiming the credits
     * @param {ExecuteOptions} options
     * @returns {Promise<string>} The transaction id
     *
     * @example
     * // Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a keyProvider to handle key management
     * const keyProvider = new AleoKeyProvider();
     * keyProvider.useCache(true);
     *
     * // Create a new ProgramManager with the key that will be used to bond credits
     * const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, undefined);
     * programManager.setAccount(new Account("YourPrivateKey"));
     *
     * // Create the claim_unbond_public transaction
     * const tx_id = await programManager.claimUnbondPublic("aleo1jx8s4dvjepculny4wfrzwyhs3tlyv65r58ns3g6q2gm2esh7ps8sqy9s5j");
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx_id);
     *  assert(transaction.id() === tx_id);
     * }, 10000);
     */
    async claimUnbondPublic(
        staker_address: string,
        options: Partial<ExecuteOptions> = {},
    ): Promise<string> {
        const tx = <Transaction>(
            await this.buildClaimUnbondPublicTransaction(
                staker_address,
                options,
            )
        );

        let feeAddress;

        if (typeof options.privateKey !== "undefined") {
            feeAddress = Address.from_private_key(options.privateKey);
        } else if (this.account !== undefined) {
            feeAddress = this.account?.address();
        } else {
            throw Error(
                "No private key provided and no private key set in the ProgramManager. Please set an account or provide a private key.",
            );
        }

        // Check if the account has sufficient credits to pay for the transaction
        if (!options.privateFee) {
            await this.checkFee(feeAddress.to_string(), tx.feeAmount());
        }

        return await this.networkClient.submitTransaction(tx);
    }

    /**
     * Build a set_validator_state transaction for later usage.
     *
     * This function allows a validator to set their state to be either opened or closed to new stakers.
     * When the validator is open to new stakers, any staker (including the validator) can bond or unbond from the validator.
     * When the validator is closed to new stakers, existing stakers can still bond or unbond from the validator, but new stakers cannot bond.
     *
     * This function serves two primary purposes:
     * 1. Allow a validator to leave the committee, by closing themselves to stakers and then unbonding all of their stakers.
     * 2. Allow a validator to maintain their % of stake, by closing themselves to allowing more stakers to bond to them.
     *
     * @param {boolean} validator_state
     * @param {Partial<ExecuteOptions>} options - Override default execution options
     * @returns {Promise<Transaction>} The transaction object
     *
     * @example
     * // Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a keyProvider to handle key management
     * const keyProvider = new AleoKeyProvider();
     * keyProvider.useCache(true);
     *
     * // Create a new ProgramManager with the key that will be used to bond credits
     * const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, undefined);
     *
     * // Create the set_validator_state transaction
     * const tx = await programManager.buildSetValidatorStateTransaction(true);
     *
     * // The transaction can be submitted later to the network using the network client.
     * programManager.networkClient.submitTransaction(tx.toString());
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx.id());
     *  assert(transaction.id() === tx.id());
     * }, 10000);
     */
    async buildSetValidatorStateTransaction(
        validator_state: boolean,
        options: Partial<ExecuteOptions> = {},
    ): Promise<Transaction> {
        const {
            programName = "credits.aleo",
            functionName = "set_validator_state",
            priorityFee = 0,
            privateFee = false,
            inputs = [validator_state.toString()],
            keySearchParams = new AleoKeyProviderParams({
                proverUri: CREDITS_PROGRAM_KEYS.set_validator_state.prover,
                verifierUri: CREDITS_PROGRAM_KEYS.set_validator_state.verifier,
                cacheKey: "credits.aleo/set_validator_state",
            }),
            program = this.creditsProgram(),
            ...additionalOptions
        } = options;

        const executeOptions: ExecuteOptions = {
            programName,
            functionName,
            priorityFee,
            privateFee,
            inputs,
            keySearchParams,
            program,
            ...additionalOptions,
        };

        return await this.buildExecutionTransaction(executeOptions);
    }

    /**
     * Submit a set_validator_state transaction to the Aleo Network.
     *
     * This function allows a validator to set their state to be either opened or closed to new stakers.
     * When the validator is open to new stakers, any staker (including the validator) can bond or unbond from the validator.
     * When the validator is closed to new stakers, existing stakers can still bond or unbond from the validator, but new stakers cannot bond.
     *
     * This function serves two primary purposes:
     * 1. Allow a validator to leave the committee, by closing themselves to stakers and then unbonding all of their stakers.
     * 2. Allow a validator to maintain their % of stake, by closing themselves to allowing more stakers to bond to them.
     *
     * @param {boolean} validator_state
     * @param {Partial<ExecuteOptions>} options - Override default execution options
     * @returns {Promise<string>} The transaction id
     *
     * @example
     * // Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a keyProvider to handle key management
     * const keyProvider = new AleoKeyProvider();
     * keyProvider.useCache(true);
     *
     * // Create a new ProgramManager with the key that will be used to bond credits
     * const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, undefined);
     *
     * // Create the set_validator_state transaction
     * const tx_id = await programManager.setValidatorState(true);
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx_id);
     *  assert(transaction.id() === tx_id);
     * }, 10000);
     */
    async setValidatorState(
        validator_state: boolean,
        options: Partial<ExecuteOptions> = {},
    ) {
        const tx = <Transaction>(
            await this.buildSetValidatorStateTransaction(
                validator_state,
                options,
            )
        );

        let feeAddress;

        if (typeof options.privateKey !== "undefined") {
            feeAddress = Address.from_private_key(options.privateKey);
        } else if (this.account !== undefined) {
            feeAddress = this.account?.address();
        } else {
            throw Error(
                "No private key provided and no private key set in the ProgramManager. Please set an account or provide a private key.",
            );
        }

        // Check if the account has sufficient credits to pay for the transaction
        if (!options.privateFee) {
            await this.checkFee(feeAddress.to_string(), tx.feeAmount());
        }

        return this.networkClient.submitTransaction(tx);
    }

    /**
     * Verify a proof from an offline execution. This is useful when it is desired to do offchain proving and verification.
     *
     * @param {executionResponse} executionResponse The response from an offline function execution (via the `programManager.run` method)
     * @param {blockHeight} blockHeight The ledger height when the execution was generated.
     * @param {ImportedPrograms} imports The imported programs used in the execution. Specified as { "programName": "programSourceCode", ... }
     * @param {ImportedVerifyingKeys} importedVerifyingKeys The verifying keys in the execution. Specified as { "programName": [["functionName", "verifyingKey"], ...], ... }
     * @returns {boolean} True if the proof is valid, false otherwise
     *
     * @example
     * /// Import the mainnet version of the sdk used to build executions.
     * import { Account, ProgramManager } from "@provablehq/sdk/mainnet.js";
     *
     * /// Create the source for two programs.
     * const program = "import add_it_up.aleo; \n\n program mul_add.aleo;\n\nfunction mul_and_add:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    mul r0 r1 into r2;\n call add_it_up.aleo/add_it r1 r2 into r3;  output r3 as u32.private;\n";
     * const program_import = "program add_it_up.aleo;\n\nfunction add_it:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
     * const programManager = new ProgramManager(undefined, undefined, undefined);
     *
     * /// Create a temporary account for the execution of the program
     * const account = Account.fromCipherText(process.env.ciphertext, process.env.password);
     * programManager.setAccount(account);
     *
     * /// Get the response and ensure that the program executed correctly
     * const executionResponse = await programManager.run(program, "mul_and_add", ["5u32", "5u32"], true);
     *
     * /// Construct the imports and verifying keys
     * const imports = { "add_it_up.aleo": program_import };
     * const importedVerifyingKeys = { "add_it_up.aleo": [["add_it", "verifyingKey1..."]] };
     *
     * /// Verify the execution.
     * const blockHeight = 9000000;
     * const isValid = programManager.verifyExecution(executionResponse, blockHeight, imports, importedVerifyingKeys);
     * assert(isValid);
     */
    verifyExecution(executionResponse: ExecutionResponse, blockHeight: number, imports?: ImportedPrograms, importedVerifyingKeys?: ImportedVerifyingKeys): boolean {
        try {
            const execution = <FunctionExecution>(
                executionResponse.getExecution()
            );
            const function_id = executionResponse.getFunctionId();
            const program = executionResponse.getProgram();
            const verifyingKey = executionResponse.getVerifyingKey();
            return verifyFunctionExecution(
                execution,
                verifyingKey,
                program,
                function_id,
                imports,
                importedVerifyingKeys,
                blockHeight
            );
        } catch (e) {
            console.warn(
                `The execution was not found in the response, cannot verify the execution: ${e}`,
            );
            return false;
        }
    }

    /**
     * Create a program object from a program's source code
     *
     * @param {string} program Program source code
     * @returns {Program} The program object
     */
    createProgramFromSource(program: string): Program {
        return Program.fromString(program);
    }

    /**
     * Get the credits program object
     *
     * @returns {Program} The credits program object
     */
    creditsProgram(): Program {
        return Program.getCreditsProgram();
    }

    /**
     * Verify a program is valid
     *
     * @param {string} program The program source code
     */
    verifyProgram(program: string): boolean {
        try {
            <Program>Program.fromString(program);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Estimate the execution fee for an authorization.
     *
     * @param {FeeEstimateOptions} options Options for fee estimate.
     *
     * @example
     * import { AleoKeyProvider, PrivateKey, initThreadPool, ProgramManager } from "@provablehq/sdk";
     *
     * await initThreadPool();
     *
     * // Create a new KeyProvider.
     * const keyProvider = new AleoKeyProvider();
     * keyProvider.useCache(true);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for executions.
     * const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider);
     *
     * // Build the `Authorization`.
     * const privateKey = new PrivateKey(); // Change this to a private key that has an aleo credit balance.
     * const authorization = await programManager.buildAuthorization({
     *     programName: "credits.aleo",
     *     functionName: "transfer_public",
     *     privateKey,
     *     inputs: [
     *         "aleo1vwls2ete8dk8uu2kmkmzumd7q38fvshrht8hlc0a5362uq8ftgyqnm3w08",
     *         "10000000u64",
     *     ],
     * });
     *
     * console.log("Getting execution id");
     *
     * // Derive the execution ID and base fee.
     * const executionId = authorization.toExecutionId().toString();
     *
     * console.log("Estimating fee");
     *
     * // Get the base fee in microcredits.
     * const baseFeeMicrocredits = await programManager.estimateFeeForAuthorization({
     *      authorization,
     *      programName: "credits.aleo"
     * });
     * const baseFeeCredits = Number(baseFeeMicrocredits)/1000000;
     *
     * console.log("Building fee authorization");
     *
     * // Build a credits.aleo/fee_public `Authorization`.
     * const feeAuthorization = await programManager.buildFeeAuthorization({
     *     deploymentOrExecutionId: executionId,
     *     baseFeeCredits,
     *     privateKey
     * });
     */
    async estimateFeeForAuthorization(
        options: FeeEstimateOptions
    ): Promise<bigint> {
        const {
            authorization,
            programName,
            program,
            imports,
            edition
        } = options;
        if (!authorization) {
            throw new Error("Authorization must be provided if estimating fee for Authorization.")
        }
        const programSource = program ? program.toString() : await this.networkClient.getProgram(programName, edition);
        const programImports = imports ? imports : await this.networkClient.getProgramImports(programSource);
        console.log(JSON.stringify(programImports));
        if (Object.keys(programImports)) {
            return WasmProgramManager.estimateFeeForAuthorization(authorization, programSource, programImports, edition);
        }
        return WasmProgramManager.estimateFeeForAuthorization(authorization, programSource, imports, edition);
    }

    /**
     * Estimate the execution fee for an Aleo function.
     *
     * @param {FeeEstimateOptions} options Options for the fee estimate.
     *
     * @returns {Promise<bigint>} Execution fee in microcredits for the authorization.
     *
     * @example
     * import { AleoKeyProvider, PrivateKey, initThreadPool, ProgramManager } from "@provablehq/sdk";
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for executions.
     * const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider);
     *
     * // Get the base fee in microcredits.
     * const baseFeeMicrocredits = await programManager.estimateExecutionFee({programName: "credits.aleo"});
     * const baseFeeCredits = Number(baseFeeMicrocredits)/1000000;
     *
     * console.log("Building fee authorization");
     *
     * // Build a credits.aleo/fee_public `Authorization`.
     * const baseFeeMicrocredits = await programManager.estimateFeeForAuthorization({
     *      programName: "credits.aleo",
     *      functionName: "transfer_public",
     * });
     * const baseFeeCredits = Number(baseFeeMicrocredits)/1000000;
     */
    async estimateExecutionFee(
        options: FeeEstimateOptions,
    ): Promise<bigint> {
        const {
            functionName,
            programName,
            program,
            imports,
            edition
        } = options;
        if (!functionName) {
            throw new Error("Function name must be specified when estimating fee.");
        }
        const programSource = program ? program.toString() : await this.networkClient.getProgram(programName, edition);
        const programImports = imports ? imports : await this.networkClient.getProgramImports(programSource);
        if (Object.keys(programImports)) {
            return WasmProgramManager.estimateExecutionFee(programSource, functionName, programImports, edition);
        }
        return WasmProgramManager.estimateExecutionFee(programSource, functionName, imports, edition);
    }

    // Internal utility function for getting a credits.aleo record
    async getCreditsRecord(
        amount: number,
        nonces: string[],
        record?: RecordPlaintext | string,
        params?: RecordSearchParams,
    ): Promise<RecordPlaintext> {
        if (record) {
            try {
                return record instanceof RecordPlaintext
                    ? record : RecordPlaintext.fromString(<string>record);
            } catch {
                logAndThrow(`Record '${record}' could not be parsed, please ensure a valid credits.aleo record 
                is passed prior to trying again`)
            }
        } else {
            try {
                const recordProvider = <RecordProvider>this.recordProvider;
                const record = await recordProvider.findCreditsRecord(
                    amount,
                    { ...params, unspent: true, nonces }
                );
                if (record.record_plaintext) {
                    return RecordPlaintext.fromString(record.record_plaintext);
                } else {
                    logAndThrow("Failed to deserialize record returned from record provider");
                }
            } catch (e: any) {
                logAndThrow(
                    `Error finding fee record. Record finder response: '${e}'. Please ensure you're connected to a valid Aleo network and a record with enough balance exists.`,
                );
            }
        }
    }

    /**
     * Builds an execution transaction for submission to the a local devnode.
     * This method skips proof generation and is not meant for use with the mainnet or testnet Aleo networks.
     * Note: getOrInitConsensusVersionTestHeights must be called prior to using this method for this method to work properly.
     *
     * @param {ExecuteOptions} options - The options for the execution transaction.
     * @returns {Promise<Transaction>} - A promise that resolves to the transaction or an error.
     *
     * @example
     * /// Import the mainnet version of the sdk.
     * import { AleoKeyProvider, getOrInitConsensusVersionTestHeights, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";
     * 
     * // Initialize the development consensus heights in order to work with devnode.
     * getOrInitConsensusVersionTestHeights("0,1,2,3,4,5,6,7,8,9,10,11,12");
     *
     * // Create a new NetworkClient and RecordProvider.
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     * keyProvider.useCache(true);
     *
     * // Initialize a program manager.
     * const programManager = new ProgramManager("http://localhost:3030", recordProvider);
     *
     * // Build and execute the transaction.
     * const tx = await programManager.buildDevnodeExecutionTransaction({
     *   programName: "hello_hello.aleo",
     *   functionName: "hello_hello",
     *   priorityFee: 0.0,
     *   privateFee: false,
     *   inputs: ["5u32", "5u32"],
     * });
     *
     * // Submit the transaction to the network
     * await programManager.networkClient.submitTransaction(tx.toString());
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx.id());
     *  assert(transaction.id() === tx.id());
     * }, 10000);
     */
    async buildDevnodeExecutionTransaction(
        options: ExecuteOptions,
    ): Promise<Transaction> {
        // Destructure the options object to access the parameters
        const {
            functionName,
            priorityFee,
            privateFee,
            inputs,
            recordSearchParams,
            privateKey,
        } = options;

        let feeRecord = options.feeRecord;
        let program = options.program;
        let programName = options.programName;
        let imports = options.imports;
        let edition = options.edition;

        let programObject;
        // Ensure the function exists on the network
        if (program === undefined) {
            try {
                programObject = await this.networkClient.getProgramObject(programName);
                program = <string>programObject.toString();
            } catch (e: any) {
                logAndThrow(
                    `Error finding ${programName}. Network response: '${e.message}'. Please ensure you're connected to a valid Aleo network the program is deployed to the network.`,
                );
            }
        } else if (typeof program == "string") {
            try {
                programObject = Program.fromString(program);
            } catch (e: any) {
                logAndThrow(`Program sources passed for ${programName} were invalid: ${e}`);
            }
        } else if (program instanceof Program) {
            programObject = program;
            program = program.toString();
        }

        if (!(programObject instanceof Program)) {
            logAndThrow(`Failed to validate program ${programName}`);
        }

        // Get the program name if it is not provided in the parameters.
        if (programName === undefined) {
            programName = programObject.id();
        }

        if (edition == undefined) {
            try {
                edition = await this.networkClient.getLatestProgramEdition(programName);
            } catch (e: any) {
                console.warn(`Error finding edition for ${programName}. Network response: '${e.message}'. Assuming edition 0.`);
                edition = 0;
            }
        }

        // Get the private key from the account if it is not provided in the parameters.
        let executionPrivateKey = privateKey;
        if (
            typeof privateKey === "undefined" &&
            typeof this.account !== "undefined"
        ) {
            executionPrivateKey = this.account.privateKey();
        }

        if (typeof executionPrivateKey === "undefined") {
            throw "No private key provided and no private key set in the ProgramManager";
        }

        // Get the fee record from the account if it is not provided in the parameters.
        try {
            if (privateFee) {
                let fee = priorityFee;
                // If a private fee is specified, but no fee record is provided, estimate the fee and find a matching record.
                if (!feeRecord) {
                    console.log("Private fee specified, but no private fee record provided, estimating fee and finding a matching fee record.")
                    const programString = programObject.toString();
                    const imports = await this.networkClient.getProgramImports(programString);
                    const baseFee = Number(WasmProgramManager.estimateDeploymentFee(programString, imports));
                    fee = baseFee + priorityFee;
                }

                // Get a credits.aleo record for the fee.
                feeRecord = await this.getCreditsRecord(
                    fee,
                    [],
                    feeRecord,
                    recordSearchParams
                )
            } else {
                // If it's specified NOT to use a privateFee, use a public fee.
                feeRecord = undefined
            }
        } catch (e: any) {
            logAndThrow(
                `Error finding fee record. Record finder response: '${e.message}'. Please ensure you're connected to a valid Aleo network and a record with enough balance exists.`,
            );
        }

        // Resolve the program imports if they exist.
        const numberOfImports = programObject.getImports().length;
        if (numberOfImports > 0 && !imports) {
            try {
                imports = <ProgramImports>(
                    await this.networkClient.getProgramImports(programName)
                );
            } catch (e: any) {
                logAndThrow(
                    `Error finding program imports. Network response: '${e.message}'. Please ensure you're connected to a valid Aleo network and the program is deployed to the network.`,
                );
            }
        }
        
        // Build a transaction without a proof
        return await WasmProgramManager.buildDevnodeExecutionTransaction(
            executionPrivateKey,
            program,
            functionName,
            inputs,
            priorityFee,
            feeRecord,
            this.host,
            imports,
            edition
        );
    }
    
    /**
     * Builds a deployment transaction with placeholder certificates and verifying keys for each function in the program.
     * Intended for use with a local devnode.
     * `getOrInitConsensusVersionTestHeights` must be called with development heights prior to invoking this method for it to work properly.
     *
     * @param {DeployOptions} options - The options for the deployment transaction.
     * @returns {string} The transaction id of the deployed program or a failure message from the network
     *
     * @example
     * /// Import the mainnet version of the sdk.
     * import { ProgramManager, NetworkRecordProvider, getOrInitConsensusVersionTestHeights } from "@provablehq/sdk/mainnet.js";
     * 
     * // Initialize the development consensus heights in order to work with a local devnode.
     * getOrInitConsensusVersionTestHeights("0,1,2,3,4,5,6,7,8,9,10,11,12");
     *
     * // Create a new NetworkClient, and RecordProvider
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     * keyProvider.useCache(true);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for deployments
     * const program = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
     * const programManager = new ProgramManager("http://localhost:3030", recordProvider);
     * programManager.setAccount(Account);
     *
     * // Define a fee in credits
     * const priorityFee = 0.0;
     *
     * // Create the deployment transaction.
     * const tx = await programManager.buildDevnodeDeploymentTransaction({program: program, fee: priorityFee, privateFee: false});
     * await programManager.networkClient.submitTransaction(tx);
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx.id());
     *  assert(transaction.id() === tx.id());
     * }, 20000);
     */
    async buildDevnodeDeploymentTransaction(
        options: DeployOptions
    ): Promise<Transaction> {
        const { program, priorityFee, privateFee, recordSearchParams } = options;
        let feeRecord = options.feeRecord;
        let privateKey = options.privateKey;

        // Ensure the program is valid.
        let programObject;
        try {
            programObject = Program.fromString(program);
        } catch (e: any) {
            logAndThrow(
                `Error parsing program: '${e.message}'. Please ensure the program is valid.`,
            );
        }

        // Ensure the program is valid and does not exist on the network
        try {
            let programSource;
            try {
                programSource = await this.networkClient.getProgram(
                    programObject.id(),
                );
            } catch (e) {
                // Program does not exist on the network, deployment can proceed
                console.log(
                    `Program ${programObject.id()} does not exist on the network, deploying...`,
                );
            }
            if (typeof programSource === "string") {
                throw Error(`Program ${programObject.id()} already exists on the network, please rename your program`);
            }
        } catch (e: any) {
            logAndThrow(`Error validating program: ${e.message}`);
        }

        // Get the private key from the account if it is not provided in the parameters
        let deploymentPrivateKey = privateKey;
        if (
            typeof privateKey === "undefined" &&
            typeof this.account !== "undefined"
        ) {
            deploymentPrivateKey = this.account.privateKey();
        }

        if (typeof deploymentPrivateKey === "undefined") {
            throw "No private key provided and no private key set in the ProgramManager";
        }

        // Get the fee record from the account if it is not provided in the parameters
        try {
            if (privateFee) {
                let fee = priorityFee;
                // If a private fee is specified, but no fee record is provided, estimate the fee and find a matching record.
                if (!feeRecord) {
                    console.log("Private fee specified, but no private fee record provided, estimating fee and finding a matching fee record.")
                    const programString = programObject.toString();
                    const imports = await this.networkClient.getProgramImports(programString);
                    const baseFee = Number(WasmProgramManager.estimateDeploymentFee(programString, imports));
                    fee = baseFee + priorityFee;
                }

                // Get a credits.aleo record for the fee.
                feeRecord = await this.getCreditsRecord(
                    fee,
                    [],
                    feeRecord,
                    recordSearchParams
                )
            } else {
                // If it's specified NOT to use a privateFee, use a public fee.
                feeRecord = undefined
            }
        } catch (e: any) {
            logAndThrow(
                `Error finding fee record. Record finder response: '${e.message}'. Please ensure you're connected to a valid Aleo network and a record with enough balance exists.`,
            );
        }

        // Resolve the program imports if they exist
        let imports;
        try {
            imports = await this.networkClient.getProgramImports(program);
        } catch (e: any) {
            logAndThrow(
                `Error finding program imports. Network response: '${e.message}'. Please ensure you're connected to a valid Aleo network and the program is deployed to the network.`,
            );
        }
        
        return await WasmProgramManager.buildDevnodeDeploymentTransaction(
            deploymentPrivateKey,
            program,
            priorityFee,
            feeRecord,
            this.host,
            imports,
        );
    }

    /**
     * Builds an upgrade transaction on a local devnodewith placeholder certificates and verifying keys for each function in the program.
     * This method is only intended for use with a local devnode.
     *
     * @param {DeployOptions} options - The options for the deployment transaction.
     * @returns {string} The transaction id of the deployed program or a failure message from the network
     *
     * @example
     * /// Import the mainnet version of the sdk.
     * import { ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a new NetworkClient, and RecordProvider
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     * keyProvider.useCache(true);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for deployments
     * const program = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
     * const programManager = new ProgramManager("http://localhost:3030", recordProvider);
     * programManager.setAccount(Account);
     *
     * // Define a fee in credits
     * const priorityFee = 0.0;
     *
     * // Create the deployment transaction.
     * const tx = await programManager.buildDevnodeUpgradeTransaction({program: program, fee: priorityFee, privateFee: false});
     * await programManager.networkClient.submitTransaction(tx);
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx.id());
     *  assert(transaction.id() === tx.id());
     * }, 20000);
     */
    async buildDevnodeUpgradeTransaction(
        options: DeployOptions
    ): Promise<Transaction> {
        const { program, priorityFee, privateFee, recordSearchParams } = options;
        let feeRecord = options.feeRecord;
        let privateKey = options.privateKey;

        // Ensure the program is valid.
        let programObject;
        try {
            programObject = Program.fromString(program);
        } catch (e: any) {
            logAndThrow(
                `Error parsing program: '${e.message}'. Please ensure the program is valid.`,
            );
        }

        // Ensure the program is valid and does not exist on the network.
        try {
            let programSource;
            try {
                programSource = await this.networkClient.getProgram(
                    programObject.id(),
                );
            } catch (e) {
                // Program does not exist on the network.
                logAndThrow(
                    `Program ${programObject.id()} does not exist on the network...`,
                );
            }
        } catch (e: any) {
            logAndThrow(`Error validating program: ${e.message}`);
        }

        // Get the private key from the account if it is not provided in the parameters
        let deploymentPrivateKey = privateKey;
        if (
            typeof privateKey === "undefined" &&
            typeof this.account !== "undefined"
        ) {
            deploymentPrivateKey = this.account.privateKey();
        }

        if (typeof deploymentPrivateKey === "undefined") {
            throw "No private key provided and no private key set in the ProgramManager";
        }

        // Get the fee record from the account if it is not provided in the parameters
        try {
            if (privateFee) {
                let fee = priorityFee;
                // If a private fee is specified, but no fee record is provided, estimate the fee and find a matching record.
                if (!feeRecord) {
                    console.log("Private fee specified, but no private fee record provided, estimating fee and finding a matching fee record.")
                    const programString = programObject.toString();
                    const imports = await this.networkClient.getProgramImports(programString);
                    const baseFee = Number(WasmProgramManager.estimateDeploymentFee(programString, imports));
                    fee = baseFee + priorityFee;
                }

                // Get a credits.aleo record for the fee.
                feeRecord = await this.getCreditsRecord(
                    fee,
                    [],
                    feeRecord,
                    recordSearchParams
                )
            } else {
                // If it's specified NOT to use a privateFee, use a public fee.
                feeRecord = undefined
            }
        } catch (e: any) {
            logAndThrow(
                `Error finding fee record. Record finder response: '${e.message}'. Please ensure you're connected to a valid Aleo network and a record with enough balance exists.`,
            );
        }

        // Resolve the program imports if they exist
        let imports;
        try {
            imports = await this.networkClient.getProgramImports(program);
        } catch (e: any) {
            logAndThrow(
                `Error finding program imports. Network response: '${e.message}'. Please ensure you're connected to a valid Aleo network and the program is deployed to the network.`,
            );
        }
        return WasmProgramManager.buildDevnodeUpgradeTransaction(
            deploymentPrivateKey,
            program,
            priorityFee,
            feeRecord,
            this.host,
            imports,
        );
    }

}

// Ensure the transfer type requires an amount record
function requiresAmountRecord(transferType: string): boolean {
    return PRIVATE_TRANSFER_TYPES.has(transferType);
}

// Validate the transfer type
function validateTransferType(transferType: string): string {
    return VALID_TRANSFER_TYPES.has(transferType)
        ? transferType
        : logAndThrow(
            `Invalid transfer type '${transferType}'. Valid transfer types are 'private', 'privateToPublic', 'public', and 'publicToPrivate'.`,
        );
}

export { ProgramManager, AuthorizationOptions, FeeAuthorizationOptions, ExecuteOptions, ProvingRequestOptions, ExternalSigningOptions };
