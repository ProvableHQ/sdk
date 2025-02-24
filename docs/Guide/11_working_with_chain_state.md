---
id: chain-state
title: Working with Chain State
sidebar_label: Working with Chain State
---

The [Provable API](https://docs.explorer.provable.com/docs/api-reference/vz155069d5xy3-introduction) provides a standard 
set of endpoints for querying the state of the Aleo blockchain.

This API is encapsulated within the `AleoNetworkClient` class within the Provable SDK.

## Transactions and Transitions

### Transaction Objects
Blocks represent the canonical history of state change on the Aleo Blockchain. Within each block `Transaction` objects 
describe either `Deployments` of new programs or `Executions` of programs that change Aleo chain state. 

An example of the information available in a transaction is visualized at 
[provable.tools](https://www.provable.tools/protocol) When the transaction object is an `Execution`, the transaction
will contain all of the `Transitions` that were executed within the program which describe the functions executed in
the transactions and their inputs and outputs.

After a program function relevant to an app has been executed, it is often useful to query transaction objects to 
visualize, store, or use the state changes produced in the transaction within the app.

### Querying and Inspecting a Transaction
Each transaction has a unique ID with the bech32 prefix `at`. This ID can be used to query the data within a transaction
with the `AleoNetworkClient`. The `AleoNetworkClient` provides a method for transaction information back in the format
of a `wasm` or `json` object. The `json` representation will provide the full structure of the `Transaction` in human 
read-able format that can be parsed using typical `JSON` parsing tools. The `wasm` representation will provide the raw
`SnarkVM` object, which has several convenience methods for extracting the objects such as `inputs`, `outputs`, and 
`records` without the need for traditional JSON parsing.

```typescript
import { AleoNetworkClient, Transition } from '@provablehq/sdk/testnet.js';

const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");

// Get a transaction by id and get its inputs and outputs from the JSON representation.
let jsonRecords = [];
const transactionJSON = await networkClient.getTransaction('at1659war3z5t4wppr9h5rck3kpf5gmzf80xpud2hz8yuv3ds286u8s5lxh7c');
const transitions = transactionJSON["execution"]["transitions"];
for (let i = 0; i < transitions.length; i++) {
    const transition = transitions[i];
    // Get the records of an individual transition.
    const transitionRecords = transition["records"];
    // Get the inputs of an individual transition.
    const transitionInputs = transition["inputs"];
    // Get the outputs of an individual transition.
    const transitionOutputs = transition["outputs"];
    // Record all records in the transaction.
    jsonRecords.push(transitionRecords);
}

// Get a transaction by id and get its inputs and outputs from the Wasm representation.
const transactionWasm = await networkClient.getTransactionObject(`at1659war3z5t4wppr9h5rck3kpf5gmzf80xpud2hz8yuv3ds286u8s5lxh7c`);
const transitionsWasm = transactionWasm.transitions();
for (let i = 0; i < transitionsWasm.length; i++) {
    const transition = <Transition>transitionsWasm[i];
    // Get the records of an individual transition.
    const transitionRecords = transition.records();
    // Get the inputs of an individual transition.
    const transitionInputs = transition.inputs();
    // Get the outputs of an individual transition.
    const transitionOutputs = transition.outputs();
}

// Get all records present in a transaction.
const transactionRecords = transactionWasm.records();
```
