import { Account } from "./account";
import { EncryptedRecord } from "./models/record-provider/encryptedRecord";
import { OwnedFilter } from "./models/record-scanner/ownedFilter";
import { OwnedRecord } from "./models/record-provider/ownedRecord";
import { RecordProvider } from "./record-provider";
import { RecordPlaintext } from "./wasm";
import { RecordSearchParams } from "./models/record-provider/recordSearchParams";
import { RecordsFilter } from "./models/record-scanner/recordsFilter";
import { RecordsResponseFilter } from "./models/record-provider/recordsResponseFilter";
import { RegistrationRequest } from "./models/record-scanner/registrationRequest";

/**
 * RecordScanner is a RecordProvider implementation that uses the record scanner service to find records.
 * 
 * @example
 * const account = new Account({ privateKey: 'APrivateKey1...' });
 * 
 * const recordScanner = new RecordScanner("https://record-scanner.aleo.org");
 * recordScanner.setAccount(account);
 * const uuid = await recordScanner.register(0);
 * 
 * const filter = {
 *     uuid,
 *     filter: {
 *         program: "credits.aleo",
 *         records: ["credits"],
 *     },
 *     responseFilter: {
 *         program: true,
 *         record: true,
 *         function: true,
 *         transition: true,
 *         block_height: true,
 *         transaction_id: true,
 *     },
 *     unspent: true,
 * };
 * 
 * const records = await recordScanner.findRecords(filter);
 */
class RecordScanner implements RecordProvider {
    account?: Account;
    readonly url: string;
    private uuid?: string;

    constructor(url: string, account?: Account) {
        this.account = account;
        this.url = url;
    }
    
    /**
     * Set the account to use for the record scanner.
     * 
     * @param {Account} account The account to use for the record scanner.
     */
    async setAccount(account: Account): Promise<void> {
        this.uuid = undefined;
        this.account = account;
    }

    /**
     * Register the account with the record scanner service.
     * 
     * @param {number} startBlock The block height to start scanning from.
     * @returns {Promise<void>} A promise that resolves when the account is registered.
     */
    async register(startBlock: number): Promise<void> {
        let request: RegistrationRequest;
        if (!this.account) {
            throw new Error("Account not set");
        } else {
            request = {
                view_key: this.account.viewKey().to_string(),
                start: startBlock,
            };
        }

        try {
            const response = await this.request(
                new Request(`${this.url}/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(request),
                })
            );

            const data = await response.json();
            this.uuid = data.uuid;
        } catch (error) {
            console.error(`Failed to register view key: ${error}`);
            throw error;
        }
    }

    /**
     * Get encrypted records from the record scanner service.
     * 
     * @param {RecordsFilter} recordsFilter The filter to use to find the records and filter the response.
     * @returns {Promise<EncryptedRecord[]>} The encrypted records.
     */
    async encryptedRecords(recordsFilter: RecordsFilter): Promise<EncryptedRecord[]> {
        try {
            const response = await this.request(
                new Request(`${this.url}/records/encrypted`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(recordsFilter),
                }),
            );

            return await response.json();
        } catch (error) {
            console.error(`Failed to get encrypted records: ${error}`);
            throw error;
        }
    }

    /**
     * Check if a list of serial numbers exist in the record scanner service.
     * 
     * @param {string[]} serialNumbers The serial numbers to check.
     * @returns {Promise<Record<string, boolean>>} Map of Aleo Record serial numbers and whether they appeared in any inputs on chain. If boolean corresponding to the Serial Number has a true value, that Record is considered spent by the Aleo Network.
     */
    async checkSerialNumbers(serialNumbers: string[]): Promise<Record<string, boolean>> {
        try {
            const response = await this.request(
                new Request(`${this.url}/records/sns`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(serialNumbers),
                }),
            );

            return await response.json();
        } catch (error) {
            console.error(`Failed to check if serial numbers exist: ${error}`);
            throw error;
        }
    }

    /**
     * Check if a list of tags exist in the record scanner service.
     * 
     * @param {string[]} tags The tags to check.
     * @returns {Promise<Record<string, boolean>>} Map of Aleo Record tags and whether they appeared in any inputs on chain. If boolean corresponding to the tag has a true value, that Record is considered spent by the Aleo Network.
     */
    async checkTags(tags: string[]): Promise<Record<string, boolean>> {
        try {
            const response = await this.request(
                new Request(`${this.url}/records/tags`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(tags),
                }),
            );
            
            return await response.json();
        } catch (error) {
            console.error(`Failed to check if tags exist: ${error}`);
            throw error;
        }
    }

    /**
     * Find a record in the record scanner service.
     * 
     * @param {OwnedFilter} searchParameters The filter to use to find the record.
     * @returns {Promise<OwnedRecord>} The record.
     */
    async findRecord(searchParameters: OwnedFilter): Promise<OwnedRecord> {
        try {
            const records = await this.findRecords(searchParameters);

            if (records.length > 0) {
                return records[0];
            }

            throw new Error("Record not found");
        } catch (error) {
            console.error(`Failed to find record: ${error}`);
            throw error;
        }
    }

    /**
     * Find records in the record scanner service.
     * 
     * @param {OwnedFilter} filter The filter to use to find the records.
     * @returns {Promise<OwnedRecord[]>} The records.
     */
    async findRecords(filter: OwnedFilter): Promise<OwnedRecord[]> {
        if (!this.uuid) {
            throw new Error("Not registered");
        }

        filter.uuid = this.uuid;

        try {
            const response = await this.request(
                new Request(`${this.url}/records/owned`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(filter),
                }),
            );

            return await response.json();
        } catch (error) {
            console.error(`Failed to get owned records: ${error}`);
            throw error;
        }
    }

    /**
     * Find a credits record in the record scanner service.
     * 
     * @param {number} microcredits The amount of microcredits to find.
     * @param {OwnedFilter} searchParameters The filter to use to find the record.
     * @returns {Promise<OwnedRecord>} The record.
     */
    async findCreditsRecord(microcredits: number, searchParameters: OwnedFilter): Promise<OwnedRecord> {
        try {
            const records = await this.findRecords({
                decrypt: true,
                unspent: searchParameters.unspent ?? false,
                filter: {
                    start: searchParameters.filter?.start ?? 0,
                    program: "credits.aleo",
                    record: "credits",
                },
                uuid: this.uuid,
            });

            const record = records.find(record => {
                const plaintext = RecordPlaintext.fromString(record.record_plaintext ?? '');
                const amountStr = plaintext.getMember("microcredits").toString();
                const amount = parseInt(amountStr.replace("u64", ""));
                return amount >= microcredits;
            });

            if (!record) {
                throw new Error("Record not found");
            }

            return record;
        } catch (error) {
            console.error(`Failed to find credits record: ${error}`);
            throw error;
        }
    }

    /**
     * Find credits records using a record scanning service.
     * 
     * @param {number[]} microcreditAmounts The amounts of microcredits to find.
     * @param {OwnedFilter} searchParameters The filter to use to find the records.
     * @returns {Promise<OwnedRecord[]>} The records
     */
    async findCreditsRecords(microcreditAmounts: number[], searchParameters: OwnedFilter): Promise<OwnedRecord[]> {
        try {
            const records = await this.findRecords({
                decrypt: true,
                unspent: searchParameters.unspent ?? false,
                filter: {
                    start: searchParameters.filter?.start ?? 0,
                    program: "credits.aleo",
                    record: "credits",
                },
                uuid: this.uuid,
            });
            return records.filter(record => {
                const plaintext = RecordPlaintext.fromString(record.record_plaintext ?? '');
                const amount = plaintext.getMember("microcredits").toString();
                return microcreditAmounts.includes(parseInt(amount.replace("u64", "")));
            });
        } catch (error) {
            console.error(`Failed to find credits records: ${error}`);
            throw error;
        }
    }

    /**
     * Wrapper function to make a request to the record scanner service and handle any errors.
     * 
     * @param {Request} req The request to make.
     * @returns {Promise<Response>} The response.
     */
    private async request(req: Request): Promise<Response> {
        try {
            const response = await fetch(req);
    
            if (!response.ok) {
                throw new Error(await response.text() ?? `Request to ${req.url} failed with status ${response.status}`);
            }

            return response;
        } catch (error) {
            console.error(`Failed to make request to ${req.url}: ${error}`);
            throw error;
        }
    }

    /**
     * Helper function to build a query string from the records filter and response filter.
     * 
     * @param {RecordSearchParams} recordsFilter The filter to use to find the records.
     * @param {RecordsResponseFilter} responseFilter The filter to use to filter the response.
     * @returns {string} The query string.
     */
    private buildQueryString(recordsFilter: RecordsFilter, responseFilter: RecordsResponseFilter): string {
        return Object.entries({ ...recordsFilter, ...responseFilter })
            .map(([key, value]) => {
                return `${key}=${Array.isArray(value) ? value.join(",") : value}`
            })
            .join("&");
    }
}

export { RecordScanner };