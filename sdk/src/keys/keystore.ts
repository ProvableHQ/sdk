import { CachedKeyPair } from "../models/keyPair";

export interface KeyStore {

    /**
     * Returns the proving and verifying keys
     *
     * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the inclusion proof.
     */
    get(locator:string): Promise<CachedKeyPair| null>
    set(locator:string, keys: CachedKeyPair): Promise<void>
    has(locator:string): Promise<boolean>
    delete(locator:string): Promise<void>
    clear(): Promise<void>
}