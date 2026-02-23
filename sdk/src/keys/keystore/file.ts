import * as fs from "node:fs/promises";
import * as path from "path";

import { CachedKeyPair, FunctionKeyPair } from "../../models/keyPair.js";
import { type KeyMetadata, KeyVerifier } from "./metadata.js";
import { KeyStore } from "./keystore.js";
import { ProvingKey, VerifyingKey } from "../../wasm.js";

export class LocalFileKeyStore implements KeyStore {

    private directory: string;

    constructor(directory?: string) {
        this.directory = directory ?? path.join(process.cwd(), "keystore");

        // Ensure directory exists
        fs.mkdir(this.directory, { recursive: true }).catch((err) => {
            console.error("Failed to create keystore directory:", err);
        });
    }

    private proverPath(locator: string): string {
        return path.join(this.directory, `${locator}.prover`);
    }

    private verifierPath(locator: string): string {
        return path.join(this.directory, `${locator}.verifier`);
    }

    private metadataPath(locator: string): string {
        return path.join(this.directory, `${locator}.metadata`);
    }

    private async readMetadata(
        locator: string
    ): Promise<{ prover: KeyMetadata; verifier: KeyMetadata } | null> {
        try {
            const data = await fs.readFile(this.metadataPath(locator), "utf-8");
            return JSON.parse(data) as { prover: KeyMetadata; verifier: KeyMetadata };
        } catch (err: unknown) {
            if (err && typeof err === "object" && "code" in err && err.code === "ENOENT")
                return null;
            throw err;
        }
    }

    private async writeMetadata(
        locator: string,
        metadata: { prover: KeyMetadata; verifier: KeyMetadata }
    ): Promise<void> {
        await fs.mkdir(path.dirname(this.metadataPath(locator)), { recursive: true });
        await fs.writeFile(
            this.metadataPath(locator),
            JSON.stringify(metadata, null, 0),
            "utf-8"
        );
    }

    private async readFileOptional(filepath: string): Promise<Uint8Array | null> {
        try {
            const data = await fs.readFile(filepath);
            return new Uint8Array(data);
        } catch (err: any) {
            if (err.code === "ENOENT") return null;
            throw err;
        }
    }

    private async writeFileAtomic(filepath: string, data: Uint8Array): Promise<void> {
        // Ensure parent directories for nested locators exist
        await fs.mkdir(path.dirname(filepath), { recursive: true });
        await fs.writeFile(filepath, data);
    }

    private async clearRecursive(dir: string): Promise<void> {
        let entries: string[];
        try {
            entries = await fs.readdir(dir);
        } catch (err: any) {
            if (err.code === "ENOENT") {
                return;
            }
            throw err;
        }

        await Promise.all(entries.map(async (name) => {
            const full = path.join(dir, name);
            let isDirectory = false;
            try {
                const stat = await fs.stat(full);
                isDirectory = stat.isDirectory();
            } catch {
                return;
            }

            if (isDirectory) {
                await this.clearRecursive(full);
            } else if (
                name.endsWith(".prover") ||
                name.endsWith(".verifier") ||
                name.endsWith(".metadata")
            ) {
                await fs.unlink(full).catch(() => {});
            }
        }));
    }

    // -------------------------------------------------------
    // KEYSTORE INTERFACE
    // -------------------------------------------------------

    async getKeys(locator: string): Promise<FunctionKeyPair | null> {
        const prover = await this.getProvingKey(locator);
        const verifier = await this.getVerifyingKey(locator);
        if (!prover || !verifier) return null;
        return [prover, verifier];
    }

    async getKeyBytes(locator: string): Promise<CachedKeyPair | null> {
        const prover = await this.readFileOptional(this.proverPath(locator));
        const verifier = await this.readFileOptional(this.verifierPath(locator));
        if (!prover || !verifier) return null;
        const metadata = await this.readMetadata(locator);
        if (metadata) await KeyVerifier.verifyKeyPairBytes([prover, verifier], metadata);
        return [prover, verifier];
    }

    async getProvingKey(locator: string): Promise<ProvingKey | null> {
        const bytes = await this.getProvingKeyBytes(locator);
        return bytes ? ProvingKey.fromBytes(bytes) : null;
    }

    async getProvingKeyBytes(locator: string): Promise<Uint8Array | null> {
        const prover = await this.readFileOptional(this.proverPath(locator));
        if (!prover) return null;
        const metadata = await this.readMetadata(locator);
        if (metadata) await KeyVerifier.verifyProverBytes(prover, metadata.prover);
        return prover;
    }

    async getVerifyingKey(locator: string): Promise<VerifyingKey | null> {
        const bytes = await this.getVerifyingKeyBytes(locator);
        return bytes ? VerifyingKey.fromBytes(bytes) : null;
    }

    async getVerifyingKeyBytes(locator: string): Promise<Uint8Array | null> {
        const verifier = await this.readFileOptional(this.verifierPath(locator));
        if (!verifier) return null;
        const metadata = await this.readMetadata(locator);
        if (metadata) await KeyVerifier.verifyVerifierBytes(verifier, metadata.verifier);
        return verifier;
    }

    async setKeys(locator: string, keys: FunctionKeyPair): Promise<void> {
        const [p, v] = keys;
        await this.setKeyBytes(locator, [p.toBytes(), v.toBytes()]);
    }

    async setKeyBytes(
        locator: string,
        keys: CachedKeyPair,
        options?: { metadata?: { prover: KeyMetadata; verifier: KeyMetadata } }
    ): Promise<void> {
        const [proverBytes, verifierBytes] = keys;
        let metadata: { prover: KeyMetadata; verifier: KeyMetadata };
        if (options?.metadata) {
            metadata = options.metadata;
        } else {
            const [proverMeta, verifierMeta] = await Promise.all([
                KeyVerifier.computeProverMetadata(proverBytes),
                KeyVerifier.computeVerifierMetadata(verifierBytes),
            ]);
            metadata = { prover: proverMeta, verifier: verifierMeta };
        }
        await this.writeFileAtomic(this.proverPath(locator), proverBytes);
        await this.writeFileAtomic(this.verifierPath(locator), verifierBytes);
        await this.writeMetadata(locator, metadata);
    }

    async getKeyMetadata(
        locator: string
    ): Promise<{ prover: KeyMetadata; verifier: KeyMetadata } | null> {
        return this.readMetadata(locator);
    }

    async has(locator: string): Promise<boolean> {
        const proverExists = await fs
            .access(this.proverPath(locator))
            .then(() => true)
            .catch(() => false);

        const verifierExists = await fs
            .access(this.verifierPath(locator))
            .then(() => true)
            .catch(() => false);

        return proverExists && verifierExists;
    }

    async delete(locator: string): Promise<void> {
        const p = this.proverPath(locator);
        const v = this.verifierPath(locator);
        const m = this.metadataPath(locator);

        await fs.unlink(p).catch(() => {});
        await fs.unlink(v).catch(() => {});
        await fs.unlink(m).catch(() => {});
    }

    async clear(): Promise<void> {
        await this.clearRecursive(this.directory);
    }
}
