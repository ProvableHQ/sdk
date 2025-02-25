---
id: setup
title: Zero Knowledge JS App Setup
sidebar_label: Project Setup
---

## Installation

The Provable SDK can be installed via npm and yarn package managers.

### NPM

```bash
npm install @provablehq/sdk
```

### Yarn

```bash
yarn add @provablehq/sdk
```

## Network Selection

The Provable SDK contains modules for interacting with both the `mainnet` and `testnet` networks. The `mainnet` and 
`testnet` networks are **NOT** interoperable so it is required to explicitly select the desired network. Any 
transactions built for the `mainnet` network will not be valid on the `testnet` network and vice versa.

The following import syntax is used to select the desired network:

### Mainnet
```typescript
import { Account, ProgramManager, initThreadPool } from '@provablehq/sdk/mainnet.js';
```

### Testnet
```typescript
import { Account, ProgramManager, initThreadPool } from '@provablehq/sdk/testnet.js';
```

If no network is explicitly selected, the SDK defaults to the `testnet` network.

```typescript
import { Account, ProgramManager, initThreadPool } from '@provablehq/sdk';
```


## WebAssembly Initialization

When the SDK is imported, single-threaded `WebAssembly` is enabled by default. However, it is recommended to enable
multithreaded `WebAssembly` as it is much more performant and eliminates the possibility of a computationally expensive
operation blocking the main thread.

Multi-threaded `WebAssembly` is enabled by calling the `initThreadPool` function at the beginning of the application.
This starts multiple `WebWorker` threads and provides access to the `WebAssembly` instance and memory to each thread.

**This function only needs to be called once and should be called before any other SDK functions.**
```typescript
import { Account, initThreadPool } from '@provablehq/sdk/mainnet.js';

// Enables multithreading
await initThreadPool();

// Create a new Aleo account
const account = new Account();

// Perform further program logic...
```

## Configuration

### Top-Level Await

Top level await is a feature that allows you to use the `await` keyword outside of an `async` function. 
This feature is necessary for the Provable SDK to function correctly.

In webpack this is enabled with the following options within `webpack.config.js`:

```json
experiments: {
    asyncWebAssembly: true,
    topLevelAwait: true,
},
```

### NodeJS Version (Node.JS Projects Only)

The Provable SDK requires a minimum of Node.js version 20 and recommends using node version 22+ for best performance.

### Framework Specific Configuration

The npm package [create-leo-app](https://www.npmjs.com/package/create-leo-app) offers several templates for building zero knowledge JavaScript apps using several
popular frameworks including React, Next.js, and Node. Examining the configuration of these templates can provide 
additional guidance on how to configure your project.
