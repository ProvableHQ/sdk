import { RecordPlaintext } from "./wasm.js";
import { logAndThrow } from "./utils.js";
import { Account } from "./account.js";
import { AleoNetworkClient } from "./network-client.js";

/**
 * Interface for record search parameters. This allows for arbitrary search parameters to be passed to record provider
 * implementations.
 */
interface RecordSearchParams {
    [key: string]: any; // This allows for arbitrary keys with any type values
}

/**
 * Interface for a record provider. A record provider is used to find records for use in deployment and execution
 * transactions on the Aleo Network. A default implementation is provided by the NetworkRecordProvider class. However,
 * a custom implementation can be provided (say if records are synced locally to a database from the network) by
 * implementing this interface.
 */
interface RecordProvider {
    account: Account

    /**
     * Find a credits.aleo record with a given number of microcredits from the chosen provider
     *
     * @param {Object} params
     * @param {number} params.microcredits The number of microcredits to search for
     * @param {boolean} params.unspent Whether or not the record is unspent
     * @param {string[]} [params.nonces] Nonces of records already found so they are not found again
     * @param {RecordSearchParams} [params.searchParameters] Additional parameters to search for
     * @returns {Promise<RecordPlaintext>} The record if found, otherwise an error
     *
     * @example
     * // A class implementing record provider can be used to find a record with a given number of microcredits
     * const record = await recordProvider.findCreditsRecord({
     *     microcredits: 5000,
     *     unspent: true,
     *     nonces: [],
     * });
     *
     * // When a record is found but not yet used, its nonce should be added to the nonces array so that it is not
     * // found again if a subsequent search is performed
     * const record2 = await recordProvider.findCreditsRecord({
     *     microcredits: 5000,
     *     unspent: true,
     *     nonces: [record.nonce()],
     * });
     *
     * // When the program manager is initialized with the record provider it will be used to find automatically find
     * // fee records and amount records for value transfers so that they do not need to be specified manually
     * const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
     * programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
     */
    findCreditsRecord(params: { microcredits: number, unspent: boolean, nonces?: string[], searchParameters?: RecordSearchParams }): Promise<RecordPlaintext>;

    /**
     * Find a list of credit.aleo records with a given number of microcredits from the chosen provider
     *
     * @param {Object} params
     * @param {number} params.microcreditAmounts A list of separate microcredit amounts to search for (e.g. [5000, 100000])
     * @param {boolean} params.unspent Whether or not the record is unspent
     * @param {string[]} [params.nonces] Nonces of records already found so that they are not found again
     * @param {RecordSearchParams} [params.searchParameters] Additional parameters to search for
     * @returns {Promise<RecordPlaintext[]>} A list of records with a value greater or equal to the amounts specified if such records exist, otherwise an error
     *
     * @example
     * // A class implementing record provider can be used to find a record with a given number of microcredits
     * const records = await recordProvider.findCreditsRecords({
     *     microcredits: [5000, 5000],
     *     unspent: true,
     *     nonces: [],
     * });
     *
     * // When a record is found but not yet used, it's nonce should be added to the nonces array so that it is not
     * // found again if a subsequent search is performed
     * const nonces = [];
     * records.forEach(record => { nonces.push(record.nonce()) });
     * const records2 = await recordProvider.findCreditsRecord(5000, true, nonces);
     *
     * // When the program manager is initialized with the record provider it will be used to find automatically find
     * // fee records and amount records for value transfers so that they do not need to be specified manually
     * const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
     * programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
     */
    findCreditsRecords(params: { microcredits: number[], unspent: boolean, nonces?: string[], searchParameters?: RecordSearchParams }): Promise<RecordPlaintext[]>;

    /**
     * Find an arbitrary record
     * @param {Object} params
     * @param {boolean} params.unspent Whether or not the record is unspent
     * @param {string[]} [params.nonces] Nonces of records already found so that they are not found again
     * @param {RecordSearchParams} [params.searchParameters] Additional parameters to search for
     * @returns {Promise<RecordPlaintext>} The record if found, otherwise an error
     *
     * @example
     * // The RecordSearchParams interface can be used to create parameters for custom record searches which can then
     * // be passed to the record provider. An example of how this would be done for the credits.aleo program is shown
     * // below.
     *
     * class CustomRecordSearch implements RecordSearchParams {
     *     startHeight: number;
     *     endHeight: number;
     *     amount: number;
     *     program: string;
     *     recordName: string;
     *     constructor(startHeight: number, endHeight: number, credits: number, maxRecords: number, programName: string, recordName: string) {
     *         this.startHeight = startHeight;
     *         this.endHeight = endHeight;
     *         this.amount = amount;
     *         this.program = programName;
     *         this.recordName = recordName;
     *     }
     * }
     *
     * const params = new CustomRecordSearch(0, 100, 5000, "credits.aleo", "credits");
     *
     * const record = await recordProvider.findRecord({
     *     unspent: true,
     *     nonces: [],
     *     searchParameters: params,
     * });
     */
    findRecord(params: { unspent: boolean, nonces?: string[], searchParameters?: RecordSearchParams }): Promise<RecordPlaintext>;

    /**
     * Find multiple records from arbitrary programs
     *
     * @param {Object} params
     * @param {boolean} params.unspent Whether or not the record is unspent
     * @param {string[]} [params.nonces] Nonces of records already found so that they are not found again
     * @param {RecordSearchParams} [params.searchParameters] Additional parameters to search for
     * @returns {Promise<RecordPlaintext>} The record if found, otherwise an error
     *
     * // The RecordSearchParams interface can be used to create parameters for custom record searches which can then
     * // be passed to the record provider. An example of how this would be done for the credits.aleo program is shown
     * // below.
     *
     * class CustomRecordSearch implements RecordSearchParams {
     *     startHeight: number;
     *     endHeight: number;
     *     amount: number;
     *     maxRecords: number;
     *     programName: string;
     *     recordName: string;
     *     constructor(startHeight: number, endHeight: number, credits: number, maxRecords: number, programName: string, recordName: string) {
     *         this.startHeight = startHeight;
     *         this.endHeight = endHeight;
     *         this.amount = amount;
     *         this.maxRecords = maxRecords;
     *         this.programName = programName;
     *         this.recordName = recordName;
     *     }
     * }
     *
     * const params = new CustomRecordSearch(0, 100, 5000, 2, "credits.aleo", "credits");
     * const records = await recordProvider.findRecords({
     *     unspent: true,
     *     nonces: [],
     *     searchParameters: params,
     * });
     */
    findRecords(params: { unspent: boolean, nonces?: string[], searchParameters?: RecordSearchParams }): Promise<RecordPlaintext[]>;
}

/**
 * A record provider implementation that uses the official Aleo API to find records for usage in program execution and
 * deployment, wallet functionality, and other use cases.
 */
class NetworkRecordProvider implements RecordProvider {
    account: Account;
    networkClient: AleoNetworkClient;

    constructor(account: Account, networkClient: AleoNetworkClient) {
        this.account = account;
        this.networkClient = networkClient;
    }

    /**
     * Set the account used to search for records
     *
     * @param {Account} account The account to use for searching for records
     */
    setAccount(account: Account) {
        this.account = account;
    }

    /**
     * Find a list of credit records with a given number of microcredits by via the official Aleo API
     *
     * @param {Object} params
     * @param {number[]} params.microcredits The number of microcredits to search for
     * @param {boolean} params.unspent Whether or not the record is unspent
     * @param {string[]} [params.nonces] Nonces of records already found so that they are not found again
     * @param {RecordSearchParams} [params.searchParameters] Additional parameters to search for
     * @returns {Promise<RecordPlaintext>} The record if found, otherwise an error
     *
     * @example
     * // Create a new NetworkRecordProvider
     * const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     *
     * // The record provider can be used to find records with a given number of microcredits
     * const record = await recordProvider.findCreditsRecord(5000, true, []);
     *
     * // When a record is found but not yet used, it's nonce should be added to the nonces parameter so that it is not
     * // found again if a subsequent search is performed
     * const records = await recordProvider.findCreditsRecords({
     *     microcredits: [5000],
     *     unspent: true,
     *     nonces: [record.nonce()],
     * });
     *
     * // When the program manager is initialized with the record provider it will be used to find automatically find
     * // fee records and amount records for value transfers so that they do not need to be specified manually
     * const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
     * programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
     *
     * */
    async findCreditsRecords(params: {
        microcredits: number[],
        unspent: boolean,
        nonces?: string[],
        searchParameters?: RecordSearchParams,
    }): Promise<RecordPlaintext[]> {
        let { microcredits, unspent, nonces, searchParameters } = params;

        let startHeight = 0;
        let endHeight = 0;
        let maxAmount = undefined;

        if (searchParameters) {
            if ("startHeight" in searchParameters && typeof searchParameters["startHeight"] == "number") {
                startHeight = searchParameters["startHeight"];
            }

            if ("endHeight" in searchParameters && typeof searchParameters["endHeight"] == "number") {
                endHeight = searchParameters["endHeight"];
            }

            if ("amounts" in searchParameters && Array.isArray(searchParameters["amounts"]) && searchParameters["amount"].every((item: any) => typeof item === 'number')) {
                microcredits = searchParameters["amounts"];
            }

            if ("maxAmount" in searchParameters && typeof searchParameters["maxAmount"] == "number") {
                maxAmount = searchParameters["maxAmount"];
            }

            if ("unspent" in searchParameters && typeof searchParameters["unspent"] == "boolean") {
                unspent = searchParameters["unspent"]
            }
        }

        // If the end height is not specified, use the current block height
        if (endHeight == 0) {
            const end = await this.networkClient.getLatestHeight();
            endHeight = end;
        }

        // If the start height is greater than the end height, throw an error
        if (startHeight >= endHeight) {
            logAndThrow("Start height must be less than end height");
        }

        return await this.networkClient.findRecords({
            startHeight,
            endHeight,
            unspent,
            programs: ["credits.aleo"],
            amounts: microcredits,
            maxMicrocredits: maxAmount,
            nonces,
            privateKey: this.account.privateKey(),
        });
    }

    /**
     * Find a credit record with a given number of microcredits by via the official Aleo API
     *
     * @param {Object} params
     * @param {number} params.microcredits The number of microcredits to search for
     * @param {boolean} params.unspent Whether or not the record is unspent
     * @param {string[]} [params.nonces] Nonces of records already found so that they are not found again
     * @param {RecordSearchParams} [params.searchParameters] Additional parameters to search for
     * @returns {Promise<RecordPlaintext>} The record if found, otherwise an error
     *
     * @example
     * // Create a new NetworkRecordProvider
     * const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     *
     * // The record provider can be used to find records with a given number of microcredits
     * const record = await recordProvider.findCreditsRecord({
     *     microcredits: 5000,
     *     unspent: true,
     *     nonces: [],
     * });
     *
     * // When a record is found but not yet used, it's nonce should be added to the nonces parameter so that it is not
     * // found again if a subsequent search is performed
     * const records = await recordProvider.findCreditsRecords(5000, true, [record.nonce()]);
     *
     * // When the program manager is initialized with the record provider it will be used to find automatically find
     * // fee records and amount records for value transfers so that they do not need to be specified manually
     * const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
     * programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
     */
    async findCreditsRecord(params: {
        microcredits: number,
        unspent: boolean,
        nonces?: string[],
        searchParameters?: RecordSearchParams,
    }): Promise<RecordPlaintext> {
        const { microcredits, unspent, nonces, searchParameters } = params;

        let records = null;

        try {
            records = await this.findCreditsRecords({
                microcredits: [microcredits],
                unspent,
                nonces,
                searchParameters,
            });
        } catch (e) {
            console.log("No records found with error:", e);
        }

        if (records && records.length > 0) {
            return records[0];
        }

        console.error("Record not found with error:", records);
        throw new Error("Record not found");
    }

    /**
     * Find an arbitrary record. WARNING: This function is not implemented yet and will throw an error.
     */
    async findRecord(params: {
        unspent: boolean,
        nonces?: string[],
        searchParameters?: RecordSearchParams,
    }): Promise<RecordPlaintext> {
        throw new Error("Not implemented");
    }

    /**
     * Find multiple records from a specified program.
     */
    async findRecords(params: {
        unspent: boolean,
        nonces?: string[],
        searchParameters?: RecordSearchParams,
    }): Promise<RecordPlaintext[]> {
        let { unspent, nonces, searchParameters } = params;

        let startHeight = 0;
        let endHeight = 0;
        let amounts = undefined;
        let maxAmount = undefined;
        let programs = undefined;

        if (searchParameters) {
            if ("startHeight" in searchParameters && typeof searchParameters["startHeight"] == "number") {
                startHeight = searchParameters["startHeight"];
            }

            if ("endHeight" in searchParameters && typeof searchParameters["endHeight"] == "number") {
                endHeight = searchParameters["endHeight"];
            }

            if ("amounts" in searchParameters && Array.isArray(searchParameters["amounts"]) && searchParameters["amounts"].every((item: any) => typeof item === 'number')) {
                amounts = searchParameters["amounts"];
            }

            if ("maxAmount" in searchParameters && typeof searchParameters["maxAmount"] == "number") {
                maxAmount = searchParameters["maxAmount"];
            }

            if ("nonces" in searchParameters && Array.isArray(searchParameters["nonces"]) && searchParameters["nonces"].every((item: any) => typeof item === "string")) {
                nonces = searchParameters["nonces"];
            }

            if ("program" in searchParameters && typeof searchParameters["program"] == "string") {
                programs = [searchParameters["program"]];
            }

            if ("programs" in searchParameters && Array.isArray(searchParameters["programs"]) && searchParameters["programs"].every((item: any) => typeof item === "string")) {
                programs = searchParameters["programs"];
            }

            if ("unspent" in searchParameters && typeof searchParameters["unspent"] == "boolean") {
                unspent = searchParameters["unspent"]
            }
        }

        // If the end height is not specified, use the current block height
        if (endHeight == 0) {
            const end = await this.networkClient.getLatestHeight();
            endHeight = end;
        }

        // If the start height is greater than the end height, throw an error
        if (startHeight >= endHeight) {
            logAndThrow("Start height must be less than end height");
        }

        return await this.networkClient.findRecords({
            startHeight,
            endHeight,
            unspent,
            programs,
            amounts,
            maxMicrocredits: maxAmount,
            nonces,
            privateKey: this.account.privateKey(),
        });
    }

}

/**
 * BlockHeightSearch is a RecordSearchParams implementation that allows for searching for records within a given
 * block height range.
 *
 * @example
 * // Create a new BlockHeightSearch
 * const params = new BlockHeightSearch({ startHeight: 89995, endHeight: 99995 });
 *
 * // Create a new NetworkRecordProvider
 * const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
 * const keyProvider = new AleoKeyProvider();
 * const recordProvider = new NetworkRecordProvider(account, networkClient);
 *
 * // The record provider can be used to find records with a given number of microcredits and the block height search
 * // can be used to find records within a given block height range
 * const record = await recordProvider.findCreditsRecord({
 *     microcredits: 5000,
 *     unspent: true,
 *     nonces: [],
 *     searchParameters: params,
 * });
 *
 */
class BlockHeightSearch implements RecordSearchParams {
    startHeight: number;
    endHeight: number;
    constructor(params: { startHeight: number, endHeight: number }) {
        this.startHeight = params.startHeight;
        this.endHeight = params.endHeight;
    }
}

export { BlockHeightSearch, NetworkRecordProvider, RecordProvider, RecordSearchParams};
