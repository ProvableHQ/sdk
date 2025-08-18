import { Account } from "./account";
import { EncryptedRecord, OwnedRecord, RecordProvider, RecordSearchParams, RecordsResponseFilter } from "./record-provider";
import { RecordPlaintext } from "./wasm";
import { RegistrationRequest } from "./models/record-scanner/registrationRequest";
import { RecordsFilter } from "./models/record-scanner/recordsFilter";
import { OwnedFilter } from "./models/record-scanner/ownedFilter";

/**
 * RecordScanner is a RecordProvider implementation that uses the record scanner service to find records.
 * 
 * @example
 * const account = new Account({ privateKey: 'APrivateKey1...' });
 * 
 * const recordScanner = new RecordScanner("https://record-scanner.aleo.org");
 * recordScanner.setAccount(account);
 * await recordScanner.register(0);
 * 
 * const filter = {
 *     start: 0,
 *     end: 100,
 *     program: "credits.aleo",
 *     record: "credits",
 * };
 * 
 * const responseFilter = {
 *     program: true,
 *     record: true,
 *     function: true,
 *     transition: true,
 *     blockHeight: true,
 *     transactionId: true,
 * };
 * 
 * const records = await recordScanner.findRecords({ filter, responseFilter });
 */
class RecordScanner implements RecordProvider {
    readonly url: string;
    private account?: Account;
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
     */
    async register(startBlock: number): Promise<void> {
        let request: RegistrationRequest;
        if (!this.account) {
            throw new Error("Account not set");
        } else {
            request = {
                viewKey: this.account.viewKey(),
                start: startBlock,
            };
        }

        try {
            const response = await this.recordScannerServiceRequest(
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
     * @param {RecordsFilter} recordsFilter The filter to use to find the records
     * @param {RecordsResponseFilter} responseFilter The filter to use to filter the response
     * @returns {Promise<EncryptedRecord[]>} The encrypted records
     */
    async encryptedRecords(recordsFilter: RecordsFilter, responseFilter: RecordsResponseFilter): Promise<EncryptedRecord[]> {
        try {
            const response = await this.recordScannerServiceRequest(
                new Request(`${this.url}/records/encrypted?${this.buildQueryString(recordsFilter, responseFilter)}`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                }),
            );

            const data = await response.json();
            return data.records;
        } catch (error) {
            console.error(`Failed to get encrypted records: ${error}`);
            throw error;
        }
    }

    /**
     * Check if a list of serial numbers exist in the record scanner service.
     * 
     * @param {string[]} serialNumbers The serial numbers to check
     * @returns {Promise<Record<string, boolean>>} A record of serial numbers and whether they exist
     */
    async checkSerialNumbers(serialNumbers: string[]): Promise<Record<string, boolean>> {
        try {
            const response = await this.recordScannerServiceRequest(
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
     * @param {string[]} tags The tags to check
     * @returns {Promise<Record<string, boolean>>} A record of tags and whether they exist
     */
    async checkTags(tags: string[]): Promise<Record<string, boolean>> {
        try {
            const response = await this.recordScannerServiceRequest(
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
     * @param {OwnedFilter} searchParameters The filter to use to find the record
     * @returns {Promise<OwnedRecord>} The record
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
     * @param {OwnedFilter} filter The filter to use to find the records
     * @returns {Promise<OwnedRecord[]>} The records
     */
    async findRecords(filter: OwnedFilter): Promise<OwnedRecord[]> {
        if (!this.uuid) {
            throw new Error("Not registered");
        }

        filter.uuid = this.uuid;

        try {
            const response = await this.recordScannerServiceRequest(
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
     * @param {number} microcredits The amount of microcredits to find
     * @param {OwnedFilter} searchParameters The filter to use to find the record
     * @returns {Promise<OwnedRecord>} The record
     */
    async findCreditsRecord(microcredits: number, searchParameters: OwnedFilter): Promise<OwnedRecord> {
        try {
            const records = await this.findRecords({
                ...searchParameters,
                program: "credits.aleo",
                record: "credits",
                decrypt: true,
            });

            const record = records.find(record => {
                const plaintext = RecordPlaintext.fromString(record.recordPlaintext);
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
     * Find credits records in the record scanner service.
     * 
     * @param {number[]} microcreditAmounts The amounts of microcredits to find
     * @param {OwnedFilter} searchParameters The filter to use to find the records
     * @returns {Promise<OwnedRecord[]>} The records
     */
    async findCreditsRecords(microcreditAmounts: number[], searchParameters: OwnedFilter): Promise<OwnedRecord[]> {
        try {
            const records = await this.findRecords({
                ...searchParameters,
                program: "credits.aleo",
                record: "credits",
                decrypt: true,
            });
            return records.filter(record => {
                const plaintext = RecordPlaintext.fromString(record.recordPlaintext);
                const amount = plaintext.getMember("microcredits").toString();
                return microcreditAmounts.includes(parseInt(amount.replace("u64", "")));
            });
        } catch (error) {
            console.error(`Failed to find credits records: ${error}`);
            throw error;
        }
    }

    /**
     * Wrapper function to make a request to the record scanner service and handle any errors
     * 
     * @param {Request} req The request to make
     * @returns {Promise<Response>} The response
     */
    private async recordScannerServiceRequest(req: Request): Promise<Response> {
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
     * @param {RecordSearchParams} recordsFilter The filter to use to find the records
     * @param {RecordsResponseFilter} responseFilter The filter to use to filter the response
     * @returns {string} The query string
     */
    private buildQueryString(recordsFilter: RecordSearchParams, responseFilter: RecordsResponseFilter): string {
        return Object.entries({ ...recordsFilter, ...responseFilter })
            .map(([key, value]) => `${key}=${value}`)
            .join("&");
    }
}