# Module `src/program-manager`

![category:other](https://img.shields.io/badge/category-other-blue.svg?style=flat-square)



[Source file](../../sdk/src/program-manager.ts)

# Class `ProgramManager`

The ProgramManager class is used to execute and deploy programs on the Aleo network and create value transfers.

## Constructors


### `ProgramManager(host, keyProvider, recordProvider)`

Create a new instance of the ProgramManager

Parameters | Type | Description
--- | --- | ---
__host__ | `string` | *A host uri running the official Aleo API*
__keyProvider__ | `FunctionKeyProvider` | *A key provider that implements {@link FunctionKeyProvider} interface*
__recordProvider__ | `RecordProvider` | *A record provider that implements {@link RecordProvider} interface*

---

## Methods

### `checkFee()`

![modifier: public](images/badges/modifier-public.svg)

Check if the fee is sufficient to pay for the transaction

---

### `setAccount(account)`

![modifier: public](images/badges/modifier-public.svg)

Set the account to use for transaction submission to the Aleo network

Parameters | Type | Description
--- | --- | ---
__account__ | [Account](sdk-src_account.md) | *Account to use for transaction submission*

---

### `setKeyProvider(keyProvider)`

![modifier: public](images/badges/modifier-public.svg)

Set the key provider that provides the proving and verifying keys for programs

Parameters | Type | Description
--- | --- | ---
__keyProvider__ | `FunctionKeyProvider` | **

---

### `setHost(host)`

![modifier: public](images/badges/modifier-public.svg)

Set the host peer to use for transaction submission to the Aleo network

Parameters | Type | Description
--- | --- | ---
__host__ | `string` | *Peer url to use for transaction submission*

---

### `setRecordProvider(recordProvider)`

![modifier: public](images/badges/modifier-public.svg)

Set the record provider that provides records for transactions

Parameters | Type | Description
--- | --- | ---
__recordProvider__ | `RecordProvider` | **

---

### `setHeader(headerName, value)`

![modifier: public](images/badges/modifier-public.svg)

Set a header in the &#x60;AleoNetworkClient&#x60;s header map

Parameters | Type | Description
--- | --- | ---
__headerName__ | `string` | *The name of the header to set*
__value__ | `string` | *The header value*

#### Examples

```javascript
import { ProgramManager } from "@provablehq/sdk/mainnet.js";

// Create a ProgramManager
const programManager = new ProgramManager("https://api.provable.com/v2");

// Set the value of the `Accept-Language` header to `en-US`
programManager.setHeader('Accept-Language', 'en-US');
```

---

### `setInclusionProver(provingKey)`

![modifier: public](images/badges/modifier-public.svg)

Set the inclusion prover into the wasm memory. This should be done prior to any execution of a function with a
private record.

Parameters | Type | Description
--- | --- | ---
__provingKey__ | [ProvingKey](sdk-src_wasm.md) | **

#### Examples

```javascript
import { ProgramManager, AleoKeyProvider } from "@provablehq/sdk/mainnet.js";

const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);

// Create a ProgramManager
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider);

// Set the inclusion keys.
programManager.setInclusionProver();
```

---

### `removeHeader(headerName)`

![modifier: public](images/badges/modifier-public.svg)

Remove a header from the &#x60;AleoNetworkClient&#x60;s header map

Parameters | Type | Description
--- | --- | ---
__headerName__ | `string` | *The name of the header to be removed*

#### Examples

```javascript
import { ProgramManager } from "@provablehq/sdk/mainnet.js";

// Create a ProgramManager
const programManager = new ProgramManager("https://api.provable.com/v2");

// Remove the default `X-Aleo-SDK-Version` header
programManager.removeHeader('X-Aleo-SDK-Version');
```

---

### `buildDeploymentTransaction(program, priorityFee, privateFee, recordSearchParams, feeRecord, privateKey) ► string`

![modifier: public](images/badges/modifier-public.svg)

Builds a deployment transaction for submission to the Aleo network.

Parameters | Type | Description
--- | --- | ---
__program__ | `string` | *Program source code*
__priorityFee__ | `number` | *The optional priority fee to be paid for that transaction.*
__privateFee__ | `boolean` | *Use a private record to pay the fee. If false this will use the account&#x27;s public credit balance*
__recordSearchParams__ | `RecordSearchParams` | *Optional parameters for searching for a record to use pay the deployment fee*
__feeRecord__ | `string` | *Optional Fee record to use for the transaction*
__privateKey__ | [PrivateKey](sdk-src_wasm.md) | *Optional private key to use for the transaction*
__*return*__ | `string` | *The transaction id of the deployed program or a failure message from the network*

#### Examples

```javascript
/// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";

// Create a new NetworkClient, KeyProvider, and RecordProvider
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);
keyProvider.useCache(true);

// Initialize a program manager with the key provider to automatically fetch keys for deployments
const program = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
programManager.setAccount(Account);

// Define a fee in credits
const priorityFee = 0.0;

// Create the deployment transaction.
const tx = await programManager.buildDeploymentTransaction(program, fee, false);
await programManager.networkClient.submitTransaction(tx);

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx.id());
 assert(transaction.id() === tx.id());
}, 20000);
```

---

### `buildUpgradeTransaction(options)`

![modifier: public](images/badges/modifier-public.svg)

Builds a deployment transaction for submission to the Aleo network that upgrades an existing program.

Parameters | Type | Description
--- | --- | ---
__options__ | `DeployOptions` | *The deployment options.*

#### Examples

```javascript
/// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";

// Create a new NetworkClient, KeyProvider, and RecordProvider
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);
keyProvider.useCache(true);

// Initialize a program manager with the key provider to automatically fetch keys for deployments
const program = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
programManager.setAccount(Account);

// Define a fee in credits
const priorityFee = 0.0;

// Create the deployment transaction.
const tx = await programManager.buildUpgradeTransaction({program: program, priorityFee: fee, privateFee: false});
await programManager.networkClient.submitTransaction(tx);

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx.id());
 assert(transaction.id() === tx.id());
}, 20000);
```

---

### `deploy(program, priorityFee, privateFee, recordSearchParams, feeRecord, privateKey) ► string`

![modifier: public](images/badges/modifier-public.svg)

Deploy an Aleo program to the Aleo network

Parameters | Type | Description
--- | --- | ---
__program__ | `string` | *Program source code*
__priorityFee__ | `number` | *The optional fee to be paid for the transaction*
__privateFee__ | `boolean` | *Use a private record to pay the fee. If false this will use the account&#x27;s public credit balance*
__recordSearchParams__ | `RecordSearchParams` | *Optional parameters for searching for a record to used pay the deployment fee*
__feeRecord__ | `string` | *Optional Fee record to use for the transaction*
__privateKey__ | [PrivateKey](sdk-src_wasm.md) | *Optional private key to use for the transaction*
__*return*__ | `string` | *The transaction id of the deployed program or a failure message from the network*

#### Examples

```javascript
/// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";

// Create a new NetworkClient, KeyProvider, and RecordProvider.
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);
keyProvider.useCache(true);

// Initialize a program manager with the key provider to automatically fetch keys for deployments
const program = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);

// Define a fee in credits
const priorityFee = 0.0;

// Deploy the program
const tx_id = await programManager.deploy(program, fee, false);

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx_id);
 assert(transaction.id() === tx_id);
}, 20000);
```

---

### `buildExecutionTransaction(options) ► Promise.<Transaction>`

![modifier: public](images/badges/modifier-public.svg)

Builds an execution transaction for submission to the Aleo network.

Parameters | Type | Description
--- | --- | ---
__options__ | `ExecuteOptions` | *The options for the execution transaction.*
__*return*__ | `Promise.<Transaction>` | *- A promise that resolves to the transaction or an error.*

#### Examples

```javascript
/// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";

// Create a new NetworkClient, KeyProvider, and RecordProvider.
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);
keyProvider.useCache(true);

// Initialize a program manager with the key provider to automatically fetch keys for executions
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);

// Build and execute the transaction
const tx = await programManager.buildExecutionTransaction({
  programName: "hello_hello.aleo",
  functionName: "hello_hello",
  priorityFee: 0.0,
  privateFee: false,
  inputs: ["5u32", "5u32"],
  keySearchParams: { "cacheKey": "hello_hello:hello" }
});

// Submit the transaction to the network
await programManager.networkClient.submitTransaction(tx.toString());

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx.id());
 assert(transaction.id() === tx.id());
}, 10000);
```

---

### `buildTransactionFromAuthorization(options) ► Promise.<Transaction>`

![modifier: public](images/badges/modifier-public.svg)

Builds an execution transaction for submission to the Aleo network from an Authorization and Fee Authorization.
This method is helpful if signing and authorization needs to be done in a secure environment separate from where
transactions are built.

Parameters | Type | Description
--- | --- | ---
__options__ | `ExecuteAuthorizationOptions` | *The options for executing the authorizations.*
__*return*__ | `Promise.<Transaction>` | *- A promise that resolves to the transaction or an error.*

#### Examples

```javascript
import { AleoKeyProvider, PrivateKey, initThreadPool, ProgramManager } from "@provablehq/sdk";

await initThreadPool();

// Create a new KeyProvider.
const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);

// Initialize a program manager with the key provider to automatically fetch keys for executions.
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider);

// Build the `Authorization`.
const privateKey = new PrivateKey(); // Change this to a private key that has an aleo credit balance.
const authorization = await programManager.buildAuthorization({
    programName: "credits.aleo",
    functionName: "transfer_public",
    privateKey,
    inputs: [
        "aleo1vwls2ete8dk8uu2kmkmzumd7q38fvshrht8hlc0a5362uq8ftgyqnm3w08",
        "10000000u64",
    ],
});

console.log("Getting execution id");

// Derive the execution ID and base fee.
const executionId = authorization.toExecutionId().toString();

console.log("Estimating fee");

// Get the base fee in microcredits.
const baseFeeMicrocredits = await programManager.estimateFeeForAuthorization(authorization, "credits.aleo");
const baseFeeCredits = Number(baseFeeMicrocredits)/1000000;

console.log("Building fee authorization");

// Build a credits.aleo/fee_public `Authorization`.
const feeAuthorization = await programManager.buildFeeAuthorization({
    deploymentOrExecutionId: executionId,
    baseFeeCredits,
    privateKey
});

console.log("Executing authorizations");

// Build and execute the transaction.
const tx = await programManager.buildTransactionFromAuthorization({
    programName: "credits.aleo",
    authorization,
    feeAuthorization,
});

// Submit the transaction to the network.
await programManager.networkClient.submitTransaction(tx.toString());

// Verify the transaction was successful.
setTimeout(async () => {
    const transaction = await programManager.networkClient.getTransaction(tx.id());
    console.log(transaction);
}, 10000);
```

---

### `buildAuthorization(options) ► Promise.<Authorization>`

![modifier: public](images/badges/modifier-public.svg)

Builds a SnarkVM &#x60;Authorization&#x60; for a specific function.

Parameters | Type | Description
--- | --- | ---
__options__ | `AuthorizationOptions` | *The options for building the &#x60;Authorization&#x60;*
__*return*__ | `Promise.<Authorization>` | *- A promise that resolves to an &#x60;Authorization&#x60; or throws an Error.*

#### Examples

```javascript
/// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";

// Create a new NetworkClient, KeyProvider, and RecordProvider.
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);
keyProvider.useCache(true);

// Initialize a ProgramManager with the key and record providers.
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);

// Build the `Authorization`.
const authorization = await programManager.buildAuthorization({
  programName: "credits.aleo",
  functionName: "transfer_public",
  inputs: [
    "aleo1vwls2ete8dk8uu2kmkmzumd7q38fvshrht8hlc0a5362uq8ftgyqnm3w08",
    "10000000u64",
  ],
});
```

---

### `buildAuthorizationUnchecked(options) ► Promise.<Authorization>`

![modifier: public](images/badges/modifier-public.svg)

Builds a SnarkVM &#x60;Authorization&#x60; for a specific function without building a circuit first. This should be used when fast authorization generation is needed and the invoker is confident inputs are coorect.

Parameters | Type | Description
--- | --- | ---
__options__ | `AuthorizationOptions` | *The options for building the &#x60;Authorization&#x60;*
__*return*__ | `Promise.<Authorization>` | *- A promise that resolves to an &#x60;Authorization&#x60; or throws an Error.*

#### Examples

```javascript
/// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";

// Create a new NetworkClient, KeyProvider, and RecordProvider.
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);
keyProvider.useCache(true);

// Initialize a ProgramManager with the key and record providers.
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);

// Build the unchecked `Authorization`.
const authorization = await programManager.buildAuthorizationUnchecked({
  programName: "credits.aleo",
  functionName: "transfer_public",
  inputs: [
    "aleo1vwls2ete8dk8uu2kmkmzumd7q38fvshrht8hlc0a5362uq8ftgyqnm3w08",
    "10000000u64",
  ],
});
```

---

### `provingRequest(options) ► Promise.<ProvingRequest>`

![modifier: public](images/badges/modifier-public.svg)

Builds a &#x60;ProvingRequest&#x60; for submission to a prover for execution.

Parameters | Type | Description
--- | --- | ---
__options__ | `ProvingRequestOptions` | *The options for building the proving request*
__*return*__ | `Promise.<ProvingRequest>` | *- A promise that resolves to the transaction or an error.*

#### Examples

```javascript
/// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";

// Create a new NetworkClient, KeyProvider, and RecordProvider.
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);
keyProvider.useCache(true);

// Initialize a ProgramManager with the key and record providers.
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);

// Build the proving request.
const provingRequest = await programManager.provingRequest({
  programName: "credits.aleo",
  functionName: "transfer_public",
  priorityFee: 0,
  privateFee: false,
  inputs: [
    "aleo1vwls2ete8dk8uu2kmkmzumd7q38fvshrht8hlc0a5362uq8ftgyqnm3w08",
    "10000000u64",
  ],
  broadcast: false,
});
```

---

### `buildFeeAuthorization(options) ► Promise.<Authorization>`

![modifier: public](images/badges/modifier-public.svg)

Builds a SnarkVM fee &#x60;Authorization&#x60; for &#x60;credits.aleo/fee_private&#x60; or &#x60;credits.aleo/fee_public&#x60;. If a record is provided &#x60;fee_private&#x60; will be executed, otherwise &#x60;fee_public&#x60; will be executed.

Parameters | Type | Description
--- | --- | ---
__options__ | `FeeAuthorizationOptions` | *The options for building the &#x60;Authorization&#x60;.*
__*return*__ | `Promise.<Authorization>` | *- A promise that resolves to an &#x60;Authorization&#x60; or throws an Error.*

#### Examples

```javascript
/// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";

// Create a new NetworkClient, KeyProvider, and RecordProvider.
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);
keyProvider.useCache(true);

// Initialize a ProgramManager with the key and record providers.
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);

// Build a credits.aleo/fee_public `Authorization`.
const feePublicAuthorization = await programManager.buildFeeAuthorization({
  deploymentOrExecutionId: "2423957656946557501636078245035919227529640894159332581642187482178647335171field",
  baseFeeCredits: 0.1,
});

// Build a credits.aleo/fee_private `Authorization`.
const record = "{ owner: aleo1j7qxyunfldj2lp8hsvy7mw5k8zaqgjfyr72x2gh3x4ewgae8v5gscf5jh3.private, microcredits: 1500000000000000u64.private, _nonce: 3077450429259593211617823051143573281856129402760267155982965992208217472983group.public }";
const feePrivateAuthorization = await programManager.buildFeeAuthorization({
  deploymentOrExecutionId: "2423957656946557501636078245035919227529640894159332581642187482178647335171field",
  baseFeeCredits: 0.1,
  feeRecord: record,
});
```

---

### `execute(options) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Builds an execution transaction for submission to the Aleo network.

Parameters | Type | Description
--- | --- | ---
__options__ | `ExecuteOptions` | *The options for the execution transaction.*
__*return*__ | `Promise.<string>` | *- The transaction id*

#### Examples

```javascript
/// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";

// Create a new NetworkClient, KeyProvider, and RecordProvider using official Aleo record, key, and network providers
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);
keyProvider.useCache(true);

// Initialize a program manager with the key provider to automatically fetch keys for executions
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);

// Build and execute the transaction
const tx_id = await programManager.execute({
  programName: "hello_hello.aleo",
  functionName: "hello_hello",
  priorityFee: 0.0,
  privateFee: false,
  inputs: ["5u32", "5u32"],
  keySearchParams: { "cacheKey": "hello_hello:hello" }
});

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx_id);
 assert(transaction.id() === tx_id);
}, 10000);
```

---

### `run(program, function_name, inputs, proveExecution, imports, keySearchParams, provingKey, verifyingKey, privateKey, offlineQuery) ► Promise.<ExecutionResponse>`

![modifier: public](images/badges/modifier-public.svg)

Run an Aleo program in offline mode

Parameters | Type | Description
--- | --- | ---
__program__ | `string` | *Program source code containing the function to be executed*
__function_name__ | `string` | *Function name to execute*
__inputs__ | `Array.<string>` | *Inputs to the function*
__proveExecution__ | `number` | *Whether to prove the execution of the function and return an execution transcript that contains the proof.*
__imports__ | `Array.<string>` | *Optional imports to the program*
__keySearchParams__ | `KeySearchParams` | *Optional parameters for finding the matching proving &amp; verifying keys for the function*
__provingKey__ | [ProvingKey](sdk-src_wasm.md) | *Optional proving key to use for the transaction*
__verifyingKey__ | [VerifyingKey](sdk-src_wasm.md) | *Optional verifying key to use for the transaction*
__privateKey__ | [PrivateKey](sdk-src_wasm.md) | *Optional private key to use for the transaction*
__offlineQuery__ | [OfflineQuery](sdk-src_wasm.md) | *Optional offline query if creating transactions in an offline environment*
__*return*__ | `Promise.<ExecutionResponse>` | *The execution response containing the outputs of the function and the proof if the program is proved.*

#### Examples

```javascript
/// Import the mainnet version of the sdk used to build executions.
import { Account, ProgramManager } from "@provablehq/sdk/mainnet.js";

/// Create the source for the "helloworld" program
const program = "program helloworld.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
const programManager = new ProgramManager(undefined, undefined, undefined);

/// Create a temporary account for the execution of the program
const account = new Account();
programManager.setAccount(account);

/// Get the response and ensure that the program executed correctly
const executionResponse = await programManager.run(program, "hello", ["5u32", "5u32"]);
const result = executionResponse.getOutputs();
assert(result === ["10u32"]);
```

---

### `join(recordOne, recordTwo, priorityFee, privateFee, recordSearchParams, feeRecord, privateKey, offlineQuery) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Join two credits records into a single credits record

Parameters | Type | Description
--- | --- | ---
__recordOne__ | [RecordPlaintext](sdk-src_wasm.md) | *First credits record to join*
__recordTwo__ | [RecordPlaintext](sdk-src_wasm.md) | *Second credits record to join*
__priorityFee__ | `number` | *The optional priority fee to be paid for the transaction*
__privateFee__ | `boolean` | *Use a private record to pay the fee. If false this will use the account&#x27;s public credit balance*
__recordSearchParams__ | `RecordSearchParams` | *Optional parameters for finding the fee record to use to pay the fee for the join transaction*
__feeRecord__ | [RecordPlaintext](sdk-src_wasm.md) | *Fee record to use for the join transaction*
__privateKey__ | [PrivateKey](sdk-src_wasm.md) | *Private key to use for the join transaction*
__offlineQuery__ | [OfflineQuery](sdk-src_wasm.md) | *Optional offline query if creating transactions in an offline environment*
__*return*__ | `Promise.<string>` | *The transaction id*

#### Examples

```javascript
/// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";

// Create a new NetworkClient, KeyProvider, and RecordProvider
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);
keyProvider.useCache(true);

// Initialize a program manager with the key provider to automatically fetch keys for executions
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
const record_1 = "{  owner: aleo184vuwr5u7u0ha5f5k44067dd2uaqewxx6pe5ltha5pv99wvhfqxqv339h4.private,  microcredits: 45000000u64.private,  _nonce: 4106205762862305308495708971985748592380064201230396559307556388725936304984group.public}"
const record_2 = "{  owner: aleo184vuwr5u7u0ha5f5k44067dd2uaqewxx6pe5ltha5pv99wvhfqxqv339h4.private,  microcredits: 45000000u64.private,  _nonce: 1540945439182663264862696551825005342995406165131907382295858612069623286213group.public}"
const tx_id = await programManager.join(record_1, record_2, 0.05, false);

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx_id);
 assert(transaction.id() === tx_id);
}, 10000);
```

---

### `split(splitAmount, amountRecord, privateKey, offlineQuery) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Split credits into two new credits records

Parameters | Type | Description
--- | --- | ---
__splitAmount__ | `number` | *Amount in microcredits to split from the original credits record*
__amountRecord__ | [RecordPlaintext](sdk-src_wasm.md) | *Amount record to use for the split transaction*
__privateKey__ | [PrivateKey](sdk-src_wasm.md) | *Optional private key to use for the split transaction*
__offlineQuery__ | [OfflineQuery](sdk-src_wasm.md) | *Optional offline query if creating transactions in an offline environment*
__*return*__ | `Promise.<string>` | *The transaction id*

#### Examples

```javascript
/// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";

// Create a new NetworkClient, KeyProvider, and RecordProvider
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);
keyProvider.useCache(true);

// Initialize a program manager with the key provider to automatically fetch keys for executions
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
const record = "{  owner: aleo184vuwr5u7u0ha5f5k44067dd2uaqewxx6pe5ltha5pv99wvhfqxqv339h4.private,  microcredits: 45000000u64.private,  _nonce: 4106205762862305308495708971985748592380064201230396559307556388725936304984group.public}"
const tx_id = await programManager.split(25000000, record);

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx_id);
 assert(transaction.id() === tx_id);
}, 10000);
```

---

### `synthesizeKeys(program, function_id, inputs, privateKey) ► Promise.<FunctionKeyPair>`

![modifier: public](images/badges/modifier-public.svg)

Pre-synthesize proving and verifying keys for a program

Parameters | Type | Description
--- | --- | ---
__program__ | `string` | *The program source code to synthesize keys for*
__function_id__ | `string` | *The function id to synthesize keys for*
__inputs__ | `Array.<string>` | *Sample inputs to the function*
__privateKey__ | [PrivateKey](sdk-src_wasm.md) | *Optional private key to use for the key synthesis*
__*return*__ | `Promise.<FunctionKeyPair>` | **

---

### `buildTransferTransaction(amount, recipient, transferType, priorityFee, privateFee, recordSearchParams, amountRecord, feeRecord, privateKey, offlineQuery) ► Promise.<Transaction>`

![modifier: public](images/badges/modifier-public.svg)

Build a transaction to transfer credits to another account for later submission to the Aleo network

Parameters | Type | Description
--- | --- | ---
__amount__ | `number` | *The amount of credits to transfer*
__recipient__ | `string` | *The recipient of the transfer*
__transferType__ | `string` | *The type of transfer to perform - options: &#x27;private&#x27;, &#x27;privateToPublic&#x27;, &#x27;public&#x27;, &#x27;publicToPrivate&#x27;*
__priorityFee__ | `number` | *The optional priority fee to be paid for the transaction*
__privateFee__ | `boolean` | *Use a private record to pay the fee. If false this will use the account&#x27;s public credit balance*
__recordSearchParams__ | `RecordSearchParams` | *Optional parameters for finding the amount and fee records for the transfer transaction*
__amountRecord__ | [RecordPlaintext](sdk-src_wasm.md) | *Optional amount record to use for the transfer*
__feeRecord__ | [RecordPlaintext](sdk-src_wasm.md) | *Optional fee record to use for the transfer*
__privateKey__ | [PrivateKey](sdk-src_wasm.md) | *Optional private key to use for the transfer transaction*
__offlineQuery__ | [OfflineQuery](sdk-src_wasm.md) | *Optional offline query if creating transactions in an offline environment*
__*return*__ | `Promise.<Transaction>` | *The transaction object*

#### Examples

```javascript
/// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";

// Create a new NetworkClient, KeyProvider, and RecordProvider
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);
keyProvider.useCache(true);

// Initialize a program manager with the key provider to automatically fetch keys for executions
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
const tx = await programManager.buildTransferTransaction(1, "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", "public", 0.2, false);
await programManager.networkClient.submitTransaction(tx.toString());

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx.id());
 assert(transaction.id() === tx.id());
}, 10000);
```

---

### `buildTransferPublicTransaction(amount, recipient, priorityFee, privateKey, offlineQuery) ► Promise.<Transaction>`

![modifier: public](images/badges/modifier-public.svg)

Build a transfer_public transaction to transfer credits to another account for later submission to the Aleo network

Parameters | Type | Description
--- | --- | ---
__amount__ | `number` | *The amount of credits to transfer*
__recipient__ | `string` | *The recipient of the transfer*
__priorityFee__ | `number` | *The optional priority fee to be paid for the transfer*
__privateKey__ | [PrivateKey](sdk-src_wasm.md) | *Optional private key to use for the transfer transaction*
__offlineQuery__ | [OfflineQuery](sdk-src_wasm.md) | *Optional offline query if creating transactions in an offline environment*
__*return*__ | `Promise.<Transaction>` | *The transaction object*

#### Examples

```javascript
/// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";

// Create a new NetworkClient, KeyProvider, and RecordProvider
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);
keyProvider.useCache(true);

// Initialize a program manager with the key provider to automatically fetch keys for executions
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
const tx = await programManager.buildTransferPublicTransaction(1, "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", 0.2);
await programManager.networkClient.submitTransaction(tx.toString());

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx.id());
 assert(transaction.id() === tx.id());
}, 10000);
```

---

### `buildTransferPublicAsSignerTransaction(amount, recipient, priorityFee, privateKey, offlineQuery) ► Promise.<Transaction>`

![modifier: public](images/badges/modifier-public.svg)

Build a transfer_public_as_signer transaction to transfer credits to another account for later submission to the Aleo network

Parameters | Type | Description
--- | --- | ---
__amount__ | `number` | *The amount of credits to transfer*
__recipient__ | `string` | *The recipient of the transfer*
__priorityFee__ | `number` | *The optional priority fee to be paid for the transfer*
__privateKey__ | [PrivateKey](sdk-src_wasm.md) | *Optional private key to use for the transfer transaction*
__offlineQuery__ | [OfflineQuery](sdk-src_wasm.md) | *Optional offline query if creating transactions in an offline environment*
__*return*__ | `Promise.<Transaction>` | *The transaction object*

#### Examples

```javascript
/// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";

// Create a new NetworkClient, KeyProvider, and RecordProvider
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);
keyProvider.useCache(true);

// Initialize a program manager with the key provider to automatically fetch keys for executions
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
const tx = await programManager.buildTransferPublicAsSignerTransaction(1, "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", 0.2);
await programManager.networkClient.submitTransaction(tx.toString());

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx.id());
 assert(transaction.id() === tx.id());
}, 10000);
```

---

### `transfer(amount, recipient, transferType, priorityFee, privateFee, recordSearchParams, amountRecord, feeRecord, privateKey, offlineQuery) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Transfer credits to another account

Parameters | Type | Description
--- | --- | ---
__amount__ | `number` | *The amount of credits to transfer*
__recipient__ | `string` | *The recipient of the transfer*
__transferType__ | `string` | *The type of transfer to perform - options: &#x27;private&#x27;, &#x27;privateToPublic&#x27;, &#x27;public&#x27;, &#x27;publicToPrivate&#x27;*
__priorityFee__ | `number` | *The optional priority fee to be paid for the transfer*
__privateFee__ | `boolean` | *Use a private record to pay the fee. If false this will use the account&#x27;s public credit balance*
__recordSearchParams__ | `RecordSearchParams` | *Optional parameters for finding the amount and fee records for the transfer transaction*
__amountRecord__ | [RecordPlaintext](sdk-src_wasm.md) | *Optional amount record to use for the transfer*
__feeRecord__ | [RecordPlaintext](sdk-src_wasm.md) | *Optional fee record to use for the transfer*
__privateKey__ | [PrivateKey](sdk-src_wasm.md) | *Optional private key to use for the transfer transaction*
__offlineQuery__ | [OfflineQuery](sdk-src_wasm.md) | *Optional offline query if creating transactions in an offline environment*
__*return*__ | `Promise.<string>` | *The transaction id*

#### Examples

```javascript
/// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";

// Create a new NetworkClient, KeyProvider, and RecordProvider
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);
keyProvider.useCache(true);

// Initialize a program manager with the key provider to automatically fetch keys for executions
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
const tx_id = await programManager.transfer(1, "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", "public", 0.2, false);

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx_id);
 assert(transaction.id() === tx_id);
}, 10000);
```

---

### `buildBondPublicTransaction(validator_address, withdrawal_address, amount, options) ► Promise.<Transaction>`

![modifier: public](images/badges/modifier-public.svg)

Build transaction to bond credits to a validator for later submission to the Aleo Network

Parameters | Type | Description
--- | --- | ---
__validator_address__ | `string` | *Address of the validator to bond to, if this address is the same as the staker (i.e. the executor of this function), it will attempt to bond the credits as a validator. Bonding as a validator currently requires a minimum of 10,000,000 credits to bond (subject to change). If the address is specified is an existing validator and is different from the address of the executor of this function, it will bond the credits to that validator&#x27;s staking committee as a delegator. A minimum of 10 credits is required to bond as a delegator.*
__withdrawal_address__ | `string` | *Address to withdraw the staked credits to when unbond_public is called.*
__amount__ | `number` | *The amount of credits to bond*
__options__ | `Partial.<ExecuteOptions>` | *Override default execution options.*
__*return*__ | `Promise.<Transaction>` | *The transaction object*

#### Examples

```javascript
// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager } from "@provablehq/sdk/mainnet.js";

// Create a keyProvider to handle key management
const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, undefined);
programManager.setAccount(new Account("YourPrivateKey"));

// Create the bonding transaction object for later submission
const tx = await programManager.buildBondPublicTransaction("aleo1jx8s4dvjepculny4wfrzwyhs3tlyv65r58ns3g6q2gm2esh7ps8sqy9s5j", "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", "aleo1feya8sjy9k2zflvl2dx39pdsq5tju28elnp2ektnn588uu9ghv8s84msv9", 2000000);

// The transaction can be later submitted to the network using the network client.
await programManager.networkClient.submitTransaction(tx.toString());

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx.id());
 assert(transaction.id() === tx.id());
}, 10000);
```

---

### `bondPublic(validator_address, withdrawal_address, amount, options) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Bond credits to validator.

Parameters | Type | Description
--- | --- | ---
__validator_address__ | `string` | *Address of the validator to bond to, if this address is the same as the signer (i.e. the executor of this function), it will attempt to bond the credits as a validator. Bonding as a validator currently requires a minimum of 1,000,000 credits to bond (subject to change). If the address is specified is an existing validator and is different from the address of the executor of this function, it will bond the credits to that validator&#x27;s staking committee as a delegator. A minimum of 10 credits is required to bond as a delegator.*
__withdrawal_address__ | `string` | *Address to withdraw the staked credits to when unbond_public is called.*
__amount__ | `number` | *The amount of credits to bond*
__options__ | `Options` | *Options for the execution*
__*return*__ | `Promise.<string>` | *The transaction id*

#### Examples

```javascript
// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager } from "@provablehq/sdk/mainnet.js";

// Create a keyProvider to handle key management
const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, undefined);

// Create the bonding transaction
tx_id = await programManager.bondPublic("aleo1jx8s4dvjepculny4wfrzwyhs3tlyv65r58ns3g6q2gm2esh7ps8sqy9s5j", "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", "aleo1feya8sjy9k2zflvl2dx39pdsq5tju28elnp2ektnn588uu9ghv8s84msv9", 2000000);

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx_id);
 assert(transaction.id() === tx_id);
}, 10000);
```

---

### `buildBondValidatorTransaction(validator_address, withdrawal_address, amount, commission, options) ► Promise.<Transaction>`

![modifier: public](images/badges/modifier-public.svg)

Build a bond_validator transaction for later submission to the Aleo Network.

Parameters | Type | Description
--- | --- | ---
__validator_address__ | `string` | *Address of the validator to bond to, if this address is the same as the staker (i.e. the executor of this function), it will attempt to bond the credits as a validator. If the address is specified is an existing validator and is different from the address of the executor of this function, it will bond the credits to that validator&#x27;s staking committee as a delegator.*
__withdrawal_address__ | `string` | *Address to withdraw the staked credits to when unbond_public is called.*
__amount__ | `number` | *The amount of credits to bond. A minimum of 10000 credits is required to bond as a delegator.*
__commission__ | `number` | *The commission rate for the validator (must be between 0 and 100 - an error will be thrown if it is not)*
__options__ | `Partial.<ExecuteOptions>` | *Override default execution options.*
__*return*__ | `Promise.<Transaction>` | *The transaction object*

#### Examples

```javascript
// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager } from "@provablehq/sdk/mainnet.js";

// Create a keyProvider to handle key management
const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, undefined);
programManager.setAccount(new Account("YourPrivateKey"));

// Create the bond validator transaction object for later use.
const tx = await programManager.buildBondValidatorTransaction("aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", "aleo1feya8sjy9k2zflvl2dx39pdsq5tju28elnp2ektnn588uu9ghv8s84msv9", 2000000);

// The transaction can later be submitted to the network using the network client.
const tx_id = await programManager.networkClient.submitTransaction(tx.toString());

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx_id);
 assert(transaction.id() === tx_id);
}, 10000);
```

---

### `bondValidator(validator_address, withdrawal_address, amount, commission, options) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Build transaction to bond a validator.

Parameters | Type | Description
--- | --- | ---
__validator_address__ | `string` | *Address of the validator to bond to, if this address is the same as the staker (i.e. the executor of this function), it will attempt to bond the credits as a validator. Bonding as a validator currently requires a minimum of 10,000,000 credits to bond (subject to change). If the address is specified is an existing validator and is different from the address of the executor of this function, it will bond the credits to that validator&#x27;s staking committee as a delegator. A minimum of 10 credits is required to bond as a delegator.*
__withdrawal_address__ | `string` | *Address to withdraw the staked credits to when unbond_public is called.*
__amount__ | `number` | *The amount of credits to bond*
__commission__ | `number` | *The commission rate for the validator (must be between 0 and 100 - an error will be thrown if it is not)*
__options__ | `Partial.<ExecuteOptions>` | *Override default execution options.*
__*return*__ | `Promise.<string>` | *The transaction id*

#### Examples

```javascript
// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager } from "@provablehq/sdk/mainnet.js";

// Create a keyProvider to handle key management
const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, undefined);
programManager.setAccount(new Account("YourPrivateKey"));

// Create the bonding transaction
const tx_id = await programManager.bondValidator("aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", "aleo1feya8sjy9k2zflvl2dx39pdsq5tju28elnp2ektnn588uu9ghv8s84msv9", 2000000);

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx_id);
 assert(transaction.id() === tx_id);
}, 10000);
```

---

### `buildUnbondPublicTransaction(staker_address, amount, options) ► Promise.<Transaction>`

![modifier: public](images/badges/modifier-public.svg)

Build an unbond_public execution transaction to unbond credits from a validator in the Aleo network.

Parameters | Type | Description
--- | --- | ---
__staker_address__ | `string` | *The address of the staker who is unbonding the credits.*
__amount__ | `number` | *The amount of credits to unbond (scaled by 1,000,000).*
__options__ | `Partial.<ExecuteOptions>` | *Override default execution options.*
__*return*__ | `Promise.<Transaction>` | *- A promise that resolves to the transaction or an error message.*

#### Examples

```javascript
// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager } from "@provablehq/sdk/mainnet.js";

// Create a keyProvider to handle key management.
const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);

// Create a new ProgramManager with the key that will be used to unbond credits.
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, undefined);
const tx = await programManager.buildUnbondPublicTransaction("aleo1jx8s4dvjepculny4wfrzwyhs3tlyv65r58ns3g6q2gm2esh7ps8sqy9s5j", 2000000);

// The transaction can be submitted later to the network using the network client.
programManager.networkClient.submitTransaction(tx.toString());

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx.id());
 assert(transaction.id() === tx.id());
}, 10000);
```

---

### `unbondPublic(staker_address, amount, options) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Unbond a specified amount of staked credits. If the address of the executor of this function is an existing
validator, it will subtract this amount of credits from the validator&#x27;s staked credits. If there are less than
1,000,000 credits staked pool after the unbond, the validator will be removed from the validator set. If the
address of the executor of this function is not a validator and has credits bonded as a delegator, it will
subtract this amount of credits from the delegator&#x27;s staked credits. If there are less than 10 credits bonded
after the unbond operation, the delegator will be removed from the validator&#x27;s staking pool.

Parameters | Type | Description
--- | --- | ---
__staker_address__ | `string` | *Address of the staker who is unbonding the credits*
__amount__ | `number` | *Amount of credits to unbond.*
__options__ | `ExecuteOptions` | *Options for the execution*
__*return*__ | `Promise.<string>` | *The transaction id*

#### Examples

```javascript
// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager } from "@provablehq/sdk/mainnet.js";

// Create a keyProvider to handle key management
const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, undefined);
programManager.setAccount(new Account("YourPrivateKey"));

// Create the unbond_public transaction and send it to the network
const tx_id = await programManager.unbondPublic("aleo1jx8s4dvjepculny4wfrzwyhs3tlyv65r58ns3g6q2gm2esh7ps8sqy9s5j", 10);

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx_id);
 assert(transaction.id() === tx_id);
}, 10000);
```

---

### `buildClaimUnbondPublicTransaction(staker_address, options) ► Promise.<Transaction>`

![modifier: public](images/badges/modifier-public.svg)

Build a transaction to claim unbonded public credits in the Aleo network.

Parameters | Type | Description
--- | --- | ---
__staker_address__ | `string` | *The address of the staker who is claiming the credits.*
__options__ | `Partial.<ExecuteOptions>` | *Override default execution options.*
__*return*__ | `Promise.<Transaction>` | *- A promise that resolves to the transaction or an error message.*

#### Examples

```javascript
// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager } from "@provablehq/sdk/mainnet.js";

// Create a keyProvider to handle key management
const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);

// Create a new ProgramManager with the key that will be used to claim unbonded credits.
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, undefined);

// Create the claim_unbond_public transaction object for later use.
const tx = await programManager.buildClaimUnbondPublicTransaction("aleo1jx8s4dvjepculny4wfrzwyhs3tlyv65r58ns3g6q2gm2esh7ps8sqy9s5j");

// The transaction can be submitted later to the network using the network client.
programManager.networkClient.submitTransaction(tx.toString());

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx.id());
 assert(transaction.id() === tx.id());
}, 10000);
```

---

### `claimUnbondPublic(staker_address, options) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Claim unbonded credits. If credits have been unbonded by the account executing this function, this method will
claim them and add them to the public balance of the account.

Parameters | Type | Description
--- | --- | ---
__staker_address__ | `string` | *Address of the staker who is claiming the credits*
__options__ | `ExecuteOptions` | **
__*return*__ | `Promise.<string>` | *The transaction id*

#### Examples

```javascript
// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager } from "@provablehq/sdk/mainnet.js";

// Create a keyProvider to handle key management
const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, undefined);
programManager.setAccount(new Account("YourPrivateKey"));

// Create the claim_unbond_public transaction
const tx_id = await programManager.claimUnbondPublic("aleo1jx8s4dvjepculny4wfrzwyhs3tlyv65r58ns3g6q2gm2esh7ps8sqy9s5j");

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx_id);
 assert(transaction.id() === tx_id);
}, 10000);
```

---

### `buildSetValidatorStateTransaction(validator_state, options) ► Promise.<Transaction>`

![modifier: public](images/badges/modifier-public.svg)

Build a set_validator_state transaction for later usage.

This function allows a validator to set their state to be either opened or closed to new stakers.
When the validator is open to new stakers, any staker (including the validator) can bond or unbond from the validator.
When the validator is closed to new stakers, existing stakers can still bond or unbond from the validator, but new stakers cannot bond.

This function serves two primary purposes:
1. Allow a validator to leave the committee, by closing themselves to stakers and then unbonding all of their stakers.
2. Allow a validator to maintain their % of stake, by closing themselves to allowing more stakers to bond to them.

Parameters | Type | Description
--- | --- | ---
__validator_state__ | `boolean` | **
__options__ | `Partial.<ExecuteOptions>` | *Override default execution options*
__*return*__ | `Promise.<Transaction>` | *The transaction object*

#### Examples

```javascript
// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager } from "@provablehq/sdk/mainnet.js";

// Create a keyProvider to handle key management
const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, undefined);

// Create the set_validator_state transaction
const tx = await programManager.buildSetValidatorStateTransaction(true);

// The transaction can be submitted later to the network using the network client.
programManager.networkClient.submitTransaction(tx.toString());

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx.id());
 assert(transaction.id() === tx.id());
}, 10000);
```

---

### `setValidatorState(validator_state, options) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Submit a set_validator_state transaction to the Aleo Network.

This function allows a validator to set their state to be either opened or closed to new stakers.
When the validator is open to new stakers, any staker (including the validator) can bond or unbond from the validator.
When the validator is closed to new stakers, existing stakers can still bond or unbond from the validator, but new stakers cannot bond.

This function serves two primary purposes:
1. Allow a validator to leave the committee, by closing themselves to stakers and then unbonding all of their stakers.
2. Allow a validator to maintain their % of stake, by closing themselves to allowing more stakers to bond to them.

Parameters | Type | Description
--- | --- | ---
__validator_state__ | `boolean` | **
__options__ | `Partial.<ExecuteOptions>` | *Override default execution options*
__*return*__ | `Promise.<string>` | *The transaction id*

#### Examples

```javascript
// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager } from "@provablehq/sdk/mainnet.js";

// Create a keyProvider to handle key management
const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, undefined);

// Create the set_validator_state transaction
const tx_id = await programManager.setValidatorState(true);

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx_id);
 assert(transaction.id() === tx_id);
}, 10000);
```

---

### `verifyExecution(executionResponse, blockHeight, imports, importedVerifyingKeys) ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Verify a proof from an offline execution. This is useful when it is desired to do offchain proving and verification.

Parameters | Type | Description
--- | --- | ---
__executionResponse__ | `executionResponse` | *The response from an offline function execution (via the &#x60;programManager.run&#x60; method)*
__blockHeight__ | `blockHeight` | *The ledger height when the execution was generated.*
__imports__ | `ImportedPrograms` | *The imported programs used in the execution. Specified as { &quot;programName&quot;: &quot;programSourceCode&quot;, ... }*
__importedVerifyingKeys__ | `ImportedVerifyingKeys` | *The verifying keys in the execution. Specified as { &quot;programName&quot;: [[&quot;functionName&quot;, &quot;verifyingKey&quot;], ...], ... }*
__*return*__ | `boolean` | *True if the proof is valid, false otherwise*

#### Examples

```javascript
/// Import the mainnet version of the sdk used to build executions.
import { Account, ProgramManager } from "@provablehq/sdk/mainnet.js";

/// Create the source for two programs.
const program = "import add_it_up.aleo; \n\n program mul_add.aleo;\n\nfunction mul_and_add:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    mul r0 r1 into r2;\n call add_it_up.aleo/add_it r1 r2 into r3;  output r3 as u32.private;\n";
const program_import = "program add_it_up.aleo;\n\nfunction add_it:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
const programManager = new ProgramManager(undefined, undefined, undefined);

/// Create a temporary account for the execution of the program
const account = Account.fromCipherText(process.env.ciphertext, process.env.password);
programManager.setAccount(account);

/// Get the response and ensure that the program executed correctly
const executionResponse = await programManager.run(program, "mul_and_add", ["5u32", "5u32"], true);

/// Construct the imports and verifying keys
const imports = { "add_it_up.aleo": program_import };
const importedVerifyingKeys = { "add_it_up.aleo": [["add_it", "verifyingKey1..."]] };

/// Verify the execution.
const blockHeight = 9000000;
const isValid = programManager.verifyExecution(executionResponse, blockHeight, imports, importedVerifyingKeys);
assert(isValid);
```

---

### `createProgramFromSource(program) ► Program`

![modifier: public](images/badges/modifier-public.svg)

Create a program object from a program&#x27;s source code

Parameters | Type | Description
--- | --- | ---
__program__ | `string` | *Program source code*
__*return*__ | [Program](sdk-src_wasm.md) | *The program object*

---

### `creditsProgram() ► Program`

![modifier: public](images/badges/modifier-public.svg)

Get the credits program object

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Program](sdk-src_wasm.md) | *The credits program object*

---

### `verifyProgram(program)`

![modifier: public](images/badges/modifier-public.svg)

Verify a program is valid

Parameters | Type | Description
--- | --- | ---
__program__ | `string` | *The program source code*

---

### `estimateFeeForAuthorization(options)`

![modifier: public](images/badges/modifier-public.svg)

Estimate the execution fee for an authorization.

Parameters | Type | Description
--- | --- | ---
__options__ | `FeeEstimateOptions` | *Options for fee estimate.*

#### Examples

```javascript
import { AleoKeyProvider, PrivateKey, initThreadPool, ProgramManager } from "@provablehq/sdk";

await initThreadPool();

// Create a new KeyProvider.
const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);

// Initialize a program manager with the key provider to automatically fetch keys for executions.
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider);

// Build the `Authorization`.
const privateKey = new PrivateKey(); // Change this to a private key that has an aleo credit balance.
const authorization = await programManager.buildAuthorization({
    programName: "credits.aleo",
    functionName: "transfer_public",
    privateKey,
    inputs: [
        "aleo1vwls2ete8dk8uu2kmkmzumd7q38fvshrht8hlc0a5362uq8ftgyqnm3w08",
        "10000000u64",
    ],
});

console.log("Getting execution id");

// Derive the execution ID and base fee.
const executionId = authorization.toExecutionId().toString();

console.log("Estimating fee");

// Get the base fee in microcredits.
const baseFeeMicrocredits = await programManager.estimateFeeForAuthorization({
     authorization,
     programName: "credits.aleo"
});
const baseFeeCredits = Number(baseFeeMicrocredits)/1000000;

console.log("Building fee authorization");

// Build a credits.aleo/fee_public `Authorization`.
const feeAuthorization = await programManager.buildFeeAuthorization({
    deploymentOrExecutionId: executionId,
    baseFeeCredits,
    privateKey
});
```

---

### `estimateExecutionFee(options) ► Promise.<bigint>`

![modifier: public](images/badges/modifier-public.svg)

Estimate the execution fee for an Aleo function.

Parameters | Type | Description
--- | --- | ---
__options__ | `FeeEstimateOptions` | *Options for the fee estimate.*
__*return*__ | `Promise.<bigint>` | *Execution fee in microcredits for the authorization.*

#### Examples

```javascript
import { AleoKeyProvider, PrivateKey, initThreadPool, ProgramManager } from "@provablehq/sdk";

// Initialize a program manager with the key provider to automatically fetch keys for executions.
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider);

// Get the base fee in microcredits.
const baseFeeMicrocredits = await programManager.estimateExecutionFee({programName: "credits.aleo"});
const baseFeeCredits = Number(baseFeeMicrocredits)/1000000;

console.log("Building fee authorization");

// Build a credits.aleo/fee_public `Authorization`.
const baseFeeMicrocredits = await programManager.estimateFeeForAuthorization({
     programName: "credits.aleo",
     functionName: "transfer_public",
});
const baseFeeCredits = Number(baseFeeMicrocredits)/1000000;
```

---

### `buildDevnodeExecutionTransaction(options) ► Promise.<Transaction>`

![modifier: public](images/badges/modifier-public.svg)

Builds an execution transaction for submission to the a local devnode.
This method skips proof generation and is not meant for use with the mainnet or testnet Aleo networks.
Note: getOrInitConsensusVersionTestHeights must be called prior to using this method for this method to work properly.

Parameters | Type | Description
--- | --- | ---
__options__ | `ExecuteOptions` | *The options for the execution transaction.*
__*return*__ | `Promise.<Transaction>` | *- A promise that resolves to the transaction or an error.*

#### Examples

```javascript
/// Import the mainnet version of the sdk.
import { AleoKeyProvider, getOrInitConsensusVersionTestHeights, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";

// Initialize the development consensus heights in order to work with devnode.
getOrInitConsensusVersionTestHeights("0,1,2,3,4,5,6,7,8,9,10,11,12");

// Create a new NetworkClient and RecordProvider.
const recordProvider = new NetworkRecordProvider(account, networkClient);
keyProvider.useCache(true);

// Initialize a program manager.
const programManager = new ProgramManager("http://localhost:3030", recordProvider);

// Build and execute the transaction.
const tx = await programManager.buildDevnodeExecutionTransaction({
  programName: "hello_hello.aleo",
  functionName: "hello_hello",
  priorityFee: 0.0,
  privateFee: false,
  inputs: ["5u32", "5u32"],
});

// Submit the transaction to the network
await programManager.networkClient.submitTransaction(tx.toString());

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx.id());
 assert(transaction.id() === tx.id());
}, 10000);
```

---

### `buildDevnodeDeploymentTransaction(options) ► string`

![modifier: public](images/badges/modifier-public.svg)

Builds a deployment transaction with placeholder certificates and verifying keys for each function in the program.
Intended for use with a local devnode.
&#x60;getOrInitConsensusVersionTestHeights&#x60; must be called with development heights prior to invoking this method for it to work properly.

Parameters | Type | Description
--- | --- | ---
__options__ | `DeployOptions` | *The options for the deployment transaction.*
__*return*__ | `string` | *The transaction id of the deployed program or a failure message from the network*

#### Examples

```javascript
/// Import the mainnet version of the sdk.
import { ProgramManager, NetworkRecordProvider, getOrInitConsensusVersionTestHeights } from "@provablehq/sdk/mainnet.js";

// Initialize the development consensus heights in order to work with a local devnode.
getOrInitConsensusVersionTestHeights("0,1,2,3,4,5,6,7,8,9,10,11,12");

// Create a new NetworkClient, and RecordProvider
const recordProvider = new NetworkRecordProvider(account, networkClient);
keyProvider.useCache(true);

// Initialize a program manager with the key provider to automatically fetch keys for deployments
const program = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
const programManager = new ProgramManager("http://localhost:3030", recordProvider);
programManager.setAccount(Account);

// Define a fee in credits
const priorityFee = 0.0;

// Create the deployment transaction.
const tx = await programManager.buildDevnodeDeploymentTransaction({program: program, fee: priorityFee, privateFee: false});
await programManager.networkClient.submitTransaction(tx);

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx.id());
 assert(transaction.id() === tx.id());
}, 20000);
```

---

### `buildDevnodeUpgradeTransaction(options) ► string`

![modifier: public](images/badges/modifier-public.svg)

Builds an upgrade transaction on a local devnodewith placeholder certificates and verifying keys for each function in the program.
This method is only intended for use with a local devnode.

Parameters | Type | Description
--- | --- | ---
__options__ | `DeployOptions` | *The options for the deployment transaction.*
__*return*__ | `string` | *The transaction id of the deployed program or a failure message from the network*

#### Examples

```javascript
/// Import the mainnet version of the sdk.
import { ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";

// Create a new NetworkClient, and RecordProvider
const recordProvider = new NetworkRecordProvider(account, networkClient);
keyProvider.useCache(true);

// Initialize a program manager with the key provider to automatically fetch keys for deployments
const program = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
const programManager = new ProgramManager("http://localhost:3030", recordProvider);
programManager.setAccount(Account);

// Define a fee in credits
const priorityFee = 0.0;

// Create the deployment transaction.
const tx = await programManager.buildDevnodeUpgradeTransaction({program: program, fee: priorityFee, privateFee: false});
await programManager.networkClient.submitTransaction(tx);

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx.id());
 assert(transaction.id() === tx.id());
}, 20000);
```

---

### `checkFee(address, feeAmount)`

![modifier: public](images/badges/modifier-public.svg)

Check if the fee is sufficient to pay for the transaction

Parameters | Type | Description
--- | --- | ---
__address__ | `string` | **
__feeAmount__ | `bigint` | **

---

### `setAccount(account)`

![modifier: public](images/badges/modifier-public.svg)

Set the account to use for transaction submission to the Aleo network

Parameters | Type | Description
--- | --- | ---
__account__ | [Account](sdk-src_account.md) | *Account to use for transaction submission*

---

### `setKeyProvider(keyProvider)`

![modifier: public](images/badges/modifier-public.svg)

Set the key provider that provides the proving and verifying keys for programs

Parameters | Type | Description
--- | --- | ---
__keyProvider__ | `FunctionKeyProvider` | **

---

### `setHost(host)`

![modifier: public](images/badges/modifier-public.svg)

Set the host peer to use for transaction submission to the Aleo network

Parameters | Type | Description
--- | --- | ---
__host__ | `string` | *Peer url to use for transaction submission*

---

### `setRecordProvider(recordProvider)`

![modifier: public](images/badges/modifier-public.svg)

Set the record provider that provides records for transactions

Parameters | Type | Description
--- | --- | ---
__recordProvider__ | `RecordProvider` | **

---

### `setHeader(headerName, value)`

![modifier: public](images/badges/modifier-public.svg)

Set a header in the &#x60;AleoNetworkClient&#x60;s header map

Parameters | Type | Description
--- | --- | ---
__headerName__ | `string` | *The name of the header to set*
__value__ | `string` | *The header value*

#### Examples

```javascript
import { ProgramManager } from "@provablehq/sdk/mainnet.js";

// Create a ProgramManager
const programManager = new ProgramManager("https://api.provable.com/v2");

// Set the value of the `Accept-Language` header to `en-US`
programManager.setHeader('Accept-Language', 'en-US');
```

---

### `setInclusionProver(provingKey)`

![modifier: public](images/badges/modifier-public.svg)

Set the inclusion prover into the wasm memory. This should be done prior to any execution of a function with a
private record.

Parameters | Type | Description
--- | --- | ---
__provingKey__ | [ProvingKey](sdk-src_wasm.md) | **

#### Examples

```javascript
import { ProgramManager, AleoKeyProvider } from "@provablehq/sdk/mainnet.js";

const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);

// Create a ProgramManager
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider);

// Set the inclusion keys.
programManager.setInclusionProver();
```

---

### `removeHeader(headerName)`

![modifier: public](images/badges/modifier-public.svg)

Remove a header from the &#x60;AleoNetworkClient&#x60;s header map

Parameters | Type | Description
--- | --- | ---
__headerName__ | `string` | *The name of the header to be removed*

#### Examples

```javascript
import { ProgramManager } from "@provablehq/sdk/mainnet.js";

// Create a ProgramManager
const programManager = new ProgramManager("https://api.provable.com/v2");

// Remove the default `X-Aleo-SDK-Version` header
programManager.removeHeader('X-Aleo-SDK-Version');
```

---

### `buildDeploymentTransaction(program, priorityFee, privateFee, recordSearchParams, feeRecord, privateKey) ► string`

![modifier: public](images/badges/modifier-public.svg)

Builds a deployment transaction for submission to the Aleo network.

Parameters | Type | Description
--- | --- | ---
__program__ | `string` | *Program source code*
__priorityFee__ | `number` | *The optional priority fee to be paid for that transaction.*
__privateFee__ | `boolean` | *Use a private record to pay the fee. If false this will use the account&#x27;s public credit balance*
__recordSearchParams__ | `RecordSearchParams` | *Optional parameters for searching for a record to use pay the deployment fee*
__feeRecord__ | `string` | *Optional Fee record to use for the transaction*
__privateKey__ | [PrivateKey](sdk-src_wasm.md) | *Optional private key to use for the transaction*
__*return*__ | `string` | *The transaction id of the deployed program or a failure message from the network*

#### Examples

```javascript
/// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";

// Create a new NetworkClient, KeyProvider, and RecordProvider
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);
keyProvider.useCache(true);

// Initialize a program manager with the key provider to automatically fetch keys for deployments
const program = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
programManager.setAccount(Account);

// Define a fee in credits
const priorityFee = 0.0;

// Create the deployment transaction.
const tx = await programManager.buildDeploymentTransaction(program, fee, false);
await programManager.networkClient.submitTransaction(tx);

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx.id());
 assert(transaction.id() === tx.id());
}, 20000);
```

---

### `buildUpgradeTransaction(options) ► Promise.<Transaction>`

![modifier: public](images/badges/modifier-public.svg)

Builds a deployment transaction for submission to the Aleo network that upgrades an existing program.

Parameters | Type | Description
--- | --- | ---
__options__ | `DeployOptions` | *The deployment options.*
__*return*__ | `Promise.<Transaction>` | **

#### Examples

```javascript
/// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";

// Create a new NetworkClient, KeyProvider, and RecordProvider
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);
keyProvider.useCache(true);

// Initialize a program manager with the key provider to automatically fetch keys for deployments
const program = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
programManager.setAccount(Account);

// Define a fee in credits
const priorityFee = 0.0;

// Create the deployment transaction.
const tx = await programManager.buildUpgradeTransaction({program: program, priorityFee: fee, privateFee: false});
await programManager.networkClient.submitTransaction(tx);

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx.id());
 assert(transaction.id() === tx.id());
}, 20000);
```

---

### `deploy(program, priorityFee, privateFee, recordSearchParams, feeRecord, privateKey) ► string`

![modifier: public](images/badges/modifier-public.svg)

Deploy an Aleo program to the Aleo network

Parameters | Type | Description
--- | --- | ---
__program__ | `string` | *Program source code*
__priorityFee__ | `number` | *The optional fee to be paid for the transaction*
__privateFee__ | `boolean` | *Use a private record to pay the fee. If false this will use the account&#x27;s public credit balance*
__recordSearchParams__ | `RecordSearchParams` | *Optional parameters for searching for a record to used pay the deployment fee*
__feeRecord__ | `string` | *Optional Fee record to use for the transaction*
__privateKey__ | [PrivateKey](sdk-src_wasm.md) | *Optional private key to use for the transaction*
__*return*__ | `string` | *The transaction id of the deployed program or a failure message from the network*

#### Examples

```javascript
/// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";

// Create a new NetworkClient, KeyProvider, and RecordProvider.
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);
keyProvider.useCache(true);

// Initialize a program manager with the key provider to automatically fetch keys for deployments
const program = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);

// Define a fee in credits
const priorityFee = 0.0;

// Deploy the program
const tx_id = await programManager.deploy(program, fee, false);

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx_id);
 assert(transaction.id() === tx_id);
}, 20000);
```

---

### `buildExecutionTransaction(options) ► Promise.<Transaction>`

![modifier: public](images/badges/modifier-public.svg)

Builds an execution transaction for submission to the Aleo network.

Parameters | Type | Description
--- | --- | ---
__options__ | `ExecuteOptions` | *The options for the execution transaction.*
__*return*__ | `Promise.<Transaction>` | *- A promise that resolves to the transaction or an error.*

#### Examples

```javascript
/// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";

// Create a new NetworkClient, KeyProvider, and RecordProvider.
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);
keyProvider.useCache(true);

// Initialize a program manager with the key provider to automatically fetch keys for executions
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);

// Build and execute the transaction
const tx = await programManager.buildExecutionTransaction({
  programName: "hello_hello.aleo",
  functionName: "hello_hello",
  priorityFee: 0.0,
  privateFee: false,
  inputs: ["5u32", "5u32"],
  keySearchParams: { "cacheKey": "hello_hello:hello" }
});

// Submit the transaction to the network
await programManager.networkClient.submitTransaction(tx.toString());

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx.id());
 assert(transaction.id() === tx.id());
}, 10000);
```

---

### `buildTransactionFromAuthorization(options) ► Promise.<Transaction>`

![modifier: public](images/badges/modifier-public.svg)

Builds an execution transaction for submission to the Aleo network from an Authorization and Fee Authorization.
This method is helpful if signing and authorization needs to be done in a secure environment separate from where
transactions are built.

Parameters | Type | Description
--- | --- | ---
__options__ | `ExecuteAuthorizationOptions` | *The options for executing the authorizations.*
__*return*__ | `Promise.<Transaction>` | *- A promise that resolves to the transaction or an error.*

#### Examples

```javascript
import { AleoKeyProvider, PrivateKey, initThreadPool, ProgramManager } from "@provablehq/sdk";

await initThreadPool();

// Create a new KeyProvider.
const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);

// Initialize a program manager with the key provider to automatically fetch keys for executions.
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider);

// Build the `Authorization`.
const privateKey = new PrivateKey(); // Change this to a private key that has an aleo credit balance.
const authorization = await programManager.buildAuthorization({
    programName: "credits.aleo",
    functionName: "transfer_public",
    privateKey,
    inputs: [
        "aleo1vwls2ete8dk8uu2kmkmzumd7q38fvshrht8hlc0a5362uq8ftgyqnm3w08",
        "10000000u64",
    ],
});

console.log("Getting execution id");

// Derive the execution ID and base fee.
const executionId = authorization.toExecutionId().toString();

console.log("Estimating fee");

// Get the base fee in microcredits.
const baseFeeMicrocredits = await programManager.estimateFeeForAuthorization(authorization, "credits.aleo");
const baseFeeCredits = Number(baseFeeMicrocredits)/1000000;

console.log("Building fee authorization");

// Build a credits.aleo/fee_public `Authorization`.
const feeAuthorization = await programManager.buildFeeAuthorization({
    deploymentOrExecutionId: executionId,
    baseFeeCredits,
    privateKey
});

console.log("Executing authorizations");

// Build and execute the transaction.
const tx = await programManager.buildTransactionFromAuthorization({
    programName: "credits.aleo",
    authorization,
    feeAuthorization,
});

// Submit the transaction to the network.
await programManager.networkClient.submitTransaction(tx.toString());

// Verify the transaction was successful.
setTimeout(async () => {
    const transaction = await programManager.networkClient.getTransaction(tx.id());
    console.log(transaction);
}, 10000);
```

---

### `buildAuthorization(options) ► Promise.<Authorization>`

![modifier: public](images/badges/modifier-public.svg)

Builds a SnarkVM &#x60;Authorization&#x60; for a specific function.

Parameters | Type | Description
--- | --- | ---
__options__ | `AuthorizationOptions` | *The options for building the &#x60;Authorization&#x60;*
__*return*__ | `Promise.<Authorization>` | *- A promise that resolves to an &#x60;Authorization&#x60; or throws an Error.*

#### Examples

```javascript
/// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";

// Create a new NetworkClient, KeyProvider, and RecordProvider.
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);
keyProvider.useCache(true);

// Initialize a ProgramManager with the key and record providers.
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);

// Build the `Authorization`.
const authorization = await programManager.buildAuthorization({
  programName: "credits.aleo",
  functionName: "transfer_public",
  inputs: [
    "aleo1vwls2ete8dk8uu2kmkmzumd7q38fvshrht8hlc0a5362uq8ftgyqnm3w08",
    "10000000u64",
  ],
});
```

---

### `buildAuthorizationUnchecked(options) ► Promise.<Authorization>`

![modifier: public](images/badges/modifier-public.svg)

Builds a SnarkVM &#x60;Authorization&#x60; for a specific function without building a circuit first. This should be used when fast authorization generation is needed and the invoker is confident inputs are coorect.

Parameters | Type | Description
--- | --- | ---
__options__ | `AuthorizationOptions` | *The options for building the &#x60;Authorization&#x60;*
__*return*__ | `Promise.<Authorization>` | *- A promise that resolves to an &#x60;Authorization&#x60; or throws an Error.*

#### Examples

```javascript
/// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";

// Create a new NetworkClient, KeyProvider, and RecordProvider.
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);
keyProvider.useCache(true);

// Initialize a ProgramManager with the key and record providers.
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);

// Build the unchecked `Authorization`.
const authorization = await programManager.buildAuthorizationUnchecked({
  programName: "credits.aleo",
  functionName: "transfer_public",
  inputs: [
    "aleo1vwls2ete8dk8uu2kmkmzumd7q38fvshrht8hlc0a5362uq8ftgyqnm3w08",
    "10000000u64",
  ],
});
```

---

### `provingRequest(options) ► Promise.<ProvingRequest>`

![modifier: public](images/badges/modifier-public.svg)

Builds a &#x60;ProvingRequest&#x60; for submission to a prover for execution.

Parameters | Type | Description
--- | --- | ---
__options__ | `ProvingRequestOptions` | *The options for building the proving request*
__*return*__ | `Promise.<ProvingRequest>` | *- A promise that resolves to the transaction or an error.*

#### Examples

```javascript
/// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";

// Create a new NetworkClient, KeyProvider, and RecordProvider.
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);
keyProvider.useCache(true);

// Initialize a ProgramManager with the key and record providers.
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);

// Build the proving request.
const provingRequest = await programManager.provingRequest({
  programName: "credits.aleo",
  functionName: "transfer_public",
  priorityFee: 0,
  privateFee: false,
  inputs: [
    "aleo1vwls2ete8dk8uu2kmkmzumd7q38fvshrht8hlc0a5362uq8ftgyqnm3w08",
    "10000000u64",
  ],
  broadcast: false,
});
```

---

### `buildFeeAuthorization(options) ► Promise.<Authorization>`

![modifier: public](images/badges/modifier-public.svg)

Builds a SnarkVM fee &#x60;Authorization&#x60; for &#x60;credits.aleo/fee_private&#x60; or &#x60;credits.aleo/fee_public&#x60;. If a record is provided &#x60;fee_private&#x60; will be executed, otherwise &#x60;fee_public&#x60; will be executed.

Parameters | Type | Description
--- | --- | ---
__options__ | `FeeAuthorizationOptions` | *The options for building the &#x60;Authorization&#x60;.*
__*return*__ | `Promise.<Authorization>` | *- A promise that resolves to an &#x60;Authorization&#x60; or throws an Error.*

#### Examples

```javascript
/// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";

// Create a new NetworkClient, KeyProvider, and RecordProvider.
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);
keyProvider.useCache(true);

// Initialize a ProgramManager with the key and record providers.
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);

// Build a credits.aleo/fee_public `Authorization`.
const feePublicAuthorization = await programManager.buildFeeAuthorization({
  deploymentOrExecutionId: "2423957656946557501636078245035919227529640894159332581642187482178647335171field",
  baseFeeCredits: 0.1,
});

// Build a credits.aleo/fee_private `Authorization`.
const record = "{ owner: aleo1j7qxyunfldj2lp8hsvy7mw5k8zaqgjfyr72x2gh3x4ewgae8v5gscf5jh3.private, microcredits: 1500000000000000u64.private, _nonce: 3077450429259593211617823051143573281856129402760267155982965992208217472983group.public }";
const feePrivateAuthorization = await programManager.buildFeeAuthorization({
  deploymentOrExecutionId: "2423957656946557501636078245035919227529640894159332581642187482178647335171field",
  baseFeeCredits: 0.1,
  feeRecord: record,
});
```

---

### `execute(options) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Builds an execution transaction for submission to the Aleo network.

Parameters | Type | Description
--- | --- | ---
__options__ | `ExecuteOptions` | *The options for the execution transaction.*
__*return*__ | `Promise.<string>` | *- The transaction id*

#### Examples

```javascript
/// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";

// Create a new NetworkClient, KeyProvider, and RecordProvider using official Aleo record, key, and network providers
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);
keyProvider.useCache(true);

// Initialize a program manager with the key provider to automatically fetch keys for executions
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);

// Build and execute the transaction
const tx_id = await programManager.execute({
  programName: "hello_hello.aleo",
  functionName: "hello_hello",
  priorityFee: 0.0,
  privateFee: false,
  inputs: ["5u32", "5u32"],
  keySearchParams: { "cacheKey": "hello_hello:hello" }
});

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx_id);
 assert(transaction.id() === tx_id);
}, 10000);
```

---

### `run(program, function_name, inputs, proveExecution, imports, keySearchParams, provingKey, verifyingKey, privateKey, offlineQuery) ► Promise.<ExecutionResponse>`

![modifier: public](images/badges/modifier-public.svg)

Run an Aleo program in offline mode

Parameters | Type | Description
--- | --- | ---
__program__ | `string` | *Program source code containing the function to be executed*
__function_name__ | `string` | *Function name to execute*
__inputs__ | `Array.<string>` | *Inputs to the function*
__proveExecution__ | `number` | *Whether to prove the execution of the function and return an execution transcript that contains the proof.*
__imports__ | `Array.<string>` | *Optional imports to the program*
__keySearchParams__ | `KeySearchParams` | *Optional parameters for finding the matching proving &amp; verifying keys for the function*
__provingKey__ | [ProvingKey](sdk-src_wasm.md) | *Optional proving key to use for the transaction*
__verifyingKey__ | [VerifyingKey](sdk-src_wasm.md) | *Optional verifying key to use for the transaction*
__privateKey__ | [PrivateKey](sdk-src_wasm.md) | *Optional private key to use for the transaction*
__offlineQuery__ | [OfflineQuery](sdk-src_wasm.md) | *Optional offline query if creating transactions in an offline environment*
__*return*__ | `Promise.<ExecutionResponse>` | *The execution response containing the outputs of the function and the proof if the program is proved.*

#### Examples

```javascript
/// Import the mainnet version of the sdk used to build executions.
import { Account, ProgramManager } from "@provablehq/sdk/mainnet.js";

/// Create the source for the "helloworld" program
const program = "program helloworld.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
const programManager = new ProgramManager(undefined, undefined, undefined);

/// Create a temporary account for the execution of the program
const account = new Account();
programManager.setAccount(account);

/// Get the response and ensure that the program executed correctly
const executionResponse = await programManager.run(program, "hello", ["5u32", "5u32"]);
const result = executionResponse.getOutputs();
assert(result === ["10u32"]);
```

---

### `join(recordOne, recordTwo, priorityFee, privateFee, recordSearchParams, feeRecord, privateKey, offlineQuery) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Join two credits records into a single credits record

Parameters | Type | Description
--- | --- | ---
__recordOne__ | [RecordPlaintext](sdk-src_wasm.md) | *First credits record to join*
__recordTwo__ | [RecordPlaintext](sdk-src_wasm.md) | *Second credits record to join*
__priorityFee__ | `number` | *The optional priority fee to be paid for the transaction*
__privateFee__ | `boolean` | *Use a private record to pay the fee. If false this will use the account&#x27;s public credit balance*
__recordSearchParams__ | `RecordSearchParams` | *Optional parameters for finding the fee record to use to pay the fee for the join transaction*
__feeRecord__ | [RecordPlaintext](sdk-src_wasm.md) | *Fee record to use for the join transaction*
__privateKey__ | [PrivateKey](sdk-src_wasm.md) | *Private key to use for the join transaction*
__offlineQuery__ | [OfflineQuery](sdk-src_wasm.md) | *Optional offline query if creating transactions in an offline environment*
__*return*__ | `Promise.<string>` | *The transaction id*

#### Examples

```javascript
/// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";

// Create a new NetworkClient, KeyProvider, and RecordProvider
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);
keyProvider.useCache(true);

// Initialize a program manager with the key provider to automatically fetch keys for executions
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
const record_1 = "{  owner: aleo184vuwr5u7u0ha5f5k44067dd2uaqewxx6pe5ltha5pv99wvhfqxqv339h4.private,  microcredits: 45000000u64.private,  _nonce: 4106205762862305308495708971985748592380064201230396559307556388725936304984group.public}"
const record_2 = "{  owner: aleo184vuwr5u7u0ha5f5k44067dd2uaqewxx6pe5ltha5pv99wvhfqxqv339h4.private,  microcredits: 45000000u64.private,  _nonce: 1540945439182663264862696551825005342995406165131907382295858612069623286213group.public}"
const tx_id = await programManager.join(record_1, record_2, 0.05, false);

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx_id);
 assert(transaction.id() === tx_id);
}, 10000);
```

---

### `split(splitAmount, amountRecord, privateKey, offlineQuery) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Split credits into two new credits records

Parameters | Type | Description
--- | --- | ---
__splitAmount__ | `number` | *Amount in microcredits to split from the original credits record*
__amountRecord__ | [RecordPlaintext](sdk-src_wasm.md) | *Amount record to use for the split transaction*
__privateKey__ | [PrivateKey](sdk-src_wasm.md) | *Optional private key to use for the split transaction*
__offlineQuery__ | [OfflineQuery](sdk-src_wasm.md) | *Optional offline query if creating transactions in an offline environment*
__*return*__ | `Promise.<string>` | *The transaction id*

#### Examples

```javascript
/// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";

// Create a new NetworkClient, KeyProvider, and RecordProvider
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);
keyProvider.useCache(true);

// Initialize a program manager with the key provider to automatically fetch keys for executions
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
const record = "{  owner: aleo184vuwr5u7u0ha5f5k44067dd2uaqewxx6pe5ltha5pv99wvhfqxqv339h4.private,  microcredits: 45000000u64.private,  _nonce: 4106205762862305308495708971985748592380064201230396559307556388725936304984group.public}"
const tx_id = await programManager.split(25000000, record);

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx_id);
 assert(transaction.id() === tx_id);
}, 10000);
```

---

### `synthesizeKeys(program, function_id, inputs, privateKey) ► Promise.<FunctionKeyPair>`

![modifier: public](images/badges/modifier-public.svg)

Pre-synthesize proving and verifying keys for a program

Parameters | Type | Description
--- | --- | ---
__program__ | `string` | *The program source code to synthesize keys for*
__function_id__ | `string` | *The function id to synthesize keys for*
__inputs__ | `Array.<string>` | *Sample inputs to the function*
__privateKey__ | [PrivateKey](sdk-src_wasm.md) | *Optional private key to use for the key synthesis*
__*return*__ | `Promise.<FunctionKeyPair>` | **

---

### `buildTransferTransaction(amount, recipient, transferType, priorityFee, privateFee, recordSearchParams, amountRecord, feeRecord, privateKey, offlineQuery) ► Promise.<Transaction>`

![modifier: public](images/badges/modifier-public.svg)

Build a transaction to transfer credits to another account for later submission to the Aleo network

Parameters | Type | Description
--- | --- | ---
__amount__ | `number` | *The amount of credits to transfer*
__recipient__ | `string` | *The recipient of the transfer*
__transferType__ | `string` | *The type of transfer to perform - options: &#x27;private&#x27;, &#x27;privateToPublic&#x27;, &#x27;public&#x27;, &#x27;publicToPrivate&#x27;*
__priorityFee__ | `number` | *The optional priority fee to be paid for the transaction*
__privateFee__ | `boolean` | *Use a private record to pay the fee. If false this will use the account&#x27;s public credit balance*
__recordSearchParams__ | `RecordSearchParams` | *Optional parameters for finding the amount and fee records for the transfer transaction*
__amountRecord__ | [RecordPlaintext](sdk-src_wasm.md) | *Optional amount record to use for the transfer*
__feeRecord__ | [RecordPlaintext](sdk-src_wasm.md) | *Optional fee record to use for the transfer*
__privateKey__ | [PrivateKey](sdk-src_wasm.md) | *Optional private key to use for the transfer transaction*
__offlineQuery__ | [OfflineQuery](sdk-src_wasm.md) | *Optional offline query if creating transactions in an offline environment*
__*return*__ | `Promise.<Transaction>` | *The transaction object*

#### Examples

```javascript
/// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";

// Create a new NetworkClient, KeyProvider, and RecordProvider
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);
keyProvider.useCache(true);

// Initialize a program manager with the key provider to automatically fetch keys for executions
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
const tx = await programManager.buildTransferTransaction(1, "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", "public", 0.2, false);
await programManager.networkClient.submitTransaction(tx.toString());

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx.id());
 assert(transaction.id() === tx.id());
}, 10000);
```

---

### `buildTransferPublicTransaction(amount, recipient, priorityFee, privateKey, offlineQuery) ► Promise.<Transaction>`

![modifier: public](images/badges/modifier-public.svg)

Build a transfer_public transaction to transfer credits to another account for later submission to the Aleo network

Parameters | Type | Description
--- | --- | ---
__amount__ | `number` | *The amount of credits to transfer*
__recipient__ | `string` | *The recipient of the transfer*
__priorityFee__ | `number` | *The optional priority fee to be paid for the transfer*
__privateKey__ | [PrivateKey](sdk-src_wasm.md) | *Optional private key to use for the transfer transaction*
__offlineQuery__ | [OfflineQuery](sdk-src_wasm.md) | *Optional offline query if creating transactions in an offline environment*
__*return*__ | `Promise.<Transaction>` | *The transaction object*

#### Examples

```javascript
/// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";

// Create a new NetworkClient, KeyProvider, and RecordProvider
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);
keyProvider.useCache(true);

// Initialize a program manager with the key provider to automatically fetch keys for executions
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
const tx = await programManager.buildTransferPublicTransaction(1, "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", 0.2);
await programManager.networkClient.submitTransaction(tx.toString());

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx.id());
 assert(transaction.id() === tx.id());
}, 10000);
```

---

### `buildTransferPublicAsSignerTransaction(amount, recipient, priorityFee, privateKey, offlineQuery) ► Promise.<Transaction>`

![modifier: public](images/badges/modifier-public.svg)

Build a transfer_public_as_signer transaction to transfer credits to another account for later submission to the Aleo network

Parameters | Type | Description
--- | --- | ---
__amount__ | `number` | *The amount of credits to transfer*
__recipient__ | `string` | *The recipient of the transfer*
__priorityFee__ | `number` | *The optional priority fee to be paid for the transfer*
__privateKey__ | [PrivateKey](sdk-src_wasm.md) | *Optional private key to use for the transfer transaction*
__offlineQuery__ | [OfflineQuery](sdk-src_wasm.md) | *Optional offline query if creating transactions in an offline environment*
__*return*__ | `Promise.<Transaction>` | *The transaction object*

#### Examples

```javascript
/// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";

// Create a new NetworkClient, KeyProvider, and RecordProvider
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);
keyProvider.useCache(true);

// Initialize a program manager with the key provider to automatically fetch keys for executions
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
const tx = await programManager.buildTransferPublicAsSignerTransaction(1, "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", 0.2);
await programManager.networkClient.submitTransaction(tx.toString());

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx.id());
 assert(transaction.id() === tx.id());
}, 10000);
```

---

### `transfer(amount, recipient, transferType, priorityFee, privateFee, recordSearchParams, amountRecord, feeRecord, privateKey, offlineQuery) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Transfer credits to another account

Parameters | Type | Description
--- | --- | ---
__amount__ | `number` | *The amount of credits to transfer*
__recipient__ | `string` | *The recipient of the transfer*
__transferType__ | `string` | *The type of transfer to perform - options: &#x27;private&#x27;, &#x27;privateToPublic&#x27;, &#x27;public&#x27;, &#x27;publicToPrivate&#x27;*
__priorityFee__ | `number` | *The optional priority fee to be paid for the transfer*
__privateFee__ | `boolean` | *Use a private record to pay the fee. If false this will use the account&#x27;s public credit balance*
__recordSearchParams__ | `RecordSearchParams` | *Optional parameters for finding the amount and fee records for the transfer transaction*
__amountRecord__ | [RecordPlaintext](sdk-src_wasm.md) | *Optional amount record to use for the transfer*
__feeRecord__ | [RecordPlaintext](sdk-src_wasm.md) | *Optional fee record to use for the transfer*
__privateKey__ | [PrivateKey](sdk-src_wasm.md) | *Optional private key to use for the transfer transaction*
__offlineQuery__ | [OfflineQuery](sdk-src_wasm.md) | *Optional offline query if creating transactions in an offline environment*
__*return*__ | `Promise.<string>` | *The transaction id*

#### Examples

```javascript
/// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";

// Create a new NetworkClient, KeyProvider, and RecordProvider
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);
keyProvider.useCache(true);

// Initialize a program manager with the key provider to automatically fetch keys for executions
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
const tx_id = await programManager.transfer(1, "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", "public", 0.2, false);

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx_id);
 assert(transaction.id() === tx_id);
}, 10000);
```

---

### `buildBondPublicTransaction(validator_address, withdrawal_address, amount, options) ► Promise.<Transaction>`

![modifier: public](images/badges/modifier-public.svg)

Build transaction to bond credits to a validator for later submission to the Aleo Network

Parameters | Type | Description
--- | --- | ---
__validator_address__ | `string` | *Address of the validator to bond to, if this address is the same as the staker (i.e. the executor of this function), it will attempt to bond the credits as a validator. Bonding as a validator currently requires a minimum of 10,000,000 credits to bond (subject to change). If the address is specified is an existing validator and is different from the address of the executor of this function, it will bond the credits to that validator&#x27;s staking committee as a delegator. A minimum of 10 credits is required to bond as a delegator.*
__withdrawal_address__ | `string` | *Address to withdraw the staked credits to when unbond_public is called.*
__amount__ | `number` | *The amount of credits to bond*
__options__ | `Partial.<ExecuteOptions>` | *Override default execution options.*
__*return*__ | `Promise.<Transaction>` | *The transaction object*

#### Examples

```javascript
// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager } from "@provablehq/sdk/mainnet.js";

// Create a keyProvider to handle key management
const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, undefined);
programManager.setAccount(new Account("YourPrivateKey"));

// Create the bonding transaction object for later submission
const tx = await programManager.buildBondPublicTransaction("aleo1jx8s4dvjepculny4wfrzwyhs3tlyv65r58ns3g6q2gm2esh7ps8sqy9s5j", "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", "aleo1feya8sjy9k2zflvl2dx39pdsq5tju28elnp2ektnn588uu9ghv8s84msv9", 2000000);

// The transaction can be later submitted to the network using the network client.
await programManager.networkClient.submitTransaction(tx.toString());

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx.id());
 assert(transaction.id() === tx.id());
}, 10000);
```

---

### `bondPublic(validator_address, withdrawal_address, amount, options) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Bond credits to validator.

Parameters | Type | Description
--- | --- | ---
__validator_address__ | `string` | *Address of the validator to bond to, if this address is the same as the signer (i.e. the executor of this function), it will attempt to bond the credits as a validator. Bonding as a validator currently requires a minimum of 1,000,000 credits to bond (subject to change). If the address is specified is an existing validator and is different from the address of the executor of this function, it will bond the credits to that validator&#x27;s staking committee as a delegator. A minimum of 10 credits is required to bond as a delegator.*
__withdrawal_address__ | `string` | *Address to withdraw the staked credits to when unbond_public is called.*
__amount__ | `number` | *The amount of credits to bond*
__options__ | `Options` | *Options for the execution*
__*return*__ | `Promise.<string>` | *The transaction id*

#### Examples

```javascript
// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager } from "@provablehq/sdk/mainnet.js";

// Create a keyProvider to handle key management
const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, undefined);

// Create the bonding transaction
tx_id = await programManager.bondPublic("aleo1jx8s4dvjepculny4wfrzwyhs3tlyv65r58ns3g6q2gm2esh7ps8sqy9s5j", "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", "aleo1feya8sjy9k2zflvl2dx39pdsq5tju28elnp2ektnn588uu9ghv8s84msv9", 2000000);

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx_id);
 assert(transaction.id() === tx_id);
}, 10000);
```

---

### `buildBondValidatorTransaction(validator_address, withdrawal_address, amount, commission, options) ► Promise.<Transaction>`

![modifier: public](images/badges/modifier-public.svg)

Build a bond_validator transaction for later submission to the Aleo Network.

Parameters | Type | Description
--- | --- | ---
__validator_address__ | `string` | *Address of the validator to bond to, if this address is the same as the staker (i.e. the executor of this function), it will attempt to bond the credits as a validator. If the address is specified is an existing validator and is different from the address of the executor of this function, it will bond the credits to that validator&#x27;s staking committee as a delegator.*
__withdrawal_address__ | `string` | *Address to withdraw the staked credits to when unbond_public is called.*
__amount__ | `number` | *The amount of credits to bond. A minimum of 10000 credits is required to bond as a delegator.*
__commission__ | `number` | *The commission rate for the validator (must be between 0 and 100 - an error will be thrown if it is not)*
__options__ | `Partial.<ExecuteOptions>` | *Override default execution options.*
__*return*__ | `Promise.<Transaction>` | *The transaction object*

#### Examples

```javascript
// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager } from "@provablehq/sdk/mainnet.js";

// Create a keyProvider to handle key management
const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, undefined);
programManager.setAccount(new Account("YourPrivateKey"));

// Create the bond validator transaction object for later use.
const tx = await programManager.buildBondValidatorTransaction("aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", "aleo1feya8sjy9k2zflvl2dx39pdsq5tju28elnp2ektnn588uu9ghv8s84msv9", 2000000);

// The transaction can later be submitted to the network using the network client.
const tx_id = await programManager.networkClient.submitTransaction(tx.toString());

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx_id);
 assert(transaction.id() === tx_id);
}, 10000);
```

---

### `bondValidator(validator_address, withdrawal_address, amount, commission, options) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Build transaction to bond a validator.

Parameters | Type | Description
--- | --- | ---
__validator_address__ | `string` | *Address of the validator to bond to, if this address is the same as the staker (i.e. the executor of this function), it will attempt to bond the credits as a validator. Bonding as a validator currently requires a minimum of 10,000,000 credits to bond (subject to change). If the address is specified is an existing validator and is different from the address of the executor of this function, it will bond the credits to that validator&#x27;s staking committee as a delegator. A minimum of 10 credits is required to bond as a delegator.*
__withdrawal_address__ | `string` | *Address to withdraw the staked credits to when unbond_public is called.*
__amount__ | `number` | *The amount of credits to bond*
__commission__ | `number` | *The commission rate for the validator (must be between 0 and 100 - an error will be thrown if it is not)*
__options__ | `Partial.<ExecuteOptions>` | *Override default execution options.*
__*return*__ | `Promise.<string>` | *The transaction id*

#### Examples

```javascript
// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager } from "@provablehq/sdk/mainnet.js";

// Create a keyProvider to handle key management
const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, undefined);
programManager.setAccount(new Account("YourPrivateKey"));

// Create the bonding transaction
const tx_id = await programManager.bondValidator("aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", "aleo1feya8sjy9k2zflvl2dx39pdsq5tju28elnp2ektnn588uu9ghv8s84msv9", 2000000);

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx_id);
 assert(transaction.id() === tx_id);
}, 10000);
```

---

### `buildUnbondPublicTransaction(staker_address, amount, options) ► Promise.<Transaction>`

![modifier: public](images/badges/modifier-public.svg)

Build an unbond_public execution transaction to unbond credits from a validator in the Aleo network.

Parameters | Type | Description
--- | --- | ---
__staker_address__ | `string` | *The address of the staker who is unbonding the credits.*
__amount__ | `number` | *The amount of credits to unbond (scaled by 1,000,000).*
__options__ | `Partial.<ExecuteOptions>` | *Override default execution options.*
__*return*__ | `Promise.<Transaction>` | *- A promise that resolves to the transaction or an error message.*

#### Examples

```javascript
// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager } from "@provablehq/sdk/mainnet.js";

// Create a keyProvider to handle key management.
const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);

// Create a new ProgramManager with the key that will be used to unbond credits.
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, undefined);
const tx = await programManager.buildUnbondPublicTransaction("aleo1jx8s4dvjepculny4wfrzwyhs3tlyv65r58ns3g6q2gm2esh7ps8sqy9s5j", 2000000);

// The transaction can be submitted later to the network using the network client.
programManager.networkClient.submitTransaction(tx.toString());

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx.id());
 assert(transaction.id() === tx.id());
}, 10000);
```

---

### `unbondPublic(staker_address, amount, options) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Unbond a specified amount of staked credits. If the address of the executor of this function is an existing
validator, it will subtract this amount of credits from the validator&#x27;s staked credits. If there are less than
1,000,000 credits staked pool after the unbond, the validator will be removed from the validator set. If the
address of the executor of this function is not a validator and has credits bonded as a delegator, it will
subtract this amount of credits from the delegator&#x27;s staked credits. If there are less than 10 credits bonded
after the unbond operation, the delegator will be removed from the validator&#x27;s staking pool.

Parameters | Type | Description
--- | --- | ---
__staker_address__ | `string` | *Address of the staker who is unbonding the credits*
__amount__ | `number` | *Amount of credits to unbond.*
__options__ | `ExecuteOptions` | *Options for the execution*
__*return*__ | `Promise.<string>` | *The transaction id*

#### Examples

```javascript
// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager } from "@provablehq/sdk/mainnet.js";

// Create a keyProvider to handle key management
const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, undefined);
programManager.setAccount(new Account("YourPrivateKey"));

// Create the unbond_public transaction and send it to the network
const tx_id = await programManager.unbondPublic("aleo1jx8s4dvjepculny4wfrzwyhs3tlyv65r58ns3g6q2gm2esh7ps8sqy9s5j", 10);

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx_id);
 assert(transaction.id() === tx_id);
}, 10000);
```

---

### `buildClaimUnbondPublicTransaction(staker_address, options) ► Promise.<Transaction>`

![modifier: public](images/badges/modifier-public.svg)

Build a transaction to claim unbonded public credits in the Aleo network.

Parameters | Type | Description
--- | --- | ---
__staker_address__ | `string` | *The address of the staker who is claiming the credits.*
__options__ | `Partial.<ExecuteOptions>` | *Override default execution options.*
__*return*__ | `Promise.<Transaction>` | *- A promise that resolves to the transaction or an error message.*

#### Examples

```javascript
// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager } from "@provablehq/sdk/mainnet.js";

// Create a keyProvider to handle key management
const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);

// Create a new ProgramManager with the key that will be used to claim unbonded credits.
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, undefined);

// Create the claim_unbond_public transaction object for later use.
const tx = await programManager.buildClaimUnbondPublicTransaction("aleo1jx8s4dvjepculny4wfrzwyhs3tlyv65r58ns3g6q2gm2esh7ps8sqy9s5j");

// The transaction can be submitted later to the network using the network client.
programManager.networkClient.submitTransaction(tx.toString());

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx.id());
 assert(transaction.id() === tx.id());
}, 10000);
```

---

### `claimUnbondPublic(staker_address, options) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Claim unbonded credits. If credits have been unbonded by the account executing this function, this method will
claim them and add them to the public balance of the account.

Parameters | Type | Description
--- | --- | ---
__staker_address__ | `string` | *Address of the staker who is claiming the credits*
__options__ | `ExecuteOptions` | **
__*return*__ | `Promise.<string>` | *The transaction id*

#### Examples

```javascript
// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager } from "@provablehq/sdk/mainnet.js";

// Create a keyProvider to handle key management
const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, undefined);
programManager.setAccount(new Account("YourPrivateKey"));

// Create the claim_unbond_public transaction
const tx_id = await programManager.claimUnbondPublic("aleo1jx8s4dvjepculny4wfrzwyhs3tlyv65r58ns3g6q2gm2esh7ps8sqy9s5j");

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx_id);
 assert(transaction.id() === tx_id);
}, 10000);
```

---

### `buildSetValidatorStateTransaction(validator_state, options) ► Promise.<Transaction>`

![modifier: public](images/badges/modifier-public.svg)

Build a set_validator_state transaction for later usage.

This function allows a validator to set their state to be either opened or closed to new stakers.
When the validator is open to new stakers, any staker (including the validator) can bond or unbond from the validator.
When the validator is closed to new stakers, existing stakers can still bond or unbond from the validator, but new stakers cannot bond.

This function serves two primary purposes:
1. Allow a validator to leave the committee, by closing themselves to stakers and then unbonding all of their stakers.
2. Allow a validator to maintain their % of stake, by closing themselves to allowing more stakers to bond to them.

Parameters | Type | Description
--- | --- | ---
__validator_state__ | `boolean` | **
__options__ | `Partial.<ExecuteOptions>` | *Override default execution options*
__*return*__ | `Promise.<Transaction>` | *The transaction object*

#### Examples

```javascript
// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager } from "@provablehq/sdk/mainnet.js";

// Create a keyProvider to handle key management
const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, undefined);

// Create the set_validator_state transaction
const tx = await programManager.buildSetValidatorStateTransaction(true);

// The transaction can be submitted later to the network using the network client.
programManager.networkClient.submitTransaction(tx.toString());

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx.id());
 assert(transaction.id() === tx.id());
}, 10000);
```

---

### `setValidatorState(validator_state, options) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Submit a set_validator_state transaction to the Aleo Network.

This function allows a validator to set their state to be either opened or closed to new stakers.
When the validator is open to new stakers, any staker (including the validator) can bond or unbond from the validator.
When the validator is closed to new stakers, existing stakers can still bond or unbond from the validator, but new stakers cannot bond.

This function serves two primary purposes:
1. Allow a validator to leave the committee, by closing themselves to stakers and then unbonding all of their stakers.
2. Allow a validator to maintain their % of stake, by closing themselves to allowing more stakers to bond to them.

Parameters | Type | Description
--- | --- | ---
__validator_state__ | `boolean` | **
__options__ | `Partial.<ExecuteOptions>` | *Override default execution options*
__*return*__ | `Promise.<string>` | *The transaction id*

#### Examples

```javascript
// Import the mainnet version of the sdk.
import { AleoKeyProvider, ProgramManager } from "@provablehq/sdk/mainnet.js";

// Create a keyProvider to handle key management
const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, undefined);

// Create the set_validator_state transaction
const tx_id = await programManager.setValidatorState(true);

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx_id);
 assert(transaction.id() === tx_id);
}, 10000);
```

---

### `verifyExecution(executionResponse, blockHeight, imports, importedVerifyingKeys) ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Verify a proof from an offline execution. This is useful when it is desired to do offchain proving and verification.

Parameters | Type | Description
--- | --- | ---
__executionResponse__ | `executionResponse` | *The response from an offline function execution (via the &#x60;programManager.run&#x60; method)*
__blockHeight__ | `blockHeight` | *The ledger height when the execution was generated.*
__imports__ | `ImportedPrograms` | *The imported programs used in the execution. Specified as { &quot;programName&quot;: &quot;programSourceCode&quot;, ... }*
__importedVerifyingKeys__ | `ImportedVerifyingKeys` | *The verifying keys in the execution. Specified as { &quot;programName&quot;: [[&quot;functionName&quot;, &quot;verifyingKey&quot;], ...], ... }*
__*return*__ | `boolean` | *True if the proof is valid, false otherwise*

#### Examples

```javascript
/// Import the mainnet version of the sdk used to build executions.
import { Account, ProgramManager } from "@provablehq/sdk/mainnet.js";

/// Create the source for two programs.
const program = "import add_it_up.aleo; \n\n program mul_add.aleo;\n\nfunction mul_and_add:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    mul r0 r1 into r2;\n call add_it_up.aleo/add_it r1 r2 into r3;  output r3 as u32.private;\n";
const program_import = "program add_it_up.aleo;\n\nfunction add_it:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
const programManager = new ProgramManager(undefined, undefined, undefined);

/// Create a temporary account for the execution of the program
const account = Account.fromCipherText(process.env.ciphertext, process.env.password);
programManager.setAccount(account);

/// Get the response and ensure that the program executed correctly
const executionResponse = await programManager.run(program, "mul_and_add", ["5u32", "5u32"], true);

/// Construct the imports and verifying keys
const imports = { "add_it_up.aleo": program_import };
const importedVerifyingKeys = { "add_it_up.aleo": [["add_it", "verifyingKey1..."]] };

/// Verify the execution.
const blockHeight = 9000000;
const isValid = programManager.verifyExecution(executionResponse, blockHeight, imports, importedVerifyingKeys);
assert(isValid);
```

---

### `createProgramFromSource(program) ► Program`

![modifier: public](images/badges/modifier-public.svg)

Create a program object from a program&#x27;s source code

Parameters | Type | Description
--- | --- | ---
__program__ | `string` | *Program source code*
__*return*__ | [Program](sdk-src_wasm.md) | *The program object*

---

### `creditsProgram() ► Program`

![modifier: public](images/badges/modifier-public.svg)

Get the credits program object

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Program](sdk-src_wasm.md) | *The credits program object*

---

### `verifyProgram(program) ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Verify a program is valid

Parameters | Type | Description
--- | --- | ---
__program__ | `string` | *The program source code*
__*return*__ | `boolean` | **

---

### `estimateFeeForAuthorization(options) ► Promise.<bigint>`

![modifier: public](images/badges/modifier-public.svg)

Estimate the execution fee for an authorization.

Parameters | Type | Description
--- | --- | ---
__options__ | `FeeEstimateOptions` | *Options for fee estimate.*
__*return*__ | `Promise.<bigint>` | **

#### Examples

```javascript
import { AleoKeyProvider, PrivateKey, initThreadPool, ProgramManager } from "@provablehq/sdk";

await initThreadPool();

// Create a new KeyProvider.
const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);

// Initialize a program manager with the key provider to automatically fetch keys for executions.
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider);

// Build the `Authorization`.
const privateKey = new PrivateKey(); // Change this to a private key that has an aleo credit balance.
const authorization = await programManager.buildAuthorization({
    programName: "credits.aleo",
    functionName: "transfer_public",
    privateKey,
    inputs: [
        "aleo1vwls2ete8dk8uu2kmkmzumd7q38fvshrht8hlc0a5362uq8ftgyqnm3w08",
        "10000000u64",
    ],
});

console.log("Getting execution id");

// Derive the execution ID and base fee.
const executionId = authorization.toExecutionId().toString();

console.log("Estimating fee");

// Get the base fee in microcredits.
const baseFeeMicrocredits = await programManager.estimateFeeForAuthorization({
     authorization,
     programName: "credits.aleo"
});
const baseFeeCredits = Number(baseFeeMicrocredits)/1000000;

console.log("Building fee authorization");

// Build a credits.aleo/fee_public `Authorization`.
const feeAuthorization = await programManager.buildFeeAuthorization({
    deploymentOrExecutionId: executionId,
    baseFeeCredits,
    privateKey
});
```

---

### `estimateExecutionFee(options) ► Promise.<bigint>`

![modifier: public](images/badges/modifier-public.svg)

Estimate the execution fee for an Aleo function.

Parameters | Type | Description
--- | --- | ---
__options__ | `FeeEstimateOptions` | *Options for the fee estimate.*
__*return*__ | `Promise.<bigint>` | *Execution fee in microcredits for the authorization.*

#### Examples

```javascript
import { AleoKeyProvider, PrivateKey, initThreadPool, ProgramManager } from "@provablehq/sdk";

// Initialize a program manager with the key provider to automatically fetch keys for executions.
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider);

// Get the base fee in microcredits.
const baseFeeMicrocredits = await programManager.estimateExecutionFee({programName: "credits.aleo"});
const baseFeeCredits = Number(baseFeeMicrocredits)/1000000;

console.log("Building fee authorization");

// Build a credits.aleo/fee_public `Authorization`.
const baseFeeMicrocredits = await programManager.estimateFeeForAuthorization({
     programName: "credits.aleo",
     functionName: "transfer_public",
});
const baseFeeCredits = Number(baseFeeMicrocredits)/1000000;
```

---

### `buildDevnodeExecutionTransaction(options) ► Promise.<Transaction>`

![modifier: public](images/badges/modifier-public.svg)

Builds an execution transaction for submission to the a local devnode.
This method skips proof generation and is not meant for use with the mainnet or testnet Aleo networks.
Note: getOrInitConsensusVersionTestHeights must be called prior to using this method for this method to work properly.

Parameters | Type | Description
--- | --- | ---
__options__ | `ExecuteOptions` | *The options for the execution transaction.*
__*return*__ | `Promise.<Transaction>` | *- A promise that resolves to the transaction or an error.*

#### Examples

```javascript
/// Import the mainnet version of the sdk.
import { AleoKeyProvider, getOrInitConsensusVersionTestHeights, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";

// Initialize the development consensus heights in order to work with devnode.
getOrInitConsensusVersionTestHeights("0,1,2,3,4,5,6,7,8,9,10,11,12");

// Create a new NetworkClient and RecordProvider.
const recordProvider = new NetworkRecordProvider(account, networkClient);
keyProvider.useCache(true);

// Initialize a program manager.
const programManager = new ProgramManager("http://localhost:3030", recordProvider);

// Build and execute the transaction.
const tx = await programManager.buildDevnodeExecutionTransaction({
  programName: "hello_hello.aleo",
  functionName: "hello_hello",
  priorityFee: 0.0,
  privateFee: false,
  inputs: ["5u32", "5u32"],
});

// Submit the transaction to the network
await programManager.networkClient.submitTransaction(tx.toString());

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx.id());
 assert(transaction.id() === tx.id());
}, 10000);
```

---

### `buildDevnodeDeploymentTransaction(options) ► string`

![modifier: public](images/badges/modifier-public.svg)

Builds a deployment transaction with placeholder certificates and verifying keys for each function in the program.
Intended for use with a local devnode.
&#x60;getOrInitConsensusVersionTestHeights&#x60; must be called with development heights prior to invoking this method for it to work properly.

Parameters | Type | Description
--- | --- | ---
__options__ | `DeployOptions` | *The options for the deployment transaction.*
__*return*__ | `string` | *The transaction id of the deployed program or a failure message from the network*

#### Examples

```javascript
/// Import the mainnet version of the sdk.
import { ProgramManager, NetworkRecordProvider, getOrInitConsensusVersionTestHeights } from "@provablehq/sdk/mainnet.js";

// Initialize the development consensus heights in order to work with a local devnode.
getOrInitConsensusVersionTestHeights("0,1,2,3,4,5,6,7,8,9,10,11,12");

// Create a new NetworkClient, and RecordProvider
const recordProvider = new NetworkRecordProvider(account, networkClient);
keyProvider.useCache(true);

// Initialize a program manager with the key provider to automatically fetch keys for deployments
const program = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
const programManager = new ProgramManager("http://localhost:3030", recordProvider);
programManager.setAccount(Account);

// Define a fee in credits
const priorityFee = 0.0;

// Create the deployment transaction.
const tx = await programManager.buildDevnodeDeploymentTransaction({program: program, fee: priorityFee, privateFee: false});
await programManager.networkClient.submitTransaction(tx);

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx.id());
 assert(transaction.id() === tx.id());
}, 20000);
```

---

### `buildDevnodeUpgradeTransaction(options) ► string`

![modifier: public](images/badges/modifier-public.svg)

Builds an upgrade transaction on a local devnodewith placeholder certificates and verifying keys for each function in the program.
This method is only intended for use with a local devnode.

Parameters | Type | Description
--- | --- | ---
__options__ | `DeployOptions` | *The options for the deployment transaction.*
__*return*__ | `string` | *The transaction id of the deployed program or a failure message from the network*

#### Examples

```javascript
/// Import the mainnet version of the sdk.
import { ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";

// Create a new NetworkClient, and RecordProvider
const recordProvider = new NetworkRecordProvider(account, networkClient);
keyProvider.useCache(true);

// Initialize a program manager with the key provider to automatically fetch keys for deployments
const program = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
const programManager = new ProgramManager("http://localhost:3030", recordProvider);
programManager.setAccount(Account);

// Define a fee in credits
const priorityFee = 0.0;

// Create the deployment transaction.
const tx = await programManager.buildDevnodeUpgradeTransaction({program: program, fee: priorityFee, privateFee: false});
await programManager.networkClient.submitTransaction(tx);

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx.id());
 assert(transaction.id() === tx.id());
}, 20000);
```

---
