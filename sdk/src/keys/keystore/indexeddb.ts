import { CachedKeyPair, FunctionKeyPair } from "../../models/keyPair.js";
import { ProvingKey, VerifyingKey } from "../../wasm.js";
import { KeyStore } from "./keystore.js";

type IndexedDbKeyStoreOptions = {
    dbName?: string;
    storeName?: string;
    version?: number;
};

type KeyRecord = {
    locator: string;
    prover: ArrayBuffer;
    verifier: ArrayBuffer;
};

export class IndexedDbKeyStore implements KeyStore {
    private dbName: string;
    private storeName: string;
    private version: number;
    private db?: IDBDatabase;
    private dbPromise?: Promise<IDBDatabase>;

    constructor(options?: IndexedDbKeyStoreOptions) {
        this.dbName = options?.dbName ?? "aleo-keystore";
        this.storeName = options?.storeName ?? "keys";
        this.version = options?.version ?? 1;
    }

    private async openDb(): Promise<IDBDatabase> {
        if (this.db) return this.db;
        if (this.dbPromise) return this.dbPromise;

        this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: "locator" });
                }
            };

            request.onsuccess = () => {
                const db = request.result;
                db.onversionchange = () => {
                    db.close();
                    this.db = undefined;
                };
                this.db = db;
                resolve(db);
            };

            request.onerror = () => {
                reject(request.error ?? new Error("Failed to open IndexedDB"));
            };

            request.onblocked = () => {
                reject(new Error("IndexedDB open blocked"));
            };
        }).catch((err) => {
            this.dbPromise = undefined;
            throw err;
        });

        return this.dbPromise;
    }

    private async runRequest<T>(
        mode: IDBTransactionMode,
        action: (store: IDBObjectStore) => IDBRequest<T>,
    ): Promise<T> {
        const db = await this.openDb();

        return new Promise<T>((resolve, reject) => {
            const tx = db.transaction(this.storeName, mode);
            const store = tx.objectStore(this.storeName);
            const request = action(store);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => {
                reject(request.error ?? new Error("IndexedDB request failed"));
            };
            tx.onabort = () => {
                reject(tx.error ?? new Error("IndexedDB transaction aborted"));
            };
        });
    }

    private toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
        return bytes.buffer.slice(
            bytes.byteOffset,
            bytes.byteOffset + bytes.byteLength,
        );
    }

    private toUint8Array(
        value: ArrayBuffer | Uint8Array | ArrayBufferView,
    ): Uint8Array {
        if (value instanceof Uint8Array) {
            return new Uint8Array(value);
        }
        if (value instanceof ArrayBuffer) {
            return new Uint8Array(value);
        }
        return new Uint8Array(value.buffer.slice(0));
    }

    async getKeys(locator: string): Promise<FunctionKeyPair | null> {
        const raw = await this.getKeysRaw(locator);
        if (!raw) return null;
        const [p, v] = raw;
        return [ProvingKey.fromBytes(p), VerifyingKey.fromBytes(v)];
    }

    async getKeysRaw(locator: string): Promise<CachedKeyPair | null> {
        const record = await this.runRequest<KeyRecord | undefined>(
            "readonly",
            (store) => store.get(locator),
        );
        if (!record || !record.prover || !record.verifier) return null;
        return [
            this.toUint8Array(record.prover),
            this.toUint8Array(record.verifier),
        ];
    }

    async getProvingKey(locator: string): Promise<ProvingKey | null> {
        const raw = await this.getProvingKeyRaw(locator);
        return raw ? ProvingKey.fromBytes(raw) : null;
    }

    async getProvingKeyRaw(locator: string): Promise<Uint8Array | null> {
        const record = await this.runRequest<KeyRecord | undefined>(
            "readonly",
            (store) => store.get(locator),
        );
        if (!record?.prover) return null;
        return this.toUint8Array(record.prover);
    }

    async getVerifyingKey(locator: string): Promise<VerifyingKey | null> {
        const raw = await this.getVerifyingKeyRaw(locator);
        return raw ? VerifyingKey.fromBytes(raw) : null;
    }

    async getVerifyingKeyRaw(locator: string): Promise<Uint8Array | null> {
        const record = await this.runRequest<KeyRecord | undefined>(
            "readonly",
            (store) => store.get(locator),
        );
        if (!record?.verifier) return null;
        return this.toUint8Array(record.verifier);
    }

    async setKeys(locator: string, keys: FunctionKeyPair): Promise<void> {
        const [p, v] = keys;
        await this.setKeysRaw(locator, [p.toBytes(), v.toBytes()]);
    }

    async setKeysRaw(locator: string, keys: CachedKeyPair): Promise<void> {
        const [proverBytes, verifierBytes] = keys;
        const record: KeyRecord = {
            locator,
            prover: this.toArrayBuffer(proverBytes),
            verifier: this.toArrayBuffer(verifierBytes),
        };
        await this.runRequest("readwrite", (store) => store.put(record));
    }

    async has(locator: string): Promise<boolean> {
        const key = await this.runRequest<IDBValidKey | undefined>(
            "readonly",
            (store) => store.getKey(locator),
        );
        return typeof key !== "undefined";
    }

    async delete(locator: string): Promise<void> {
        await this.runRequest("readwrite", (store) => store.delete(locator));
    }

    async clear(): Promise<void> {
        await this.runRequest("readwrite", (store) => store.clear());
    }
}
