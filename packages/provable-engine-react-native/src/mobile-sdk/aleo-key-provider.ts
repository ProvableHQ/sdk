import type { KeySearchParams } from "./aleo-key-provider-params";
import {
  CREDITS_PROGRAM_KEYS,
  type Key,
  PRIVATE_TO_PUBLIC_TRANSFER,
  PRIVATE_TRANSFER,
  PUBLIC_TO_PRIVATE_TRANSFER,
  PUBLIC_TRANSFER,
  PUBLIC_TRANSFER_AS_SIGNER,
} from "./constants";
import { getNetwork } from "./current-network";
import { ProvingKey } from "./proving-key";
import { get } from "./utils";
import { VerifyingKey } from "./verifying-key";

type CachedKeyPair = [Uint8Array, Uint8Array];
export type FunctionKeyPair = [ProvingKey, VerifyingKey];

export interface FunctionKeyProvider {
  /**
   * Get bond_public function keys from the credits.aleo program
   *
   * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the bond_public function
   */
  bondPublicKeys(): Promise<FunctionKeyPair>;

  /**
   * Get bond_validator function keys from the credits.aleo program
   *
   * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the bond_validator function
   */
  bondValidatorKeys(): Promise<FunctionKeyPair>;

  /**
   * Cache a set of keys. This will overwrite any existing keys with the same keyId. The user can check if a keyId
   * exists in the cache using the containsKeys method prior to calling this method if overwriting is not desired.
   *
   * @param {string} keyId access key for the cache
   * @param {FunctionKeyPair} keys keys to cache
   */
  cacheKeys(keyId: string, keys: FunctionKeyPair): void;

  /**
   * Get unbond_public function keys from the credits.aleo program
   *
   * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the unbond_public function
   */
  claimUnbondPublicKeys(): Promise<FunctionKeyPair>;

  /**
   * Get arbitrary function keys from a provider
   *
   * @param {KeySearchParams | undefined} params - Optional search parameters for the key provider
   * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the specified program
   *
   * @example
   * // Create a search object which implements the KeySearchParams interface
   * class IndexDbSearch implements KeySearchParams {
   *     db: string
   *     keyId: string
   *     constructor(params: {db: string, keyId: string}) {
   *         this.db = params.db;
   *         this.keyId = params.keyId;
   *     }
   * }
   *
   * // Create a new object which implements the KeyProvider interface
   * class IndexDbKeyProvider implements FunctionKeyProvider {
   *     async functionKeys(params: KeySearchParams): Promise<FunctionKeyPair> {
   *         return new Promise((resolve, reject) => {
   *             const request = indexedDB.open(params.db, 1);
   *
   *             request.onupgradeneeded = function(e) {
   *                 const db = e.target.result;
   *                 if (!db.objectStoreNames.contains('keys')) {
   *                     db.createObjectStore('keys', { keyPath: 'id' });
   *                 }
   *             };
   *
   *             request.onsuccess = function(e) {
   *                 const db = e.target.result;
   *                 const transaction = db.transaction(["keys"], "readonly");
   *                 const store = transaction.objectStore("keys");
   *                 const request = store.get(params.keyId);
   *                 request.onsuccess = function(e) {
   *                     if (request.result) {
   *                         resolve(request.result as FunctionKeyPair);
   *                     } else {
   *                         reject(new Error("Key not found"));
   *                     }
   *                 };
   *                 request.onerror = function(e) { reject(new Error("Error fetching key")); };
   *             };
   *
   *             request.onerror = function(e) { reject(new Error("Error opening database")); };
   *         });
   *     }
   *
   *     // implement the other methods...
   * }
   *
   *
   * const keyProvider = new AleoKeyProvider();
   * const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
   * const recordProvider = new NetworkRecordProvider(account, networkClient);
   *
   * // Initialize a program manager with the key provider to automatically fetch keys for value transfers
   * const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
   * programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
   *
   * // Keys can also be fetched manually
   * const searchParams = new IndexDbSearch({db: "keys", keyId: "credits.aleo:transferPrivate"});
   * const [transferPrivateProvingKey, transferPrivateVerifyingKey] = await keyProvider.functionKeys(searchParams);
   */
  functionKeys(params?: KeySearchParams): Promise<FunctionKeyPair>;

  /**
   * Get fee_private function keys from the credits.aleo program
   *
   * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the join function
   */
  feePrivateKeys(): Promise<FunctionKeyPair>;

  /**
   * Get fee_public function keys from the credits.aleo program
   *
   * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the join function
   */
  feePublicKeys(): Promise<FunctionKeyPair>;

  /**
   * Get keys for the inclusion proof.
   *
   * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the join function
   */
  inclusionKeys(): Promise<FunctionKeyPair>;

  /**
   * Get join function keys from the credits.aleo program
   *
   * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the join function
   */
  joinKeys(): Promise<FunctionKeyPair>;

  /**
   * Get split function keys from the credits.aleo program
   *
   * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the join function
   */
  splitKeys(): Promise<FunctionKeyPair>;

  /**
   * Get keys for a variant of the transfer function from the credits.aleo program
   *
   * @param {string} visibility Visibility of the transfer function (private, public, privateToPublic, publicToPrivate)
   * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the specified transfer function
   *
   * @example
   * // Create a new object which implements the KeyProvider interface
   * const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
   * const keyProvider = new AleoKeyProvider();
   * const recordProvider = new NetworkRecordProvider(account, networkClient);
   *
   * // Initialize a program manager with the key provider to automatically fetch keys for value transfers
   * const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
   * programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
   *
   * // Keys can also be fetched manually
   * const [transferPublicProvingKey, transferPublicVerifyingKey] = await keyProvider.transferKeys("public");
   */
  transferKeys(visibility: string): Promise<FunctionKeyPair>;

  /**
   * Get unbond_public function keys from the credits.aleo program
   *
   * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the join function
   */
  unBondPublicKeys(): Promise<FunctionKeyPair>;
}

/**
 * Options for creating an AleoKeyProvider instance.
 */
export interface AleoKeyProviderOptions {
  /** Whether to enable caching of keys */
  enableCaching?: boolean;
  /** Maximum number of keys to cache */
  maxCacheSize?: number;
  /** Cache timeout in milliseconds */
  cacheTimeout?: number;
}

/**
 * AleoKeyProvider class for managing cryptographic keys in React Native applications.
 *
 * The AleoKeyProvider class provides methods to generate, cache, and manage cryptographic
 * keys for Aleo programs. It supports caching for improved performance and provides
 * utilities for key derivation and management.
 *
 * @example
 * import { AleoKeyProvider, Account } from "@provablehq/shield-mobile-sdk";
 *
 * const keyProvider = new AleoKeyProvider();
 * keyProvider.useCache(true);
 *
 * // Generate keys for a program
 * const keys = await keyProvider.functionKeys("credits.aleo", "transfer_public");
 */
export class AleoKeyProvider implements FunctionKeyProvider {
  private _enableCaching: boolean;
  private _maxCacheSize: number;
  private _cacheTimeout: number;
  private _cache: Map<string, CachedKeyPair>;

  constructor(options: AleoKeyProviderOptions = {}) {
    this._enableCaching = options.enableCaching ?? true;
    this._maxCacheSize = options.maxCacheSize ?? 100;
    this._cacheTimeout = options.cacheTimeout ?? 300000; // 5 minutes default
    this._cache = new Map<string, CachedKeyPair>();
  }

  async fetchBytes(url = "/"): Promise<Uint8Array> {
    try {
      const response = await get(url);
      const data = await response.arrayBuffer();
      return new Uint8Array(data);
    } catch (error: any) {
      throw new Error(`Error fetching data.${error.message}`);
    }
  }

  /**
   * Enable or disable key caching
   * @param {boolean} useCache Whether to use caching
   *
   * @example
   * import { AleoKeyProvider } from "@provablehq/shield-mobile-sdk";
   *
   * const keyProvider = new AleoKeyProvider();
   * keyProvider.useCache(true); // Enable caching
   * keyProvider.useCache(false); // Disable caching
   */
  useCache(useCache: boolean): void {
    this._enableCaching = useCache;
  }

  /**
   * Check if caching is enabled
   * @returns {boolean} True if caching is enabled
   */
  isCacheEnabled(): boolean {
    return this._enableCaching;
  }

  /**
   * Set the maximum cache size
   * @param {number} maxSize Maximum number of keys to cache
   *
   * @example
   * import { AleoKeyProvider } from "@provablehq/shield-mobile-sdk";
   *
   * const keyProvider = new AleoKeyProvider();
   * keyProvider.setMaxCacheSize(200); // Cache up to 200 keys
   */
  setMaxCacheSize(maxSize: number): void {
    this._maxCacheSize = maxSize;
  }

  /**
   * Get the maximum cache size
   * @returns {number} Maximum number of keys that can be cached
   */
  getMaxCacheSize(): number {
    return this._maxCacheSize;
  }

  /**
   * Set the cache timeout
   * @param {number} timeout Cache timeout in milliseconds
   *
   * @example
   * import { AleoKeyProvider } from "@provablehq/shield-mobile-sdk";
   *
   * const keyProvider = new AleoKeyProvider();
   * keyProvider.setCacheTimeout(600000); // 10 minutes timeout
   */
  setCacheTimeout(timeout: number): void {
    this._cacheTimeout = timeout;
  }

  /**
   * Get the cache timeout
   * @returns {number} Cache timeout in milliseconds
   */
  getCacheTimeout(): number {
    return this._cacheTimeout;
  }

  /**
   * Get the number of cached keys
   * @returns {Promise<number>} The number of cached keys
   *
   * @example
   * import { AleoKeyProvider } from "@provablehq/shield-mobile-sdk";
   *
   * const keyProvider = new AleoKeyProvider();
   * const cacheSize = await keyProvider.getCacheSize();
   * console.log(`Cache contains ${cacheSize} keys`);
   */
  async getCacheSize(): Promise<number> {
    return this._cache.size;
  }

  /**
   * Cache a set of keys. This will overwrite any existing keys with the same keyId. The user can check if a keyId
   * exists in the cache using the containsKeys method prior to calling this method if overwriting is not desired.
   *
   * @param {string} keyId access key for the cache
   * @param {FunctionKeyPair} keys keys to cache
   */
  cacheKeys(keyId: string, keys: FunctionKeyPair) {
    const [provingKey, verifyingKey] = keys;
    this._cache.set(keyId, [provingKey.toBytes(), verifyingKey.toBytes()]);
  }

  /**
   * Clear all cached keys
   * @returns {Promise<void>}
   *
   * @example
   * import { AleoKeyProvider } from "@provablehq/shield-mobile-sdk";
   *
   * const keyProvider = new AleoKeyProvider();
   * await keyProvider.clearCache();
   */
  async clearCache(): Promise<void> {
    this._cache.clear();
  }

  /**
   * Determine if a keyId exists in the cache
   *
   * @param {string} keyId keyId of a proving and verifying key pair
   * @returns {boolean} true if the keyId exists in the cache, false otherwise
   */
  containsKeys(keyId: string): boolean {
    return this._cache.has(keyId);
  }

  /**
   * Delete a set of keys from the cache
   *
   * @param {string} keyId keyId of a proving and verifying key pair to delete from memory
   * @returns {boolean} true if the keyId exists in the cache and was deleted, false if the key did not exist
   */
  deleteKeys(keyId: string): boolean {
    return this._cache.delete(keyId);
  }

  /**
   * Get a set of keys from the cache
   * @param keyId keyId of a proving and verifying key pair
   *
   * @returns {FunctionKeyPair} Proving and verifying keys for the specified program
   */
  getKeys(keyId: string): FunctionKeyPair {
    console.debug(`Checking if key exists in cache. KeyId: ${keyId}`);
    if (this._cache.has(keyId)) {
      const [provingKeyBytes, verifyingKeyBytes] = <CachedKeyPair>this._cache.get(keyId);
      return [ProvingKey.fromBytes(provingKeyBytes), VerifyingKey.fromBytes(verifyingKeyBytes)];
    } else {
      throw new Error("Key not found in cache.");
    }
  }

  /**
   * Get arbitrary function keys from a provider
   *
   * @param {KeySearchParams} params parameters for the key search in form of: {proverUri: string, verifierUri: string, cacheKey: string}
   * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the specified program
   *
   * @example
   * // Create a new object which implements the KeyProvider interface
   * const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
   * const keyProvider = new AleoKeyProvider();
   * const recordProvider = new NetworkRecordProvider(account, networkClient);
   *
   * // Initialize a program manager with the key provider to automatically fetch keys for value transfers
   * const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
   * programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
   *
   * // Keys can also be fetched manually using the key provider
   * const keySearchParams = { "cacheKey": "myProgram:myFunction" };
   * const [transferPrivateProvingKey, transferPrivateVerifyingKey] = await keyProvider.functionKeys(keySearchParams);
   */
  async functionKeys(params?: KeySearchParams): Promise<FunctionKeyPair> {
    if (params) {
      let proverUrl: string | undefined;
      let verifierUrl: string | undefined;
      let cacheKey: string | undefined;

      if ("name" in params && typeof params.name === "string") {
        const key = CREDITS_PROGRAM_KEYS.getKey(params.name);
        return this.fetchCreditsKeys(key);
      }

      if ("proverUri" in params && typeof params.proverUri === "string") {
        proverUrl = params.proverUri;
      }

      if ("verifierUri" in params && typeof params.verifierUri === "string") {
        verifierUrl = params.verifierUri;
      }

      if ("cacheKey" in params && typeof params.cacheKey === "string") {
        cacheKey = params.cacheKey;
      }

      if (proverUrl && verifierUrl) {
        return await this.fetchRemoteKeys(proverUrl, verifierUrl, cacheKey);
      }

      if (cacheKey) {
        return this.getKeys(cacheKey);
      }
    }
    throw new Error(
      "Invalid parameters provided, must provide either a cacheKey and/or a proverUrl and a verifierUrl"
    );
  }

  /**
   * Returns the proving and verifying keys for a specified program from a specified url.
   *
   * @param {string} verifierUrl Url of the proving key
   * @param {string} proverUrl Url the verifying key
   * @param {string} cacheKey Key to store the keys in the cache
   *
   * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the specified program
   *
   * @example
   * // Create a new AleoKeyProvider object
   * const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
   * const keyProvider = new AleoKeyProvider();
   * const recordProvider = new NetworkRecordProvider(account, networkClient);
   *
   * // Initialize a program manager with the key provider to automatically fetch keys for value transfers
   * const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
   * programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
   *
   * // Keys can also be fetched manually
   * const [transferPrivateProvingKey, transferPrivateVerifyingKey] = await keyProvider.fetchKeys(
   *     CREDITS_PROGRAM_KEYS.transfer_private.prover,
   *     CREDITS_PROGRAM_KEYS.transfer_private.verifier,
   * );
   */
  async fetchRemoteKeys(
    proverUrl: string,
    verifierUrl: string,
    cacheKey?: string
  ): Promise<FunctionKeyPair> {
    try {
      // If cache is enabled, check if the keys have already been fetched and return them if they have
      if (this._enableCaching) {
        if (!cacheKey) {
          cacheKey = proverUrl;
        }
        const value = this._cache.get(cacheKey);
        if (typeof value !== "undefined") {
          return [ProvingKey.fromBytes(value[0]), VerifyingKey.fromBytes(value[1])];
        } else {
          console.debug(`Fetching proving keys from url ${proverUrl} <- url fetchRemoteKeys`);
          const provingKey = <ProvingKey>ProvingKey.fromBytes(await this.fetchBytes(proverUrl));
          console.debug(`Fetching verifying keys ${verifierUrl}`);
          const verifyingKey = <VerifyingKey>await this.getVerifyingKey(verifierUrl);
          this._cache.set(cacheKey, [provingKey.toBytes(), verifyingKey.toBytes()]);
          return [provingKey, verifyingKey];
        }
      } else {
        // If cache is disabled, fetch the keys and return them
        const provingKey = <ProvingKey>ProvingKey.fromBytes(await this.fetchBytes(proverUrl));
        const verifyingKey = <VerifyingKey>await this.getVerifyingKey(verifierUrl);
        return [provingKey, verifyingKey];
      }
    } catch (error: any) {
      throw new Error(
        `Error: ${error.message} fetching fee proving and verifying keys from ${proverUrl} and ${verifierUrl}.`
      );
    }
  }

  /***
   * Fetches the proving key from a remote source.
   *
   * @param proverUrl
   * @param cacheKey
   *
   * @returns {Promise<ProvingKey>} Proving key for the specified program
   */
  async fetchProvingKey(proverUrl: string, cacheKey?: string): Promise<ProvingKey> {
    try {
      // If cache is enabled, check if the keys have already been fetched and return them if they have
      if (this._enableCaching) {
        if (!cacheKey) {
          cacheKey = proverUrl;
        }
        const value = this._cache.get(cacheKey);
        if (typeof value !== "undefined") {
          return ProvingKey.fromBytes(value[0]);
        } else {
          console.debug(`Fetching proving keys from url ${proverUrl} <- url fetchProvingKey`);
          const provingKey = <ProvingKey>ProvingKey.fromBytes(await this.fetchBytes(proverUrl));
          return provingKey;
        }
      } else {
        const provingKey = <ProvingKey>ProvingKey.fromBytes(await this.fetchBytes(proverUrl));
        return provingKey;
      }
    } catch (error: any) {
      throw new Error(`Error: ${error.message} fetching fee proving keys from ${proverUrl}`);
    }
  }

  async fetchCreditsKeys(key: Key): Promise<FunctionKeyPair> {
    try {
      if (!this._cache.has(key.locator) || !this._enableCaching) {
        const verifying_key = key.verifyingKey();
        // Construct full URL with current network (Rust returns path-only)
        const network = getNetwork();
        const baseUrl = "https://parameters.provable.com";
        const fullProverUrl = key.prover.startsWith("http")
          ? key.prover // Already a full URL (backward compat)
          : `${baseUrl}/${network}/${key.prover}`; // Construct from path
        console.log(`Fetching proving keys from url ${fullProverUrl} <- url fetchCreditsKeys`);
        const proving_key = <ProvingKey>await this.fetchProvingKey(fullProverUrl, key.locator);
        if (this._enableCaching) {
          this._cache.set(key.locator, [
            proving_key.toBytes(),
            verifying_key.toBytes(),
          ]);
        }
        return [proving_key, verifying_key];
      } else {
        const keyPair = <CachedKeyPair>this._cache.get(key.locator);
        return [ProvingKey.fromBytes(keyPair[0]), VerifyingKey.fromBytes(keyPair[1])];
      }
    } catch (error: any) {
      throw new Error(`Error: fetching credits.aleo keys: ${error.message}`);
    }
  }

  async bondPublicKeys(): Promise<FunctionKeyPair> {
    return this.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.bond_public);
  }

  bondValidatorKeys(): Promise<FunctionKeyPair> {
    return this.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.bond_validator);
  }

  claimUnbondPublicKeys(): Promise<FunctionKeyPair> {
    return this.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.claim_unbond_public);
  }

  /**
   * Returns the proving and verifying keys for the transfer functions in the credits.aleo program
   * @param {string} visibility Visibility of the transfer function
   * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the transfer functions
   *
   * @example
   * // Create a new AleoKeyProvider
   * const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
   * const keyProvider = new AleoKeyProvider();
   * const recordProvider = new NetworkRecordProvider(account, networkClient);
   *
   * // Initialize a program manager with the key provider to automatically fetch keys for value transfers
   * const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
   * programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
   *
   * // Keys can also be fetched manually
   * const [transferPublicProvingKey, transferPublicVerifyingKey] = await keyProvider.transferKeys("public");
   */
  async transferKeys(visibility: string): Promise<FunctionKeyPair> {
    if (PRIVATE_TRANSFER.has(visibility)) {
      return await this.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.transfer_private);
    } else if (PRIVATE_TO_PUBLIC_TRANSFER.has(visibility)) {
      return await this.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.transfer_private_to_public);
    } else if (PUBLIC_TRANSFER.has(visibility)) {
      return await this.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.transfer_public);
    } else if (PUBLIC_TRANSFER_AS_SIGNER.has(visibility)) {
      return await this.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.transfer_public_as_signer);
    } else if (PUBLIC_TO_PRIVATE_TRANSFER.has(visibility)) {
      return await this.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.transfer_public_to_private);
    } else {
      throw new Error("Invalid visibility type");
    }
  }

  /**
   * Returns the proving and verifying keys for the transfer_public function.
   *
   * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the transfer_public function
   */
  async transferPublicKeys(): Promise<FunctionKeyPair> {
    return await this.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.transfer_public);
  }

  /**
   * Returns the proving and verifying keys for the inclusion proof.
   *
   * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the inclusion proof.
   */
  async inclusionKeys(): Promise<FunctionKeyPair> {
    return await this.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.inclusion);
  }

  /**
   * Returns the proving and verifying keys for the join function in the credits.aleo program
   *
   * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the join function
   */
  async joinKeys(): Promise<FunctionKeyPair> {
    return await this.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.join);
  }

  /**
   * Returns the proving and verifying keys for the split function in the credits.aleo program
   *
   * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the split function
   * */
  async splitKeys(): Promise<FunctionKeyPair> {
    return await this.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.split);
  }

  /**
   * Returns the proving and verifying keys for the fee_private function in the credits.aleo program
   *
   * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the fee function
   */
  async feePrivateKeys(): Promise<FunctionKeyPair> {
    return await this.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.fee_private);
  }

  /**
   * Returns the proving and verifying keys for the fee_public function in the credits.aleo program
   *
   * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the fee function
   */
  async feePublicKeys(): Promise<FunctionKeyPair> {
    return await this.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.fee_public);
  }

  /**
   * Gets a verifying key. If the verifying key is for a credits.aleo function, get it from the wasm cache otherwise
   *
   * @returns {Promise<VerifyingKey>} Verifying key for the function
   */
  // attempt to fetch it from the network
  async getVerifyingKey(verifierUri: string): Promise<VerifyingKey> {
    switch (verifierUri) {
      case CREDITS_PROGRAM_KEYS.bond_public.verifier:
        return CREDITS_PROGRAM_KEYS.bond_public.verifyingKey();
      case CREDITS_PROGRAM_KEYS.bond_validator.verifier:
        return CREDITS_PROGRAM_KEYS.bond_validator.verifyingKey();
      case CREDITS_PROGRAM_KEYS.claim_unbond_public.verifier:
        return CREDITS_PROGRAM_KEYS.claim_unbond_public.verifyingKey();
      case CREDITS_PROGRAM_KEYS.fee_private.verifier:
        return CREDITS_PROGRAM_KEYS.fee_private.verifyingKey();
      case CREDITS_PROGRAM_KEYS.fee_public.verifier:
        return CREDITS_PROGRAM_KEYS.fee_public.verifyingKey();
      case CREDITS_PROGRAM_KEYS.inclusion.verifier:
        return CREDITS_PROGRAM_KEYS.inclusion.verifyingKey();
      case CREDITS_PROGRAM_KEYS.join.verifier:
        return CREDITS_PROGRAM_KEYS.join.verifyingKey();
      case CREDITS_PROGRAM_KEYS.set_validator_state.verifier:
        return CREDITS_PROGRAM_KEYS.set_validator_state.verifyingKey();
      case CREDITS_PROGRAM_KEYS.split.verifier:
        return CREDITS_PROGRAM_KEYS.split.verifyingKey();
      case CREDITS_PROGRAM_KEYS.transfer_private.verifier:
        return CREDITS_PROGRAM_KEYS.transfer_private.verifyingKey();
      case CREDITS_PROGRAM_KEYS.transfer_private_to_public.verifier:
        return CREDITS_PROGRAM_KEYS.transfer_private_to_public.verifyingKey();
      case CREDITS_PROGRAM_KEYS.transfer_public.verifier:
        return CREDITS_PROGRAM_KEYS.transfer_public.verifyingKey();
      case CREDITS_PROGRAM_KEYS.transfer_public_as_signer.verifier:
        return CREDITS_PROGRAM_KEYS.transfer_public_as_signer.verifyingKey();
      case CREDITS_PROGRAM_KEYS.transfer_public_to_private.verifier:
        return CREDITS_PROGRAM_KEYS.transfer_public_to_private.verifyingKey();
      case CREDITS_PROGRAM_KEYS.unbond_public.verifier:
        return CREDITS_PROGRAM_KEYS.unbond_public.verifyingKey();
      default:
        try {
          /// Try to fetch the verifying key from the network as a string
          const response = await get(verifierUri);
          const text = await response.text();
          return <VerifyingKey>VerifyingKey.fromString(text);
        } catch (_e) {
          /// If that fails, try to fetch the verifying key from the network as bytes
          try {
            return <VerifyingKey>VerifyingKey.fromBytes(await this.fetchBytes(verifierUri));
          } catch (inner: any) {
            throw new Error(`Invalid verifying key. Error: ${inner.message}`);
          }
        }
    }
  }

  unBondPublicKeys(): Promise<FunctionKeyPair> {
    return this.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.unbond_public);
  }
}
