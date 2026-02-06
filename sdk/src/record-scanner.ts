import { parseJSON, post } from "./utils.js";
import { EncryptedRecord } from "./models/record-provider/encryptedRecord";
import { CryptoBoxPubKey } from "./models/cryptoBoxPubkey.js";
import { EncryptedRegistrationRequest } from "./models/record-scanner/encryptedRegistrationRequest.js";
import { OwnedFilter } from "./models/record-scanner/ownedFilter";
import { OwnedRecord } from "./models/record-provider/ownedRecord";
import { RecordProvider } from "./record-provider";
import { Field, Poseidon4, RecordPlaintext, ViewKey } from "./wasm";
import { RecordsFilter } from "./models/record-scanner/recordsFilter";
import { RegistrationRequest } from "./models/record-scanner/registrationRequest";
import { RegistrationResponse } from "./models/record-scanner/registrationResponse";
import { StatusResponse } from "./models/record-scanner/statusResponse";
import { RECORD_DOMAIN, FIVE_MINUTES } from "./constants.js";
import { encryptRegistrationRequest } from "./security.js";

/**
 * JWT data for optional authentication with the record scanning service (e.g. Provable API).
 */
export interface RecordScannerJWTData {
    jwt: string;
    expiration: number;
}

type RecordScannerOptions = {
    url: string;
    apiKey?: string | { header: string, value: string };
    /** Required for JWT refresh when using authenticated record scanner (e.g. Provable API). */
    consumerId?: string;
    /** Optional JWT for auth. If omitted and apiKey + consumerId are set, JWT is refreshed when needed. */
    jwtData?: RecordScannerJWTData;
}

/**
 * RecordScanner is a RecordProvider implementation that uses the record scanner service to find records.
 * 
 * @example
 * const account = new Account({ privateKey: 'APrivateKey1...' });
 * 
 * const recordScanner = new RecordScanner({ url: "https://record-scanner.aleo.org" });
 * recordScanner.setAccount(account);
 * recordScanner.setApiKey("your-api-key");
 * const uuid = await recordScanner.register(0);
 * 
 * const filter = {
 *     uuid,
 *     filter: {
 *         program: "credits.aleo",
 *         records: ["credits"],
 *     },
 *     responseFilter: {
 *         commitment: true,
 *         owner: true,
 *         tag: true,
 *         tag?: boolean;
 *         sender: true,
 *         spent: true,
 *         record_ciphertext: true,
 *         block_height: true;
 *         block_timestamp: true;
 *         output_index: true;
 *         record_name: true;
 *         function_name: true;
 *         program_name: true;
 *         transition_id: true;
 *         transaction_id: true;
 *         transaction_index: true;
 *         transition_index: true;
 *     },
 *     unspent: true,
 * };
 * 
 * const records = await recordScanner.findRecords(filter);
 */
class RecordScanner implements RecordProvider {
    readonly url: string;
    private apiKey?: { header: string, value: string };
    private uuid?: Field;
    private consumerId?: string;
    private jwtData?: RecordScannerJWTData;

    constructor(options: RecordScannerOptions) {
        // Set the network by detecting which version of the SDK is being used.
        const network = "/%%NETWORK%%";

        // If the user has configured a network in their uri, throw
        if (options.url.endsWith("/mainnet") || options.url.endsWith("/testnet")) {
            throw new Error("The record scanning url should not include the specific network, this is automatically configured by the Provable SDK.");
        }

        // Configure the url to use the network the SDK is using.
        this.url = options.url + network;

        // Configure authentication options/
        this.apiKey = typeof options.apiKey === "string" ? { header: "X-Provable-API-Key", value: options.apiKey } : options.apiKey;
        this.consumerId = options.consumerId;
        this.jwtData = options.jwtData;
    }

    /**
     * Set the API key to use for the record scanner.
     * 
     * @param {string} apiKey The API key to use for the record scanner.
     */
    async setApiKey(apiKey: string | { header: string, value: string }): Promise<void> {
        this.apiKey = typeof apiKey === "string" ? { header: "X-Provable-API-Key", value: apiKey } : apiKey;
    }

    /**
     * Set the consumer ID used for JWT refresh when using authenticated record scanner (e.g. Provable API).
     */
    async setConsumerId(consumerId: string): Promise<void> {
        this.consumerId = consumerId;
    }

    /**
     * Set JWT data for authentication. Optional; when not set, JWT can be refreshed from apiKey + consumerId if provided.
     */
    async setJwtData(jwtData: RecordScannerJWTData | undefined): Promise<void> {
        this.jwtData = jwtData;
    }

    /**
     * Refreshes the JWT by making a POST request to /jwts/{consumer_id}. Used when authentication is required.
     */
    private async refreshJwt(apiKey: string, consumerId: string): Promise<RecordScannerJWTData> {
        const response = await post(
            `https://api.provable.com/jwts/${consumerId}`,
            {
                headers: {
                    "X-Provable-API-Key": apiKey,
                },
            }
        );
        const authHeader = response.headers.get("authorization");
        if (!authHeader) {
            throw new Error("No authorization header in JWT refresh response");
        }
        const body = await response.json();
        return {
            jwt: authHeader,
            expiration: body.exp * 1000, // Convert to milliseconds
        };
    }

    /**
     * Returns auth headers (e.g. Authorization with JWT). Refreshes JWT if expired and apiKey + consumerId are set. Empty when auth is not configured.
     */
    private async getAuthHeaders(): Promise<Record<string, string>> {
        let jwtData = this.jwtData;
        const isExpired = jwtData && Date.now() >= jwtData.expiration - FIVE_MINUTES;
        if (!jwtData || isExpired) {
            const apiKey = this.apiKey?.value;
            if (apiKey && this.consumerId) {
                jwtData = await this.refreshJwt(apiKey, this.consumerId);
                this.jwtData = jwtData;
            } else if (jwtData?.jwt) {
                // Use existing JWT even if expired when we can't refresh
                return { Authorization: jwtData.jwt };
            } else {
                return {};
            }
        }
        return jwtData?.jwt ? { Authorization: jwtData.jwt } : {};
    }

    /**
     * Set the UUID to use for the record scanner.
     * 
     * @param {Field} uuid The UUID to use for the record scanner.
     */
    async setUuid(uuidOrViewKey: Field | ViewKey): Promise<void> {
        this.uuid = uuidOrViewKey instanceof ViewKey ? this.computeUUID(uuidOrViewKey) : uuidOrViewKey;
    }

    /**
     * Register the account with the record scanner service.
     * 
     * @param {number} startBlock The block height to start scanning from.
     * @returns {Promise<RegistrationResponse>} The response from the record scanner service.
     */
    async register(viewKey: ViewKey, startBlock: number): Promise<RegistrationResponse> {
        try {
            let request: RegistrationRequest = {
                view_key: viewKey.to_string(),
                start: startBlock,
            };

            const response = await this.request(
                new Request(`${this.url}/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(request),
                })
            );

            const data = await response.json();
            this.uuid = data.uuid;
            return data;
        } catch (error) {
            console.error(`Failed to register view key: ${error}`);
            throw error;
        }
    }

    /**
     * Fetches an ephemeral public key from the record scanner service for use with registerEncrypted.
     * Follows the same pattern as the delegated proving service /pubkey endpoint.
     *
     * @returns {Promise<CryptoBoxPubKey>} The service's ephemeral public key and key_id.
     */
    async getPubkey(): Promise<CryptoBoxPubKey> {
        const response = await this.request(
            new Request(`${this.url}/pubkey`, { method: "GET" })
        );
        return parseJSON(await response.text()) as CryptoBoxPubKey;
    }

    /**
     * Registers the account with the record scanner service using the encrypted flow:
     * fetches an ephemeral public key from /pubkey, encrypts the registration request (view key + start block),
     * and POSTs to /register/encrypted. Use this when the record scanner requires encrypted registration (e.g. for privacy).
     *
     * @param {ViewKey} viewKey The view key to register.
     * @param {number} startBlock The block height to start scanning from.
     * @returns {Promise<RegistrationResponse>} The response from the record scanner service.
     */
    async registerEncrypted(viewKey: ViewKey, startBlock: number): Promise<RegistrationResponse> {
        const pubkey = await this.getPubkey();
        const ciphertext = encryptRegistrationRequest(pubkey.public_key, viewKey, startBlock);
        const payload: EncryptedRegistrationRequest = {
            key_id: pubkey.key_id,
            ciphertext,
        };
        const response = await this.request(
            new Request(`${this.url}/register/encrypted`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
        );
        const data = await response.json();
        this.uuid = data.uuid;
        return data;
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
     * Check the status of a record scanner indexing job.
     * 
     * @param {string} jobId The job id to check.
     * @returns {Promise<StatusResponse>} The status of the job.
     */
    async checkStatus(): Promise<StatusResponse> {
        try {
            const response = await this.request(
                new Request(`${this.url}/status`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(this.uuid?.toString()),
                }),
            );

            return await response.json();
        } catch (error) {
            console.error(`Failed to check status of job: ${error}`);
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
            throw new Error("You are using the RecordScanner implementation of the RecordProvider. No account has been registered with the RecordScanner which is required to use the findRecords method. Please set an with the setAccount method before calling the findRecords method again.");
        }

        filter.uuid = this.uuid?.toString();

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
                unspent: searchParameters.unspent,
                filter: {
                    start: searchParameters.filter?.start ?? 0,
                    program: "credits.aleo",
                    record: "credits",
                },
                uuid: this.uuid?.toString(),
            });

            const record = records.find(record => {
                const plaintext = RecordPlaintext.fromString(record.record_plaintext ?? '');
                const amountStr = plaintext.getMember("microcredits").toString();
                const amount = parseInt(amountStr.replace("u64", ""));
                return amount >= microcredits;
            });

            if (!record) {
                throw new Error(`No records found matching the supplied search filter:\n${JSON.stringify(searchParameters, null, 2)}`);
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
                unspent: searchParameters.unspent,
                filter: {
                    start: searchParameters.filter?.start ?? 0,
                    program: "credits.aleo",
                    record: "credits",
                },
                uuid: this.uuid?.toString(),
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
     * Optionally adds JWT Authorization header when consumerId/jwtData (or apiKey+consumerId) are configured.
     *
     * @param {Request} req The request to make.
     * @returns {Promise<Response>} The response.
     */
    private async request(req: Request): Promise<Response> {
        try {
            const authHeaders = await this.getAuthHeaders();
            for (const [key, value] of Object.entries(authHeaders)) {
                req.headers.set(key, value);
            }
            if (this.apiKey) {
                req.headers.set(this.apiKey.header, this.apiKey.value);
            }
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

    computeUUID(vk: ViewKey): Field {
        // Construct the material needed for the Poseidon oracle.
        const inputs = [Field.newDomainSeparator(RECORD_DOMAIN), vk.toField(), Field.one()]
        // Calculate the uuid.
        const hasher = new Poseidon4();
        return hasher.hash(inputs);
    }
}

export { RecordScanner };
