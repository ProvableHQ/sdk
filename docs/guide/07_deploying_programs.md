---
id: deployment
title: Deploying Programs
sidebar_label: Deploying Programs
---

Developers of Apps on the Aleo Chain will often need to deploy their own program to implement the logic of their Dapp.
This section provides an overview of how to deploy a program to the Aleo Network and the languages that can be used to
develop programs.

## Developing an Aleo Program
Programs on Aleo are written in one of two languages:

### Leo Language
Leo is a high-level, developer-friendly language for developing zero-knowledge programs. The
[Leo Playground](https://play.leo-lang.org/) provides a web IDE that allows developers to build, test and deploy
new programs for. Documentation and tutorials on the Leo Language can be found at [docs.leo-lang.org](https://docs.leo-lang.org/).

### Aleo Instructions
Aleo instructions is a lower level language  that provides developers with fine-grained control over the execution
flow of zero-knowledge programs. It is written to be syntactically similar to the R1CS constraint systems that Aleo 
programs compile into. A full guide to this language can be found at
[docs.leo-lang.org/aleo/language](https://docs.leo-lang.org/aleo/language).

## Deploying a Program

### How to Create a Program Deployment
Programs are deployed by building a `Deployment Transaction`. This is done by calling the SDK `deploy` or 
`buildDeploymentTransaction` method. Under the hood these methods execute and prove each function in the Aleo program to 
derive verifying keys. These keys are stored in a `Deployment Transaction`and sent to the Aleo Network. 

If the program name is available and the fee is sufficient, the program will be stored on the Aleo Network. Once a 
is deployed, its functions can be executed via `Execution Transactions` by any party.

Programs can be deployed to either the Aleo Testnet or Mainnet. It is highly recommended that developers test their 
programs on the Testnet before deploying them to Aleo Mainnet. 

### Deploying a Program with the Provable SDK

When ready to deploy a program, the `Aleo Instructions` source code must be imported into the JS/TS environment as a 
`string`. If the program is written in `Leo` it must first be compiled to `Aleo Instructions`. Once the source code is 
available with JS/TS, it can be deployed using the ProgramManager. The following code snippet demonstrates how to deploy 
a program using the Provable SDK:
```typescript
import { Account, AleoNetworkClient, NetworkRecordProvider, ProgramManager, AleoKeyProvider} from '@provablehq/provablekit/testnet.js';

// Create a key provider that will be used to find public proving & verifying keys for Aleo programs
const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);

// Create a record provider that will be used to find records and transaction data for Aleo programs
const networkClient = new AleoNetworkClient("https://api.provable.com/v2");

// Use existing account with funds
const account = new Account({
    privateKey: env.var("PRIVATE_KEY"),
});

// Initialize a program manager to talk to the Aleo network with the configured key and record providers
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider);
programManager.setAccount(account)

// Define an Aleo program to deploy
const program = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";

// Set the priority fee to pay to deploy the program
const priorityFee = 0.0;

// Build a deployment transaction for the program.
const tx = await programManager.buildDeploymentTransaction(program, priorityFee, false);

// Send the transaction to the network.
const tx_id = await programManager.networkClient.submitTransaction(tx);

// Verify the transaction was successful
const transaction = await programManager.networkClient.getTransaction(tx_id);
```
Once a program has been deployed, developers can check to see its deployment status and monitor its activity using the
[Provable Explorer](https://explorer.provable.com/programs).

### Deployment Fees

A fee must be paid to the Aleo Network for deployment. This fee can be paid publicly using a public balance or privately
using an `Credits` record. The fee for deploying any program can be calculated with the static `estimateDeploymentFee` 
method of the `ProgramManager` class.
```typescript
const program = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";

const fee = await ProgramManager.estimateDeploymentFee(program);
```

Deployment fees are calculated based on the following formulas. The cost of deploying a program is proportional to the 
amount of opcodes used in a program and the complexity of the operations it performs. More computationally expensive 
opcode usage such as hash functions will cost more than simple opcodes such as arithmetic or boolean opcodes.

| Cost Component     | Cost (Microcredits)      | 
|--------------------|--------------------------|
| **Synthesis Cost** | 25*#Constraints          | 
| **Storage Cost**   | 1000*#Bytes              |
| **Namespace Cost** | 10^(10 - num_characters) |
| **Total Cost**     | Synthesis + Storage + Namespace |
