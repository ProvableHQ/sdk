import * as fs from "node:fs/promises";
import * as path from "path";

import { CachedKeyPair, FunctionKeyPair } from "../../models/keyPair.js";
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
        await fs.mkdir(this.directory, { recursive: true });
        await fs.writeFile(filepath, data);
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

    async getKeysRaw(locator: string): Promise<CachedKeyPair | null> {
        const prover = await this.getProvingKeyRaw(locator);
        const verifier = await this.getVerifyingKeyRaw(locator);
        if (!prover || !verifier) return null;
        return [prover, verifier];
    }

    async getProvingKey(locator: string): Promise<ProvingKey | null> {
        const bytes = await this.getProvingKeyRaw(locator);
        return bytes ? ProvingKey.fromBytes(bytes) : null;
    }

    async getProvingKeyRaw(locator: string): Promise<Uint8Array | null> {
        return this.readFileOptional(this.proverPath(locator));
    }

    async getVerifyingKey(locator: string): Promise<VerifyingKey | null> {
        const bytes = await this.getVerifyingKeyRaw(locator);
        return bytes ? VerifyingKey.fromBytes(bytes) : null;
    }

    async getVerifyingKeyRaw(locator: string): Promise<Uint8Array | null> {
        return this.readFileOptional(this.verifierPath(locator));
    }

    async setKeys(locator: string, keys: FunctionKeyPair): Promise<void> {
        const [p, v] = keys;
        await this.writeFileAtomic(this.proverPath(locator), p.toBytes());
        await this.writeFileAtomic(this.verifierPath(locator), v.toBytes());
    }

    async setKeysRaw(locator: string, keys: CachedKeyPair): Promise<void> {
        const [proverBytes, verifierBytes] = keys;
        await this.writeFileAtomic(this.proverPath(locator), proverBytes);
        await this.writeFileAtomic(this.verifierPath(locator), verifierBytes);
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

        await fs.unlink(p).catch(() => {});
        await fs.unlink(v).catch(() => {});
    }

    async clear(): Promise<void> {
        const files = await fs.readdir(this.directory);
        await Promise.all(
            files
                .filter(f => f.endsWith(".prover") || f.endsWith(".verifier"))
                .map(f => fs.unlink(path.join(this.directory, f)))
        );
    }
}
