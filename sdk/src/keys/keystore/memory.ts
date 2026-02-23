import { CachedKeyPair } from "../../models/keyPair.js";
import { type KeyMetadata, KeyVerifier } from "./metadata.js";
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
    const metadataMap = new Map<
        string,
        { prover: KeyMetadata; verifier: KeyMetadata }
    >();
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

    ks.getKeyBytes = async (locator) => {
        const raw = map.get(locator) ?? null;
        if (!raw) return null;
        const metadata = metadataMap.get(locator);
        if (metadata) await KeyVerifier.verifyKeyPairBytes(raw, metadata);
        return raw;
    };

    ks.getProvingKey = async (locator) => {
        const raw = map.get(locator);
        return raw ? ProvingKey.fromBytes(raw[0]) : null;
    };

    ks.getProvingKeyBytes = async (locator) =>
        map.get(locator)?.[0] ?? null;

    ks.getVerifyingKey = async (locator) => {
        const raw = map.get(locator);
        return raw ? VerifyingKey.fromBytes(raw[1]) : null;
    };

    ks.getVerifyingKeyBytes = async (locator) =>
        map.get(locator)?.[1] ?? null;

    ks.setKeys = async (locator, [pk, vk]) => {
        await ks.setKeyBytes(locator, [pk.toBytes(), vk.toBytes()]);
    };

    ks.setKeyBytes = async (locator, raw, options?) => {
        map.set(locator, raw);
        let metadata: { prover: KeyMetadata; verifier: KeyMetadata };
        if (options?.metadata) {
            metadata = options.metadata;
        } else {
            const [proverMeta, verifierMeta] = await Promise.all([
                KeyVerifier.computeProverMetadata(raw[0]),
                KeyVerifier.computeVerifierMetadata(raw[1]),
            ]);
            metadata = { prover: proverMeta, verifier: verifierMeta };
        }
        metadataMap.set(locator, metadata);
    };

    ks.getKeyMetadata = async (locator) =>
        metadataMap.get(locator) ?? null;

    ks.has = async (locator) => Map.prototype.has.call(map, locator);

    ks.delete = async (locator) => {
        Map.prototype.delete.call(map, locator);
        metadataMap.delete(locator);
    };

    ks.clear = async () => {
        Map.prototype.clear.call(map);
        metadataMap.clear();
    };

    return ks;
}
