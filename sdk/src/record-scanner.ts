import { Account } from "./account";
import { EncryptedRecord, OwnedRecord, RecordProvider, RecordSearchParams, RecordsResponseFilter } from "./record-provider";
import { RecordPlaintext } from "./wasm";

type RegistrationRequest = {
    viewKey: string;
    start: number;
}

interface RecordsFilter extends RecordSearchParams {
    start: number;
    end?: number;
    program?: string;
    record?: string;
    function?: string;
}

interface OwnedFilter extends RecordSearchParams {
    decrypt?: boolean;
    filter?: RecordsFilter;
    responseFilter?: RecordsResponseFilter;
}

interface OwnedFilterWithUuid extends OwnedFilter {
    uuid: string;
}

class RecordScanner implements RecordProvider {
    readonly url: string;
    private account?: Account;
    private uuid?: string;

    constructor(url: string, account?: Account) {
        this.account = account;
        this.url = url;
    }
    
    async setAccount(account: Account): Promise<void> {
        this.account = account;
    }

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

    async getEncryptedRecords(recordsFilter: RecordsFilter, responseFilter: RecordsResponseFilter): Promise<EncryptedRecord[]> {
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

    async serialNumbersExist(serialNumbers: string[]): Promise<Record<string, boolean>> {
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

    async tagsExist(tags: string[]): Promise<Record<string, boolean>> {
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

    async findRecord(searchParameters: OwnedFilter, filterFn?: (record: RecordPlaintext) => boolean): Promise<OwnedRecord> {
        try {
            const records = await this.findRecords(searchParameters, filterFn);

            if (records.length > 0) {
                return records[0];
            }

            throw new Error("Record not found");
        } catch (error) {
            console.error(`Failed to find record: ${error}`);
            throw error;
        }
    }

    async findRecords(searchParameters: OwnedFilter, filterFn?: (record: RecordPlaintext) => boolean): Promise<OwnedRecord[]> {
        if (!this.uuid) {
            throw new Error("Not registered");
        }

        const filterWithUuid: OwnedFilterWithUuid = {
            ...searchParameters,
            uuid: this.uuid,
        };

        try {
            const response = await this.recordScannerServiceRequest(
                new Request(`${this.url}/records/owned`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(filterWithUuid),
                }),
            );

            const records = await response.json();
            return filterFn ? records.filter(filterFn) : records;
        } catch (error) {
            console.error(`Failed to get owned records: ${error}`);
            throw error;
        }
    }

    async findCreditsRecord(microcredits: number, searchParameters: OwnedFilter, nonces?: string[]): Promise<OwnedRecord> {
        try {
            const records = await this.findRecords({
                ...searchParameters,
                program: "credits.aleo",
                record: "credits",
                decrypt: true,
            });

            const record = records.find(record => {
                const plaintext = RecordPlaintext.fromString(record.recordPlaintext);
                const amount = plaintext.getMember("microcredits").toString();
                return amount === `${microcredits}u64`;
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

    async findCreditsRecords(microcreditAmounts: number[], searchParameters: OwnedFilter, nonces?: string[]): Promise<OwnedRecord[]> {
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

    private buildQueryString(recordsFilter: RecordSearchParams, responseFilter: RecordsResponseFilter): string {
        return Object.entries({ ...recordsFilter, ...responseFilter })
            .map(([key, value]) => `${key}=${value}`)
            .join("&");
    }
}