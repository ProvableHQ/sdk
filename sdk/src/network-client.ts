import { get, post, parseJSON, logAndThrow, retryWithBackoff, environment } from "./utils.js";
import { Account } from "./account.js";
import { BlockJSON } from "./models/blockJSON.js";
import { TransactionJSON } from "./models/transaction/transactionJSON.js";
import {
    Address,
    Plaintext,
    RecordCiphertext,
    Program,
    ProvingRequest,
    RecordPlaintext,
    PrivateKey,
    Transaction,
} from "./wasm.js";
import { ConfirmedTransactionJSON } from "./models/confirmed_transaction.js";
import { ProvingResponse } from "./models/provingResponse.js";

type ProgramImports = { [key: string]: string | Program };

interface AleoNetworkClientOptions {
    headers?: { [key: string]: string };
}

/**
 * Options for submitting a proving request.
 *
 * @property provingRequest {ProvingRequest | string} The proving request being submitted to the network.
 * @property url {string} The URL of the delegated proving service.
 * @property apiKey {string} The API key to use for authentication.
 */
interface DelegatedProvingParams {
    provingRequest: ProvingRequest | string;
    url?: string;
    apiKey?: string;
}

/**
 * Client library that encapsulates REST calls to publicly exposed endpoints of Aleo nodes. The methods provided in this
 * allow users to query public information from the Aleo blockchain and submit transactions to the network.
 *
 * @param {string} host
 * @example
 * // Connection to a local node.
 * const localNetworkClient = new AleoNetworkClient("http://0.0.0.0:3030", undefined, account);
 *
 * // Connection to a public beacon node
 * const account = Account.fromCiphertext(process.env.ciphertext, process.env.password);
 * const publicNetworkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined, account);
 */
class AleoNetworkClient {
    host: string;
    headers: { [key: string]: string };
    account: Account | undefined;
    ctx: { [key: string]: string };
    verboseErrors: boolean;
    readonly network: string;

    constructor(host: string, options?: AleoNetworkClientOptions) {
        this.host = host + "/%%NETWORK%%";
        this.network = "%%NETWORK%%";
        this.ctx = {};
        this.verboseErrors = true;

        if (options && options.headers) {
            this.headers = options.headers;
        } else {
            this.headers = {
                // This is replaced by the actual version by a Rollup plugin
                "X-Aleo-SDK-Version": "%%VERSION%%",
                "X-Aleo-environment" : environment(),
            };
        }
    }

    /**
     * Set an account to use in networkClient calls
     *
     * @param {Account} account Set an account to use for record scanning functions.
     * @example
     * import { Account, AleoNetworkClient } from "@provablehq/sdk/mainnet.js";
     *
     * const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1");
     * const account = new Account();
     * networkClient.setAccount(account);
     */
    setAccount(account: Account) {
        this.account = account;
    }

    /**
     * Return the Aleo account used in the networkClient
     *
     * @example
     * const account = networkClient.getAccount();
     */
    getAccount(): Account | undefined {
        return this.account;
    }

    /**
     * Set a new host for the networkClient
     *
     * @param {string} host The address of a node hosting the Aleo API
     *
     * @example
     * import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a networkClient that connects to a local node.
     * const networkClient = new AleoNetworkClient("http://0.0.0.0:3030", undefined);
     *
     * // Set the host to a public node.
     * networkClient.setHost("http://api.explorer.provable.com/v1");
     */
    setHost(host: string) {
        this.host = host + "/%%NETWORK%%";
    }

    /**
     * Set verbose errors to true or false for the `AleoNetworkClient`. When set to true, if `submitTransaction` fails, the failure responses will report descriptive information as to why the transaction failed.
     *
     * @param {boolean} verboseErrors Set verbose error mode to true or false for the AleoNetworkClient.
     * @example
     * import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a networkClient
     * const networkClient = new AleoNetworkClient();
     *
     * // Set debug mode to true
     * networkClient.setVerboseTransactionErrors(true);
     **/
    setVerboseErrors(verboseErrors: boolean) {
        this.verboseErrors = verboseErrors;
    }

    /**
     * Set a header in the `AleoNetworkClient`s header map
     *
     * @param {string} headerName The name of the header to set
     * @param {string} value The header value
     *
     * @example
     * import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a networkClient
     * const networkClient = new AleoNetworkClient();
     *
     * // Set the value of the `Accept-Language` header to `en-US`
     * networkClient.setHeader('Accept-Language', 'en-US');
     */
    setHeader(headerName: string, value: string) {
        this.headers[headerName] = value;
    }

    removeHeader(headerName: string) {
        delete this.headers[headerName];
    }

    /**
     * Fetches data from the Aleo network and returns it as a JSON object.
     *
     * @param url The URL to fetch data from.
     */
    async fetchData<Type>(url = "/"): Promise<Type> {
        try {
            const raw = await this.fetchRaw(url);
            return parseJSON(raw);
        } catch (error) {
            throw new Error(`Error fetching data: ${error}`);
        }
    }

    /**
     * Fetches data from the Aleo network and returns it as an unparsed string.
     *
     * This method should be used when it is desired to reconstitute data returned
     * from the network into a WASM object.
     *
     * @param url
     */
    async fetchRaw(url = "/"): Promise<string> {
        try {
            const ctx = {...this.ctx};
            return await retryWithBackoff(async () => {
                const response = await get(this.host + url, {
                    headers: {
                        ...this.headers,
                        ...ctx,
                    },
                });
                return await response.text();
            });
        } catch (error) {
            throw new Error(`Error fetching data: ${error}`);
        }
    }

    /**
     * Wrapper around the POST helper to allow mocking in tests. Not meant for use in production.
     *
     * @param url The URL to POST to.
     * @param options The RequestInit options for the POST request.
     * @returns The Response object from the POST request.
     */
    private async _sendPost(url: string, options: RequestInit) {
        return post(url, options);
    }

    /**
     * Attempt to find records in the Aleo blockchain.
     *
     * @param {number} startHeight - The height at which to start searching for unspent records
     * @param {number} endHeight - The height at which to stop searching for unspent records
     * @param {boolean} unspent - Whether to search for unspent records only
     * @param {string[]} programs - The program(s) to search for unspent records in
     * @param {number[]} amounts - The amounts (in microcredits) to search for (eg. [100, 200, 3000])
     * @param {number} maxMicrocredits - The maximum number of microcredits to search for
     * @param {string[]} nonces - The nonces of already found records to exclude from the search
     * @param {string | PrivateKey} privateKey - An optional private key to use to find unspent records.
     * @returns {Promise<Array<RecordPlaintext>>} An array of records belonging to the account configured in the network client.
     *
     * @example
     * import { Account, AleoNetworkClient } from "@provablehq/sdk/mainnet.js";
     *
     * // Import an account from a ciphertext and password.
     * const account = Account.fromCiphertext(process.env.ciphertext, process.env.password);
     *
     * // Create a network client.
     * const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
     * networkClient.setAccount(account);
     *
     * // Find specific amounts
     * const startHeight = 500000;
     * const amounts = [600000, 1000000];
     * const records = networkClient.findRecords(startHeight, undefined, true, ["credits.aleo"] amounts);
     *
     * // Find specific amounts with a maximum number of cumulative microcredits
     * const maxMicrocredits = 100000;
     * const records = networkClient.findRecords(startHeight, undefined, true, ["credits.aleo"] undefined, maxMicrocredits);
     */
    async findRecords(
        startHeight: number,
        endHeight: number | undefined,
        unspent: boolean = false,
        programs?: string[],
        amounts?: number[] | undefined,
        maxMicrocredits?: number | undefined,
        nonces?: string[] | undefined,
        privateKey?: string | PrivateKey | undefined,
    ): Promise<Array<RecordPlaintext>> {
        nonces = nonces || [];
        // Ensure start height is not negative
        if (startHeight < 0) {
            throw new Error("Start height must be greater than or equal to 0");
        }

        // Initialize search parameters
        const records = new Array<RecordPlaintext>();
        let start;
        let end;
        let resolvedPrivateKey: PrivateKey;
        let failures = 0;
        let totalRecordValue = BigInt(0);
        let latestHeight: number;

        // Ensure a private key is present to find owned records
        if (typeof privateKey === "undefined") {
            if (typeof this.account === "undefined") {
                throw new Error(
                    "Private key must be specified in an argument to findOwnedRecords or set in the AleoNetworkClient",
                );
            } else {
                resolvedPrivateKey = this.account._privateKey;
            }
        } else {
            try {
                resolvedPrivateKey =
                    privateKey instanceof PrivateKey
                        ? privateKey
                        : PrivateKey.from_string(privateKey);
            } catch (error) {
                throw new Error("Error parsing private key provided.");
            }
        }
        const viewKey = resolvedPrivateKey.to_view_key();

        // Get the latest height to ensure the range being searched is valid
        try {
            const blockHeight = await this.getLatestHeight();
            if (typeof blockHeight === "number") {
                latestHeight = blockHeight;
            } else {
                throw new Error(
                    `Error fetching latest block height: Expected type 'number' got '${typeof blockHeight}'`,
                );
            }
        } catch (error) {
            throw new Error(`Error fetching latest block height: ${error}`);
        }

        // If no end height is specified or is greater than the latest height, set the end height to the latest height
        if (typeof endHeight === "number" && endHeight <= latestHeight) {
            end = endHeight;
        } else {
            end = latestHeight;
        }

        // If the starting is greater than the ending height, return an error
        if (startHeight > end) {
            throw new Error(
                "Start height must be less than or equal to end height.",
            );
        }

        // Iterate through blocks in reverse order in chunks of 50
        while (end > startHeight) {
            start = end - 50;
            if (start < startHeight) {
                start = startHeight;
            }
            try {
                // Get 50 blocks (or the difference between the start and end if less than 50)
                const blocks = await this.getBlockRange(start, end);
                end = start;
                // Iterate through blocks to find unspent records
                for (let i = 0; i < blocks.length; i++) {
                    const block = blocks[i];
                    const transactions = block.transactions;
                    if (!(typeof transactions === "undefined")) {
                        for (let j = 0; j < transactions.length; j++) {
                            const confirmedTransaction = transactions[j];
                            // Search for unspent records in execute transactions of credits.aleo
                            if (confirmedTransaction.type == "execute") {
                                const transaction =
                                    confirmedTransaction.transaction;
                                if (
                                    transaction.execution &&
                                    !(
                                        typeof transaction.execution
                                            .transitions == "undefined"
                                    )
                                ) {
                                    for (
                                        let k = 0;
                                        k <
                                        transaction.execution.transitions
                                            .length;
                                        k++
                                    ) {
                                        const transition =
                                            transaction.execution.transitions[
                                                k
                                                ];
                                        // Only search for unspent records in the specified programs.
                                        if (
                                            !(typeof programs === "undefined")
                                        ) {
                                            if (
                                                !programs.includes(
                                                    transition.program,
                                                )
                                            ) {
                                                continue;
                                            }
                                        }
                                        if (
                                            !(
                                                typeof transition.outputs ==
                                                "undefined"
                                            )
                                        ) {
                                            for (
                                                let l = 0;
                                                l < transition.outputs.length;
                                                l++
                                            ) {
                                                const output =
                                                    transition.outputs[l];
                                                if (output.type === "record") {
                                                    try {
                                                        // Create a wasm record ciphertext object from the found output
                                                        const record =
                                                            RecordCiphertext.fromString(
                                                                output.value,
                                                            );
                                                        // Determine if the record is owned by the specified view key
                                                        if (
                                                            record.isOwner(
                                                                viewKey,
                                                            )
                                                        ) {
                                                            // Decrypt the record and get the serial number
                                                            const recordPlaintext =
                                                                record.decrypt(
                                                                    viewKey,
                                                                );

                                                            // If the record has already been found, skip it
                                                            const nonce =
                                                                recordPlaintext.nonce();
                                                            if (
                                                                nonces.includes(
                                                                    nonce,
                                                                )
                                                            ) {
                                                                continue;
                                                            }

                                                            if (unspent) {
                                                                const recordViewKey = recordPlaintext.recordViewKey(viewKey).toString();
                                                                // Otherwise record the nonce that has been found
                                                                const serialNumber =
                                                                    recordPlaintext.serialNumberString(
                                                                        resolvedPrivateKey,
                                                                        "credits.aleo",
                                                                        "credits",
                                                                        recordViewKey
                                                                    );
                                                                // Attempt to see if the serial number is spent
                                                                try {
                                                                    await retryWithBackoff(
                                                                        () =>
                                                                            this.getTransitionId(
                                                                                serialNumber,
                                                                            ),
                                                                    );
                                                                    continue;
                                                                } catch (error) {
                                                                    console.log(
                                                                        "Found unspent record!",
                                                                    );
                                                                }
                                                            }

                                                            // Add the record to the list of records if the user did not specify amounts.
                                                            if (!amounts) {
                                                                records.push(
                                                                    recordPlaintext,
                                                                );
                                                                // If the user specified a maximum number of microcredits, check if the search has found enough
                                                                if (
                                                                    typeof maxMicrocredits ===
                                                                    "number"
                                                                ) {
                                                                    totalRecordValue +=
                                                                        recordPlaintext.microcredits();
                                                                    // Exit if the search has found the amount specified
                                                                    if (
                                                                        totalRecordValue >=
                                                                        BigInt(
                                                                            maxMicrocredits,
                                                                        )
                                                                    ) {
                                                                        return records;
                                                                    }
                                                                }
                                                            }

                                                            // If the user specified a list of amounts, check if the search has found them
                                                            if (
                                                                !(
                                                                    typeof amounts ===
                                                                    "undefined"
                                                                ) &&
                                                                amounts.length >
                                                                0
                                                            ) {
                                                                let amounts_found = 0;
                                                                if (
                                                                    recordPlaintext.microcredits() >
                                                                    amounts[
                                                                        amounts_found
                                                                        ]
                                                                ) {
                                                                    amounts_found += 1;
                                                                    records.push(
                                                                        recordPlaintext,
                                                                    );
                                                                    // If the user specified a maximum number of microcredits, check if the search has found enough
                                                                    if (
                                                                        typeof maxMicrocredits ===
                                                                        "number"
                                                                    ) {
                                                                        totalRecordValue +=
                                                                            recordPlaintext.microcredits();
                                                                        // Exit if the search has found the amount specified
                                                                        if (
                                                                            totalRecordValue >=
                                                                            BigInt(
                                                                                maxMicrocredits,
                                                                            )
                                                                        ) {
                                                                            return records;
                                                                        }
                                                                    }
                                                                    if (
                                                                        records.length >=
                                                                        amounts.length
                                                                    ) {
                                                                        return records;
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    } catch (error) {}
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                // If there is an error fetching blocks, log it and keep searching
                console.warn(
                    "Error fetching blocks in range: " +
                    start.toString() +
                    "-" +
                    end.toString(),
                );
                console.warn("Error: ", error);
                failures += 1;
                if (failures > 10) {
                    console.warn(
                        "10 failures fetching records reached. Returning records fetched so far",
                    );
                    return records;
                }
            }
        }
        return records;
    }

    /**
     * Attempts to find unspent records in the Aleo blockchain.
     *
     * @param {number} startHeight - The height at which to start searching for unspent records
     * @param {number} endHeight - The height at which to stop searching for unspent records
     * @param {string[]} programs - The program(s) to search for unspent records in
     * @param {number[]} amounts - The amounts (in microcredits) to search for (eg. [100, 200, 3000])
     * @param {number} maxMicrocredits - The maximum number of microcredits to search for
     * @param {string[]} nonces - The nonces of already found records to exclude from the search
     * @param {string | PrivateKey} privateKey - An optional private key to use to find unspent records.
     * @returns {Promise<Array<RecordPlaintext>>} An array of unspent records belonging to the account configured in the network client.
     *
     * @example
     * import { Account, AleoNetworkClient } from "@provablehq/sdk/mainnet.js";
     *
     * const account = Account.fromCiphertext(process.env.ciphertext, process.env.password);
     *
     * // Create a network client and set an account to search for records with.
     * const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
     * networkClient.setAccount(account);
     *
     * // Find specific amounts
     * const startHeight = 500000;
     * const endHeight = 550000;
     * const amounts = [600000, 1000000];
     * const records = networkClient.findUnspentRecords(startHeight, endHeight, ["credits.aleo"], amounts);
     *
     * // Find specific amounts with a maximum number of cumulative microcredits
     * const maxMicrocredits = 100000;
     * const records = networkClient.findUnspentRecords(startHeight, undefined, ["credits.aleo"], undefined, maxMicrocredits);
     */
    async findUnspentRecords(
        startHeight: number,
        endHeight: number | undefined,
        programs?: string[],
        amounts?: number[] | undefined,
        maxMicrocredits?: number | undefined,
        nonces?: string[] | undefined,
        privateKey?: string | PrivateKey | undefined,
    ): Promise<Array<RecordPlaintext>> {
        try {
            this.ctx = { "X-ALEO-METHOD": "findUnspentRecords" };
            return await this.findRecords(
                startHeight,
                endHeight,
                true,
                programs,
                amounts,
                maxMicrocredits,
                nonces,
                privateKey,
            );
        } catch (error) {
            throw new Error("Error finding unspent records: " + error);
        } finally {
            this.ctx = {};
        }
    }

    /**
     * Returns the contents of the block at the specified block height.
     *
     * @param {number} blockHeight - The height of the block to fetch
     * @returns {Promise<BlockJSON>} A javascript object containing the block at the specified height
     *
     * @example
     * const block = networkClient.getBlock(1234);
     */
    async getBlock(blockHeight: number): Promise<BlockJSON> {
        try {
            this.ctx = { "X-ALEO-METHOD": "getBlock" };
            const block = await this.fetchData<BlockJSON>(
                "/block/" + blockHeight,
            );
            return block;
        } catch (error) {
            throw new Error(`Error fetching block ${blockHeight}: ${error}`);
        } finally {
            this.ctx = {};
        }
    }

    /**
     * Returns the contents of the block with the specified hash.
     *
     * @param {string} blockHash The hash of the block to fetch.
     * @returns {Promise<BlockJSON>} A javascript object representation of the block matching the hash.
     *
     * @example
     * import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";
     *
     * const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
     * const block = networkClient.getBlockByHash("ab19dklwl9vp63zu3hwg57wyhvmqf92fx5g8x0t6dr72py8r87pxupqfne5t9");
     */
    async getBlockByHash(blockHash: string): Promise<BlockJSON> {
        try {
            this.ctx = { "X-ALEO-METHOD": "getBlockByHash" };
            const block = await this.fetchData<BlockJSON>(
                `/block/${blockHash}`,
            );
            return block;
        } catch (error) {
            throw new Error(`Error fetching block ${blockHash}: ${error}`);
        } finally {
            this.ctx = {};
        }
    }

    /**
     * Returns a range of blocks between the specified block heights. A maximum of 50 blocks can be fetched at a time.
     *
     * @param {number} start Starting block to fetch.
     * @param {number} end Ending block to fetch. This cannot be more than 50 blocks ahead of the start block.
     * @returns {Promise<Array<BlockJSON>>} An array of block objects
     *
     * @example
     * import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";
     *
     * // Fetch 50 blocks.
     * const (start, end) = (2050, 2100);
     * const blockRange = networkClient.getBlockRange(start, end);
     *
     * let cursor = start;
     * blockRange.forEach((block) => {
     *   assert(block.height == cursor);
     *   cursor += 1;
     *  }
     */
    async getBlockRange(start: number, end: number): Promise<Array<BlockJSON>> {
        try {
            this.ctx = { "X-ALEO-METHOD": "getBlockRange" };
            return await this.fetchData<Array<BlockJSON>>(
                "/blocks?start=" + start + "&end=" + end,
            );
        } catch (error) {
            throw new Error(
                `Error fetching blocks between ${start} and ${end}: ${error}`,
            );
        } finally {
            this.ctx = {};
        }
    }

    /**
     * Returns the deployment transaction id associated with the specified program.
     *
     * @param {Program | string} program The name of the deployed program OR a wasm Program object.
     * @returns {Promise<string>} The transaction ID of the deployment transaction.
     *
     * @example
     * import { AleoNetworkClient } from "@provablehq/sdk/testnet.js";
     *
     * // Get the transaction ID of the deployment transaction for a program.
     * const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
     * const transactionId = networkClient.getDeploymentTransactionIDForProgram("hello_hello.aleo");
     *
     * // Get the transaction data for the deployment transaction.
     * const transaction = networkClient.getTransactionObject(transactionId);
     *
     * // Get the verifying keys for the functions in the deployed program.
     * const verifyingKeys = transaction.verifyingKeys();
     */
    async getDeploymentTransactionIDForProgram(
        program: Program | string,
    ): Promise<string> {
        this.ctx = { "X-ALEO-METHOD": "getDeploymentTransactionIDForProgram" };
        if (program instanceof Program) {
            program = program.id();
        }
        try {
            const id = await this.fetchData<string>(
                "/find/transactionID/deployment/" + program,
            );
            return id.replace('"', "");
        } catch (error) {
            throw new Error(
                `Error fetching deployment transaction for program ${program}: ${error}`,
            );
        } finally {
            this.ctx = {};
        }
    }

    /**
     * Returns the deployment transaction associated with a specified program as a JSON object.
     *
     * @param {Program | string} program The name of the deployed program OR a wasm Program object.
     * @returns {Promise<Transaction>} JSON representation of the deployment transaction.
     *
     * @example
     * import { AleoNetworkClient, DeploymentJSON } from "@provablehq/sdk/testnet.js";
     *
     * // Get the transaction ID of the deployment transaction for a program.
     * const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
     * const transaction = networkClient.getDeploymentTransactionForProgram("hello_hello.aleo");
     *
     * // Get the verifying keys for each function in the deployment.
     * const deployment = <DeploymentJSON>transaction.deployment;
     * const verifyingKeys = deployment.verifying_keys;
     */
    async getDeploymentTransactionForProgram(
        program: Program | string,
    ): Promise<TransactionJSON> {
        if (program instanceof Program) {
            program = program.id();
        }
        try {
            this.ctx = { "X-ALEO-METHOD": "getDeploymentTransactionForProgram" };
            const transaction_id = <string>(
                await this.getDeploymentTransactionIDForProgram(program)
            );
            return <TransactionJSON>await this.getTransaction(transaction_id);
        } catch (error) {
            throw new Error(
                `Error fetching deployment transaction for program ${program}: ${error}`,
            );
        } finally {
            this.ctx = {};
        }
    }

    /**
     * Returns the deployment transaction associated with a specified program as a wasm object.
     *
     * @param {Program | string} program The name of the deployed program OR a wasm Program object.
     * @returns {Promise<Transaction>} Wasm object representation of the deployment transaction.
     *
     * @example
     * import { AleoNetworkClient } from "@provablehq/sdk/testnet.js";
     *
     * // Get the transaction ID of the deployment transaction for a program.
     * const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
     * const transactionId = networkClient.getDeploymentTransactionIDForProgram("hello_hello.aleo");
     *
     * // Get the transaction data for the deployment transaction.
     * const transaction = networkClient.getDeploymentTransactionObjectForProgram(transactionId);
     *
     * // Get the verifying keys for the functions in the deployed program.
     * const verifyingKeys = transaction.verifyingKeys();
     */
    async getDeploymentTransactionObjectForProgram(
        program: Program | string,
    ): Promise<Transaction> {
        try {
            this.ctx = { "X-ALEO-METHOD": "getDeploymentTransactionObjectForProgram" };
            const transaction_id = <string>(
                await this.getDeploymentTransactionIDForProgram(program)
            );
            return await this.getTransactionObject(transaction_id);
        } catch (error) {
            throw new Error(
                `Error fetching deployment transaction for program ${program}: ${error}`,
            );
        } finally {
            this.ctx = {};
        }
    }

    /**
     * Returns the contents of the latest block as JSON.
     *
     * @returns {Promise<BlockJSON>} A javascript object containing the latest block
     *
     * @example
     * import { AleoNetworkClient } from "@provablehq/sdk/testnet.js";
     *
     * // Create a network client.
     * const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
     *
     * const latestHeight = networkClient.getLatestBlock();
     */
    async getLatestBlock(): Promise<BlockJSON> {
        try {
            this.ctx = { "X-ALEO-METHOD": "getLatestBlock" };
            return (await this.fetchData<BlockJSON>(
                "/block/latest",
            )) as BlockJSON;
        } catch (error) {
            throw new Error(`Error fetching latest block: ${error}`);
        } finally {
            this.ctx = {};
        }
    }

    /**
     * Returns the latest committee.
     *
     * @returns {Promise<object>} A javascript object containing the latest committee
     *
     * @example
     * import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a network client.
     * const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
     *
     * // Create a network client and get the latest committee.
     * const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
     * const latestCommittee = await networkClient.getLatestCommittee();
     */
    async getLatestCommittee(): Promise<object> {
        try {
            this.ctx = { "X-ALEO-METHOD": "getLatestCommittee" };
            return await this.fetchData<object>("/committee/latest");
        } catch (error) {
            throw new Error(`Error fetching latest committee: ${error}`);
        } finally {
            this.ctx = {};
        }
    }

    /**
     * Returns the committee at the specified block height.
     *
     * @param {number} blockHeight - The height of the block to fetch the committee for
     * @returns {Promise<object>} A javascript object containing the committee
     *
     * @example
     * import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a network client.
     * const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
     *
     * // Create a network client and get the committee for a specific block.
     * const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
     * const committee = await networkClient.getCommitteeByBlockHeight(1234);
     */
    async getCommitteeByBlockHeight(blockHeight: number): Promise<object> {
        try {
            this.ctx = { "X-ALEO-METHOD": "getCommitteeByBlockHeight" };
            return await this.fetchData<object>(`/committee/${blockHeight}`);
        } catch (error) {
            throw new Error(
                `Error fetching committee at height ${blockHeight}: ${error}`,
            );
        } finally {
            this.ctx = {};
        }
    }

    /**
     * Returns the latest block height.
     *
     * @returns {Promise<number>} The latest block height.
     *
     * @example
     * import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a network client.
     * const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
     *
     * const latestHeight = networkClient.getLatestHeight();
     */
    async getLatestHeight(): Promise<number> {
        try {
            this.ctx = { "X-ALEO-METHOD": "getLatestHeight" };
            return Number(await this.fetchData<bigint>("/block/height/latest"));
        } catch (error) {
            throw new Error(`Error fetching latest height: ${error}`);
        } finally {
            this.ctx = {};
        }
    }

    /**
     * Returns the latest block hash.
     *
     * @returns {Promise<string>} The latest block hash.
     *
     * @example
     * import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a network client.
     * const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
     *
     * // Get the latest block hash.
     * const latestHash = networkClient.getLatestBlockHash();
     */
    async getLatestBlockHash(): Promise<string> {
        try {
            this.ctx = { "X-ALEO-METHOD": "getLatestBlockHash" };
            return String(await this.fetchData<string>("/block/hash/latest"));
        } catch (error) {
            throw new Error(`Error fetching latest hash: ${error}`);
        } finally {
            this.ctx = {};
        }
    }

    /**
     * Returns the source code of a program given a program ID.
     *
     * @param {string} programId The program ID of a program deployed to the Aleo Network.
     * @param {number | undefined} edition The edition of the program to fetch. When this is undefined it will fetch the latest version.
     * @returns {Promise<string>} The source code of the program.
     *
     * @example
     * import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a network client.
     * const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
     *
     * // Get the source code of a program.)
     * @returns {Promise<string>} Source code of the program
     *
     * @example
     * import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a network client.
     * const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
     *
     * const program = networkClient.getProgram("hello_hello.aleo");
     * const expectedSource = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n"
     * assert.equal(program, expectedSource);
     */
    async getProgram(programId: string, edition?: number): Promise<string> {
        try {
            this.ctx = { "X-ALEO-METHOD": "getProgramVersion" };
            if (typeof edition === "number") {
                return await this.fetchData<string>(
                    `/program/${programId}/${edition}`,
                );
            } else {
                return await this.fetchData<string>("/program/" + programId);
            }
        } catch (error) {
            throw new Error(`Error fetching program ${programId}: ${error}`);
        } finally {
            this.ctx = {};
        }
    }

    /**
     * Returns the current program edition deployed on the Aleo network.
     *
     * @param {string} programId The program ID of a program deployed to the Aleo Network.
     * @returns {Promise<number>} The edition of the program.
     *
     * @example
     * import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a network client.
     * const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
     *
     * const programVersion = networkClient.getLatestProgramEdition("hello_hello.aleo");
     * assert.equal(programVersion, 1);
     */
    async getLatestProgramEdition(programId: string): Promise<number> {
        try {
            this.ctx = { "X-ALEO-METHOD": "getLatestProgramEdition" };
            const raw = await this.fetchRaw("/program/" + programId + "/latest_edition");
            return JSON.parse(raw);
        } catch (error) {
            throw new Error(`Error fetching program ${programId}: ${error}`);
        } finally {
            this.ctx = {};
        }
    }

    /**
     * Returns a program object from a program ID or program source code.
     *
     * @param {string} inputProgram The program ID or program source code of a program deployed to the Aleo Network.
     * @param {number | undefined} edition The edition of the program to fetch. When this is undefined it will fetch the latest version.
     * @returns {Promise<Program>} Source code of the program.
     *
     * @example
     * import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a network client.
     * const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
     *
     * const programID = "hello_hello.aleo";
     * const programSource = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n"
     *
     * // Get program object from program ID or program source code
     * const programObjectFromID = await networkClient.getProgramObject(programID);
     * const programObjectFromSource = await networkClient.getProgramObject(programSource);
     *
     * // Both program objects should be equal
     * assert(programObjectFromID.to_string() === programObjectFromSource.to_string());
     */
    async getProgramObject(inputProgram: string, edition?: number): Promise<Program> {
        try {
            this.ctx = { "X-ALEO-METHOD": "getProgramObject" };
            return Program.fromString(
                <string>await this.getProgram(inputProgram, edition),
            );
        } catch (error) {
            throw new Error(
                `${inputProgram} is neither a program name or a valid program: ${error}`,
            );
        } finally {
            this.ctx = {};
        }
    }

    /**
     *  Returns an object containing the source code of a program and the source code of all programs it imports
     *
     * @param {Program | string} inputProgram The program ID or program source code of a program deployed to the Aleo Network
     * @returns {Promise<ProgramImports>} Object of the form { "program_id": "program_source", .. } containing program id & source code for all program imports
     *
     * @example
     * import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";
     *
     * const double_test_source = "import multiply_test.aleo;\n\nprogram double_test.aleo;\n\nfunction double_it:\n    input r0 as u32.private;\n    call multiply_test.aleo/multiply 2u32 r0 into r1;\n    output r1 as u32.private;\n"
     * const double_test = Program.fromString(double_test_source);
     * const expectedImports = {
     *     "multiply_test.aleo": "program multiply_test.aleo;\n\nfunction multiply:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    mul r0 r1 into r2;\n    output r2 as u32.private;\n"
     * }
     *
     * // Create a network client.
     * const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
     *
     * // Imports can be fetched using the program ID, source code, or program object
     * let programImports = await networkClient.getProgramImports("double_test.aleo");
     * assert.deepStrictEqual(programImports, expectedImports);
     *
     * // Using the program source code
     * programImports = await networkClient.getProgramImports(double_test_source);
     * assert.deepStrictEqual(programImports, expectedImports);
     *
     * // Using the program object
     * programImports = await networkClient.getProgramImports(double_test);
     * assert.deepStrictEqual(programImports, expectedImports);
     */
    async getProgramImports(inputProgram: Program | string): Promise<ProgramImports> {
            try {
                this.ctx = { "X-ALEO-METHOD": "getProgramImports" };
                const imports: ProgramImports = {};
                const visited = new Set<string>();
                
                await this._getProgramImportsRecursive(inputProgram, imports, visited);
                
                return imports;
            } catch (error: any) {
                logAndThrow("Error fetching program imports: " + error.message);
            } finally {
                this.ctx = {};
            }
        }

        private async _getProgramImportsRecursive(
            inputProgram: Program | string,
            imports: ProgramImports,
            visited: Set<string>
        ): Promise<void> {
            // Normalize input to a Program object
            let program: Program;
            let programId: string;
            
            if (inputProgram instanceof Program) {
                program = inputProgram;
                programId = program.id();
            } else {
                try {
                    program = Program.fromString(inputProgram);
                    programId = program.id();
                } catch {
                    try {
                        programId = inputProgram;
                        program = await this.getProgramObject(inputProgram);
                    } catch (error2) {
                        throw new Error(
                            `${inputProgram} is neither a program name nor a valid program: ${error2}`,
                        );
                    }
                }
            }

            // Skip if already processed (prevents infinite recursion on circular dependencies)
            if (visited.has(programId)) {
                return;
            }
            visited.add(programId);

            // Get the list of programs that the program imports
            const importList = program.getImports();

            // Recursively get any imports that the imported programs have in a depth-first search
            for (let i = 0; i < importList.length; i++) {
                const import_id = importList[i];
                if (!imports.hasOwnProperty(import_id)) {
                    const programSource = <string>await this.getProgram(import_id);
                    imports[import_id] = programSource;
                    
                    // Recursively process nested imports with shared visited set
                    // Pass the program source to avoid re-fetching
                    await this._getProgramImportsRecursive(programSource, imports, visited);
                }
            }
    }


    /**
     * Get a list of the program names that a program imports.
     *
     * @param {Program | string} inputProgram - The program id or program source code to get the imports of
     * @returns {string[]} - The list of program names that the program imports
     *
     * @example
     * import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a network client.
     * const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
     *
     * const programImportsNames = networkClient.getProgramImports("wrapped_credits.aleo");
     * const expectedImportsNames = ["credits.aleo"];
     * assert.deepStrictEqual(programImportsNames, expectedImportsNames);
     */
    async getProgramImportNames(
        inputProgram: Program | string,
    ): Promise<string[]> {
        try {
            this.ctx = { "X-ALEO-METHOD": "getProgramImportNames" };
            const program =
                inputProgram instanceof Program
                    ? inputProgram
                    : <Program>await this.getProgramObject(inputProgram);
            return program.getImports();
        } catch (error: any) {
            throw new Error(
                `Error fetching imports for program ${inputProgram instanceof Program ? inputProgram.id() : inputProgram}: ${error.message}`,
            );
        } finally {
            this.ctx = {};
        }
    }

    /**
     * Returns the names of the mappings of a program.
     *
     * @param {string} programId - The program ID to get the mappings of (e.g. "credits.aleo")
     * @returns {Promise<Array<string>>} - The names of the mappings of the program.
     *
     * @example
     * import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a network client.
     * const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
     *
     * const mappings = networkClient.getProgramMappingNames("credits.aleo");
     * const expectedMappings = [
     *   "committee",
     *   "delegated",
     *   "metadata",
     *   "bonded",
     *   "unbonding",
     *   "account",
     *   "withdraw"
     * ];
     * assert.deepStrictEqual(mappings, expectedMappings);
     */
    async getProgramMappingNames(programId: string): Promise<Array<string>> {
        try {
            this.ctx = { "X-ALEO-METHOD": "getProgramMappingNames" };
            return await this.fetchData<Array<string>>(
                `/program/${programId}/mappings`,
            );
        } catch (error) {
            throw new Error(
                `Error fetching mappings for program ${programId} - ensure the program exists on chain before trying again: ${error}`,
            );
        } finally {
            this.ctx = {};
        }
    }

    /**
     * Returns the value of a program's mapping for a specific key.
     *
     * @param {string} programId - The program ID to get the mapping value of (e.g. "credits.aleo")
     * @param {string} mappingName - The name of the mapping to get the value of (e.g. "account")
     * @param {string | Plaintext} key - The key to look up in the mapping (e.g. an address for the "account" mapping)
     * @returns {Promise<string>} String representation of the value of the mapping
     *
     * @example
     * import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a network client.
     * const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
     *
     * // Get public balance of an account
     * const mappingValue = networkClient.getMappingValue("credits.aleo", "account", "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px");
     * const expectedValue = "0u64";
     * assert(mappingValue === expectedValue);
     */
    async getProgramMappingValue(
        programId: string,
        mappingName: string,
        key: string | Plaintext,
    ): Promise<string> {
        try {
            this.ctx = { "X-ALEO-METHOD": "getProgramMappingValue" };
            const keyString = key instanceof Plaintext ? key.toString() : key;
            return await this.fetchData<string>(
                `/program/${programId}/mapping/${mappingName}/${keyString}`,
            );
        } catch (error) {
            throw new Error(
                `Error fetching value for key '${key}' in mapping '${mappingName}' in program '${programId}' - ensure the mapping exists and the key is correct: ${error}`,
            );
        } finally {
            this.ctx = {};
        }
    }

    /**
     * Returns the value of a mapping as a wasm Plaintext object. Returning an object in this format allows it to be converted to a Js type and for its internal members to be inspected if it's a struct or array.
     *
     * @param {string} programId - The program ID to get the mapping value of (e.g. "credits.aleo")
     * @param {string} mappingName - The name of the mapping to get the value of (e.g. "bonded")
     * @param {string | Plaintext} key - The key to look up in the mapping (e.g. an address for the "bonded" mapping)
     * @returns {Promise<Plaintext>} String representation of the value of the mapping
     *
     * @example
     * import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a network client.
     * const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
     *
     * // Get the bond state as an account.
     * const unbondedState = networkClient.getMappingPlaintext("credits.aleo", "bonded", "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px");
     *
     * // Get the two members of the object individually.
     * const validator = unbondedState.getMember("validator");
     * const microcredits = unbondedState.getMember("microcredits");
     *
     * // Ensure the expected values are correct.
     * assert.equal(validator, "aleo1u6940v5m0fzud859xx2c9tj2gjg6m5qrd28n636e6fdd2akvfcgqs34mfd");
     * assert.equal(microcredits, BigInt("9007199254740991"));
     *
     * // Get a JS object representation of the unbonded state.
     * const unbondedStateObject = unbondedState.toObject();
     *
     * const expectedState = {
     *     validator: "aleo1u6940v5m0fzud859xx2c9tj2gjg6m5qrd28n636e6fdd2akvfcgqs34mfd",
     *     microcredits: BigInt(9007199254740991)
     * };
     * assert.equal(unbondedState, expectedState);
     */
    async getProgramMappingPlaintext(
        programId: string,
        mappingName: string,
        key: string | Plaintext,
    ): Promise<Plaintext> {
        try {
            this.ctx = { "X-ALEO-METHOD": "getProgramMappingPlaintext" };
            const keyString = key instanceof Plaintext ? key.toString() : key;
            const value = await this.fetchRaw(
                `/program/${programId}/mapping/${mappingName}/${keyString}`,
            );
            return Plaintext.fromString(JSON.parse(value));
        } catch (error) {
            throw new Error("Failed to fetch mapping value." + error);
        } finally {
            this.ctx = {};
        }
    }

    /**
     * Returns the public balance of an address from the account mapping in credits.aleo
     *
     * @param {Address | string} address A string or wasm object representing an address.
     * @returns {Promise<number>} The public balance of the address in microcredits.
     *
     * @example
     * import { AleoNetworkClient, Account } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a network client.
     * const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
     *
     * // Get the balance of an account from either an address object or address string.
     * const account = Account.fromCiphertext(process.env.ciphertext, process.env.password);
     * const publicBalance = await networkClient.getPublicBalance(account.address());
     * const publicBalanceFromString = await networkClient.getPublicBalance(account.address().to_string());
     * assert(publicBalance === publicBalanceFromString);
     */
    async getPublicBalance(address: Address | string): Promise<number> {
        try {
            this.ctx = { "X-ALEO-METHOD": "getPublicBalance" };
            const addressString =
                address instanceof Address ? address.to_string() : address;
            const balanceStr = await this.getProgramMappingValue(
                "credits.aleo",
                "account",
                addressString,
            );
            return balanceStr ? parseInt(balanceStr) : 0;
        } catch (error) {
            throw new Error(
                `Error fetching public balance for ${address}: ${error}`,
            );
        } finally {
            this.ctx = {};
        }
    }

    /**
     * Returns the latest state/merkle root of the Aleo blockchain.
     *
     * @returns {Promise<string>} A string representing the latest state root of the Aleo blockchain.
     *
     * @example
     * import { AleoNetworkClient, Account } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a network client.
     * const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
     *
     * // Get the latest state root.
     * const stateRoot = networkClient.getStateRoot();
     */
    async getStateRoot(): Promise<string> {
        try {
            this.ctx = { "X-ALEO-METHOD": "getStateRoot" };
            return await this.fetchData<string>("/stateRoot/latest");
        } catch (error) {
            throw new Error(`Error fetching latest state root: ${error}`);
        } finally {
            this.ctx = {};
        }
    }

    /**
     * Returns a transaction by its unique identifier.
     *
     * @param {string} transactionId The transaction ID to fetch.
     * @returns {Promise<TransactionJSON>} A json representation of the transaction.
     *
     * @example
     * import { AleoNetworkClient, Account } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a network client.
     * const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
     *
     * const transaction = networkClient.getTransaction("at1handz9xjrqeynjrr0xay4pcsgtnczdksz3e584vfsgaz0dh0lyxq43a4wj");
     */
    async getTransaction(transactionId: string): Promise<TransactionJSON> {
        try {
            this.ctx = { "X-ALEO-METHOD": "getTransaction" };
            return await this.fetchData<TransactionJSON>(
                "/transaction/" + transactionId,
            );
        } catch (error) {
            throw new Error(
                `Error fetching transaction ${transactionId}: ${error}`,
            );
        } finally {
            this.ctx = {};
        }
    }

    /**
     * Returns a confirmed transaction by its unique identifier.
     *
     * @param {string} transactionId The transaction ID to fetch.
     * @returns {Promise<ConfirmedTransactionJSON>} A json object containing the confirmed transaction.
     *
     * @example
     * import { AleoNetworkClient, Account } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a network client.
     * const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
     *
     * const transaction = networkClient.getConfirmedTransaction("at1handz9xjrqeynjrr0xay4pcsgtnczdksz3e584vfsgaz0dh0lyxq43a4wj");
     * assert.equal(transaction.status, "confirmed");
     */
    async getConfirmedTransaction(
        transactionId: string,
    ): Promise<ConfirmedTransactionJSON> {
        try {
            this.ctx = { "X-ALEO-METHOD": "getConfirmedTransaction" };
            return await this.fetchData<ConfirmedTransactionJSON>(
                `/transaction/confirmed/${transactionId}`,
            );
        } catch (error) {
            throw new Error(
                `Error fetching confirmed transaction ${transactionId}: ${error}`,
            );
        } finally {
            this.ctx = {};
        }
    }

    /**
     * Returns a transaction as a wasm object. Getting a transaction of this type will allow the ability for the inputs,
     * outputs, and records to be searched for and displayed.
     *
     * @param {string} transactionId - The unique identifier of the transaction to fetch
     * @returns {Promise<Transaction>} A wasm object representation of the transaction.
     *
     * @example
     * const transactionObject = networkClient.getTransaction("at1handz9xjrqeynjrr0xay4pcsgtnczdksz3e584vfsgaz0dh0lyxq43a4wj");
     * // Get the transaction inputs as a JS array.
     * const transactionInputs = transactionObject.inputs(true);
     *
     * // Get the transaction outputs as a JS object.
     * const transactionOutputs = transactionObject.outputs(true);
     *
     * // Get any records generated in transitions in the transaction as a JS object.
     * const records = transactionObject.records();
     *
     * // Get the transaction type.
     * const transactionType = transactionObject.transactionType();
     * assert.equal(transactionType, "Execute");
     *
     * // Get a JS representation of all inputs, outputs, and transaction metadata.
     * const transactionSummary = transactionObject.summary();
     */
    async getTransactionObject(transactionId: string): Promise<Transaction> {
        try {
            this.ctx = { "X-ALEO-METHOD": "getTransactionObject" };
            const transaction = await this.fetchRaw(
                "/transaction/" + transactionId,
            );
            return Transaction.fromString(transaction);
        } catch (error) {
            throw new Error(
                `Error fetching transaction object ${transactionId}: ${error}`,
            );
        } finally {
            this.ctx = {};
        }
    }

    /**
     * Returns the transactions present at the specified block height.
     *
     * @param {number} blockHeight The block height to fetch the confirmed transactions at.
     * @returns {Promise<Array<ConfirmedTransactionJSON>>} An array of confirmed transactions (in JSON format) for the block height.
     *
     * @example
     * import { AleoNetworkClient, Account } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a network client.
     * const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
     *
     * const transactions = networkClient.getTransactions(654);
     */
    async getTransactions(
        blockHeight: number,
    ): Promise<Array<ConfirmedTransactionJSON>> {
        try {
            this.ctx = { "X-ALEO-METHOD": "getTransactions" };
            return await this.fetchData<Array<ConfirmedTransactionJSON>>(
                "/block/" + blockHeight.toString() + "/transactions",
            );
        } catch (error) {
            throw new Error(`Error fetching transactions: ${error}`);
        } finally {
            this.ctx = {};
        }
    }

    /**
     * Returns the confirmed transactions present in the block with the specified block hash.
     *
     * @param {string} blockHash The block hash to fetch the confirmed transactions at.
     * @returns {Promise<Array<ConfirmedTransactionJSON>>} An array of confirmed transactions (in JSON format) for the block hash.
     *
     * @example
     * import { AleoNetworkClient, Account } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a network client.
     * const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
     *
     * const transactions = networkClient.getTransactionsByBlockHash("ab19dklwl9vp63zu3hwg57wyhvmqf92fx5g8x0t6dr72py8r87pxupqfne5t9");
     */
    async getTransactionsByBlockHash(
        blockHash: string,
    ): Promise<Array<ConfirmedTransactionJSON>> {
        try {
            this.ctx = { "X-ALEO-METHOD": "getTransactionsByBlockHash" };
            const block = await this.fetchData<BlockJSON>(
                `/block/${blockHash}`,
            );
            const height = block.header.metadata.height;
            return await this.getTransactions(Number(height));
        } catch (error) {
            throw new Error(
                `Error fetching transactions for block ${blockHash}: ${error}`,
            );
        } finally {
            this.ctx = {};
        }
    }

    /**
     * Returns the transactions in the memory pool. This method requires access to a validator's REST API.
     *
     * @returns {Promise<Array<TransactionJSON>>} An array of transactions (in JSON format) currently in the mempool.
     *
     * @example
     * import { AleoNetworkClient, Account } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a network client.
     * const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
     *
     * // Get the current transactions in the mempool.
     * const transactions = networkClient.getTransactionsInMempool();
     */
    async getTransactionsInMempool(): Promise<Array<TransactionJSON>> {
        try {
            this.ctx = { "X-ALEO-METHOD": "getTransactionsInMempool" };
            return await this.fetchData<Array<TransactionJSON>>(
                "/memoryPool/transactions",
            );
        } catch (error) {
            throw new Error(
                `Error fetching transactions from mempool: ${error}`,
            );
        } finally {
            this.ctx = {};
        }
    }

    /**
     * Returns the transition ID of the transition corresponding to the ID of the input or output.
     * @param {string} inputOrOutputID - The unique identifier of the input or output to find the transition ID for
     * @returns {Promise<string>} - The transition ID of the input or output ID.
     *
     * @example
     * const transitionId = networkClient.getTransitionId("2429232855236830926144356377868449890830704336664550203176918782554219952323field");
     */
    async getTransitionId(inputOrOutputID: string): Promise<string> {
        try {
            this.ctx = { "X-ALEO-METHOD": "getTransitionId" };
            return await this.fetchData<string>(
                "/find/transitionID/" + inputOrOutputID,
            );
        } catch (error) {
            throw new Error(
                `Error fetching transition ID for input/output ${inputOrOutputID}: ${error}`,
            );
        } finally {
            this.ctx = {};
        }
    }

    /**
     * Submit an execute or deployment transaction to the Aleo network.
     *
     * @param {Transaction | string} transaction - The transaction to submit, either as a Transaction object or string representation
     * @returns {Promise<string>} - The transaction id of the submitted transaction or the resulting error
     */
    async submitTransaction(
        transaction: Transaction | string,
    ): Promise<string> {
        const transactionString =
            transaction instanceof Transaction
                ? transaction.toString()
                : transaction;
        try {
            const endpoint = this.verboseErrors ? "transaction/broadcast?check_transaction=true" : "transaction/broadcast";
            const response = await retryWithBackoff(() =>
                this._sendPost(`${this.host}/${endpoint}`, {
                    body: transactionString,
                    headers: Object.assign({}, {...this.headers, "X-ALEO-METHOD" : "submitTransaction"}, {
                        "Content-Type": "application/json",
                    }),
                }),
            );

            try {
                const text = await response.text();
                return parseJSON(text);
            } catch (error: any) {
                throw new Error(
                    `Error posting transaction. Aleo network response: ${error.message}`,
                );
            }
        } catch (error: any) {
            throw new Error(
                `Error posting transaction: ${error}`,
            );
        }
    }

    /**
     * Submit a solution to the Aleo network.
     *
     * @param {string} solution - The string representation of the solution to submit
     * @returns {Promise<string>} The solution id of the submitted solution or the resulting error.
     */
    async submitSolution(solution: string): Promise<string> {
        try {
            const response = await retryWithBackoff(() =>
                post(this.host + "/solution/broadcast", {
                    body: solution,
                    headers: Object.assign({}, {...this.headers, "X-ALEO-METHOD": "submitSolution"}, {
                        "Content-Type": "application/json",
                    }),
                }),
            );

            try {
                const text = await response.text();
                return parseJSON(text);
            } catch (error: any) {
                throw new Error(
                    `Error posting solution. Aleo network response: ${error.message}`,
                );
            }
        } catch (error: any) {
            throw new Error(
                `Error posting solution: No response received: ${error.message}`,
            );
        }
    }

    /**
     * Submit a `ProvingRequest` to a remote proving service for delegated proving. If the broadcast flag of the `ProvingRequest` is set to `true` the remote service will attempt to broadcast the result `Transaction` on behalf of the requestor.
     *
     * @param {DelegatedProvingParams} options - The optional parameters required to submit a proving request.
     * @returns {Promise<ProvingResponse>} The ProvingResponse containing the transaction result and the result of the broadcast if the `broadcast` flag was set to `true`.
     */
    async submitProvingRequest(options: DelegatedProvingParams): Promise<ProvingResponse> {
        const proverUri = options.url ?? this.host;
        const provingRequestString = options.provingRequest instanceof ProvingRequest
            ? options.provingRequest.toString()
            : options.provingRequest;

        // Build headers with proper auth fallback
        const headers: Record<string, string> = {
          ...this.headers,
          "X-ALEO-METHOD": "submitProvingRequest",
          "Content-Type": "application/json"
        };

        // Add auth header based on what's available
        if (options.apiKey) {
          headers["X-Provable-API-Key"] = options.apiKey;
        }

        try {
            const response = await retryWithBackoff(() =>
                post(`${proverUri}/prove`, {
                body: provingRequestString,
                 headers
                })
            );
            const responseText = await response.text();
            return parseJSON(responseText);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to submit proving request: ${errorMessage}`);
        }
    }

    /**
     * Await a submitted transaction to be confirmed or rejected on the Aleo network.
     *
     * @param {string} transactionId - The transaction ID to wait for confirmation
     * @param {number} checkInterval - The interval in milliseconds to check for confirmation (default: 2000)
     * @param {number} timeout - The maximum time in milliseconds to wait for confirmation (default: 45000)
     * @returns {Promise<Transaction>} The confirmed transaction object that returns if the transaction is confirmed.
     *
     * @example
     * import { AleoNetworkClient, Account, ProgramManager } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a network client and program manager.
     * const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
     * const programManager = new ProgramManager(networkClient);
     *
     * // Set the account for the program manager.
     * programManager.setAccount(Account.fromCiphertext(process.env.ciphertext, process.env.password));
     *
     * // Build a transfer transaction.
     * const tx = await programManager.buildTransferPublicTransaction(100, "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", 0);
     *
     * // Submit the transaction to the network.
     * const transactionId = await networkClient.submitTransaction(tx);
     *
     * // Wait for the transaction to be confirmed.
     * const transaction = await networkClient.waitForTransactionConfirmation(transactionId);
     */
    async waitForTransactionConfirmation(
        transactionId: string,
        checkInterval: number = 2000,
        timeout: number = 45000,
    ): Promise<ConfirmedTransactionJSON> {
        const startTime = Date.now();

        return new Promise((resolve, reject) => {
            const interval = setInterval(async () => {
                const elapsed = Date.now() - startTime;

                if (elapsed > timeout) {
                    clearInterval(interval);
                    return reject(
                        new Error(
                            `Transaction ${transactionId} did not appear after the timeout period of ${interval}ms - consider resubmitting the transaction`,
                        ),
                    );
                }

                try {
                    const res = await fetch(
                        `${this.host}/transaction/confirmed/${transactionId}`,
                        {
                            headers: {
                                ...this.headers,
                                "X-ALEO-METHOD" : "waitForTransactionConfirmation",
                            },
                        },
                    );
                    if (!res.ok) {
                        let text = "";
                        try {
                            text = await res.text();
                            console.warn("Response text from server:", text);
                        } catch (err) {
                            console.warn("Failed to read response text:", err);
                        }

                        // If the transaction ID is malformed (e.g. invalid checksum, wrong length),
                        // the API returns a 4XX with "Invalid URL" — we treat this as a fatal error and stop polling.
                        if (
                            res.status >= 400 &&
                            res.status < 500 &&
                            text.includes("Invalid URL")
                        ) {
                            clearInterval(interval);
                            return reject(
                                new Error(`Malformed transaction ID: ${text}`),
                            );
                        }

                        // Log and continue polling for 404s or 5XX errors in case a tx doesn't exist yet
                        console.warn(
                            "Non-OK response (retrying):",
                            res.status,
                            text,
                        );
                        return;
                    }

                    const data = parseJSON(await res.text());
                    if (data?.status === "accepted") {
                        clearInterval(interval);
                        return resolve(data);
                    }

                    if (data?.status === "rejected") {
                        clearInterval(interval);
                        return reject(
                            new Error(
                                `Transaction ${transactionId} was rejected by the network. Ensure that the account paying the fee has enough credits and that the inputs to the on-chain function are valid.`,
                            ),
                        );
                    }
                } catch (err) {
                    console.error("Polling error:", err);
                }
            }, checkInterval);
        });
    }
}

export { AleoNetworkClient, AleoNetworkClientOptions, ProgramImports };
