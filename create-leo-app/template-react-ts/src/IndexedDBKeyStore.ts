import type {
  KeyStore,
  KeyLocator,
} from "@provablehq/sdk";
import {
  ProvingKey,
  VerifyingKey,
} from "@provablehq/sdk";
import type { FunctionKeyPair } from "@provablehq/sdk";

const DB_NAME = "aleo-keystore";
const DB_VERSION = 1;
const KEYS_STORE = "keys";
const META_STORE = "metadata";

/**
 * Browser-native KeyStore backed by IndexedDB.
 *
 * Implements the SDK's KeyStore interface so that proving and verifying keys
 * are persisted across page reloads. Drop-in replacement for LocalFileKeyStore
 * in browser/React environments.
 */
export class IndexedDBKeyStore implements KeyStore {
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = this.open();
  }

  private open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(KEYS_STORE)) {
          db.createObjectStore(KEYS_STORE);
        }
        if (!db.objectStoreNames.contains(META_STORE)) {
          db.createObjectStore(META_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  private async tx(
    store: string,
    mode: IDBTransactionMode,
  ): Promise<IDBObjectStore> {
    const db = await this.dbPromise;
    return db.transaction(store, mode).objectStore(store);
  }

  private request<T>(req: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async getKeyBytes(locator: KeyLocator): Promise<Uint8Array | null> {
    const store = await this.tx(KEYS_STORE, "readonly");
    const result = await this.request(store.get(locator.locator));
    return result instanceof Uint8Array ? result : null;
  }

  async getProvingKey(locator: KeyLocator): Promise<ProvingKey | null> {
    const bytes = await this.getKeyBytes(locator);
    if (!bytes) return null;
    return ProvingKey.fromBytes(bytes);
  }

  async getVerifyingKey(locator: KeyLocator): Promise<VerifyingKey | null> {
    const bytes = await this.getKeyBytes(locator);
    if (!bytes) return null;
    return VerifyingKey.fromBytes(bytes);
  }

  async setKeys(
    proverLocator: KeyLocator,
    verifierLocator: KeyLocator,
    keys: FunctionKeyPair,
  ): Promise<void> {
    const [pk, vk] = keys;
    const store = await this.tx(KEYS_STORE, "readwrite");
    await this.request(store.put(pk.toBytes(), proverLocator.locator));
    // Reopen transaction (IndexedDB auto-commits after await).
    const store2 = await this.tx(KEYS_STORE, "readwrite");
    await this.request(store2.put(vk.toBytes(), verifierLocator.locator));
  }

  async setKeyBytes(keyBytes: Uint8Array, locator: KeyLocator): Promise<void> {
    const store = await this.tx(KEYS_STORE, "readwrite");
    await this.request(store.put(keyBytes, locator.locator));
  }

  async getKeyMetadata(locator: string): Promise<any | null> {
    const store = await this.tx(META_STORE, "readonly");
    const result = await this.request(store.get(locator));
    return result ?? null;
  }

  async has(locator: string): Promise<boolean> {
    const store = await this.tx(KEYS_STORE, "readonly");
    const count = await this.request(store.count(locator));
    return count > 0;
  }

  async delete(locator: string): Promise<void> {
    const keyStore = await this.tx(KEYS_STORE, "readwrite");
    await this.request(keyStore.delete(locator));
    const metaStore = await this.tx(META_STORE, "readwrite");
    await this.request(metaStore.delete(locator));
  }

  async clear(): Promise<void> {
    const keyStore = await this.tx(KEYS_STORE, "readwrite");
    await this.request(keyStore.clear());
    const metaStore = await this.tx(META_STORE, "readwrite");
    await this.request(metaStore.clear());
  }
}
