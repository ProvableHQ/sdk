# Transfers

## Using the Convenience Method

```ts
import { Account, ProgramManager, AleoKeyProvider } from "@provablehq/sdk/testnet.js";

const account = new Account({ privateKey: process.env.ALEO_PRIVATE_KEY });
const pm = new ProgramManager("https://api.provable.com/v2");
pm.setAccount(account);

const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);
pm.setKeyProvider(keyProvider);

const txId = await pm.transfer(
    1.0,                // amount in credits (not microcredits)
    "aleo1recipient...",
    "public",           // "public" | "private" | "publicToPrivate" | "privateToPublic"
    0,                  // priorityFee
    false,              // privateFee (use public fee)
);
```

## Using buildExecutionTransaction (Full Control)

```ts
import {
    Account, AleoKeyProvider, AleoKeyProviderParams,
    initThreadPool, ProgramManager, CREDITS_PROGRAM_KEYS,
} from "@provablehq/sdk/testnet.js";

await initThreadPool();

const account = new Account({ privateKey: process.env.ALEO_PRIVATE_KEY });
const pm = new ProgramManager("https://api.provable.com/v2");
pm.setAccount(account);

const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);
pm.setKeyProvider(keyProvider);

const tx = await pm.buildExecutionTransaction({
    programName: "credits.aleo",
    functionName: "transfer_public",
    inputs: ["aleo1recipient...", "1000000u64"],  // amount in microcredits
    priorityFee: 0,
    privateFee: false,
    keySearchParams: new AleoKeyProviderParams({
        cacheKey: CREDITS_PROGRAM_KEYS.getKey("transfer_public").locator,
    }),
    program: pm.creditsProgram().toString(),
});

const txId = await pm.networkClient.submitTransaction(tx);
```

## Credits Class (Reusable Wrapper)

A composable wrapper for all four transfer types:

```ts
class Credits {
    private pm: ProgramManager;
    private keyProvider: AleoKeyProvider;
    private creditsProgram: string;

    constructor(account: Account, apiUrl = "https://api.provable.com/v2") {
        this.pm = new ProgramManager(apiUrl);
        this.pm.setAccount(account);
        this.keyProvider = new AleoKeyProvider();
        this.keyProvider.useCache(true);
        this.pm.setKeyProvider(this.keyProvider);
        this.creditsProgram = this.pm.creditsProgram().toString();
    }

    private async execute(functionName: string, inputs: string[]) {
        return this.pm.buildExecutionTransaction({
            programName: "credits.aleo",
            functionName,
            inputs,
            priorityFee: 0,
            privateFee: false,
            keySearchParams: new AleoKeyProviderParams({
                cacheKey: CREDITS_PROGRAM_KEYS.getKey(functionName).locator,
            }),
            program: this.creditsProgram,
        });
    }

    async transferPublic(recipient: string, amount: number) {
        const tx = await this.execute("transfer_public", [recipient, `${amount}u64`]);
        return this.pm.networkClient.submitTransaction(tx);
    }

    async transferPrivate(recipient: string, amount: number, amountRecord: string) {
        const tx = await this.execute("transfer_private", [amountRecord, recipient, `${amount}u64`]);
        return this.pm.networkClient.submitTransaction(tx);
    }

    async shield(recipient: string, amount: number) {
        const tx = await this.execute("transfer_public_to_private", [recipient, `${amount}u64`]);
        return this.pm.networkClient.submitTransaction(tx);
    }

    async unshield(amountRecord: string, amount: number) {
        const tx = await this.execute("transfer_private_to_public", [amountRecord, `${amount}u64`]);
        return this.pm.networkClient.submitTransaction(tx);
    }
}
```
