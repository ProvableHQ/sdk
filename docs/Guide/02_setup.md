---
id: setup
title: Zero Knowledge JS App Setup
sidebar_label: Project Setup
---
# Project Setup

## Installation

The first step to creating an app that interacts with the Aleo network is to install the Provable SDK.
```bash
npm install @provablehq/sdk
```

## WebAssembly Initialization

Before being able to utilize `WebAssembly` it must be initialized within the Browser or Node environment. This is done by calling initThreadPool function which initializes `wasm` memory and creates a wasm instance which can take advantage of multiple available threads on the host machine.
```typescript
import { Account, initThreadPool } from '@provablehq/sdk/mainnet.js';

// Enables multithreading
await initThreadPool();

// Create a new Aleo account
const account = new Account();

// Perform further program logic...
```

## Network Selection

The Provable SDK contains modules for interacting with both the `mainnet` and `testnet` networks. The network may be specified in the import statement as the filename. If no file is specified `testnet` will be used by default.

### Testnet
```typescript
import { Account, ProgramManager, initThreadPool } from 'provable/sdk/testnet.js';
```

### Mainnet
```typescript
import { Account, ProgramManager, initThreadPool } from 'provable/sdk/mainnet.js';
```

## Program Manager

In order to interact with the network via program execution a ProgramManager object must be created.
```typescript
import { Account, ProgramManager, initThreadPool } from 'provable/sdk/mainnet.js';

// Enables multithreading
await initThreadPool();

// Create a new Aleo account
const account = new Account();

// Create a new ProgramManager object
const programManager = new ProgramManager();
// Set the ProgramManager's account to the executor account
programManager.setAccount(account);
```
Once the `ProgramManager` has been created it can be used to execute programs.
```typescript
import { Account, ProgramManager, initThreadPool } from 'provable/sdk/mainnet.js';

await initThreadPool();

const account = new Account();

const programManager = new ProgramManager();
programManager.setAccount(account);

const transaction = await programManager.execute({
    programName: "add.aleo",
    functionName: "add",
    fee: 0.020,
    privateFee: false,
    inputs: ["5u32", "5u32"],
    keySearchParams: { "cacheKey": "hello_hello:hello" }
});
const result = await programManager.networkClient.submitTransaction(transaction);
```
Using the SDK as outlined above allows for a JavaScript app to interact with the Aleo network. The npm package [create-leo-app](https://www.npmjs.com/package/create-leo-app) offers several templates for building zero knowledge JavaScript apps using several popular frameworks including React, Next.js, and Node.