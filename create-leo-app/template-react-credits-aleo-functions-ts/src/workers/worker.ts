import { createWasmEngine } from "@provablehq/provable-engine-wasm";
import { ProvableKit } from "@provablehq/provablekit";
import {
    Account,
    ProgramManager,
    PrivateKey,
    initThreadPool,
    AleoKeyProvider,
    AleoKeyProviderParams,
    TransactionObject,
} from "@provablehq/provablekit/testnet.js";
import { CREDITS_PROGRAM_KEYS } from "@provablehq/provablekit/testnet.js";
import { expose, proxy } from "comlink";


await ProvableKit.init({
  engine: createWasmEngine(),
  env: { network: "testnet" },
});
await initThreadPool();

/**
 * A class that wraps the credits.aleo program functionality.
 *
 * Provides methods for all credits.aleo transfer functions:
 * - transferPublic: Public to public transfer
 * - transferPublicToPrivate: Public to private transfer
 * - transferPrivate: Private to private transfer
 * - transferPrivateToPublic: Private to public transfer
 * - join: Combine two private records
 * - split: Split a private record into two
 */
class Credits {
    private programManager: ProgramManager;
    private keyProvider: AleoKeyProvider;
    private creditsProgram: string;
    private _account: Account;

    constructor(account: Account, apiUrl: string = "https://api.provable.com/v2") {
        this._account = account;
        this.programManager = new ProgramManager(apiUrl);
        this.programManager.setAccount(account);

        this.keyProvider = new AleoKeyProvider();
        this.keyProvider.useCache(true);
        this.programManager.setKeyProvider(this.keyProvider);

        this.creditsProgram = this.programManager.creditsProgram().toString();
    }

    get account(): Account {
        return this._account;
    }

    /**
     * Execute a credits.aleo function.
     */
    private async execute(functionName: string, inputs: string[]): Promise<string[]> {
        const keyParams = new AleoKeyProviderParams({
            cacheKey: CREDITS_PROGRAM_KEYS.getKey(functionName).locator,
        });

        const tx = await this.programManager.buildExecutionTransaction({
            programName: "credits.aleo",
            functionName,
            inputs,
            priorityFee: 0,
            privateFee: false,
            keySearchParams: keyParams,
            program: this.creditsProgram,
        });

        const summary = tx.summary(true) as TransactionObject;
        return this.extractOutputs(summary);
    }

    /**
     * Extract outputs from a built transaction using its summary.
     */
    private extractOutputs(summary: TransactionObject): string[] {
        if (!summary.execution) return [];

        const execTransition = summary.execution.transitions.find(
            (t) => t.function !== "fee_public" && t.function !== "fee_private",
        );
        if (!execTransition?.outputs) return [];

        return execTransition.outputs.map((o) => {
            if (o.type === "record" && o.value) {
                return String(o.value);
            } else if (o.type === "future") {
                const args = Array.isArray(o.arguments)
                    ? o.arguments.map(String).join(", ")
                    : "";
                return `Future { program: ${o.program}, function: ${o.function}, args: [${args}] }`;
            }
            return o.value ? String(o.value) : "";
        });
    }

    async transferPublic(recipient: string, amount: number): Promise<string[]> {
        return this.execute("transfer_public", [recipient, `${amount}u64`]);
    }

    async transferPublicToPrivate(recipient: string, amount: number): Promise<string[]> {
        return this.execute("transfer_public_to_private", [recipient, `${amount}u64`]);
    }

    async transferPrivate(record: string, recipient: string, amount: number): Promise<string[]> {
        return this.execute("transfer_private", [record, recipient, `${amount}u64`]);
    }

    async transferPrivateToPublic(record: string, recipient: string, amount: number): Promise<string[]> {
        return this.execute("transfer_private_to_public", [record, recipient, `${amount}u64`]);
    }

    async join(record1: string, record2: string): Promise<string[]> {
        return this.execute("join", [record1, record2]);
    }

    async split(record: string, amount: number): Promise<string[]> {
        return this.execute("split", [record, `${amount}u64`]);
    }
}

// Create a default Credits instance with the demo account
const accountCiphertext =
    "ciphertext1qvq283j7ujnhz59d4rnu772rfmvf94039x9ekhk2lzuutteqzlghsr3g9824qgw97a79mmdymqdt0ulqdkahq39vnerw2tl7thvvnnunq386jzjnw29e0ghnq7unphgdzw637q3fgvvlkrcywsc5jukkdhss5qq3njp";
const account = Account.fromCiphertext(accountCiphertext, "provablealeo1");
const credits = new Credits(account);

/**
 * Generate a new random private key.
 */
async function getPrivateKey() {
    const key = new PrivateKey();
    return proxy(key);
}

const workerMethods = {
    transferPublic: (recipient: string, amount: number) =>
        credits.transferPublic(recipient, amount),
    transferPublicToPrivate: (recipient: string, amount: number) =>
        credits.transferPublicToPrivate(recipient, amount),
    transferPrivate: (record: string, recipient: string, amount: number) =>
        credits.transferPrivate(record, recipient, amount),
    transferPrivateToPublic: (record: string, recipient: string, amount: number) =>
        credits.transferPrivateToPublic(record, recipient, amount),
    join: (record1: string, record2: string) =>
        credits.join(record1, record2),
    split: (record: string, amount: number) =>
        credits.split(record, amount),
    getPrivateKey,
};

export type WorkerMethods = typeof workerMethods;

expose(workerMethods);
