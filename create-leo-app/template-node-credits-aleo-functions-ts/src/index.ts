import { createWasmEngine } from "@provablehq/provable-engine-wasm";
import { ProvableKit } from "@provablehq/provablekit";
import {
    Account,
    initThreadPool,
    ProgramManager,
    AleoKeyProvider,
    AleoKeyProviderParams,
    TransactionObject,
} from "@provablehq/provablekit/testnet.js";
import { CREDITS_PROGRAM_KEYS } from "@provablehq/provablekit/testnet.js";

// Initialize the threadpool to speed up proving.

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
 *
 * @example
 * const account = Account.fromCiphertext(ciphertext, password);
 * const credits = new Credits(account);
 *
 * await credits.transferPublic(recipient, 50000);
 * await credits.transferPrivate(record, recipient, 100000);
 */
class Credits {
    private programManager: ProgramManager;
    private keyProvider: AleoKeyProvider;
    private creditsProgram: string;
    private _account: Account;

    /**
     * Create a new Credits instance.
     *
     * @param account - The Aleo account to use for transactions
     * @param apiUrl - The API endpoint (defaults to https://api.provable.com/v2)
     */
    constructor(account: Account, apiUrl: string = "https://api.provable.com/v2") {
        this._account = account;
        this.programManager = new ProgramManager(apiUrl);
        this.programManager.setAccount(account);

        this.keyProvider = new AleoKeyProvider();
        this.keyProvider.useCache(true);
        this.programManager.setKeyProvider(this.keyProvider);

        this.creditsProgram = this.programManager.creditsProgram().toString();
    }

    /**
     * Get the account associated with this Credits instance.
     */
    get account(): Account {
        return this._account;
    }

    /**
     * Execute a credits.aleo function.
     */
    private async execute(functionName: string, inputs: string[]): Promise<string[]> {
        const start = Date.now();
        console.log(`Starting ${functionName} execution`);

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
        const outputs = this.extractOutputs(summary);

        console.log("Transaction ID:", tx.id());
        console.log("Outputs:", outputs);
        console.log(`${functionName} finished in ${Date.now() - start}ms`);

        return outputs;
    }

    /**
     * Extract outputs from a built transaction using its summary.
     * Gets outputs from the execution transition (excludes fee transition).
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

    /**
     * Transfer credits from the caller's public balance to a recipient's public balance.
     *
     * @param recipient - The Aleo address to receive the credits
     * @param amount - The amount to transfer in microcredits
     * @returns The outputs from the execution
     *
     * @example
     * await credits.transferPublic("aleo1abc...xyz", 1000000);
     */
    async transferPublic(recipient: string, amount: number): Promise<string[]> {
        return this.execute("transfer_public", [recipient, `${amount}u64`]);
    }

    /**
     * Transfer credits from the caller's public balance to a recipient as a private record.
     *
     * @param recipient - The Aleo address to receive the private record
     * @param amount - The amount to transfer in microcredits
     * @returns The outputs containing the new private record
     *
     * @example
     * await credits.transferPublicToPrivate("aleo1abc...xyz", 500000);
     */
    async transferPublicToPrivate(recipient: string, amount: number): Promise<string[]> {
        return this.execute("transfer_public_to_private", [recipient, `${amount}u64`]);
    }

    /**
     * Transfer credits privately from one record to another address.
     *
     * @param record - The sender's credits record (plaintext format)
     * @param recipient - The Aleo address to receive the credits
     * @param amount - The amount to transfer in microcredits
     * @returns The outputs containing recipient record + change record
     *
     * @example
     * await credits.transferPrivate(myRecord, "aleo1abc...xyz", 100000);
     */
    async transferPrivate(record: string, recipient: string, amount: number): Promise<string[]> {
        return this.execute("transfer_private", [record, recipient, `${amount}u64`]);
    }

    /**
     * Transfer credits from a private record to a recipient's public balance.
     *
     * @param record - The sender's credits record (plaintext format)
     * @param recipient - The Aleo address to receive the public credits
     * @param amount - The amount to transfer in microcredits
     * @returns The outputs containing the change record
     *
     * @example
     * await credits.transferPrivateToPublic(myRecord, "aleo1abc...xyz", 50000);
     */
    async transferPrivateToPublic(record: string, recipient: string, amount: number): Promise<string[]> {
        return this.execute("transfer_private_to_public", [record, recipient, `${amount}u64`]);
    }

    /**
     * Combine two private credit records into a single record.
     *
     * @param record1 - The first credits record to combine
     * @param record2 - The second credits record to combine
     * @returns The outputs containing the combined record
     *
     * @example
     * await credits.join(recordA, recordB);
     */
    async join(record1: string, record2: string): Promise<string[]> {
        return this.execute("join", [record1, record2]);
    }

    /**
     * Split a private credit record into two separate records.
     *
     * @param record - The credits record to split
     * @param amount - The amount for the first output record
     * @returns The outputs containing two records
     *
     * @example
     * await credits.split(myRecord, 200000);
     */
    async split(record: string, amount: number): Promise<string[]> {
        return this.execute("split", [record, `${amount}u64`]);
    }
}

// ============================================================================
// Demo: Using the Credits class
// ============================================================================

// Import the account
const accountCiphertext =
    "ciphertext1qvq283j7ujnhz59d4rnu772rfmvf94039x9ekhk2lzuutteqzlghsr3g9824qgw97a79mmdymqdt0ulqdkahq39vnerw2tl7thvvnnunq386jzjnw29e0ghnq7unphgdzw637q3fgvvlkrcywsc5jukkdhss5qq3njp";
const account = Account.fromCiphertext(accountCiphertext, "provablealeo1");

// Create the Credits instance
const credits = new Credits(account);

// Specify the recipient
const recipient = "aleo1vskzxa2qqgnhznxsqh6tgq93c30sfkj6xqwe7sr85lgjkexjlcxs3lxhy3";

// NOTE: These records exist on testnet and are used to build transactions.
// Since we only build (not broadcast) the transactions, they remain unspent.

const sendRecord = `{
  owner: aleo1vskzxa2qqgnhznxsqh6tgq93c30sfkj6xqwe7sr85lgjkexjlcxs3lxhy3.private,
  microcredits: 500000u64.private,
  _nonce: 2128807984625485873765840993868794284062894954530194503954279385341936659546group.public,
  _version: 1u8.public
}`;

const joinRecord = `{
  owner: aleo1vskzxa2qqgnhznxsqh6tgq93c30sfkj6xqwe7sr85lgjkexjlcxs3lxhy3.private,
  microcredits: 1000000u64.private,
  _nonce: 3679642728562651942188038004588605401119210243204186196628122783406618717891group.public,
  _version: 1u8.public
}`;

const functions: Record<string, () => Promise<string[]>> = {
    transfer_public: () => credits.transferPublic(recipient, 50000),
    transfer_public_to_private: () => credits.transferPublicToPrivate(recipient, 50000),
    transfer_private: () => credits.transferPrivate(sendRecord, recipient, 100000),
    transfer_private_to_public: () => credits.transferPrivateToPublic(sendRecord, recipient, 50000),
    join: () => credits.join(sendRecord, joinRecord),
    split: () => credits.split(sendRecord, 250000),
};

async function main() {
    const selected = process.argv[2];

    if (selected && !functions[selected]) {
        console.error(`Unknown function: ${selected}`);
        console.error(`Available: ${Object.keys(functions).join(", ")}`);
        process.exit(1);
    }

    const toRun = selected ? { [selected]: functions[selected] } : functions;

    for (const fn of Object.values(toRun)) {
        await fn();
    }

    console.log("\nDone!");
}

main().catch(console.error);
