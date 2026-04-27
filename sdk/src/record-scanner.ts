import { parseJSON, post, TransportFunction, defaultTransport } from "./utils.js";
import { EncryptedRecord } from "./models/record-provider/encryptedRecord.js";
import { CryptoBoxPubKey } from "./models/cryptoBoxPubkey.js";
import { EncryptedRegistrationRequest } from "./models/record-scanner/encryptedRegistrationRequest.js";
import { OwnedFilter } from "./models/record-scanner/ownedFilter.js";
import { OwnedRecord } from "./models/record-provider/ownedRecord.js";
import { RecordProvider } from "./record-provider.js";
import { Field, Poseidon4, RecordCiphertext, RecordPlaintext, ViewKey } from "./wasm.js";
import { RecordsFilter } from "./models/record-scanner/recordsFilter.js";
import { RegisterResult } from "./models/record-scanner/registrationResult.js";
import { RevokeResult } from "./models/record-scanner/revokeResult.js";
import {
    DecryptionNotEnabledError,
    RecordNotFoundError,
    RecordScannerFailure,
    UUIDError,
    RecordScannerRequestError,
    ViewKeyNotStoredError,
} from "./models/record-scanner/error.js";
import { RegistrationRequest } from "./models/record-scanner/registrationRequest.js";
import { RegistrationResponse } from "./models/record-scanner/registrationResponse.js";
import { StatusResponse } from "./models/record-scanner/statusResponse.js";
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
 *
 * @property {string} jwt The JWT token string.
 * @property {number} expiration Expiration time as a Unix timestamp (e.g. in milliseconds).
 */
export interface RecordScannerJWTData {
    jwt: string;
    expiration: number;
}

/**
 * Configuration for the record scanner.
 *
 * @property {string} url Base URL of the record scanning service (network path is appended by the SDK).
 * @property {string | { header: string, value: string }} [apiKey] API key as a string or as a custom header name and value.
 * @property {string} [consumerId] Required for JWT refresh when using authenticated record scanner (e.g. Provable API).
 * @property {RecordScannerJWTData} [jwtData] Optional JWT for auth. If omitted and apiKey + consumerId are set, JWT is refreshed when needed.
 * @property {ViewKey[]} [viewKeys] Optional view keys to use for local scanning and decryption.
 * @property {Account} [account] Optional account to use for local scanning and decryption.
 * @property {boolean} [cacheViewKeysOnRegister] Cache view keys in memory for faster scanning upon register.
 * @property {boolean} [autoReRegister] If true, on 422 from /owned attempt one re-register via registerEncrypted (when a view key is in viewKeys or account) and retry once. Default false.
 * @property {boolean} [decryptEnabled] If true, enable decryption of owned records (e.g. for use with the decrypt method). This is REQUIRED for findCreditsRecord/findCreditsRecords to work properly. Further the ViewKey matching the UUID must be stored in the RecordScanner object to perform decryption. Default false.
 */
export interface RecordScannerOptions {
    url: string;
    apiKey?: string | { header: string, value: string };
    consumerId?: string;
    jwtData?: RecordScannerJWTData;
    viewKeys?: ViewKey[];
    account?: Account;
    cacheViewKeysOnRegister?: boolean;
    autoReRegister?: boolean;
    decryptEnabled?: boolean;
    transport?: TransportFunction;
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
 * recordScanner.setApiKey("example-api-key");
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
    private readonly baseUrl: string;
    private apiKey?: { header: string, value: string };
    private consumerId?: string;
    private jwtData?: RecordScannerJWTData;
    private uuid?: Field;
    private viewKeys?: { [key: string]: ViewKey };
    private autoReRegister?: boolean;
    private decryptEnabled?: boolean;
    transport: TransportFunction;
    account?: Account | undefined;

    /**
     * @param {RecordScannerOptions} options Configuration for the record scanner.
     */
    constructor(options: RecordScannerOptions) {
        // Set the network by detecting which version of the SDK is being used.
        const network = "/%%NETWORK%%";
        this.transport = options.transport ?? defaultTransport;

        // If the user has configured a network in their uri, throw.
        if (options.url.endsWith("/mainnet") || options.url.endsWith("/testnet")) {
            throw new Error("The record scanning url should not include the specific network, this is automatically configured by the Provable SDK.");
        }

        // Configure the url to use the network the SDK is using.
        // baseUrl is the API root (origin only) — used for JWT refresh which
        // lives at /jwts/{consumerId} on the API root, not under /scanner.
        this.baseUrl = new URL(options.url).origin;
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
        this.autoReRegister = options.autoReRegister;
        this.decryptEnabled = options.decryptEnabled;
    }

    /**
     * Set the API key to use for the record scanner.
     *
     * @param {string | { header: string, value: string }} apiKey The API key to use for the record scanner.
     */
    setApiKey(apiKey: string | { header: string, value: string }) {
        this.apiKey = typeof apiKey === "string" ? { header: "X-Provable-API-Key", value: apiKey } : apiKey;
    }

    /**
     * Set the consumer ID used for JWT refresh when using authenticated record scanner (e.g. Provable API).
     *
     * @param {string} consumerId The consumer ID to use for JWT refresh.
     */
    setConsumerId(consumerId: string) {
        this.consumerId = consumerId;
    }

    /**
     * Set JWT data for authentication. Optional; when not set, JWT can be refreshed from apiKey + consumerId if provided.
     *
     * @param {RecordScannerJWTData | undefined} jwtData The JWT data to use, or undefined to clear.
     */
    setJwtData(jwtData: RecordScannerJWTData | undefined) {
        this.jwtData = jwtData;
    }

    /**
     * Set whether /owned should automatically re-register on 422 (when a view key for the UUID is in viewKeys or account) and retry once.
     *
     * @param {boolean} enabled Whether to enable auto re-register on 422.
     */
    setAutoReRegister(enabled: boolean) {
        this.autoReRegister = enabled;
    }

    /**
     * Set whether decryption of owned records is enabled (e.g. for use with the decrypt method).
     *
     * @param {boolean} enabled Whether to enable decryption of owned records received from the scanner using the `owned` or any `findRecords` methods.
     */
    setDecryptEnabled(enabled: boolean) {
        this.decryptEnabled = enabled;
    }

    /**
     * Add a view key to the record scanner for usage in local decryption. This is REQUIRED for findCreditsRecord/findCreditsRecords to work properly.
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
     * Return the view key for the given record-scanner UUID if one is configured
     * (in viewKeys or as the account's view key). Used to decide if re-registration on 422 is possible.
     *
     * @param {string} uuid The record-scanner UUID to look up.
     * @returns {ViewKey | undefined} The view key for that UUID, or undefined.
     */
    private getViewKeyForUuid(uuid: string): ViewKey | undefined {
        // Prefer view key from the cached map (keyed by UUID string).
        const cachedVk = this.viewKeys?.[uuid];
        if (cachedVk) return cachedVk;
        // Otherwise use the account's view key if it matches this UUID.
        const accountVk = this.account?.viewKey();
        if (accountVk && this.computeUUID(accountVk).toString() === uuid) return accountVk;
        return undefined;
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
     *
     * @param {string} apiKey The API key to use for the refresh request.
     * @param {string} consumerId The consumer ID for the JWT endpoint.
     * @returns {Promise<RecordScannerJWTData>} The new JWT data.
     */
    private async refreshJwt(apiKey: string, consumerId: string): Promise<RecordScannerJWTData> {
        const response = await post(
            `${this.baseUrl}/jwts/${consumerId}`,
            {
                headers: {
                    "X-Provable-API-Key": apiKey,
                },
            },
            this.transport,
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
     *
     * @returns {Promise<Record<string, string>>} Auth headers to add to requests, or empty object when not configured.
     */
    private async getAuthHeaders(): Promise<Record<string, string>> {
        let jwtData = this.jwtData;
        // Consider JWT expired a few minutes early to avoid race at boundary.
        const isExpired = jwtData && Date.now() >= jwtData.expiration - FIVE_MINUTES;
        if (!jwtData || isExpired) {
            const apiKey = this.apiKey?.value;
            if (apiKey && this.consumerId) {
                jwtData = await this.refreshJwt(apiKey, this.consumerId);
                this.jwtData = jwtData;
            } else if (jwtData?.jwt) {
                // Use existing JWT even if expired when refresh is not possible.
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
     * If the error is a RecordScannerRequestError (from request()), return a RecordScannerFailure result;
     * otherwise re-throw the error.
     *
     * @param {unknown} err The error from a failed request (e.g. from request() or from a catch after calling it).
     * @returns {RecordScannerFailure} When err is RecordScannerRequestError.
     * @throws Re-throws err when it is not a RecordScannerRequestError.
     */
    private handleRequestError(err: unknown): RecordScannerFailure {
        if (err instanceof RecordScannerRequestError) {
            return {
                ok: false,
                status: err.status,
                error: { message: err.message, status: err.status },
            };
        }
        throw err;
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
            console.error(`Failed to register view key: ${err}`);
            return this.handleRequestError(err);
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
            return this.handleRequestError(err);
        }
    }

    /**
     * Remove all local scanner state associated with the given UUID (stored uuid, viewKeys entry, account if it matches).
     * Called after a successful revoke so the scanner does not retain view keys or account for a revoked registration.
     */
    private clearLocalStateForUuid(uuidStr: string): void {
        if (this.uuid != null && this.uuid.toString() === uuidStr) {
            this.uuid = undefined;
        }
        if (this.viewKeys != null) {
            delete this.viewKeys[uuidStr];
            if (Object.keys(this.viewKeys).length === 0) {
                this.viewKeys = undefined;
            }
        }
        if (this.account != null && this.computeUUID(this.account.viewKey()).toString() === uuidStr) {
            this.account = undefined;
        }
    }

    /**
     * Revoke the account registration with the record scanning service (POST /revoke). On success, also removes
     * all local state for that UUID: the stored UUID (if it matches), the view key for that UUID, and the
     * account (if its view key corresponds to that UUID).
     *
     * @param {string | Field | undefined} uuid The UUID to revoke. If omitted, uses the UUID configured on the scanner.
     * @returns {Promise<RevokeResult>} `{ ok: true, data: { status } }` on success, or `{ ok: false, status, error }` on failure.
     * @throws {UUIDError} When no UUID is configured and none provided, or when the UUID string is invalid.
     */
    async revoke(uuid?: string | Field): Promise<RevokeResult> {
        const resolvedUuid = uuid ?? this.uuid;
        if (!resolvedUuid) {
            throw new UUIDError("No UUID configured for the record scanner and no UUID provided.");
        }
        const uuidStr = typeof resolvedUuid === "string" ? resolvedUuid : resolvedUuid.toString();
        if (!this.uuidIsValid(uuidStr)) {
            throw new UUIDError(`UUID provided ${uuidStr} is invalid`, uuidStr);
        }
        try {
            const response = await this.request(
                new Request(`${this.url}/revoke`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(uuidStr),
                }),
            );
            const data = await response.json();
            this.clearLocalStateForUuid(uuidStr);
            return { ok: true, data };
        } catch (err) {
            return this.handleRequestError(err);
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
            return this.handleRequestError(err);
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
            return this.handleRequestError(err);
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
            return this.handleRequestError(err);
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
            return this.handleRequestError(err);
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
        const uuid = this.getUUID(filter);
        // Throw an error if none could be found, otherwise set the UUID on the filter with either the UUID configured
        // within the filter or the UUID configured within the scanner.
        if (!uuid) {
            throw new UUIDError(
                "Error while using the record scanner. UUID is not set on the scanner and the UUID provided in the record filter was invalid.",
                undefined,
                filter,
            );
        }
        filter.uuid = uuid;

        // Inner request used to retry once after 422 re-register without duplicating logic.
        const ownedRequest = async (): Promise<OwnedRecordsResult> => {
            const response = await this.request(
                new Request(`${this.url}/records/owned`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(filter),
                }),
            );
            const data = await response.json();
            return { ok: true, data };
        };

        // When decryption is enabled and a view key exists for this UUID, decrypt records in place before returning.
        const attemptDecrypt = (result: OwnedRecordsResult): OwnedRecordsResult => {
            if (result.ok && this.decryptEnabled) {
                const viewKey = this.getViewKeyForUuid(uuid);
                if (viewKey) this.decrypt(viewKey, result.data);
            }
            return result;
        };

        try {
            return attemptDecrypt(await ownedRequest());
        } catch (err) {
            const failure = this.handleRequestError(err);
            // On 422 (e.g. not registered), optionally re-register with registerEncrypted and retry once.
            if (failure.status === 422 && this.autoReRegister) {
                const viewKey = this.getViewKeyForUuid(uuid);
                if (viewKey) {
                    const regResult = await this.registerEncrypted(viewKey, 0);
                    if (regResult.ok) {
                        try {
                            return attemptDecrypt(await ownedRequest());
                        } catch (retryErr) {
                            return this.handleRequestError(retryErr);
                        }
                    }
                }
            }
            return failure;
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
     * Get RecordPlaintext from an OwnedRecord by parsing record_plaintext (trimmed). Returns null if missing or parse fails. Does not decrypt; decryption is handled only in owned().
     */
    private getPlaintext(record: OwnedRecord): RecordPlaintext | null {
        // Only read record_plaintext (decrypted by the owned() callwhen decryptEnabled is true).
        const plaintextStr = record.record_plaintext?.trim();
        if (!plaintextStr) return null;
        try {
            return RecordPlaintext.fromString(plaintextStr);
        } catch {
            return null;
        }
    }

    /**
     * For each owned record provided, attempt to decrypt with the given view key. On success, sets record_plaintext on that record to the decrypted plaintext string. Records that fail to decrypt (e.g. wrong view key) or have no record_ciphertext are left unchanged.
     *
     * @param {ViewKey} viewKey The view key to use for decryption.
     * @param {OwnedRecord[]} records The owned records to decrypt (mutated in place).
     */
    decrypt(viewKey: ViewKey, records: OwnedRecord[]): void {
        for (const record of records) {
            const ciphertextStr = record.record_ciphertext?.trim();
            if (!ciphertextStr) continue;
            try {
                const ciphertext = RecordCiphertext.fromString(ciphertextStr);
                const plaintext = ciphertext.decrypt(viewKey);
                record.record_plaintext = plaintext.toString();
            } catch {
                // Wrong view key or invalid ciphertext; leave this record unchanged.
            }
        }
    }

    /**
     * Find a credits.aleo record in the record scanning service.
     * 
     * @param {number} microcredits The amount of microcredits to find.
     * @param {OwnedFilter} searchParameters The filter to use to find the record.
     * @returns {Promise<OwnedRecord>} The record.
     */
    async findCreditsRecord(microcredits: number, searchParameters: OwnedFilter): Promise<OwnedRecord> {
        const uuid = <string>this.getUUID(searchParameters);
        if (!uuid) {
            throw new UUIDError(`No uuid found in the record scanner filter`, uuid, searchParameters);
        }

        if (!this.decryptEnabled) {
            throw new DecryptionNotEnabledError(
                "Decryption of owned records must be enabled (set decryptEnabled in options or call setDecryptEnabled(true)) to use findCreditsRecord.",
                searchParameters,
            );
        }
        if (!this.getViewKeyForUuid(uuid)) {
            throw new ViewKeyNotStoredError(
                `No view key for UUID ${uuid} is stored in the record scanner. Add the view key via viewKeys in options, addViewKey(), or setAccount().`,
                uuid,
                searchParameters,
            );
        }

        try {
            // Fetch credits records (owned() will decrypt when decryptEnabled and view key are set).
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

            // First record whose plaintext microcredits >= requested amount.
            const record = records.find(r => {
                const plaintext = this.getPlaintext(r);
                if (!plaintext) return false;
                try {
                    const amountStr = plaintext.getMember("microcredits").toString();
                    const amount = parseInt(amountStr.replace("u64", ""));
                    return amount >= microcredits;
                } catch {
                    return false;
                }
            });

            if (!record) {
                throw new RecordNotFoundError(
                    `No records found matching the supplied search filter:\n${JSON.stringify(searchParameters, null, 2)}. Decryption of owned records MUST be enabled and the ViewKey matching the UUID must be stored in the RecordScanner object to perform decryption.`,
                    searchParameters,
                );
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
        const uuid = <string>this.getUUID(searchParameters);
        if (!uuid) {
            throw new UUIDError(`No uuid found in the record scanner filter, and none configured within the record scanner`, uuid, searchParameters);
        }

        if (!this.decryptEnabled) {
            throw new DecryptionNotEnabledError(
                "Decryption of owned records must be enabled (set decryptEnabled in options or call setDecryptEnabled(true)) to use findCreditsRecords.",
                searchParameters,
            );
        }
        if (!this.getViewKeyForUuid(uuid)) {
            throw new ViewKeyNotStoredError(
                `No view key for UUID ${uuid} is stored in the record scanner. Add the view key via viewKeys in options, addViewKey(), or setAccount().`,
                uuid,
                searchParameters,
            );
        }

        try {
            // Fetch credits records (owned() decrypts when decryptEnabled and a view key matching the UUID are set).
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
            // Keep only records whose plaintext microcredits match one of the requested amounts.
            return records.filter(r => {
                const plaintext = this.getPlaintext(r);
                if (!plaintext) return false;
                try {
                    const amount = plaintext.getMember("microcredits").toString();
                    return microcreditAmounts.includes(parseInt(amount.replace("u64", "")));
                } catch {
                    return false;
                }
            });
        } catch (error) {
            console.error(`Failed to find credits records: ${error}`);
            throw error;
        }
    }

    /**
     * Wrapper function to make a request to the record scanning service and handle any errors. Optionally adds JWT Authorization header when consumerId/jwtData (or apiKey+consumerId) are configured.
     *
     * @param {Request} req The request to make.
     * @returns {Promise<Response>} The response when the request succeeds.
     * @throws {RecordScannerRequestError} When the server returns a non-2xx status (e.g. 4xx, 5xx).
     * @throws Re-throws any error from fetch (e.g. network failure) or from getAuthHeaders().
     */
    private async request(req: Request): Promise<Response> {
        try {
            // Attach JWT (if configured) and API key before sending.
            const authHeaders = await this.getAuthHeaders();
            for (const [key, value] of Object.entries(authHeaders)) {
                req.headers.set(key, value);
            }
            if (this.apiKey) {
                req.headers.set(this.apiKey.header, this.apiKey.value);
            }
            const body = req.body ? await req.text() : undefined;
            const plainHeaders: Record<string, string> = {};
            req.headers.forEach((value, key) => { plainHeaders[key] = value; });
            const response = await this.transport(req.url, {
                method: req.method,
                headers: plainHeaders,
                body,
            });

            // Non-2xx: throw so callers can handleRequestError or re-register on 422 if autoReRegister is enabled.
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
     * Get the uuid for the filter, first by extracting the UUID from the filter, then falling back to the uuid configured within the record scanner.
     *
     * @param {OwnedFilter} filter The filter to extract the UUID from.
     * @returns {string | undefined} The UUID for the filter, or undefined if the filter does not contain a UUID.
     */
    private getUUID(filter: OwnedFilter): string | undefined {
        // Filter may specify a UUID; otherwise use the scanner's configured UUID.
        if (filter.uuid && this.uuidIsValid(filter.uuid)) {
            return filter.uuid;
        }
        return this.uuid?.toString();
    }
}

export { RecordScanner };
