# Module `src/program-manager`

![category:other](https://img.shields.io/badge/category-other-blue.svg?style=flat-square)



[Source file](../src/program-manager.ts)

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

### `deploy(program, fee, privateFee, recordSearchParams, feeRecord, privateKey) ► string`

![modifier: public](images/badges/modifier-public.svg)

Deploy an Aleo program to the Aleo network

Parameters | Type | Description
--- | --- | ---
__program__ | `string` | *Program source code*
__fee__ | `number` | *Fee to pay for the transaction*
__privateFee__ | `boolean` | *Use a private record to pay the fee. If false this will use the account&#x27;s public credit balance*
__recordSearchParams__ | `RecordSearchParams` | *Optional parameters for searching for a record to use
pay the deployment fee*
__feeRecord__ | `string` | *Optional Fee record to use for the transaction*
__privateKey__ | [PrivateKey](sdk-src_wasm.md) | *Optional private key to use for the transaction*
__*return*__ | `string` | *The transaction id of the deployed program or a failure message from the network*

#### Examples

```javascript
// Create a new NetworkClient, KeyProvider, and RecordProvider
const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);

// Initialize a program manager with the key provider to automatically fetch keys for deployments
const program = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);

// Define a fee in credits
const fee = 1.2;

// Deploy the program
const tx_id = await programManager.deploy(program, fee);

// Verify the transaction was successful
const transaction = await programManager.networkClient.getTransaction(tx_id);
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
// Create a new NetworkClient, KeyProvider, and RecordProvider using official Aleo record, key, and network providers
const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
const keyProvider = new AleoKeyProvider();
keyProvider.useCache = true;
const recordProvider = new NetworkRecordProvider(account, networkClient);

// Initialize a program manager with the key provider to automatically fetch keys for executions
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);

// Build and execute the transaction
const transaction = await programManager.buildExecutionTransaction({
  programName: "hello_hello.aleo",
  functionName: "hello_hello",
  fee: 0.020,
  privateFee: false,
  inputs: ["5u32", "5u32"],
  keySearchParams: { "cacheKey": "hello_hello:hello" }
});
const result = await programManager.networkClient.submitTransaction(transaction);
```

---

### `execute(options) ► Promise.<Transaction>`

![modifier: public](images/badges/modifier-public.svg)

Builds an execution transaction for submission to the Aleo network.

Parameters | Type | Description
--- | --- | ---
__options__ | `ExecuteOptions` | *The options for the execution transaction.*
__*return*__ | `Promise.<Transaction>` | *- A promise that resolves to the transaction or an error.*

#### Examples

```javascript
// Create a new NetworkClient, KeyProvider, and RecordProvider using official Aleo record, key, and network providers
const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
const keyProvider = new AleoKeyProvider();
keyProvider.useCache = true;
const recordProvider = new NetworkRecordProvider(account, networkClient);

// Initialize a program manager with the key provider to automatically fetch keys for executions
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);

// Build and execute the transaction
const transaction = await programManager.execute({
  programName: "hello_hello.aleo",
  functionName: "hello_hello",
  fee: 0.020,
  privateFee: false,
  inputs: ["5u32", "5u32"],
  keySearchParams: { "cacheKey": "hello_hello:hello" }
});
const result = await programManager.networkClient.submitTransaction(transaction);
```

---

### `run(program, function_name, inputs, proveExecution, imports, keySearchParams, provingKey, verifyingKey, privateKey, offlineQuery) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Run an Aleo program in offline mode

Parameters | Type | Description
--- | --- | ---
__program__ | `string` | *Program source code containing the function to be executed*
__function_name__ | `string` | *Function name to execute*
__inputs__ | `Array.<string>` | *Inputs to the function*
__proveExecution__ | `number` | *Whether to prove the execution of the function and return an execution transcript
that contains the proof.*
__imports__ | `Array.<string>` | *Optional imports to the program*
__keySearchParams__ | `KeySearchParams` | *Optional parameters for finding the matching proving &amp;
verifying keys for the function*
__provingKey__ | [ProvingKey](sdk-src_wasm.md) | *Optional proving key to use for the transaction*
__verifyingKey__ | [VerifyingKey](sdk-src_wasm.md) | *Optional verifying key to use for the transaction*
__privateKey__ | [PrivateKey](sdk-src_wasm.md) | *Optional private key to use for the transaction*
__offlineQuery__ | [OfflineQuery](sdk-src_wasm.md) | *Optional offline query if creating transactions in an offline environment*
__*return*__ | `Promise.<string>` | **

#### Examples

```javascript
import { Account, Program } from '@provablehq/sdk';

/// Create the source for the "helloworld" program
const program = "program helloworld.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
const programManager = new ProgramManager();

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
__recordSearchParams__ | `RecordSearchParams` | *Optional parameters for finding the fee record to use
to pay the fee for the join transaction*
__feeRecord__ | [RecordPlaintext](sdk-src_wasm.md) | *Fee record to use for the join transaction*
__privateKey__ | [PrivateKey](sdk-src_wasm.md) | *Private key to use for the join transaction*
__offlineQuery__ | [OfflineQuery](sdk-src_wasm.md) | *Optional offline query if creating transactions in an offline environment*
__*return*__ | `Promise.<string>` | **

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
__*return*__ | `Promise.<string>` | **

#### Examples

```javascript
// Create a new NetworkClient, KeyProvider, and RecordProvider
const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);

// Initialize a program manager with the key provider to automatically fetch keys for executions
const programName = "hello_hello.aleo";
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
const record = "{  owner: aleo184vuwr5u7u0ha5f5k44067dd2uaqewxx6pe5ltha5pv99wvhfqxqv339h4.private,  microcredits: 45000000u64.private,  _nonce: 4106205762862305308495708971985748592380064201230396559307556388725936304984group.public}"
const tx_id = await programManager.split(25000000, record);
const transaction = await programManager.networkClient.getTransaction(tx_id);
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

### `buildTransferTransaction(amount, recipient, transferType, fee, privateFee, recordSearchParams, amountRecord, feeRecord, privateKey, offlineQuery) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Build a transaction to transfer credits to another account for later submission to the Aleo network

Parameters | Type | Description
--- | --- | ---
__amount__ | `number` | *The amount of credits to transfer*
__recipient__ | `string` | *The recipient of the transfer*
__transferType__ | `string` | *The type of transfer to perform - options: &#x27;private&#x27;, &#x27;privateToPublic&#x27;, &#x27;public&#x27;, &#x27;publicToPrivate&#x27;*
__fee__ | `number` | *The fee to pay for the transfer*
__privateFee__ | `boolean` | *Use a private record to pay the fee. If false this will use the account&#x27;s public credit balance*
__recordSearchParams__ | `RecordSearchParams` | *Optional parameters for finding the amount and fee
records for the transfer transaction*
__amountRecord__ | [RecordPlaintext](sdk-src_wasm.md) | *Optional amount record to use for the transfer*
__feeRecord__ | [RecordPlaintext](sdk-src_wasm.md) | *Optional fee record to use for the transfer*
__privateKey__ | [PrivateKey](sdk-src_wasm.md) | *Optional private key to use for the transfer transaction*
__offlineQuery__ | [OfflineQuery](sdk-src_wasm.md) | *Optional offline query if creating transactions in an offline environment*
__*return*__ | `Promise.<string>` | *The transaction id of the transfer transaction*

#### Examples

```javascript
// Create a new NetworkClient, KeyProvider, and RecordProvider
const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);

// Initialize a program manager with the key provider to automatically fetch keys for executions
const programName = "hello_hello.aleo";
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
await programManager.initialize();
const tx_id = await programManager.transfer(1, "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", "private", 0.2)
const transaction = await programManager.networkClient.getTransaction(tx_id);
```

---

### `buildTransferPublicTransaction(amount, recipient, transferType, fee, privateFee, recordSearchParams, amountRecord, feeRecord, privateKey, offlineQuery) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Build a transfer_public transaction to transfer credits to another account for later submission to the Aleo network

Parameters | Type | Description
--- | --- | ---
__amount__ | `number` | *The amount of credits to transfer*
__recipient__ | `string` | *The recipient of the transfer*
__transferType__ | `string` | *The type of transfer to perform - options: &#x27;private&#x27;, &#x27;privateToPublic&#x27;, &#x27;public&#x27;, &#x27;publicToPrivate&#x27;*
__fee__ | `number` | *The fee to pay for the transfer*
__privateFee__ | `boolean` | *Use a private record to pay the fee. If false this will use the account&#x27;s public credit balance*
__recordSearchParams__ | `RecordSearchParams` | *Optional parameters for finding the amount and fee
records for the transfer transaction*
__amountRecord__ | [RecordPlaintext](sdk-src_wasm.md) | *Optional amount record to use for the transfer*
__feeRecord__ | [RecordPlaintext](sdk-src_wasm.md) | *Optional fee record to use for the transfer*
__privateKey__ | [PrivateKey](sdk-src_wasm.md) | *Optional private key to use for the transfer transaction*
__offlineQuery__ | [OfflineQuery](sdk-src_wasm.md) | *Optional offline query if creating transactions in an offline environment*
__*return*__ | `Promise.<string>` | *The transaction id of the transfer transaction*

---

### `buildTransferPublicAsSignerTransaction(amount, recipient, transferType, fee, privateFee, recordSearchParams, amountRecord, feeRecord, privateKey, offlineQuery) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Build a transfer_public_as_signer transaction to transfer credits to another account for later submission to the Aleo network

Parameters | Type | Description
--- | --- | ---
__amount__ | `number` | *The amount of credits to transfer*
__recipient__ | `string` | *The recipient of the transfer*
__transferType__ | `string` | *The type of transfer to perform - options: &#x27;private&#x27;, &#x27;privateToPublic&#x27;, &#x27;public&#x27;, &#x27;publicToPrivate&#x27;*
__fee__ | `number` | *The fee to pay for the transfer*
__privateFee__ | `boolean` | *Use a private record to pay the fee. If false this will use the account&#x27;s public credit balance*
__recordSearchParams__ | `RecordSearchParams` | *Optional parameters for finding the amount and fee
records for the transfer transaction*
__amountRecord__ | [RecordPlaintext](sdk-src_wasm.md) | *Optional amount record to use for the transfer*
__feeRecord__ | [RecordPlaintext](sdk-src_wasm.md) | *Optional fee record to use for the transfer*
__privateKey__ | [PrivateKey](sdk-src_wasm.md) | *Optional private key to use for the transfer transaction*
__offlineQuery__ | [OfflineQuery](sdk-src_wasm.md) | *Optional offline query if creating transactions in an offline environment*
__*return*__ | `Promise.<string>` | *The transaction id of the transfer transaction*

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
__recordSearchParams__ | `RecordSearchParams` | *Optional parameters for finding the amount and fee
records for the transfer transaction*
__amountRecord__ | [RecordPlaintext](sdk-src_wasm.md) | *Optional amount record to use for the transfer*
__feeRecord__ | [RecordPlaintext](sdk-src_wasm.md) | *Optional fee record to use for the transfer*
__privateKey__ | [PrivateKey](sdk-src_wasm.md) | *Optional private key to use for the transfer transaction*
__offlineQuery__ | [OfflineQuery](sdk-src_wasm.md) | *Optional offline query if creating transactions in an offline environment*
__*return*__ | `Promise.<string>` | *The transaction id of the transfer transaction*

#### Examples

```javascript
// Create a new NetworkClient, KeyProvider, and RecordProvider
const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);

// Initialize a program manager with the key provider to automatically fetch keys for executions
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
await programManager.initialize();
const tx_id = await programManager.transfer(1, "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", "private", 0.2)
const transaction = await programManager.networkClient.getTransaction(tx_id);
```

---

### `buildBondPublicTransaction(staker_address, validator_address, withdrawal_address, amount, options) ► `

![modifier: public](images/badges/modifier-public.svg)

Build transaction to bond credits to a validator for later submission to the Aleo Network

Parameters | Type | Description
--- | --- | ---
__staker_address__ | `string` | *Address of the staker who is bonding the credits*
__validator_address__ | `string` | *Address of the validator to bond to, if this address is the same as the staker (i.e. the
executor of this function), it will attempt to bond the credits as a validator. Bonding as a validator currently
requires a minimum of 10,000,000 credits to bond (subject to change). If the address is specified is an existing
validator and is different from the address of the executor of this function, it will bond the credits to that
validator&#x27;s staking committee as a delegator. A minimum of 10 credits is required to bond as a delegator.*
__withdrawal_address__ | `string` | *Address to withdraw the staked credits to when unbond_public is called.*
__amount__ | `number` | *The amount of credits to bond*
__options__ | `Partial.<ExecuteOptions>` | *Override default execution options.*
__*return*__ | `undefined` | *string*

#### Examples

```javascript
// Create a keyProvider to handle key management
const keyProvider = new AleoKeyProvider();
keyProvider.useCache = true;

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);
programManager.setAccount(new Account("YourPrivateKey"));

// Create the bonding transaction object for later submission
const tx = await programManager.buildBondPublicTransaction("aleo1jx8s4dvjepculny4wfrzwyhs3tlyv65r58ns3g6q2gm2esh7ps8sqy9s5j", "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", "aleo1feya8sjy9k2zflvl2dx39pdsq5tju28elnp2ektnn588uu9ghv8s84msv9", 2000000);
console.log(tx);

// The transaction can be later submitted to the network using the network client.
const result = await programManager.networkClient.submitTransaction(tx);
```

---

### `bondPublic(staker_address, validator_address, withdrawal_address, amount, options) ► `

![modifier: public](images/badges/modifier-public.svg)

Bond credits to validator.

Parameters | Type | Description
--- | --- | ---
__staker_address__ | `string` | *Address of the staker who is bonding the credits*
__validator_address__ | `string` | *Address of the validator to bond to, if this address is the same as the signer (i.e. the
executor of this function), it will attempt to bond the credits as a validator. Bonding as a validator currently
requires a minimum of 1,000,000 credits to bond (subject to change). If the address is specified is an existing
validator and is different from the address of the executor of this function, it will bond the credits to that
validator&#x27;s staking committee as a delegator. A minimum of 10 credits is required to bond as a delegator.*
__withdrawal_address__ | `string` | *Address to withdraw the staked credits to when unbond_public is called.*
__amount__ | `number` | *The amount of credits to bond*
__options__ | `Options` | *Options for the execution*
__*return*__ | `undefined` | *string*

#### Examples

```javascript
// Create a keyProvider to handle key management
const keyProvider = new AleoKeyProvider();
keyProvider.useCache = true;

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);
programManager.setAccount(new Account("YourPrivateKey"));

// Create the bonding transaction
const tx_id = await programManager.bondPublic("aleo1jx8s4dvjepculny4wfrzwyhs3tlyv65r58ns3g6q2gm2esh7ps8sqy9s5j", "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", "aleo1feya8sjy9k2zflvl2dx39pdsq5tju28elnp2ektnn588uu9ghv8s84msv9", 2000000);
```

---

### `buildBondValidatorTransaction(validator_address, withdrawal_address, amount, commission, options) ► `

![modifier: public](images/badges/modifier-public.svg)

Build a bond_validator transaction for later submission to the Aleo Network.

Parameters | Type | Description
--- | --- | ---
__validator_address__ | `string` | *Address of the validator to bond to, if this address is the same as the staker (i.e. the
executor of this function), it will attempt to bond the credits as a validator. Bonding as a validator currently
requires a minimum of 10,000,000 credits to bond (subject to change). If the address is specified is an existing
validator and is different from the address of the executor of this function, it will bond the credits to that
validator&#x27;s staking committee as a delegator. A minimum of 10 credits is required to bond as a delegator.*
__withdrawal_address__ | `string` | *Address to withdraw the staked credits to when unbond_public is called.*
__amount__ | `number` | *The amount of credits to bond*
__commission__ | `number` | *The commission rate for the validator (must be between 0 and 100 - an error will be thrown if it is not)*
__options__ | `Partial.<ExecuteOptions>` | *Override default execution options.*
__*return*__ | `undefined` | *string*

#### Examples

```javascript
// Create a keyProvider to handle key management
const keyProvider = new AleoKeyProvider();
keyProvider.useCache = true;

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);
programManager.setAccount(new Account("YourPrivateKey"));

// Create the bond validator transaction object for later use.
const tx = await programManager.buildBondValidatorTransaction("aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", "aleo1feya8sjy9k2zflvl2dx39pdsq5tju28elnp2ektnn588uu9ghv8s84msv9", 2000000);
console.log(tx);

// The transaction can later be submitted to the network using the network client.
const tx_id = await programManager.networkClient.submitTransaction(tx);
```

---

### `bondValidator(validator_address, withdrawal_address, amount, commission, options) ► `

![modifier: public](images/badges/modifier-public.svg)

Build transaction to bond a validator.

Parameters | Type | Description
--- | --- | ---
__validator_address__ | `string` | *Address of the validator to bond to, if this address is the same as the staker (i.e. the
executor of this function), it will attempt to bond the credits as a validator. Bonding as a validator currently
requires a minimum of 10,000,000 credits to bond (subject to change). If the address is specified is an existing
validator and is different from the address of the executor of this function, it will bond the credits to that
validator&#x27;s staking committee as a delegator. A minimum of 10 credits is required to bond as a delegator.*
__withdrawal_address__ | `string` | *Address to withdraw the staked credits to when unbond_public is called.*
__amount__ | `number` | *The amount of credits to bond*
__commission__ | `number` | *The commission rate for the validator (must be between 0 and 100 - an error will be thrown if it is not)*
__options__ | `Partial.<ExecuteOptions>` | *Override default execution options.*
__*return*__ | `undefined` | *string*

#### Examples

```javascript
// Create a keyProvider to handle key management
const keyProvider = new AleoKeyProvider();
keyProvider.useCache = true;

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);
programManager.setAccount(new Account("YourPrivateKey"));

// Create the bonding transaction
const tx_id = await programManager.bondValidator("aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", "aleo1feya8sjy9k2zflvl2dx39pdsq5tju28elnp2ektnn588uu9ghv8s84msv9", 2000000);
```

---

### `buildUnbondPublicTransaction(staker_address, amount, options) ► Promise.<Transaction>`

![modifier: public](images/badges/modifier-public.svg)

Build a transaction to unbond public credits from a validator in the Aleo network.

Parameters | Type | Description
--- | --- | ---
__staker_address__ | `string` | *The address of the staker who is unbonding the credits.*
__amount__ | `number` | *The amount of credits to unbond (scaled by 1,000,000).*
__options__ | `Partial.<ExecuteOptions>` | *Override default execution options.*
__*return*__ | `Promise.<Transaction>` | *- A promise that resolves to the transaction or an error message.*

#### Examples

```javascript
// Create a keyProvider to handle key management.
const keyProvider = new AleoKeyProvider();
keyProvider.useCache = true;

// Create a new ProgramManager with the key that will be used to unbond credits.
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);
const tx = await programManager.buildUnbondPublicTransaction("aleo1jx8s4dvjepculny4wfrzwyhs3tlyv65r58ns3g6q2gm2esh7ps8sqy9s5j", 2000000);
console.log(tx);

// The transaction can be submitted later to the network using the network client.
programManager.networkClient.submitTransaction(tx);
```

---

### `unbondPublic(staker_address, amount, options) ► `

![modifier: public](images/badges/modifier-public.svg)

Unbond a specified amount of staked credits.

Parameters | Type | Description
--- | --- | ---
__staker_address__ | `string` | *Address of the staker who is unbonding the credits*
__amount__ | `number` | *Amount of credits to unbond. If the address of the executor of this function is an
existing validator, it will subtract this amount of credits from the validator&#x27;s staked credits. If there are
less than 1,000,000 credits staked pool after the unbond, the validator will be removed from the validator set.
If the address of the executor of this function is not a validator and has credits bonded as a delegator, it will
subtract this amount of credits from the delegator&#x27;s staked credits. If there are less than 10 credits bonded
after the unbond operation, the delegator will be removed from the validator&#x27;s staking pool.*
__options__ | `ExecuteOptions` | *Options for the execution*
__*return*__ | `undefined` | *string*

#### Examples

```javascript
// Create a keyProvider to handle key management
const keyProvider = new AleoKeyProvider();
keyProvider.useCache = true;

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);
programManager.setAccount(new Account("YourPrivateKey"));

// Create the bonding transaction and send it to the network
const tx_id = await programManager.unbondPublic("aleo1jx8s4dvjepculny4wfrzwyhs3tlyv65r58ns3g6q2gm2esh7ps8sqy9s5j", 10);
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
// Create a keyProvider to handle key management
const keyProvider = new AleoKeyProvider();
keyProvider.useCache = true;

// Create a new ProgramManager with the key that will be used to claim unbonded credits.
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);

// Create the claim unbonded transaction object for later use.
const tx = await programManager.buildClaimUnbondPublicTransaction("aleo1jx8s4dvjepculny4wfrzwyhs3tlyv65r58ns3g6q2gm2esh7ps8sqy9s5j");
console.log(tx);

// The transaction can be submitted later to the network using the network client.
programManager.networkClient.submitTransaction(tx);
```

---

### `claimUnbondPublic(staker_address, options) ► `

![modifier: public](images/badges/modifier-public.svg)

Claim unbonded credits. If credits have been unbonded by the account executing this function, this method will
claim them and add them to the public balance of the account.

Parameters | Type | Description
--- | --- | ---
__staker_address__ | `string` | *Address of the staker who is claiming the credits*
__options__ | `ExecuteOptions` | **
__*return*__ | `undefined` | *string*

#### Examples

```javascript
// Create a keyProvider to handle key management
const keyProvider = new AleoKeyProvider();
keyProvider.useCache = true;

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);
programManager.setAccount(new Account("YourPrivateKey"));

// Create the bonding transaction
const tx_id = await programManager.claimUnbondPublic("aleo1jx8s4dvjepculny4wfrzwyhs3tlyv65r58ns3g6q2gm2esh7ps8sqy9s5j");
```

---

### `buildSetValidatorStateTransaction(validator_state, options) ► `

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
__*return*__ | `undefined` | *string*

#### Examples

```javascript
// Create a keyProvider to handle key management
const keyProvider = new AleoKeyProvider();
keyProvider.useCache = true;

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);
programManager.setAccount(new Account("ValidatorPrivateKey"));

// Create the bonding transaction
const tx = await programManager.buildSetValidatorStateTransaction(true);

// The transaction can be submitted later to the network using the network client.
programManager.networkClient.submitTransaction(tx);
```

---

### `setValidatorState(validator_state, options) ► `

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
__*return*__ | `undefined` | *string*

#### Examples

```javascript
// Create a keyProvider to handle key management
const keyProvider = new AleoKeyProvider();
keyProvider.useCache = true;

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);
programManager.setAccount(new Account("ValidatorPrivateKey"));

// Create the bonding transaction
const tx_id = await programManager.setValidatorState(true);
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

### `deploy(program, fee, privateFee, recordSearchParams, feeRecord, privateKey) ► string`

![modifier: public](images/badges/modifier-public.svg)

Deploy an Aleo program to the Aleo network

Parameters | Type | Description
--- | --- | ---
__program__ | `string` | *Program source code*
__fee__ | `number` | *Fee to pay for the transaction*
__privateFee__ | `boolean` | *Use a private record to pay the fee. If false this will use the account&#x27;s public credit balance*
__recordSearchParams__ | `RecordSearchParams` | *Optional parameters for searching for a record to use
pay the deployment fee*
__feeRecord__ | `string` | *Optional Fee record to use for the transaction*
__privateKey__ | [PrivateKey](sdk-src_wasm.md) | *Optional private key to use for the transaction*
__*return*__ | `string` | *The transaction id of the deployed program or a failure message from the network*

#### Examples

```javascript
// Create a new NetworkClient, KeyProvider, and RecordProvider
const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);

// Initialize a program manager with the key provider to automatically fetch keys for deployments
const program = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);

// Define a fee in credits
const fee = 1.2;

// Deploy the program
const tx_id = await programManager.deploy(program, fee);

// Verify the transaction was successful
const transaction = await programManager.networkClient.getTransaction(tx_id);
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
// Create a new NetworkClient, KeyProvider, and RecordProvider using official Aleo record, key, and network providers
const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
const keyProvider = new AleoKeyProvider();
keyProvider.useCache = true;
const recordProvider = new NetworkRecordProvider(account, networkClient);

// Initialize a program manager with the key provider to automatically fetch keys for executions
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);

// Build and execute the transaction
const transaction = await programManager.buildExecutionTransaction({
  programName: "hello_hello.aleo",
  functionName: "hello_hello",
  fee: 0.020,
  privateFee: false,
  inputs: ["5u32", "5u32"],
  keySearchParams: { "cacheKey": "hello_hello:hello" }
});
const result = await programManager.networkClient.submitTransaction(transaction);
```

---

### `execute(options) ► Promise.<Transaction>`

![modifier: public](images/badges/modifier-public.svg)

Builds an execution transaction for submission to the Aleo network.

Parameters | Type | Description
--- | --- | ---
__options__ | `ExecuteOptions` | *The options for the execution transaction.*
__*return*__ | `Promise.<Transaction>` | *- A promise that resolves to the transaction or an error.*

#### Examples

```javascript
// Create a new NetworkClient, KeyProvider, and RecordProvider using official Aleo record, key, and network providers
const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
const keyProvider = new AleoKeyProvider();
keyProvider.useCache = true;
const recordProvider = new NetworkRecordProvider(account, networkClient);

// Initialize a program manager with the key provider to automatically fetch keys for executions
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);

// Build and execute the transaction
const transaction = await programManager.execute({
  programName: "hello_hello.aleo",
  functionName: "hello_hello",
  fee: 0.020,
  privateFee: false,
  inputs: ["5u32", "5u32"],
  keySearchParams: { "cacheKey": "hello_hello:hello" }
});
const result = await programManager.networkClient.submitTransaction(transaction);
```

---

### `run(program, function_name, inputs, proveExecution, imports, keySearchParams, provingKey, verifyingKey, privateKey, offlineQuery) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Run an Aleo program in offline mode

Parameters | Type | Description
--- | --- | ---
__program__ | `string` | *Program source code containing the function to be executed*
__function_name__ | `string` | *Function name to execute*
__inputs__ | `Array.<string>` | *Inputs to the function*
__proveExecution__ | `number` | *Whether to prove the execution of the function and return an execution transcript
that contains the proof.*
__imports__ | `Array.<string>` | *Optional imports to the program*
__keySearchParams__ | `KeySearchParams` | *Optional parameters for finding the matching proving &amp;
verifying keys for the function*
__provingKey__ | [ProvingKey](sdk-src_wasm.md) | *Optional proving key to use for the transaction*
__verifyingKey__ | [VerifyingKey](sdk-src_wasm.md) | *Optional verifying key to use for the transaction*
__privateKey__ | [PrivateKey](sdk-src_wasm.md) | *Optional private key to use for the transaction*
__offlineQuery__ | [OfflineQuery](sdk-src_wasm.md) | *Optional offline query if creating transactions in an offline environment*
__*return*__ | `Promise.<string>` | **

#### Examples

```javascript
import { Account, Program } from '@provablehq/sdk';

/// Create the source for the "helloworld" program
const program = "program helloworld.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
const programManager = new ProgramManager();

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
__recordSearchParams__ | `RecordSearchParams` | *Optional parameters for finding the fee record to use
to pay the fee for the join transaction*
__feeRecord__ | [RecordPlaintext](sdk-src_wasm.md) | *Fee record to use for the join transaction*
__privateKey__ | [PrivateKey](sdk-src_wasm.md) | *Private key to use for the join transaction*
__offlineQuery__ | [OfflineQuery](sdk-src_wasm.md) | *Optional offline query if creating transactions in an offline environment*
__*return*__ | `Promise.<string>` | **

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
__*return*__ | `Promise.<string>` | **

#### Examples

```javascript
// Create a new NetworkClient, KeyProvider, and RecordProvider
const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);

// Initialize a program manager with the key provider to automatically fetch keys for executions
const programName = "hello_hello.aleo";
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
const record = "{  owner: aleo184vuwr5u7u0ha5f5k44067dd2uaqewxx6pe5ltha5pv99wvhfqxqv339h4.private,  microcredits: 45000000u64.private,  _nonce: 4106205762862305308495708971985748592380064201230396559307556388725936304984group.public}"
const tx_id = await programManager.split(25000000, record);
const transaction = await programManager.networkClient.getTransaction(tx_id);
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

### `buildTransferTransaction(amount, recipient, transferType, fee, privateFee, recordSearchParams, amountRecord, feeRecord, privateKey, offlineQuery) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Build a transaction to transfer credits to another account for later submission to the Aleo network

Parameters | Type | Description
--- | --- | ---
__amount__ | `number` | *The amount of credits to transfer*
__recipient__ | `string` | *The recipient of the transfer*
__transferType__ | `string` | *The type of transfer to perform - options: &#x27;private&#x27;, &#x27;privateToPublic&#x27;, &#x27;public&#x27;, &#x27;publicToPrivate&#x27;*
__fee__ | `number` | *The fee to pay for the transfer*
__privateFee__ | `boolean` | *Use a private record to pay the fee. If false this will use the account&#x27;s public credit balance*
__recordSearchParams__ | `RecordSearchParams` | *Optional parameters for finding the amount and fee
records for the transfer transaction*
__amountRecord__ | [RecordPlaintext](sdk-src_wasm.md) | *Optional amount record to use for the transfer*
__feeRecord__ | [RecordPlaintext](sdk-src_wasm.md) | *Optional fee record to use for the transfer*
__privateKey__ | [PrivateKey](sdk-src_wasm.md) | *Optional private key to use for the transfer transaction*
__offlineQuery__ | [OfflineQuery](sdk-src_wasm.md) | *Optional offline query if creating transactions in an offline environment*
__*return*__ | `Promise.<string>` | *The transaction id of the transfer transaction*

#### Examples

```javascript
// Create a new NetworkClient, KeyProvider, and RecordProvider
const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);

// Initialize a program manager with the key provider to automatically fetch keys for executions
const programName = "hello_hello.aleo";
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
await programManager.initialize();
const tx_id = await programManager.transfer(1, "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", "private", 0.2)
const transaction = await programManager.networkClient.getTransaction(tx_id);
```

---

### `buildTransferPublicTransaction(amount, recipient, transferType, fee, privateFee, recordSearchParams, amountRecord, feeRecord, privateKey, offlineQuery) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Build a transfer_public transaction to transfer credits to another account for later submission to the Aleo network

Parameters | Type | Description
--- | --- | ---
__amount__ | `number` | *The amount of credits to transfer*
__recipient__ | `string` | *The recipient of the transfer*
__transferType__ | `string` | *The type of transfer to perform - options: &#x27;private&#x27;, &#x27;privateToPublic&#x27;, &#x27;public&#x27;, &#x27;publicToPrivate&#x27;*
__fee__ | `number` | *The fee to pay for the transfer*
__privateFee__ | `boolean` | *Use a private record to pay the fee. If false this will use the account&#x27;s public credit balance*
__recordSearchParams__ | `RecordSearchParams` | *Optional parameters for finding the amount and fee
records for the transfer transaction*
__amountRecord__ | [RecordPlaintext](sdk-src_wasm.md) | *Optional amount record to use for the transfer*
__feeRecord__ | [RecordPlaintext](sdk-src_wasm.md) | *Optional fee record to use for the transfer*
__privateKey__ | [PrivateKey](sdk-src_wasm.md) | *Optional private key to use for the transfer transaction*
__offlineQuery__ | [OfflineQuery](sdk-src_wasm.md) | *Optional offline query if creating transactions in an offline environment*
__*return*__ | `Promise.<string>` | *The transaction id of the transfer transaction*

---

### `buildTransferPublicAsSignerTransaction(amount, recipient, transferType, fee, privateFee, recordSearchParams, amountRecord, feeRecord, privateKey, offlineQuery) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Build a transfer_public_as_signer transaction to transfer credits to another account for later submission to the Aleo network

Parameters | Type | Description
--- | --- | ---
__amount__ | `number` | *The amount of credits to transfer*
__recipient__ | `string` | *The recipient of the transfer*
__transferType__ | `string` | *The type of transfer to perform - options: &#x27;private&#x27;, &#x27;privateToPublic&#x27;, &#x27;public&#x27;, &#x27;publicToPrivate&#x27;*
__fee__ | `number` | *The fee to pay for the transfer*
__privateFee__ | `boolean` | *Use a private record to pay the fee. If false this will use the account&#x27;s public credit balance*
__recordSearchParams__ | `RecordSearchParams` | *Optional parameters for finding the amount and fee
records for the transfer transaction*
__amountRecord__ | [RecordPlaintext](sdk-src_wasm.md) | *Optional amount record to use for the transfer*
__feeRecord__ | [RecordPlaintext](sdk-src_wasm.md) | *Optional fee record to use for the transfer*
__privateKey__ | [PrivateKey](sdk-src_wasm.md) | *Optional private key to use for the transfer transaction*
__offlineQuery__ | [OfflineQuery](sdk-src_wasm.md) | *Optional offline query if creating transactions in an offline environment*
__*return*__ | `Promise.<string>` | *The transaction id of the transfer transaction*

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
__recordSearchParams__ | `RecordSearchParams` | *Optional parameters for finding the amount and fee
records for the transfer transaction*
__amountRecord__ | [RecordPlaintext](sdk-src_wasm.md) | *Optional amount record to use for the transfer*
__feeRecord__ | [RecordPlaintext](sdk-src_wasm.md) | *Optional fee record to use for the transfer*
__privateKey__ | [PrivateKey](sdk-src_wasm.md) | *Optional private key to use for the transfer transaction*
__offlineQuery__ | [OfflineQuery](sdk-src_wasm.md) | *Optional offline query if creating transactions in an offline environment*
__*return*__ | `Promise.<string>` | *The transaction id of the transfer transaction*

#### Examples

```javascript
// Create a new NetworkClient, KeyProvider, and RecordProvider
const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);

// Initialize a program manager with the key provider to automatically fetch keys for executions
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
await programManager.initialize();
const tx_id = await programManager.transfer(1, "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", "private", 0.2)
const transaction = await programManager.networkClient.getTransaction(tx_id);
```

---

### `buildBondPublicTransaction(staker_address, validator_address, withdrawal_address, amount, options) ► `

![modifier: public](images/badges/modifier-public.svg)

Build transaction to bond credits to a validator for later submission to the Aleo Network

Parameters | Type | Description
--- | --- | ---
__staker_address__ | `string` | *Address of the staker who is bonding the credits*
__validator_address__ | `string` | *Address of the validator to bond to, if this address is the same as the staker (i.e. the
executor of this function), it will attempt to bond the credits as a validator. Bonding as a validator currently
requires a minimum of 10,000,000 credits to bond (subject to change). If the address is specified is an existing
validator and is different from the address of the executor of this function, it will bond the credits to that
validator&#x27;s staking committee as a delegator. A minimum of 10 credits is required to bond as a delegator.*
__withdrawal_address__ | `string` | *Address to withdraw the staked credits to when unbond_public is called.*
__amount__ | `number` | *The amount of credits to bond*
__options__ | `Partial.<ExecuteOptions>` | *Override default execution options.*
__*return*__ | `undefined` | *string*

#### Examples

```javascript
// Create a keyProvider to handle key management
const keyProvider = new AleoKeyProvider();
keyProvider.useCache = true;

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);
programManager.setAccount(new Account("YourPrivateKey"));

// Create the bonding transaction object for later submission
const tx = await programManager.buildBondPublicTransaction("aleo1jx8s4dvjepculny4wfrzwyhs3tlyv65r58ns3g6q2gm2esh7ps8sqy9s5j", "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", "aleo1feya8sjy9k2zflvl2dx39pdsq5tju28elnp2ektnn588uu9ghv8s84msv9", 2000000);
console.log(tx);

// The transaction can be later submitted to the network using the network client.
const result = await programManager.networkClient.submitTransaction(tx);
```

---

### `bondPublic(staker_address, validator_address, withdrawal_address, amount, options) ► `

![modifier: public](images/badges/modifier-public.svg)

Bond credits to validator.

Parameters | Type | Description
--- | --- | ---
__staker_address__ | `string` | *Address of the staker who is bonding the credits*
__validator_address__ | `string` | *Address of the validator to bond to, if this address is the same as the signer (i.e. the
executor of this function), it will attempt to bond the credits as a validator. Bonding as a validator currently
requires a minimum of 1,000,000 credits to bond (subject to change). If the address is specified is an existing
validator and is different from the address of the executor of this function, it will bond the credits to that
validator&#x27;s staking committee as a delegator. A minimum of 10 credits is required to bond as a delegator.*
__withdrawal_address__ | `string` | *Address to withdraw the staked credits to when unbond_public is called.*
__amount__ | `number` | *The amount of credits to bond*
__options__ | `Options` | *Options for the execution*
__*return*__ | `undefined` | *string*

#### Examples

```javascript
// Create a keyProvider to handle key management
const keyProvider = new AleoKeyProvider();
keyProvider.useCache = true;

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);
programManager.setAccount(new Account("YourPrivateKey"));

// Create the bonding transaction
const tx_id = await programManager.bondPublic("aleo1jx8s4dvjepculny4wfrzwyhs3tlyv65r58ns3g6q2gm2esh7ps8sqy9s5j", "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", "aleo1feya8sjy9k2zflvl2dx39pdsq5tju28elnp2ektnn588uu9ghv8s84msv9", 2000000);
```

---

### `buildBondValidatorTransaction(validator_address, withdrawal_address, amount, commission, options) ► `

![modifier: public](images/badges/modifier-public.svg)

Build a bond_validator transaction for later submission to the Aleo Network.

Parameters | Type | Description
--- | --- | ---
__validator_address__ | `string` | *Address of the validator to bond to, if this address is the same as the staker (i.e. the
executor of this function), it will attempt to bond the credits as a validator. Bonding as a validator currently
requires a minimum of 10,000,000 credits to bond (subject to change). If the address is specified is an existing
validator and is different from the address of the executor of this function, it will bond the credits to that
validator&#x27;s staking committee as a delegator. A minimum of 10 credits is required to bond as a delegator.*
__withdrawal_address__ | `string` | *Address to withdraw the staked credits to when unbond_public is called.*
__amount__ | `number` | *The amount of credits to bond*
__commission__ | `number` | *The commission rate for the validator (must be between 0 and 100 - an error will be thrown if it is not)*
__options__ | `Partial.<ExecuteOptions>` | *Override default execution options.*
__*return*__ | `undefined` | *string*

#### Examples

```javascript
// Create a keyProvider to handle key management
const keyProvider = new AleoKeyProvider();
keyProvider.useCache = true;

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);
programManager.setAccount(new Account("YourPrivateKey"));

// Create the bond validator transaction object for later use.
const tx = await programManager.buildBondValidatorTransaction("aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", "aleo1feya8sjy9k2zflvl2dx39pdsq5tju28elnp2ektnn588uu9ghv8s84msv9", 2000000);
console.log(tx);

// The transaction can later be submitted to the network using the network client.
const tx_id = await programManager.networkClient.submitTransaction(tx);
```

---

### `bondValidator(validator_address, withdrawal_address, amount, commission, options) ► `

![modifier: public](images/badges/modifier-public.svg)

Build transaction to bond a validator.

Parameters | Type | Description
--- | --- | ---
__validator_address__ | `string` | *Address of the validator to bond to, if this address is the same as the staker (i.e. the
executor of this function), it will attempt to bond the credits as a validator. Bonding as a validator currently
requires a minimum of 10,000,000 credits to bond (subject to change). If the address is specified is an existing
validator and is different from the address of the executor of this function, it will bond the credits to that
validator&#x27;s staking committee as a delegator. A minimum of 10 credits is required to bond as a delegator.*
__withdrawal_address__ | `string` | *Address to withdraw the staked credits to when unbond_public is called.*
__amount__ | `number` | *The amount of credits to bond*
__commission__ | `number` | *The commission rate for the validator (must be between 0 and 100 - an error will be thrown if it is not)*
__options__ | `Partial.<ExecuteOptions>` | *Override default execution options.*
__*return*__ | `undefined` | *string*

#### Examples

```javascript
// Create a keyProvider to handle key management
const keyProvider = new AleoKeyProvider();
keyProvider.useCache = true;

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);
programManager.setAccount(new Account("YourPrivateKey"));

// Create the bonding transaction
const tx_id = await programManager.bondValidator("aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", "aleo1feya8sjy9k2zflvl2dx39pdsq5tju28elnp2ektnn588uu9ghv8s84msv9", 2000000);
```

---

### `buildUnbondPublicTransaction(staker_address, amount, options) ► Promise.<Transaction>`

![modifier: public](images/badges/modifier-public.svg)

Build a transaction to unbond public credits from a validator in the Aleo network.

Parameters | Type | Description
--- | --- | ---
__staker_address__ | `string` | *The address of the staker who is unbonding the credits.*
__amount__ | `number` | *The amount of credits to unbond (scaled by 1,000,000).*
__options__ | `Partial.<ExecuteOptions>` | *Override default execution options.*
__*return*__ | `Promise.<Transaction>` | *- A promise that resolves to the transaction or an error message.*

#### Examples

```javascript
// Create a keyProvider to handle key management.
const keyProvider = new AleoKeyProvider();
keyProvider.useCache = true;

// Create a new ProgramManager with the key that will be used to unbond credits.
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);
const tx = await programManager.buildUnbondPublicTransaction("aleo1jx8s4dvjepculny4wfrzwyhs3tlyv65r58ns3g6q2gm2esh7ps8sqy9s5j", 2000000);
console.log(tx);

// The transaction can be submitted later to the network using the network client.
programManager.networkClient.submitTransaction(tx);
```

---

### `unbondPublic(staker_address, amount, options) ► `

![modifier: public](images/badges/modifier-public.svg)

Unbond a specified amount of staked credits.

Parameters | Type | Description
--- | --- | ---
__staker_address__ | `string` | *Address of the staker who is unbonding the credits*
__amount__ | `number` | *Amount of credits to unbond. If the address of the executor of this function is an
existing validator, it will subtract this amount of credits from the validator&#x27;s staked credits. If there are
less than 1,000,000 credits staked pool after the unbond, the validator will be removed from the validator set.
If the address of the executor of this function is not a validator and has credits bonded as a delegator, it will
subtract this amount of credits from the delegator&#x27;s staked credits. If there are less than 10 credits bonded
after the unbond operation, the delegator will be removed from the validator&#x27;s staking pool.*
__options__ | `ExecuteOptions` | *Options for the execution*
__*return*__ | `undefined` | *string*

#### Examples

```javascript
// Create a keyProvider to handle key management
const keyProvider = new AleoKeyProvider();
keyProvider.useCache = true;

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);
programManager.setAccount(new Account("YourPrivateKey"));

// Create the bonding transaction and send it to the network
const tx_id = await programManager.unbondPublic("aleo1jx8s4dvjepculny4wfrzwyhs3tlyv65r58ns3g6q2gm2esh7ps8sqy9s5j", 10);
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
// Create a keyProvider to handle key management
const keyProvider = new AleoKeyProvider();
keyProvider.useCache = true;

// Create a new ProgramManager with the key that will be used to claim unbonded credits.
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);

// Create the claim unbonded transaction object for later use.
const tx = await programManager.buildClaimUnbondPublicTransaction("aleo1jx8s4dvjepculny4wfrzwyhs3tlyv65r58ns3g6q2gm2esh7ps8sqy9s5j");
console.log(tx);

// The transaction can be submitted later to the network using the network client.
programManager.networkClient.submitTransaction(tx);
```

---

### `claimUnbondPublic(staker_address, options) ► `

![modifier: public](images/badges/modifier-public.svg)

Claim unbonded credits. If credits have been unbonded by the account executing this function, this method will
claim them and add them to the public balance of the account.

Parameters | Type | Description
--- | --- | ---
__staker_address__ | `string` | *Address of the staker who is claiming the credits*
__options__ | `ExecuteOptions` | **
__*return*__ | `undefined` | *string*

#### Examples

```javascript
// Create a keyProvider to handle key management
const keyProvider = new AleoKeyProvider();
keyProvider.useCache = true;

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);
programManager.setAccount(new Account("YourPrivateKey"));

// Create the bonding transaction
const tx_id = await programManager.claimUnbondPublic("aleo1jx8s4dvjepculny4wfrzwyhs3tlyv65r58ns3g6q2gm2esh7ps8sqy9s5j");
```

---

### `buildSetValidatorStateTransaction(validator_state, options) ► `

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
__*return*__ | `undefined` | *string*

#### Examples

```javascript
// Create a keyProvider to handle key management
const keyProvider = new AleoKeyProvider();
keyProvider.useCache = true;

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);
programManager.setAccount(new Account("ValidatorPrivateKey"));

// Create the bonding transaction
const tx = await programManager.buildSetValidatorStateTransaction(true);

// The transaction can be submitted later to the network using the network client.
programManager.networkClient.submitTransaction(tx);
```

---

### `setValidatorState(validator_state, options) ► `

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
__*return*__ | `undefined` | *string*

#### Examples

```javascript
// Create a keyProvider to handle key management
const keyProvider = new AleoKeyProvider();
keyProvider.useCache = true;

// Create a new ProgramManager with the key that will be used to bond credits
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);
programManager.setAccount(new Account("ValidatorPrivateKey"));

// Create the bonding transaction
const tx_id = await programManager.setValidatorState(true);
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
