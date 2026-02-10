import { parseJSON, post } from "./utils.js";
import { EncryptedRecord } from "./models/record-provider/encryptedRecord";
import { CryptoBoxPubKey } from "./models/cryptoBoxPubkey.js";
import { EncryptedRegistrationRequest } from "./models/record-scanner/encryptedRegistrationRequest.js";
import { OwnedFilter } from "./models/record-scanner/ownedFilter";
import { OwnedRecord } from "./models/record-provider/ownedRecord";
import { RecordProvider } from "./record-provider";
import { Field, Poseidon4, RecordCiphertext, RecordPlaintext, ViewKey } from "./wasm";
import { RecordsFilter } from "./models/record-scanner/recordsFilter";
import { RegisterResult } from "./models/record-scanner/registrationResult.js";
import { UUIDError, RecordScannerRequestError } from "./models/record-scanner/error.js";
import { RegistrationRequest } from "./models/record-scanner/registrationRequest";
import { RegistrationResponse } from "./models/record-scanner/registrationResponse";
import { StatusResponse } from "./models/record-scanner/statusResponse";
import { TagsResult } from "./models/record-scanner/tagsResult.js";
import { SerialNumbersResult } from "./models/record-scanner/serialNumbersResult.js";
import { StatusResult } from "./models/record-scanner/statusResult.js";
import { OwnedRecordsResult } from "./models/record-scanner/ownedRecordsResult.js";
import { EncryptedRecordsResult } from "./models/record-scanner/encryptedRecordsResult.js";
import { RECORD_DOMAIN, FIVE_MINUTES } from "./constants.js";
import { encryptRegistrationRequest } from "./security.js";
import { Account } from "./account.js";

/**
 * JWT data for optional authentication with the record scanning service (e.g. Provable API).
 */
export interface RecordScannerJWTData {
    jwt: string;
    expiration: number;
}

export type RecordScannerOptions = {
    url: string;
    apiKey?: string | { header: string, value: string };
    /** Required for JWT refresh when using authenticated record scanner (e.g. Provable API). */
    consumerId?: string;
    /** Optional JWT for auth. If omitted and apiKey + consumerId are set, JWT is refreshed when needed. */
    jwtData?: RecordScannerJWTData;
    /** Optional view keys to use for local scanning and decryption. */
    viewKeys?: ViewKey[]
    /** Optional account to use for local scanning and decryption. */
    account?: Account;
    /** Cache view keys in memory for faster scanning upon register. */
    cacheViewKeysOnRegister?: boolean;
}

/**
 * RecordScanner is a RecordProvider implementation that uses Provable's confidential record scanning service to find
 * records.
 *
 * @example
 * const account = new Account({ privateKey: 'APrivateKey1...' });
 *
 * const recordScanner = new RecordScanner({ url: "https://record-scanner.aleo.org" });
 * recordScanner.setAccount(account);
 * recordScanner.setApiKey("your-api-key");
 * const result = await recordScanner.register(viewKey, 0);
 * if (result.ok) { const uuid = result.data.uuid; }
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
    readonly cacheViewKeysOnRegister?: boolean;
    readonly url: string;
    private apiKey?: { header: string, value: string };
    private consumerId?: string;
    private jwtData?: RecordScannerJWTData;
    private uuid?: Field;
    private viewKeys?: { [key: string]: ViewKey };
    account?: Account | undefined;

    constructor(options: RecordScannerOptions) {
        // Set the network by detecting which version of the SDK is being used.
        const network = "/%%NETWORK%%";

        // If the user has configured a network in their uri, throw.
        if (options.url.endsWith("/mainnet") || options.url.endsWith("/testnet")) {
            throw new Error("The record scanning url should not include the specific network, this is automatically configured by the Provable SDK.");
        }

        // Configure the url to use the network the SDK is using.
        this.url = options.url + network;

        // Get any view keys passed in the options.
        this.viewKeys = options.viewKeys ?
            Object.fromEntries(options.viewKeys.map(viewKey => [this.computeUUID(viewKey), viewKey]))
            : undefined;

        // Set the view key caching flag if provided (default: true).
        this.cacheViewKeysOnRegister = options.cacheViewKeysOnRegister ??= true;

        // Set the account if provided.
        this.account = options.account;
        if (this.account) {
            // Compute the UUID from the view key and set it on the scanner.
            this.setUuid(this.account.viewKey());
            // Add the view key to the scanner's view keys.
            this.addViewKey(this.account.viewKey());
        }

        // Configure authentication options.
        this.apiKey = typeof options.apiKey === "string" ? {
            header: "X-Provable-API-Key",
            value: options.apiKey
        } : options.apiKey;
        this.consumerId = options.consumerId;
        this.jwtData = options.jwtData;
    }

    /**
     * Set the API key to use for the record scanner.
     * 
     * @param {string} apiKey The API key to use for the record scanner.
     */
    setApiKey(apiKey: string | { header: string, value: string }) {
        this.apiKey = typeof apiKey === "string" ? { header: "X-Provable-API-Key", value: apiKey } : apiKey;
    }

    /**
     * Set the consumer ID used for JWT refresh when using authenticated record scanner (e.g. Provable API).
     */
    setConsumerId(consumerId: string) {
        this.consumerId = consumerId;
    }

    /**
     * Set JWT data for authentication. Optional; when not set, JWT can be refreshed from apiKey + consumerId if provided.
     */
    setJwtData(jwtData: RecordScannerJWTData | undefined) {
        this.jwtData = jwtData;
    }

    /**
     * Add a view key to the record scanner for usage in local decryption.
     *
     * @param {ViewKey} viewKey The view key to add.
     */
    addViewKey(viewKey: ViewKey) {
        const uuid = this.computeUUID(viewKey).toString();
        this.viewKeys = this.viewKeys ? { ...this.viewKeys, [uuid]: viewKey } : { [uuid]: viewKey };
    }

    /**
     * Remove a view key from the record scanner.
     *
     * @param {string} uuid The uuid of the view key to remove.
     */
    removeViewKey(uuid: string) {
        if (this.viewKeys) {
            delete this.viewKeys[uuid];
        }
    }

    /**
     * Set the primary account for the record scanner.
     *
     * @param {Account} account The account to set as the primary account.
     */
    setAccount(account: Account) {
        const existingVk = this.account?.viewKey();
        // Set the account on the scanner.
        this.account = account;
        // Set the uuid on the scanner using the view key from the account.
        this.setUuid(account.viewKey());
        // Add the view key to the scanner's view keys.
        this.addViewKey(account.viewKey());
        // Remove the existing view key from the scanner's view keys if it exists.
        if (existingVk) {
            this.removeViewKey(this.computeUUID(existingVk).toString());
        }
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
     * Set the UUID for the record scanner.
     * 
     * @param {Field | ViewKey} keyMaterial The UUID to use for the record scanner. If a ViewKey is provided, the UUID will be computed from the key.
     */
    setUuid(keyMaterial: Field | ViewKey) {
        this.uuid = keyMaterial instanceof ViewKey ? this.computeUUID(keyMaterial) : keyMaterial;
    }

    /**
     * Register the account with the record scanning service (unencrypted POST /register). Does not throw if a valid error response from the record scanner is received; returns a result object instead.
     *
     * @param {ViewKey} viewKey The view key to register.
     * @param {number} startBlock The block height to start scanning from.
     * @returns {Promise<RegisterResult>} `{ ok: true, data }` on success, or `{ ok: false, status, error }` on failure.
     */
    async register(viewKey: ViewKey, startBlock: number): Promise<RegisterResult> {
        try {
            const request: RegistrationRequest = {
                view_key: viewKey.to_string(),
                start: startBlock,
            };
            const response = await this.request(
                new Request(`${this.url}/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(request),
                }),
            );
            const data = await response.json();

            // If the uuid is not set, set it on the scanner.
            if (!this.uuid) {
                this.uuid = data.uuid;
            }

            // Add the view key to the local scanner's view keys if configured to do so.
            if (this.cacheViewKeysOnRegister) {
                this.addViewKey(viewKey);
            }
            return { ok: true, data };
        } catch (err) {
            if (err instanceof RecordScannerRequestError) {
                return {
                    ok: false,
                    status: err.status,
                    error: { message: err.message, status: err.status },
                };
            }
            console.error(`Failed to register view key: ${err}`);
            throw err;
        }
    }

    /**
     * Fetches an ephemeral public key from the record scanning service for use with registerEncrypted.
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
     * Registers the account with the record scanning service using the encrypted flow: 1. fetches an ephemeral public key from /pubkey - 2. encrypts the registration request (view key + start block) - 3. POSTs to /register/encrypted. Does not HTTP error on a proper error response from the record scanner; returns a result object instead.
     *
     * @param {ViewKey} viewKey The view key to register.
     * @param {number} startBlock The block height to start scanning from.
     * @returns {Promise<RegisterResult>} `{ ok: true, data }` on success, or `{ ok: false, status, error }` on failure.
     */
    async registerEncrypted(
        viewKey: ViewKey,
        startBlock: number,
    ): Promise<RegisterResult> {
        try {
            // Get the ephemeral public key from the record scanner.
            const pubkey = await this.getPubkey();
            // Encrypt the registration request using the ephemeral public key.
            const ciphertext = encryptRegistrationRequest(pubkey.public_key, viewKey, startBlock);
            const payload: EncryptedRegistrationRequest = {
                key_id: pubkey.key_id,
                ciphertext,
            };

            // Send the encrypted registration request to the record scanner.
            const response = await this.request(
                new Request(`${this.url}/register/encrypted`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }),
            );
            const data = await response.json();

            // If the uuid is not set, set it on the scanner.
            if (!this.uuid) {
                this.uuid = data.uuid;
            }
            // Add the view key to the local scanner's view keys if configured to do so.
            if (this.cacheViewKeysOnRegister) {
                this.addViewKey(viewKey);
            }
            return { ok: true, data };
        } catch (err) {
            if (err instanceof RecordScannerRequestError) {
                return {
                    ok: false,
                    status: err.status,
                    error: { message: err.message, status: err.status },
                };
            }
            throw err;
        }
    }

    /**
     * Get encrypted records from the record scanning service. This is a safe variant of /records/encrypted that returns
     * a result instead of throwing on HTTP error.
     *
     * @param {RecordsFilter} recordsFilter The filter to use to find the records and filter the response.
     * @returns {Promise<EncryptedRecordsResult>} The encrypted records or an error if the request failed.
     */
    async encrypted(recordsFilter: RecordsFilter): Promise<EncryptedRecordsResult> {
        try {
            const response = await this.request(
                new Request(`${this.url}/records/encrypted`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(recordsFilter),
                }),
            );
            const data = await response.json();
            return { ok: true, data };
        } catch (err) {
            if (err instanceof RecordScannerRequestError) {
                return {
                    ok: false,
                    status: err.status,
                    error: { message: err.message, status: err.status },
                };
            }
            throw err;
        }
    }

    /**
     * Get encrypted records from the record scanning service.
     *
     * @param {RecordsFilter} recordsFilter The filter to use to find the records and filter the response.
     * @returns {Promise<EncryptedRecord[]>} The encrypted records.
     */
    async encryptedRecords(recordsFilter: RecordsFilter): Promise<EncryptedRecord[]> {
        const result = await this.encrypted(recordsFilter);
        if (result.ok) return result.data;
        throw new RecordScannerRequestError(result.error.message, result.status);
    }

    /**
     * Check if serial numbers appear in any record inputs on-chain, indicating that the records they belong to have been spent. This is a safe variant of /records/sns that returns a result instead of throwing on HTTP error.
     *
     * @param {string[]} serialNumbers The serial numbers to check.
     * @returns {Promise<SerialNumbersResult>} Map of Aleo Record serial numbers and whether they appeared in any inputs on chain. If a boolean corresponding to the Serial Number has a true value, that Record is considered spent by the Aleo Network.
     */
    async serialNumbers(serialNumbers: string[]): Promise<SerialNumbersResult> {
        try {
            const response = await this.request(
                new Request(`${this.url}/records/sns`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(serialNumbers),
                }),
            );
            const data = await response.json();
            return { ok: true, data };
        } catch (err) {
            if (err instanceof RecordScannerRequestError) {
                return {
                    ok: false,
                    status: err.status,
                    error: { message: err.message, status: err.status },
                };
            }
            throw err;
        }
    }

    /**
     * Check if serial numbers appear in any record inputs on-chain, indicating that the records they belong to have been spent.
     *
     * @param {string[]} serialNumbers The serial numbers to check.
     * @returns {Promise<Record<string, boolean>>} Map of Aleo Record serial numbers and whether they appeared in any inputs on chain. If boolean corresponding to the Serial Number has a true value, that Record is considered spent by the Aleo Network.
     */
    async checkSerialNumbers(serialNumbers: string[]): Promise<Record<string, boolean>> {
        const result = await this.serialNumbers(serialNumbers);
        if (result.ok) return result.data;
        throw new RecordScannerRequestError(result.error.message, result.status);
    }

    /**
     * Check if tags appear in any record inputs on-chain, indicating that the records they belong to have been spent. This is a safe variant of /records/tags that returns a result instead of throwing on HTTP error.
     *
     * *
     * @param {string[]} tags The tags to check.
     * @returns {Promise<TagsResult>} Map of Aleo Record tags and whether they appeared in any inputs on chain. If a boolean corresponding to the tag has a true value, that Record is considered spent by the Aleo Network.
     */
    async tags(tags: string[]): Promise<TagsResult> {
        try {
            const response = await this.request(
                new Request(`${this.url}/records/tags`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(tags),
                }),
            );
            const data = await response.json();
            return { ok: true, data };
        } catch (err) {
            if (err instanceof RecordScannerRequestError) {
                return {
                    ok: false,
                    status: err.status,
                    error: { message: err.message, status: err.status },
                };
            }
            throw err;
        }
    }

    /**
     * Check if tags appear in any record inputs on-chain, indicating that the records they belong to have been spent.
     * 
     * @param {string[]} tags The tags to check.
     * @returns {Promise<Record<string, boolean>>} Map of Aleo Record tags and whether they appeared in any inputs on chain. If boolean corresponding to the tag has a true value, that Record is considered spent by the Aleo Network.
     */
    async checkTags(tags: string[]): Promise<Record<string, boolean>> {
        const result = await this.tags(tags);
        if (result.ok) return result.data;
        throw new RecordScannerRequestError(result.error.message, result.status);
    }

    /**
     * Check the scan completion job status for a specific UUID.
     *
     * @param {string | Field | undefined} uuid The UUID of the job to check. If no UUID is provided as input, the UUID configured for the scanner will be used.
     * @returns {Promise<StatusResult>} The status of the job or an error if the job could not be found.
     */
    async status(uuid?: string | Field): Promise<StatusResult> {
        // Attempt to get the UUID from the parameter or use the configured UUID within the scanner.
        uuid = uuid ?? this.uuid;
        if (!uuid) {
            throw new UUIDError("No UUID configured for the record scanner.");
        }

        // If the UUID is a string, verify that it is valid.
        if (typeof uuid === "string" && !this.uuidIsValid(uuid)) {
            throw new UUIDError(`UUID ${uuid} is invalid`, uuid);
        }

        // Check the status of the job for the specified UUID.
        try {
            const response = await this.request(
                new Request(`${this.url}/status`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(uuid.toString()),
                }),
            );
            const data = await response.json();
            return { ok: true, data };
        } catch (err) {
            if (err instanceof RecordScannerRequestError) {
                return {
                    ok: false,
                    status: err.status,
                    error: { message: err.message, status: err.status },
                };
            }
            throw err;
        }
    }

    /**
     * Find a record in the record scanning service.
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
     * Get owned records. Throws if the UUID passed in the OwnedFilter is invalid or is not configured in the record scanner otherwise returns the RESTFUL response from the record scanner.
     *
     * @param {OwnedFilter} filter The OwnedFilter used to specify the subset of owned records to select.
     * @returns {Promise<OwnedRecordsResult>} Record belonging to the uuid passed in the filter or set on the Record Scanner.
     */
    async owned(filter: OwnedFilter): Promise<OwnedRecordsResult> {
        // Extract and verify the correctness of the UUID from the filter or get the configured UUID within the scanner.
        const uuid = this.getUUID(filter)
        // Throw an error if none could be found, otherwise set the UUID on the filter with either the UUID configured
        // within the filter or the UUID configured within the scanner.
        if (!uuid) {
            throw new Error("Error while using the record scanner. UUID is not set on the scanner and the UUID " +
                "provided in the record filter was invalid.");
        } else {
            filter.uuid = uuid;
        }

        try {
            // Construct the request to the record scanner owned endpoint.
            const response = await this.request(
                new Request(`${this.url}/records/owned`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(filter),
                }),
            );
            // If the response is okay, return the records.
            const data = await response.json();
            return { ok: true, data };
        } catch (err) {
            // If the response was not a 200, return the error to the caller.
            if (err instanceof RecordScannerRequestError) {
                return {
                    ok: false,
                    status: err.status,
                    error: { message: err.message, status: err.status },
                };
            }
            throw err;
        }
    }

    /**
     * Find records using the record scanning service.
     * 
     * @param {OwnedFilter} searchParameters The filter to use to find the records.
     * @returns {Promise<OwnedRecord[]>} The records.
     */
    async findRecords(searchParameters: OwnedFilter): Promise<OwnedRecord[]> {
        // Get the records from the record scanner.
        const result = await this.owned(searchParameters);
        // If the request was successful, return the records otherwise throw an error.
        if (result.ok) return result.data;
        throw new RecordScannerRequestError(result.error.message, result.status);
    }

    /**
     * Find a credits.aleo record in the record scanning service.
     * 
     * @param {number} microcredits The amount of microcredits to find.
     * @param {OwnedFilter} searchParameters The filter to use to find the record.
     * @returns {Promise<OwnedRecord>} The record.
     */
    async findCreditsRecord(microcredits: number, searchParameters: OwnedFilter): Promise<OwnedRecord> {
        // Attempt to get the UUID from the filter or the configured UUID within the scanner.
        const uuid = <string>this.getUUID(searchParameters);
        if (!uuid) {
            throw new UUIDError(`No uuid found in the record scanner filter`, uuid, searchParameters);
        }

        // Specify an error message if no matching view key is found.
        const msg = `Cannot find a credits.aleo record matching ${microcredits} microcredits
- No matching view key found for UUID ${uuid} in the record scanner. A matching ViewKey must be present
in order to decrypt the records from the record scanning service. ViewKeys can be added using the addViewKey
method.`;

        // Attempt to get the configured view key to decrypt the record.
        const viewKey =
            this.viewKeys?.[uuid] ??
            (this.account?.viewKey() &&
            this.computeUUID(this.account.viewKey()).toString() === uuid
                ? this.account.viewKey()
                : undefined);
        if (!viewKey) throw new UUIDError(msg, uuid, searchParameters);


        try {
            // Construct the request to the record scanner for credits.aleo records.
            const records = await this.findRecords({
                unspent: searchParameters.unspent ?? true,
                filter: {
                    program: "credits.aleo",
                    record: "credits",
                    ...(searchParameters.filter ? searchParameters.filter : {}),
                },
                responseFilter: searchParameters.responseFilter,
                uuid,
            });

            // Attempt to find a record matching the desired amount.
            const record = records.find(record => {
                // Find a record matching the desired amount.
                if (record.record_ciphertext) {
                    try {
                        RecordCiphertext.fromString(record.record_ciphertext).decrypt(viewKey);
                        const plaintext = RecordPlaintext.fromString(record.record_plaintext ?? '');
                        const amountStr = plaintext.getMember("microcredits").toString();
                        const amount = parseInt(amountStr.replace("u64", ""));
                        return amount >= microcredits;
                    } catch {
                        return false;
                    }
                } else {
                    return false;
                }
            });

            // Throw an error if no matching record was found.
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
     * Find credits records greater than or equal to the specified amounts using the record scanning service.
     * 
     * @param {number[]} microcreditAmounts The amounts of microcredits to find.
     * @param {OwnedFilter} searchParameters The filter to use to find the records.
     * @returns {Promise<OwnedRecord[]>} The records
     */
    async findCreditsRecords(microcreditAmounts: number[], searchParameters: OwnedFilter): Promise<OwnedRecord[]> {
        // Attempt to get the UUID from the filter or the configured UUID within the scanner.
        const uuid = <string>this.getUUID(searchParameters);
        if (!uuid) {
            throw new UUIDError(`No uuid found in the record scanner filter, and none configured within the record scanner`, uuid, searchParameters);
        }

        // Specify an error message if no matching view key is found.
        const msg = `Cannot find credits.aleo records matching amounts ${microcreditAmounts} 
- No matching view key found for UUID ${uuid} in the record scanner. A matching ViewKey must be present
in order to decrypt the records from the record scanning service. ViewKeys can be added using the addViewKey
method.`;

        // Attempt to get the configured view key to decrypt the record.
        const viewKey =
            this.viewKeys?.[uuid] ??
            (this.account?.viewKey() &&
            this.computeUUID(this.account.viewKey()).toString() === uuid
                ? this.account.viewKey()
                : undefined);
        if (!viewKey) throw new UUIDError(msg, uuid, searchParameters);

        try {
            // Construct the request to the record scanner for credits.aleo records.
            const records = await this.findRecords({
                unspent: searchParameters.unspent ?? true,
                filter: {
                    program: "credits.aleo",
                    record: "credits",
                    ...(searchParameters.filter ? searchParameters.filter : {}),
                },
                responseFilter: searchParameters.responseFilter,
                uuid,
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
     * Wrapper function to make a request to the record scanning service and handle any errors.
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
                const text = await response.text();
                throw new RecordScannerRequestError(
                    text || `Request to ${req.url} failed with status ${response.status}`,
                    response.status,
                );
            }

            return response;
        } catch (error) {
            console.error(`Failed to make request to ${req.url}: ${error}`);
            throw error;
        }
    }

    /**
     * Compute the record scanner UUID for a view key.
     *
     * @param {ViewKey} viewKey The view key to compute the UUID for.
     * @returns {Field} The computed UUID corresponding to the view key.
     */
    computeUUID(viewKey: ViewKey): Field {
        // Construct the material needed for the Poseidon oracle.
        const inputs = [Field.newDomainSeparator(RECORD_DOMAIN), viewKey.toField(), Field.one()]
        // Calculate the uuid.
        const hasher = new Poseidon4();
        return hasher.hash(inputs);
    }

    /**
     * Validate a UUID string to ensure it represents a valid Aleo Record Scanner UUID.
     *
     * @param {string} uuid The UUID to validate.
     * @returns {boolean} Whether the UUID is valid.
     */
    uuidIsValid(uuid: string): boolean {
        try {
            Field.fromString(uuid);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get the uuid for the filter, first by extracting the UUID from the filter, then falling back to the uuid
     * configured within the record scanner.
     *
     * @param {OwnedFilter} filter The filter to extract the UUID from.
     * @returns {string | undefined} The UUID for the filter, or undefined if the filter does not contain a UUID.
     */
    private getUUID(filter: OwnedFilter): string | undefined {
        // Extract the UUID from the filter.
        if (filter.uuid && this.uuidIsValid(filter.uuid)) {
            return filter.uuid;
        }

        return this.uuid?.toString();
    }
}

export { RecordScanner };
