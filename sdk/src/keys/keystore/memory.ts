import { CachedKeyPair } from "../../models/keyPair.js";
import { KeyStore } from "./keystore.js";
import { ProvingKey, VerifyingKey } from "../../wasm.js";

/**
 * @param {Map<string, CachedKeyPair>} map Any interface which returns a string as cached keypair bytes.
 *
 * @returns {KeyStore} The map decorated as a keystore.
 */
export function promoteMapToKeyStore(
    map: Map<string, CachedKeyPair>
): KeyStore {
    const ks = map as unknown as KeyStore;

    ks.getKeys = async (locator) => {
        const raw = map.get(locator);
        if (!raw) return null;
        const [p, v] = raw;
        return [
            ProvingKey.fromBytes(p),
            VerifyingKey.fromBytes(v),
        ];
    };

    ks.getKeysRaw = async (locator) => map.get(locator) ?? null;

    ks.getProvingKey = async (locator) => {
        const raw = map.get(locator);
        return raw ? ProvingKey.fromBytes(raw[0]) : null;
    };

    ks.getProvingKeyRaw = async (locator) =>
        map.get(locator)?.[0] ?? null;

    ks.getVerifyingKey = async (locator) => {
        const raw = map.get(locator);
        return raw ? VerifyingKey.fromBytes(raw[1]) : null;
    };

    ks.getVerifyingKeyRaw = async (locator) =>
        map.get(locator)?.[1] ?? null;

    ks.setKeys = async (locator, [pk, vk]) => {
        map.set(locator, [pk.toBytes(), vk.toBytes()]);
    };

    ks.setKeysRaw = async (locator, raw) => {
        map.set(locator, raw);
    };

    ks.has = async (locator) => map.has(locator);

    ks.delete = async (locator) => {
        map.delete(locator);
    };

    ks.clear = async () => map.clear();

    return ks;
}
