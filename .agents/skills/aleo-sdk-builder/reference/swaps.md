# Swaps (Interacting with DEX Programs)

Aleo DEX programs are standard deployed programs. Interact with them via `buildExecutionTransaction`.

## Basic Swap

```ts
const tx = await pm.buildExecutionTransaction({
    programName: "my_dex.aleo",
    functionName: "swap",
    inputs: [
        inputTokenRecord,     // Token record to swap from
        "100u64",             // Amount to swap
        "50u64",              // Minimum output (slippage protection)
    ],
    priorityFee: 0,
    privateFee: false,
});
const txId = await pm.networkClient.submitTransaction(tx);
```

## Programs That Call Other Programs (Dynamic Dispatch)

Some DEX programs (e.g., universal AMMs) use dynamic dispatch to call token programs.
When a program calls another program, string inputs in field-typed positions must be
converted to field elements.

> **Note:** Dynamic dispatch support (`prepareInputs`, `ProgramImportsBuilder`) is
> under active development on the `feat/dynamic-dispatch` branch and not yet available
> on mainnet. Check that branch for the latest API before using these features.

For programs already deployed that use dynamic dispatch, you need to:

1. Fetch the imported program sources from the network
2. Pass them as imports when building the execution transaction
3. Convert any string literals in field-typed positions to field elements

```ts
// Fetch imported program sources
const tokenASource = await pm.networkClient.getProgram("token_a.aleo");
const tokenBSource = await pm.networkClient.getProgram("token_b.aleo");

// Build the execution with imports
const tx = await pm.buildExecutionTransaction({
    programName: "universal_amm.aleo",
    functionName: "swap",
    inputs: ["token_a.aleo", "100u64"],  // string inputs may need field conversion
    priorityFee: 0,
    privateFee: false,
    imports: {
        "token_a.aleo": tokenASource,
        "token_b.aleo": tokenBSource,
    },
});
```
