# Deployment

## Deploy to Network

`buildDeploymentTransaction` takes positional arguments (not an options object):

```ts
const programSource = `
program my_token.aleo;

record Token:
    owner as address.private;
    amount as u64.private;

function mint:
    input r0 as address.private;
    input r1 as u64.private;
    cast r0 r1 into r2 as Token.record;
    output r2 as Token.record;
`;

const tx = await pm.buildDeploymentTransaction(
    programSource,  // program: string
    0,              // priorityFee: number
    false,          // privateFee: boolean
);
const txId = await pm.networkClient.submitTransaction(tx);
```

## Local Development with Devnode

```bash
cargo install leo-lang
# Standard devnet-only key — not used on mainnet
leo devnode start --private-key APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH
```

Point at `http://localhost:3030`. No API key needed locally.

```ts
const pm = new ProgramManager("http://localhost:3030");
pm.setAccount(account);

// Deploy with devnode (skips proof generation for fast iteration)
const deployTx = await pm.buildDeploymentTransaction(programSource, 0, false);
await pm.networkClient.submitTransaction(deployTx);

// Execute with devnode (uses ExecuteOptions object)
const execTx = await pm.buildDevnodeExecutionTransaction({
    programName: "my_program.aleo",
    functionName: "my_function",
    inputs: ["1u32", "2u32"],
    priorityFee: 0,
    privateFee: false,
});
await pm.networkClient.submitTransaction(execTx);
```

Note: `buildDevnodeExecutionTransaction` takes an `ExecuteOptions` object (same shape
as `buildExecutionTransaction`). It does not have a separate `skipProof` parameter —
proof skipping is handled internally for devnode transactions.
