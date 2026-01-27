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
            } else if (name.endsWith(".prover") || name.endsWith(".verifier")) {
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
        const prover = await this.getProvingKeyBytes(locator);
        const verifier = await this.getVerifyingKeyBytes(locator);
        if (!prover || !verifier) return null;
        return [prover, verifier];
    }

    async getProvingKey(locator: string): Promise<ProvingKey | null> {
        const bytes = await this.getProvingKeyBytes(locator);
        return bytes ? ProvingKey.fromBytes(bytes) : null;
    }

    async getProvingKeyBytes(locator: string): Promise<Uint8Array | null> {
        return this.readFileOptional(this.proverPath(locator));
    }

    async getVerifyingKey(locator: string): Promise<VerifyingKey | null> {
        const bytes = await this.getVerifyingKeyBytes(locator);
        return bytes ? VerifyingKey.fromBytes(bytes) : null;
    }

    async getVerifyingKeyBytes(locator: string): Promise<Uint8Array | null> {
        return this.readFileOptional(this.verifierPath(locator));
    }

    async setKeys(locator: string, keys: FunctionKeyPair): Promise<void> {
        const [p, v] = keys;
        await this.writeFileAtomic(this.proverPath(locator), p.toBytes());
        await this.writeFileAtomic(this.verifierPath(locator), v.toBytes());
    }

    async setKeyBytes(locator: string, keys: CachedKeyPair): Promise<void> {
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
        await this.clearRecursive(this.directory);
    }
}
