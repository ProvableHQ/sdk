import { CachedKeyPair, FunctionKeyPair } from "../../models/keyPair.js";
import { KeyStore } from "./keystore.js";
import { LocalFileKeyStore } from "./file.js";
import { promoteMapToKeyStore } from "./memory.js";
import { ProvingKey, VerifyingKey } from "../../wasm.js";
import {
    CREDITS_PROGRAM_KEYS,
    PRIVATE_TRANSFER,
    PRIVATE_TO_PUBLIC_TRANSFER,
    PUBLIC_TRANSFER,
    PUBLIC_TRANSFER_AS_SIGNER,
} from "../../constants.js";
import {
    FunctionKeyProvider,
    KeySearchParams,
} from "../provider/function-key-provider.js";

/**
 * NodeKeyProvider: FunctionKeyProvider implementation for Node.js
 * - Caches keys in memory (optional)
 * - On cache-miss, reads keys from disk via LocalFileKeyStore using a locator string
 */
class NodeKeyProvider implements FunctionKeyProvider {
    private cache: Map<string, CachedKeyPair>;
    private cacheOption: boolean;
    private fileStore: LocalFileKeyStore;

    constructor(directory?: string) {
        this.cache = new Map<string, CachedKeyPair>();
        this.cacheOption = true;
        this.fileStore = new LocalFileKeyStore(directory);
    }

    // ---------------- Cache controls ----------------
    useCache(use: boolean) {
        this.cacheOption = use;
    }

    clearCache() {
        this.cache.clear();
    }

    cacheKeys(keyId: string, keys: FunctionKeyPair): void {
        const [provingKey, verifyingKey] = keys;
        this.cache.set(keyId, [provingKey.toBytes(), verifyingKey.toBytes()]);
    }

    containsKeys(keyId: string): boolean {
        return this.cache.has(keyId);
    }

    deleteKeys(keyId: string): boolean {
        return this.cache.delete(keyId);
    }

    getKeys(keyId: string): FunctionKeyPair {
        if (!this.cache.has(keyId)) {
            throw new Error("Key not found in cache.");
        }
        const [provingKeyBytes, verifyingKeyBytes] = <CachedKeyPair>(
            this.cache.get(keyId)
        );
        return [
            ProvingKey.fromBytes(provingKeyBytes),
            VerifyingKey.fromBytes(verifyingKeyBytes),
        ];
    }

    async keyStore(): Promise<KeyStore | undefined> {
        return this.cacheOption ? promoteMapToKeyStore(this.cache) : undefined;
    }

    // ---------------- Core lookup ----------------
    private async fetchByLocator(locator: string): Promise<FunctionKeyPair> {
        // Memory first
        const cached = this.cache.get(locator);
        if (this.cacheOption && cached) {
            return [
                ProvingKey.fromBytes(cached[0]),
                VerifyingKey.fromBytes(cached[1]),
            ];
        }

        // Disk fallback
        const keyBytes = await this.fileStore.getKeyBytes(locator);
        if (!keyBytes) {
            throw new Error(`Keys not found for locator '${locator}'`);
        }
        const [proverBytes, verifierBytes] = keyBytes;
        if (this.cacheOption) {
            this.cache.set(locator, [proverBytes, verifierBytes]);
        }

        return [
            ProvingKey.fromBytes(proverBytes),
            VerifyingKey.fromBytes(verifierBytes),
        ];
    }

    // ---------------- FunctionKeyProvider methods ----------------
    async functionKeys(params?: KeySearchParams): Promise<FunctionKeyPair> {
        if (!params) {
            throw new Error("Invalid parameters provided, must provide a cacheKey or name");
        }

        // Allow 'name' to reference a credits.aleo function key by name via CREDITS_PROGRAM_KEYS
        if ("name" in params && typeof (params as any)["name"] === "string") {
            const key = CREDITS_PROGRAM_KEYS.getKey((params as any)["name"]);
            return this.fetchByLocator(key.locator);
        }

        // Generic locators via cacheKey
        if ("cacheKey" in params && typeof (params as any)["cacheKey"] === "string") {
            return this.fetchByLocator((params as any)["cacheKey"]);
        }

        throw new Error("Invalid parameters provided, must provide a cacheKey or name");
    }

    async feePrivateKeys(): Promise<FunctionKeyPair> {
        return this.fetchByLocator(CREDITS_PROGRAM_KEYS.fee_private.locator);
    }

    async feePublicKeys(): Promise<FunctionKeyPair> {
        return this.fetchByLocator(CREDITS_PROGRAM_KEYS.fee_public.locator);
    }

    async inclusionKeys(): Promise<FunctionKeyPair> {
        return this.fetchByLocator(CREDITS_PROGRAM_KEYS.inclusion.locator);
    }

    async joinKeys(): Promise<FunctionKeyPair> {
        return this.fetchByLocator(CREDITS_PROGRAM_KEYS.join.locator);
    }

    async splitKeys(): Promise<FunctionKeyPair> {
        return this.fetchByLocator(CREDITS_PROGRAM_KEYS.split.locator);
    }

    async transferKeys(visibility: string): Promise<FunctionKeyPair> {
        if (PRIVATE_TRANSFER.has(visibility)) {
            return this.fetchByLocator(CREDITS_PROGRAM_KEYS.transfer_private.locator);
        } else if (PRIVATE_TO_PUBLIC_TRANSFER.has(visibility)) {
            return this.fetchByLocator(CREDITS_PROGRAM_KEYS.transfer_private_to_public.locator);
        } else if (PUBLIC_TRANSFER.has(visibility)) {
            return this.fetchByLocator(CREDITS_PROGRAM_KEYS.transfer_public.locator);
        } else if (PUBLIC_TRANSFER_AS_SIGNER.has(visibility)) {
            return this.fetchByLocator(CREDITS_PROGRAM_KEYS.transfer_public_as_signer.locator);
        } else {
            throw new Error("Invalid visibility type");
        }
    }

    async bondPublicKeys(): Promise<FunctionKeyPair> {
        return this.fetchByLocator(CREDITS_PROGRAM_KEYS.bond_public.locator);
    }

    bondValidatorKeys(): Promise<FunctionKeyPair> {
        return this.fetchByLocator(CREDITS_PROGRAM_KEYS.bond_validator.locator);
    }

    async claimUnbondPublicKeys(): Promise<FunctionKeyPair> {
        return this.fetchByLocator(CREDITS_PROGRAM_KEYS.claim_unbond_public.locator);
    }

    async unBondPublicKeys(): Promise<FunctionKeyPair> {
        return this.fetchByLocator(CREDITS_PROGRAM_KEYS.unbond_public.locator);
    }
}

export { NodeKeyProvider };


