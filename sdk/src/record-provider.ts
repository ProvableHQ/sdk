import { RecordPlaintext } from "./wasm.js";
import { logAndThrow } from "./utils.js";
import { Account } from "./account.js";
import { AleoNetworkClient } from "./network-client.js";

/**
 * Interface for record search parameters. This allows for arbitrary search parameters to be passed to record provider
 * implementations.
 */
interface RecordSearchParams {
    unspent: boolean;
    [key: string]: any; // This allows for arbitrary keys with any type values
}

type RecordsResponseFilter = {
    program: boolean;
    record: boolean;
    function: boolean;
    transition: boolean;
    blockHeight: boolean;
    transactionId: boolean;
    transitionId: boolean;
    ioIndex: boolean;
}

type EncryptedRecord = {
    commitment: string;
    checksum?: string;
    blockHeight?: number;
    programName?: string;
    functionName?: string;
    outputIndex?: number;
    owner?: string;
    recordCiphertext?: string;
    recordName?: string;
    recordNonce?: string;
    transactionId?: string;
    transitionId?: string;
    transactionIndex?: number;
    transitionIndex?: number;
}

type OwnedRecord = {
    blockHeight?: number;
    commitment?: string;
    functionName?: string;
    outputIndex?: number;
    owner?: string;
    programName?: string;
    recordCiphertext?: string;
    recordPlaintext?: string;
    recordName?: string;
    spent?: boolean;
    tag?: string;
    transactionId?: string;
    transitionId?: string;
    transactionIndex?: number;
    transitionIndex?: number;
}

interface RecordResponse {
    owner?: string;
}

/**
 * Interface for a record provider. A record provider is used to find records for use in deployment and execution
 * transactions on the Aleo Network. A default implementation is provided by the NetworkRecordProvider class. However,
 * a custom implementation can be provided (say if records are synced locally to a database from the network) by
 * implementing this interface.
 */
interface RecordProvider {
    getEncryptedRecords(recordsFilter: RecordSearchParams, responseFilter: RecordsResponseFilter): Promise<EncryptedRecord[]>;

    serialNumbersExist(serialNumbers: string[]): Promise<Record<string, boolean>>;

    tagsExist(tags: string[]): Promise<Record<string, boolean>>;

    /**
     * Find a credits.aleo record with a given number of microcredits from the chosen provider
     *
     * @param {number} microcredits The number of microcredits to search for
     * @param {boolean} unspent Whether or not the record is unspent
     * @param {string[]} nonces Nonces of records already found so they are not found again
     * @param {RecordSearchParams} searchParameters Additional parameters to search for
     * @returns {Promise<RecordPlaintext>} The record if found, otherwise an error
     *
     * @example
     * // A class implementing record provider can be used to find a record with a given number of microcredits
     * const record = await recordProvider.findCreditsRecord(5000, true, []);
     *
     * // When a record is found but not yet used, its nonce should be added to the nonces array so that it is not
     * // found again if a subsequent search is performed
     * const record2 = await recordProvider.findCreditsRecord(5000, true, [record.nonce()]);
     *
     * // When the program manager is initialized with the record provider it will be used to find automatically find
     * // fee records and amount records for value transfers so that they do not need to be specified manually
     * const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
     * programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
     */
    findCreditsRecord(microcredits: number, searchParameters: RecordSearchParams, nonces?: string[]): Promise<OwnedRecord>;

    /**
     * Find a list of credit.aleo records with a given number of microcredits from the chosen provider
     *
     * @param {number} microcreditAmounts A list of separate microcredit amounts to search for (e.g. [5000, 100000])
     * @param {boolean} unspent Whether or not the record is unspent
     * @param {string[]} nonces Nonces of records already found so that they are not found again
     * @param {RecordSearchParams} searchParameters Additional parameters to search for
     * @returns {Promise<RecordPlaintext[]>} A list of records with a value greater or equal to the amounts specified if such records exist, otherwise an error
     *
     * @example
     * // A class implementing record provider can be used to find a record with a given number of microcredits
     * const records = await recordProvider.findCreditsRecords([5000, 5000], true, []);
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
    findCreditsRecords(microcreditAmounts: number[], searchParameters: RecordSearchParams, nonces?: string[]): Promise<OwnedRecord[]>;

    /**
     * Find an arbitrary record
     * @param {boolean} unspent Whether or not the record is unspent
     * @param {string[]} nonces Nonces of records already found so that they are not found again
     * @param {RecordSearchParams} searchParameters Additional parameters to search for
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
     * const record = await recordProvider.findRecord(true, [], params);
     */
    findRecord(searchParameters: RecordSearchParams, filterFn?: (record: RecordPlaintext) => boolean, nonces?: string[]): Promise<OwnedRecord>;

    /**
     * Find multiple records from arbitrary programs
     *
     * @param {boolean} unspent Whether or not the record is unspent
     * @param {string[]} nonces Nonces of records already found so that they are not found again
     * @param {RecordSearchParams} searchParameters Additional parameters to search for
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
     * const records = await recordProvider.findRecord(true, [], params);
     */
    findRecords(searchParameters?: RecordSearchParams, filterFn?: (record: RecordPlaintext) => boolean, nonces?: string[],): Promise<OwnedRecord[]>;
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
     * @param {number[]} microcredits The number of microcredits to search for
     * @param {boolean} unspent Whether or not the record is unspent
     * @param {string[]} nonces Nonces of records already found so that they are not found again
     * @param {RecordSearchParams} searchParameters Additional parameters to search for
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
     * const records = await recordProvider.findCreditsRecords(5000, true, [record.nonce()]);
     *
     * // When the program manager is initialized with the record provider it will be used to find automatically find
     * // fee records and amount records for value transfers so that they do not need to be specified manually
     * const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
     * programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
     *
     * */
    async findCreditsRecords(microcredits: number[], searchParameters: RecordSearchParams, nonces?: string[]): Promise<OwnedRecord[]> {
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

        const recordsPts = await this.networkClient.findRecords(startHeight, endHeight, searchParameters.unspent, ["credits.aleo"], microcredits, maxAmount, nonces, this.account.privateKey());
        return recordsPts.map((record) => ({
            commitment: record.commitment().toString(),
            owner: record.owner().toString(),
            programName: 'credits.aleo',
            recordName: 'credits',
            recordPlaintext: record.to_string(),
            tag: record.tag().toString(),
        }));
    }

    /**
     * Find a credit record with a given number of microcredits by via the official Aleo API
     *
     * @param {number} microcredits The number of microcredits to search for
     * @param {boolean} unspent Whether or not the record is unspent
     * @param {string[]} nonces Nonces of records already found so that they are not found again
     * @param {RecordSearchParams} searchParameters Additional parameters to search for
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
     * const records = await recordProvider.findCreditsRecords(5000, true, [record.nonce()]);
     *
     * // When the program manager is initialized with the record provider it will be used to find automatically find
     * // fee records and amount records for value transfers so that they do not need to be specified manually
     * const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
     * programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
     */
    async findCreditsRecord(microcredits: number, searchParameters: RecordSearchParams,nonces?: string[]): Promise<OwnedRecord> {
        let records = null;

        try {
            records = await this.findCreditsRecords([microcredits], searchParameters, nonces);
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
    async findRecord(searchParameters: RecordSearchParams, filterFn?: (record: RecordPlaintext) => boolean, nonces?: string[]): Promise<OwnedRecord> {
        let records;

        try {
            records = await this.findRecords(searchParameters, filterFn, nonces);
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
     * Find multiple records from a specified program.
     */
    async findRecords(searchParameters: RecordSearchParams, filterFn?: (record: RecordPlaintext) => boolean, nonces?: string[]): Promise<OwnedRecord[]> {
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

        const recordPts = await this.networkClient.findRecords(startHeight, endHeight, searchParameters.unspent, programs, amounts, maxAmount, nonces, this.account.privateKey());
        return recordPts.map((record) => ({
            commitment: record.commitment().toString(),
            owner: record.owner().toString(),
            programName: record.program().toString(),
            recordName: record.name().toString(),
        }));
    }

    async getEncryptedRecords(recordsFilter: RecordSearchParams, responseFilter: RecordsResponseFilter): Promise<EncryptedRecord[]> {
        throw new Error("Not implemented");
    }

    async serialNumbersExist(serialNumbers: string[]): Promise<Record<string, boolean>> {
        throw new Error("Not implemented");
    }

    async tagsExist(tags: string[]): Promise<Record<string, boolean>> {
        throw new Error("Not implemented");
    }
}

/**
 * BlockHeightSearch is a RecordSearchParams implementation that allows for searching for records within a given
 * block height range.
 *
 * @example
 * // Create a new BlockHeightSearch
 * const params = new BlockHeightSearch(89995, 99995);
 *
 * // Create a new NetworkRecordProvider
 * const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
 * const keyProvider = new AleoKeyProvider();
 * const recordProvider = new NetworkRecordProvider(account, networkClient);
 *
 * // The record provider can be used to find records with a given number of microcredits and the block height search
 * // can be used to find records within a given block height range
 * const record = await recordProvider.findCreditsRecord(5000, true, [], params);
 *
 */
class BlockHeightSearch implements RecordSearchParams {
    startHeight: number;
    endHeight: number;
    unspent: boolean;
    constructor(startHeight: number, endHeight: number, unspent: boolean) {
        this.startHeight = startHeight;
        this.endHeight = endHeight;
        this.unspent = unspent;
    }
}

export { 
    BlockHeightSearch,
    EncryptedRecord,
    OwnedRecord,
    RecordProvider,
    RecordSearchParams,
    RecordsResponseFilter,
};
