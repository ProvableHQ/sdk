# Local Proving

Generates the full ZK proof on-device. Requires `initThreadPool()`.

## Full Flow

```ts
import {
    Account, AleoKeyProvider, AleoKeyProviderParams,
    initThreadPool, ProgramManager, CREDITS_PROGRAM_KEYS,
} from "@provablehq/sdk/testnet.js";

await initThreadPool();  // Required for local proving

const account = new Account({ privateKey: process.env.ALEO_PRIVATE_KEY });
const pm = new ProgramManager("https://api.provable.com/v2");
pm.setAccount(account);

const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);
pm.setKeyProvider(keyProvider);

const tx = await pm.buildExecutionTransaction({
    programName: "credits.aleo",
    functionName: "transfer_public",
    inputs: ["aleo1recipient...", "1000000u64"],
    priorityFee: 0,
    privateFee: false,
    keySearchParams: new AleoKeyProviderParams({
        cacheKey: CREDITS_PROGRAM_KEYS.getKey("transfer_public").locator,
    }),
    program: pm.creditsProgram().toString(),
});

const txId = await pm.networkClient.submitTransaction(tx);
```

## When to Use Local Proving

- Privacy-sensitive operations (proof generation stays local)
- Offline or air-gapped environments
- Development and testing
- When you cannot or do not want to trust a third-party prover
