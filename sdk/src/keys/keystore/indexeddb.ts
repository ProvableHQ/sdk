import { FunctionKeyPair } from "../../models/keyPair.js";
import { KeyFingerprint } from "../verifier/interface.js";
import { InvalidLocatorError } from "./error.js";
import { KeyLocator, KeyStore, ProvingKeyLocator, VerifyingKeyLocator } from "./interface.js";
import { MemKeyVerifier } from "../verifier/memory.js";
import { ProvingKey, VerifyingKey } from "../../wasm.js";

/** Shape of each record stored in the IndexedDB object store. */
interface StoredKey {
    /** Serialized locator string (also the primary key). */
    locator: string;
    /** Raw key bytes. */
    bytes: Uint8Array;
    /** SHA-256 fingerprint computed at write time. */
    metadata: KeyFingerprint;
}

/**
 * Browser-compatible {@link KeyStore} backed by IndexedDB.
 *
 * This is the browser counterpart to {@link LocalFileKeyStore} (which requires Node.js `fs`).
 * It persists proving and verifying keys across page reloads and browser sessions using the
 * IndexedDB API available in all modern browsers and Web Workers.
 *
 * **Environment**: Browser / Web Worker only. Instantiating this class is safe in any
 * environment, but the first IndexedDB operation will reject with a clear error when
 * `globalThis.indexedDB` is not available (e.g., Node.js, SSR contexts). Guard your
 * imports accordingly if you bundle for server-side rendering.
 *
 * **Security**: Keys are stored as plaintext `Uint8Array` in IndexedDB. Any script
 * running on the same origin — including scripts injected via XSS — can read the stored
 * proving and verifying keys. Do **not** use this keystore for data that must remain
 * confidential under an XSS-capable adversary; encrypt sensitive material at the
 * application layer before persisting, or use an in-memory store.
 *
 * @example
 * ```ts
 * import { IndexedDBKeyStore, ProgramManager } from "@provablehq/sdk";
 *
 * const keyStore = new IndexedDBKeyStore();
 * const pm = new ProgramManager();
 * pm.setKeyStore(keyStore);
 * // Keys synthesized during execution are now cached in IndexedDB
 * // and reloaded automatically on subsequent runs.
 * ```
 */
export class IndexedDBKeyStore implements KeyStore {
    private readonly dbName: string;
    private readonly storeName = "keys";
    private readonly keyVerifier = new MemKeyVerifier();
    private dbPromise: Promise<IDBDatabase> | null = null;

    /**
     * @param dbName IndexedDB database name. Defaults to `"aleo-keystore"`.
     */
    constructor(dbName = "aleo-keystore") {
        this.dbName = dbName;
    }

    // -------------------------------------------------------
    // IndexedDB helpers
    // -------------------------------------------------------

    /** Opens (or creates) the database, returning a cached promise. */
    private openDB(): Promise<IDBDatabase> {
        if (this.dbPromise) return this.dbPromise;
        // Env check sits outside the Promise constructor so a failure doesn't
        // poison the cache; a later call (e.g. after a polyfill loads) can retry.
        if (typeof indexedDB === "undefined") {
            return Promise.reject(
                new Error(
                    "IndexedDBKeyStore requires a browser or Web Worker environment: " +
                        "`indexedDB` is not defined. If you are in Node.js or an SSR " +
                        "context, use LocalFileKeyStore or an in-memory key provider instead.",
                ),
            );
        }
        this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: "locator" });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => {
                this.dbPromise = null;
                reject(request.error);
            };
            request.onblocked = () => {
                this.dbPromise = null;
                reject(new DOMException("Database open blocked", "AbortError"));
            };
        });
        return this.dbPromise;
    }

    /** Runs a single read-write transaction and returns the request result. */
    private async tx<T>(
        mode: IDBTransactionMode,
        fn: (store: IDBObjectStore) => IDBRequest<T>,
    ): Promise<T> {
        const db = await this.openDB();
        return new Promise<T>((resolve, reject) => {
            const txn = db.transaction(this.storeName, mode);
            const store = txn.objectStore(this.storeName);
            const req = fn(store);
            let result: T;
            req.onsuccess = () => { result = req.result; };
            txn.oncomplete = () => resolve(result);
            txn.onerror = () => reject(txn.error);
            txn.onabort = () => reject(txn.error ?? new DOMException("Transaction aborted", "AbortError"));
        });
    }

    // -------------------------------------------------------
    // Locator serialization (mirrors LocalFileKeyStore)
    // -------------------------------------------------------

    private validateComponent(value: string, label: string): void {
        if (value === "" || value === ".") {
            throw new InvalidLocatorError(
                `KeyLocator ${label} must not be empty or "." (got "${value}")`,
                value,
                "reserved_name",
            );
        }
        if (value.includes("..")) {
            throw new InvalidLocatorError(
                `KeyLocator ${label} must not contain ".." (got "${value}")`,
                value,
                "path_traversal",
            );
        }
        if (value.includes("/") || value.includes("\\") || value.includes("\0")) {
            throw new InvalidLocatorError(
                `KeyLocator ${label} must not contain path separators or null bytes (got "${value}")`,
                value,
                "path_separator",
            );
        }
    }

    private validateNonNegative(value: number, label: string): void {
        if (!Number.isInteger(value) || value < 0) {
            throw new InvalidLocatorError(
                `KeyLocator ${label} must be a non-negative integer (got ${value})`,
                String(value),
                "negative_value",
            );
        }
    }

    private serializeLocator(locator: KeyLocator): string {
        this.validateComponent(locator.program, "program");
        this.validateComponent(locator.functionName, "functionName");
        this.validateComponent(locator.network, "network");
        this.validateNonNegative(locator.edition, "edition");
        this.validateNonNegative(locator.amendment, "amendment");
        const base = `${locator.program}.${locator.functionName}.e${locator.edition}.a${locator.amendment}.${locator.network}.${locator.keyType}`;
        if (locator.keyType === "translation") {
            this.validateComponent(locator.recordName, "recordName");
            this.validateNonNegative(locator.recordInputPosition, "recordInputPosition");
            return `${base}.${locator.recordName}.${locator.recordInputPosition}`;
        }
        return base;
    }

    private checksumToFingerprint(checksum: string | undefined, keyBytes: Uint8Array): KeyFingerprint | undefined {
        if (!checksum) return undefined;
        return { checksum, size: keyBytes.length };
    }

    // -------------------------------------------------------
    // KeyStore interface
    // -------------------------------------------------------

    async getKeyBytes(locator: KeyLocator): Promise<Uint8Array | null> {
        const key = this.serializeLocator(locator);
        const record = await this.tx<StoredKey | undefined>("readonly", (store) => store.get(key));
        if (!record) return null;

        const fingerprint =
            this.checksumToFingerprint(locator.checksum, record.bytes) ?? record.metadata;
        if (fingerprint) {
            await this.keyVerifier.verifyKeyBytes({
                keyBytes: record.bytes,
                locator: key,
                fingerprint,
            });
        }

        return record.bytes;
    }

    async getProvingKey(locator: ProvingKeyLocator): Promise<ProvingKey | null> {
        const bytes = await this.getKeyBytes(locator);
        if (!bytes) return null;
        return ProvingKey.fromBytes(bytes);
    }

    async getVerifyingKey(locator: VerifyingKeyLocator): Promise<VerifyingKey | null> {
        const bytes = await this.getKeyBytes(locator);
        if (!bytes) return null;
        return VerifyingKey.fromBytes(bytes);
    }

    async setKeys(
        proverLocator: ProvingKeyLocator,
        verifierLocator: VerifyingKeyLocator,
        keys: FunctionKeyPair,
    ): Promise<void> {
        const proverKey = this.serializeLocator(proverLocator);
        const verifierKey = this.serializeLocator(verifierLocator);

        const [provingKey, verifyingKey] = keys;
        const [provingKeyBytes, verifyingKeyBytes] = [
            provingKey.toBytes(),
            verifyingKey.toBytes(),
        ];

        const [proverFingerprint, verifierFingerprint] = await Promise.all([
            this.keyVerifier.computeKeyMetadata({
                keyBytes: provingKeyBytes,
                locator: proverKey,
                fingerprint: this.checksumToFingerprint(proverLocator.checksum, provingKeyBytes),
            }),
            this.keyVerifier.computeKeyMetadata({
                keyBytes: verifyingKeyBytes,
                locator: verifierKey,
                fingerprint: this.checksumToFingerprint(verifierLocator.checksum, verifyingKeyBytes),
            }),
        ]);

        const proverRecord: StoredKey = { locator: proverKey, bytes: provingKeyBytes, metadata: proverFingerprint };
        const verifierRecord: StoredKey = { locator: verifierKey, bytes: verifyingKeyBytes, metadata: verifierFingerprint };

        // Write both in a single transaction for atomicity.
        const db = await this.openDB();
        await new Promise<void>((resolve, reject) => {
            const txn = db.transaction(this.storeName, "readwrite");
            const store = txn.objectStore(this.storeName);
            store.put(proverRecord);
            store.put(verifierRecord);
            txn.oncomplete = () => resolve();
            txn.onerror = () => reject(txn.error);
            txn.onabort = () => reject(txn.error ?? new DOMException("Transaction aborted", "AbortError"));
        });
    }

    async setKeyBytes(keyBytes: Uint8Array, locator: KeyLocator): Promise<void> {
        const key = this.serializeLocator(locator);

        const computedMetadata = await this.keyVerifier.computeKeyMetadata({
            keyBytes,
            locator: key,
            fingerprint: this.checksumToFingerprint(locator.checksum, keyBytes),
        });

        const record: StoredKey = { locator: key, bytes: keyBytes, metadata: computedMetadata };
        await this.tx("readwrite", (store) => store.put(record));
    }

    async getKeyMetadata(locator: KeyLocator): Promise<KeyFingerprint | null> {
        const key = this.serializeLocator(locator);
        const record = await this.tx<StoredKey | undefined>("readonly", (store) => store.get(key));
        return record?.metadata ?? null;
    }

    async has(locator: KeyLocator): Promise<boolean> {
        const key = this.serializeLocator(locator);
        const count = await this.tx<number>("readonly", (store) => store.count(IDBKeyRange.only(key)));
        return count > 0;
    }

    async delete(locator: KeyLocator): Promise<void> {
        const key = this.serializeLocator(locator);
        await this.tx("readwrite", (store) => store.delete(key));
    }

    async clear(): Promise<void> {
        await this.tx("readwrite", (store) => store.clear());
    }
}
