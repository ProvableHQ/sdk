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

### `buildDeploymentTransaction(program, fee, privateFee, recordSearchParams, feeRecord, privateKey) ► string`

![modifier: public](images/badges/modifier-public.svg)

Builds a deployment transaction for submission to the Aleo network.

Parameters | Type | Description
--- | --- | ---
__program__ | `string` | *Program source code*
__fee__ | `number` | *Fee to pay for the transaction*
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
keyProvider.useCache = true;

// Initialize a program manager with the key provider to automatically fetch keys for deployments
const program = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
programManager.setAccount(Account);

// Define a fee in credits
const fee = 1.2;

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

### `deploy(program, fee, privateFee, recordSearchParams, feeRecord, privateKey) ► string`

![modifier: public](images/badges/modifier-public.svg)

Deploy an Aleo program to the Aleo network

Parameters | Type | Description
--- | --- | ---
__program__ | `string` | *Program source code*
__fee__ | `number` | *Fee to pay for the transaction*
__privateFee__ | `boolean` | *Use a private record to pay the fee. If false this will use the account&#x27;s public credit balance*
__recordSearchParams__ | `RecordSearchParams` | *Optional parameters for searching for a record to used pay the deployment fee*
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
keyProvider.useCache = true;

// Initialize a program manager with the key provider to automatically fetch keys for deployments
const program = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);

// Define a fee in credits
const fee = 1.2;

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

// Create a new NetworkClient, KeyProvider, and RecordProvider using official Aleo record, key, and network providers
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);
keyProvider.useCache = true;

// Initialize a program manager with the key provider to automatically fetch keys for executions
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);

// Build and execute the transaction
const tx = await programManager.buildExecutionTransaction({
  programName: "hello_hello.aleo",
  functionName: "hello_hello",
  fee: 0.020,
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
keyProvider.useCache = true;

// Initialize a program manager with the key provider to automatically fetch keys for executions
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);

// Build and execute the transaction
const tx_id = await programManager.execute({
  programName: "hello_hello.aleo",
  functionName: "hello_hello",
  fee: 0.020,
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

### `join(recordOne, recordTwo, fee, privateFee, recordSearchParams, feeRecord, privateKey, offlineQuery) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Join two credits records into a single credits record

Parameters | Type | Description
--- | --- | ---
__recordOne__ | [RecordPlaintext](sdk-src_wasm.md) | *First credits record to join*
__recordTwo__ | [RecordPlaintext](sdk-src_wasm.md) | *Second credits record to join*
__fee__ | `number` | *Fee in credits pay for the join transaction*
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
keyProvider.useCache = true;

// Initialize a program manager with the key provider to automatically fetch keys for executions
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
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
keyProvider.useCache = true;

// Initialize a program manager with the key provider to automatically fetch keys for executions
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
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

### `buildTransferTransaction(amount, recipient, transferType, fee, privateFee, recordSearchParams, amountRecord, feeRecord, privateKey, offlineQuery) ► Promise.<Transaction>`

![modifier: public](images/badges/modifier-public.svg)

Build a transaction to transfer credits to another account for later submission to the Aleo network

Parameters | Type | Description
--- | --- | ---
__amount__ | `number` | *The amount of credits to transfer*
__recipient__ | `string` | *The recipient of the transfer*
__transferType__ | `string` | *The type of transfer to perform - options: &#x27;private&#x27;, &#x27;privateToPublic&#x27;, &#x27;public&#x27;, &#x27;publicToPrivate&#x27;*
__fee__ | `number` | *The fee to pay for the transfer*
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
keyProvider.useCache = true;

// Initialize a program manager with the key provider to automatically fetch keys for executions
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
const tx = await programManager.buildTransferTransaction(1, "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", "public", 0.2, false);
await programManager.networkClient.submitTransaction(tx.toString());

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx.id());
 assert(transaction.id() === tx.id());
}, 10000);
```

---

### `buildTransferPublicTransaction(amount, recipient, fee, privateKey, offlineQuery) ► Promise.<Transaction>`

![modifier: public](images/badges/modifier-public.svg)

Build a transfer_public transaction to transfer credits to another account for later submission to the Aleo network

Parameters | Type | Description
--- | --- | ---
__amount__ | `number` | *The amount of credits to transfer*
__recipient__ | `string` | *The recipient of the transfer*
__fee__ | `number` | *The fee to pay for the transfer records for the transfer transaction*
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
keyProvider.useCache = true;

// Initialize a program manager with the key provider to automatically fetch keys for executions
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
const tx = await programManager.buildTransferPublicTransaction(1, "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", 0.2);
await programManager.networkClient.submitTransaction(tx.toString());

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx.id());
 assert(transaction.id() === tx.id());
}, 10000);
```

---

### `buildTransferPublicAsSignerTransaction(amount, recipient, transferType, fee, privateFee, recordSearchParams, amountRecord, feeRecord, privateKey, offlineQuery) ► Promise.<Transaction>`

![modifier: public](images/badges/modifier-public.svg)

Build a transfer_public_as_signer transaction to transfer credits to another account for later submission to the Aleo network

Parameters | Type | Description
--- | --- | ---
__amount__ | `number` | *The amount of credits to transfer*
__recipient__ | `string` | *The recipient of the transfer*
__transferType__ | `string` | *The type of transfer to perform - options: &#x27;private&#x27;, &#x27;privateToPublic&#x27;, &#x27;public&#x27;, &#x27;publicToPrivate&#x27;*
__fee__ | `number` | *The fee to pay for the transfer*
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
keyProvider.useCache = true;

// Initialize a program manager with the key provider to automatically fetch keys for executions
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
const tx = await programManager.buildTransferPublicAsSignerTransaction(1, "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", 0.2);
await programManager.networkClient.submitTransaction(tx.toString());

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx.id());
 assert(transaction.id() === tx.id());
}, 10000);
```

---

### `transfer(amount, recipient, transferType, fee, privateFee, recordSearchParams, amountRecord, feeRecord, privateKey, offlineQuery) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Transfer credits to another account

Parameters | Type | Description
--- | --- | ---
__amount__ | `number` | *The amount of credits to transfer*
__recipient__ | `string` | *The recipient of the transfer*
__transferType__ | `string` | *The type of transfer to perform - options: &#x27;private&#x27;, &#x27;privateToPublic&#x27;, &#x27;public&#x27;, &#x27;publicToPrivate&#x27;*
__fee__ | `number` | *The fee to pay for the transfer*
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
keyProvider.useCache = true;

// Initialize a program manager with the key provider to automatically fetch keys for executions
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
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
keyProvider.useCache = true;

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);
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
keyProvider.useCache = true;

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);

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
keyProvider.useCache = true;

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);
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
keyProvider.useCache = true;

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);
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
keyProvider.useCache = true;

// Create a new ProgramManager with the key that will be used to unbond credits.
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);
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
keyProvider.useCache = true;

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);
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
keyProvider.useCache = true;

// Create a new ProgramManager with the key that will be used to claim unbonded credits.
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);

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
keyProvider.useCache = true;

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);
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
keyProvider.useCache = true;

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);

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
keyProvider.useCache = true;

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);

// Create the set_validator_state transaction
const tx_id = await programManager.setValidatorState(true);

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx_id);
 assert(transaction.id() === tx_id);
}, 10000);
```

---

### `verifyExecution(executionResponse) ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Verify a proof of execution from an offline execution

Parameters | Type | Description
--- | --- | ---
__executionResponse__ | `executionResponse` | **
__*return*__ | `boolean` | *True if the proof is valid, false otherwise*

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

### `buildDeploymentTransaction(program, fee, privateFee, recordSearchParams, feeRecord, privateKey) ► string`

![modifier: public](images/badges/modifier-public.svg)

Builds a deployment transaction for submission to the Aleo network.

Parameters | Type | Description
--- | --- | ---
__program__ | `string` | *Program source code*
__fee__ | `number` | *Fee to pay for the transaction*
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
keyProvider.useCache = true;

// Initialize a program manager with the key provider to automatically fetch keys for deployments
const program = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
programManager.setAccount(Account);

// Define a fee in credits
const fee = 1.2;

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

### `deploy(program, fee, privateFee, recordSearchParams, feeRecord, privateKey) ► string`

![modifier: public](images/badges/modifier-public.svg)

Deploy an Aleo program to the Aleo network

Parameters | Type | Description
--- | --- | ---
__program__ | `string` | *Program source code*
__fee__ | `number` | *Fee to pay for the transaction*
__privateFee__ | `boolean` | *Use a private record to pay the fee. If false this will use the account&#x27;s public credit balance*
__recordSearchParams__ | `RecordSearchParams` | *Optional parameters for searching for a record to used pay the deployment fee*
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
keyProvider.useCache = true;

// Initialize a program manager with the key provider to automatically fetch keys for deployments
const program = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);

// Define a fee in credits
const fee = 1.2;

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

// Create a new NetworkClient, KeyProvider, and RecordProvider using official Aleo record, key, and network providers
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);
keyProvider.useCache = true;

// Initialize a program manager with the key provider to automatically fetch keys for executions
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);

// Build and execute the transaction
const tx = await programManager.buildExecutionTransaction({
  programName: "hello_hello.aleo",
  functionName: "hello_hello",
  fee: 0.020,
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
keyProvider.useCache = true;

// Initialize a program manager with the key provider to automatically fetch keys for executions
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);

// Build and execute the transaction
const tx_id = await programManager.execute({
  programName: "hello_hello.aleo",
  functionName: "hello_hello",
  fee: 0.020,
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

### `join(recordOne, recordTwo, fee, privateFee, recordSearchParams, feeRecord, privateKey, offlineQuery) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Join two credits records into a single credits record

Parameters | Type | Description
--- | --- | ---
__recordOne__ | [RecordPlaintext](sdk-src_wasm.md) | *First credits record to join*
__recordTwo__ | [RecordPlaintext](sdk-src_wasm.md) | *Second credits record to join*
__fee__ | `number` | *Fee in credits pay for the join transaction*
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
keyProvider.useCache = true;

// Initialize a program manager with the key provider to automatically fetch keys for executions
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
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
keyProvider.useCache = true;

// Initialize a program manager with the key provider to automatically fetch keys for executions
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
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

### `buildTransferTransaction(amount, recipient, transferType, fee, privateFee, recordSearchParams, amountRecord, feeRecord, privateKey, offlineQuery) ► Promise.<Transaction>`

![modifier: public](images/badges/modifier-public.svg)

Build a transaction to transfer credits to another account for later submission to the Aleo network

Parameters | Type | Description
--- | --- | ---
__amount__ | `number` | *The amount of credits to transfer*
__recipient__ | `string` | *The recipient of the transfer*
__transferType__ | `string` | *The type of transfer to perform - options: &#x27;private&#x27;, &#x27;privateToPublic&#x27;, &#x27;public&#x27;, &#x27;publicToPrivate&#x27;*
__fee__ | `number` | *The fee to pay for the transfer*
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
keyProvider.useCache = true;

// Initialize a program manager with the key provider to automatically fetch keys for executions
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
const tx = await programManager.buildTransferTransaction(1, "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", "public", 0.2, false);
await programManager.networkClient.submitTransaction(tx.toString());

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx.id());
 assert(transaction.id() === tx.id());
}, 10000);
```

---

### `buildTransferPublicTransaction(amount, recipient, fee, privateKey, offlineQuery) ► Promise.<Transaction>`

![modifier: public](images/badges/modifier-public.svg)

Build a transfer_public transaction to transfer credits to another account for later submission to the Aleo network

Parameters | Type | Description
--- | --- | ---
__amount__ | `number` | *The amount of credits to transfer*
__recipient__ | `string` | *The recipient of the transfer*
__fee__ | `number` | *The fee to pay for the transfer records for the transfer transaction*
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
keyProvider.useCache = true;

// Initialize a program manager with the key provider to automatically fetch keys for executions
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
const tx = await programManager.buildTransferPublicTransaction(1, "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", 0.2);
await programManager.networkClient.submitTransaction(tx.toString());

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx.id());
 assert(transaction.id() === tx.id());
}, 10000);
```

---

### `buildTransferPublicAsSignerTransaction(amount, recipient, transferType, fee, privateFee, recordSearchParams, amountRecord, feeRecord, privateKey, offlineQuery) ► Promise.<Transaction>`

![modifier: public](images/badges/modifier-public.svg)

Build a transfer_public_as_signer transaction to transfer credits to another account for later submission to the Aleo network

Parameters | Type | Description
--- | --- | ---
__amount__ | `number` | *The amount of credits to transfer*
__recipient__ | `string` | *The recipient of the transfer*
__transferType__ | `string` | *The type of transfer to perform - options: &#x27;private&#x27;, &#x27;privateToPublic&#x27;, &#x27;public&#x27;, &#x27;publicToPrivate&#x27;*
__fee__ | `number` | *The fee to pay for the transfer*
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
keyProvider.useCache = true;

// Initialize a program manager with the key provider to automatically fetch keys for executions
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
const tx = await programManager.buildTransferPublicAsSignerTransaction(1, "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", 0.2);
await programManager.networkClient.submitTransaction(tx.toString());

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx.id());
 assert(transaction.id() === tx.id());
}, 10000);
```

---

### `transfer(amount, recipient, transferType, fee, privateFee, recordSearchParams, amountRecord, feeRecord, privateKey, offlineQuery) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Transfer credits to another account

Parameters | Type | Description
--- | --- | ---
__amount__ | `number` | *The amount of credits to transfer*
__recipient__ | `string` | *The recipient of the transfer*
__transferType__ | `string` | *The type of transfer to perform - options: &#x27;private&#x27;, &#x27;privateToPublic&#x27;, &#x27;public&#x27;, &#x27;publicToPrivate&#x27;*
__fee__ | `number` | *The fee to pay for the transfer*
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
keyProvider.useCache = true;

// Initialize a program manager with the key provider to automatically fetch keys for executions
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
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
keyProvider.useCache = true;

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);
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
keyProvider.useCache = true;

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);

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
keyProvider.useCache = true;

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);
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
keyProvider.useCache = true;

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);
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
keyProvider.useCache = true;

// Create a new ProgramManager with the key that will be used to unbond credits.
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);
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
keyProvider.useCache = true;

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);
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
keyProvider.useCache = true;

// Create a new ProgramManager with the key that will be used to claim unbonded credits.
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);

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
keyProvider.useCache = true;

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);
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
keyProvider.useCache = true;

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);

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
keyProvider.useCache = true;

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);

// Create the set_validator_state transaction
const tx_id = await programManager.setValidatorState(true);

// Verify the transaction was successful
setTimeout(async () => {
 const transaction = await programManager.networkClient.getTransaction(tx_id);
 assert(transaction.id() === tx_id);
}, 10000);
```

---

### `verifyExecution(executionResponse) ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Verify a proof of execution from an offline execution

Parameters | Type | Description
--- | --- | ---
__executionResponse__ | `executionResponse` | **
__*return*__ | `boolean` | *True if the proof is valid, false otherwise*

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
<<<<<<< HEAD

### `buildDeploymentTransaction(private_key, program, imports, priority_fee_credits, fee_record, url, imports, fee_proving_key, fee_verifying_key) ► Transaction`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Deploy an Aleo program

Parameters | Type | Description
--- | --- | ---
__private_key__ | `undefined` | *The private key of the sender*
__program__ | `undefined` | *The source code of the program being deployed*
__imports__ | `undefined` | *A javascript object holding the source code of any imported programs in the
form \{&quot;program_name1&quot;: &quot;program_source_code&quot;, &quot;program_name2&quot;: &quot;program_source_code&quot;, ..\}.
Note that all imported programs must be deployed on chain before the main program in order
for the deployment to succeed*
__priority_fee_credits__ | `undefined` | *The amount of credits to pay as a fee*
__fee_record__ | `undefined` | *The record to spend the fee from*
__url__ | `undefined` | *The url of the Aleo network node to send the transaction to*
__imports__ | `undefined` | *(optional) Provide a list of imports to use for the program deployment in the
form of a javascript object where the keys are a string of the program name and the values
are a string representing the program source code \{ &quot;hello.aleo&quot;: &quot;hello.aleo source code&quot; \}*
__fee_proving_key__ | `undefined` | *(optional) Provide a proving key to use for the fee execution*
__fee_verifying_key__ | `undefined` | *(optional) Provide a verifying key to use for the fee execution*
__*return*__ | [Transaction](sdk-src_wasm.md) | **

---

### `estimateDeploymentFee(program, imports) ► u64`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Estimate the fee for a program deployment

Disclaimer: Fee estimation is experimental and may not represent a correct estimate on any current or future network

Parameters | Type | Description
--- | --- | ---
__program__ | `undefined` | *The source code of the program being deployed*
__imports__ | `undefined` | *(optional) Provide a list of imports to use for the deployment fee estimation
in the form of a javascript object where the keys are a string of the program name and the values
are a string representing the program source code \{ &quot;hello.aleo&quot;: &quot;hello.aleo source code&quot; \}*
__*return*__ | `u64` | **

---

### `estimateProgramNameCost(name) ► u64`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Estimate the component of the deployment cost which comes from the fee for the program name.
Note that this cost does not represent the entire cost of deployment. It is additional to
the cost of the size (in bytes) of the deployment.

Disclaimer: Fee estimation is experimental and may not represent a correct estimate on any current or future network

Parameters | Type | Description
--- | --- | ---
__name__ | `undefined` | *The name of the program to be deployed*
__*return*__ | `u64` | **

---

### `executeFunctionOffline(private_key, program, function, inputs, prove_execution, cache, imports, proving_key, verifying_key) ► Promise.<ExecutionResponse>`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Execute an arbitrary function locally

Parameters | Type | Description
--- | --- | ---
__private_key__ | [PrivateKey](sdk-src_wasm.md) | *The private key of the sender*
__program__ | `string` | *The source code of the program being executed*
__function__ | `string` | *The name of the function to execute*
__inputs__ | `Array` | *A javascript array of inputs to the function*
__prove_execution__ | `boolean` | *If true, the execution will be proven and an execution object
containing the proof and the encrypted inputs and outputs needed to verify the proof offline
will be returned.*
__cache__ | `boolean` | *Cache the proving and verifying keys in the Execution response.
If this is set to &#x27;true&#x27; the keys synthesized will be stored in the Execution Response
and the &#x60;ProvingKey&#x60; and &#x60;VerifyingKey&#x60; can be retrieved from the response via the &#x60;.getKeys()&#x60;
method.*
__imports__ | `Object` | *(optional) Provide a list of imports to use for the function execution in the
form of a javascript object where the keys are a string of the program name and the values
are a string representing the program source code \{ &quot;hello.aleo&quot;: &quot;hello.aleo source code&quot; \}*
__proving_key__ | [ProvingKey](sdk-src_wasm.md) | *(optional) Provide a verifying key to use for the function execution*
__verifying_key__ | [VerifyingKey](sdk-src_wasm.md) | *(optional) Provide a verifying key to use for the function execution*
__*return*__ | `Promise.<ExecutionResponse>` | **

---

### `buildExecutionTransaction(private_key, program, function, inputs, priority_fee_credits, fee_record, url, imports, proving_key, verifying_key, fee_proving_key, fee_verifying_key) ► Transaction`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Execute Aleo function and create an Aleo execution transaction

Parameters | Type | Description
--- | --- | ---
__private_key__ | `undefined` | *The private key of the sender*
__program__ | `undefined` | *The source code of the program being executed*
__function__ | `undefined` | *The name of the function to execute*
__inputs__ | `undefined` | *A javascript array of inputs to the function*
__priority_fee_credits__ | `undefined` | *The amount of credits to pay as a fee*
__fee_record__ | `undefined` | *The record to spend the fee from*
__url__ | `undefined` | *The url of the Aleo network node to send the transaction to
If this is set to &#x27;true&#x27; the keys synthesized (or passed in as optional parameters via the
&#x60;proving_key&#x60; and &#x60;verifying_key&#x60; arguments) will be stored in the ProgramManager&#x27;s memory
and used for subsequent transactions. If this is set to &#x27;false&#x27; the proving and verifying
keys will be deallocated from memory after the transaction is executed.*
__imports__ | `undefined` | *(optional) Provide a list of imports to use for the function execution in the
form of a javascript object where the keys are a string of the program name and the values
are a string representing the program source code \{ &quot;hello.aleo&quot;: &quot;hello.aleo source code&quot; \}*
__proving_key__ | `undefined` | *(optional) Provide a verifying key to use for the function execution*
__verifying_key__ | `undefined` | *(optional) Provide a verifying key to use for the function execution*
__fee_proving_key__ | `undefined` | *(optional) Provide a proving key to use for the fee execution*
__fee_verifying_key__ | `undefined` | *(optional) Provide a verifying key to use for the fee execution*
__*return*__ | [Transaction](sdk-src_wasm.md) | **

---

### `estimateExecutionFee(private_key, program, function, inputs, url, imports, proving_key, verifying_key) ► u64`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Estimate Fee for Aleo function execution. Note if &quot;cache&quot; is set to true, the proving and
verifying keys will be stored in the ProgramManager&#x27;s memory and used for subsequent
program executions.

Disclaimer: Fee estimation is experimental and may not represent a correct estimate on any current or future network

Parameters | Type | Description
--- | --- | ---
__private_key__ | `undefined` | *The private key of the sender*
__program__ | `undefined` | *The source code of the program to estimate the execution fee for*
__function__ | `undefined` | *The name of the function to execute*
__inputs__ | `undefined` | *A javascript array of inputs to the function*
__url__ | `undefined` | *The url of the Aleo network node to send the transaction to*
__imports__ | `undefined` | *(optional) Provide a list of imports to use for the fee estimation in the
form of a javascript object where the keys are a string of the program name and the values
are a string representing the program source code \{ &quot;hello.aleo&quot;: &quot;hello.aleo source code&quot; \}*
__proving_key__ | `undefined` | *(optional) Provide a verifying key to use for the fee estimation*
__verifying_key__ | `undefined` | *(optional) Provide a verifying key to use for the fee estimation*
__*return*__ | `u64` | *Fee in microcredits*

---

### `estimateFinalizeFee(program, function) ► u64`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Estimate the finalize fee component for executing a function. This fee is additional to the
size of the execution of the program in bytes. If the function does not have a finalize
step, then the finalize fee is 0.

Disclaimer: Fee estimation is experimental and may not represent a correct estimate on any current or future network

Parameters | Type | Description
--- | --- | ---
__program__ | `undefined` | *The program containing the function to estimate the finalize fee for*
__function__ | `undefined` | *The function to estimate the finalize fee for*
__*return*__ | `u64` | *Fee in microcredits*

---

### `buildJoinTransaction(private_key, record_1, record_2, priority_fee_credits, fee_record, url, join_proving_key, join_verifying_key, fee_proving_key, fee_verifying_key) ► Transaction`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Join two records together to create a new record with an amount of credits equal to the sum
of the credits of the two original records

Parameters | Type | Description
--- | --- | ---
__private_key__ | `undefined` | *The private key of the sender*
__record_1__ | `undefined` | *The first record to combine*
__record_2__ | `undefined` | *The second record to combine*
__priority_fee_credits__ | `undefined` | *The amount of credits to pay as a fee*
__fee_record__ | `undefined` | *The record to spend the fee from*
__url__ | `undefined` | *The url of the Aleo network node to send the transaction to*
__join_proving_key__ | `undefined` | *(optional) Provide a proving key to use for the join function*
__join_verifying_key__ | `undefined` | *(optional) Provide a verifying key to use for the join function*
__fee_proving_key__ | `undefined` | *(optional) Provide a proving key to use for the fee execution*
__fee_verifying_key__ | `undefined` | *(optional) Provide a verifying key to use for the fee execution*
__*return*__ | [Transaction](sdk-src_wasm.md) | *Transaction object*

---

### `buildSplitTransaction(private_key, split_amount, amount_record, url, split_proving_key, split_verifying_key) ► Transaction`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Split an Aleo credits record into two separate records. This function does not require a fee.

Parameters | Type | Description
--- | --- | ---
__private_key__ | `undefined` | *The private key of the sender*
__split_amount__ | `undefined` | *The amount of the credit split. This amount will be subtracted from the
value of the record and two new records will be created with the split amount and the remainder*
__amount_record__ | `undefined` | *The record to split*
__url__ | `undefined` | *The url of the Aleo network node to send the transaction to*
__split_proving_key__ | `undefined` | *(optional) Provide a proving key to use for the split function*
__split_verifying_key__ | `undefined` | *(optional) Provide a verifying key to use for the split function*
__*return*__ | [Transaction](sdk-src_wasm.md) | *Transaction object*

---

### `buildTransferTransaction(private_key, amount_credits, recipient, transfer_type, amount_record, priority_fee_credits, fee_record, url, transfer_verifying_key, fee_proving_key, fee_verifying_key) ► Transaction`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Send credits from one Aleo account to another

Parameters | Type | Description
--- | --- | ---
__private_key__ | `undefined` | *The private key of the sender*
__amount_credits__ | `undefined` | *The amount of credits to send*
__recipient__ | `undefined` | *The recipient of the transaction*
__transfer_type__ | `undefined` | *The type of the transfer (options: &quot;private&quot;, &quot;public&quot;, &quot;private_to_public&quot;, &quot;public_to_private&quot;)*
__amount_record__ | `undefined` | *The record to fund the amount from*
__priority_fee_credits__ | `undefined` | *The amount of credits to pay as a fee*
__fee_record__ | `undefined` | *The record to spend the fee from*
__url__ | `undefined` | *The url of the Aleo network node to send the transaction to*
__transfer_verifying_key__ | `undefined` | *(optional) Provide a verifying key to use for the transfer
function*
__fee_proving_key__ | `undefined` | *(optional) Provide a proving key to use for the fee execution*
__fee_verifying_key__ | `undefined` | *(optional) Provide a verifying key to use for the fee execution*
__*return*__ | [Transaction](sdk-src_wasm.md) | **

---

### `synthesizeKeyPair(program, function_id, inputs, imports) ► Promise.<KeyPair>`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Synthesize proving and verifying keys for a program

Parameters | Type | Description
--- | --- | ---
__program__ | `string` | *The program source code of the program to synthesize keys for*
__function_id__ | `string` | *The function to synthesize keys for*
__inputs__ | `Array` | *The inputs to the function*
__imports__ | `Object` | *The imports for the program*
__*return*__ | `Promise.<KeyPair>` | **

---
=======
>>>>>>> a7a0ef90a982be5c40f5f18b064a13dc59428e1c
