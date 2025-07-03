# Module `src/network-client`

![category:other](https://img.shields.io/badge/category-other-blue.svg?style=flat-square)



[Source file](../../sdk/src/network-client.ts)

# Class `AleoNetworkClient`

Client library that encapsulates REST calls to publicly exposed endpoints of Aleo nodes. The methods provided in this
allow users to query public information from the Aleo blockchain and submit transactions to the network.

## Examples

```javascript
// Connection to a local node.
const localNetworkClient = new AleoNetworkClient("http://0.0.0.0:3030", undefined, account);

// Connection to a public beacon node
const account = Account.fromCiphertext(process.env.ciphertext, process.env.password);
const publicNetworkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined, account);
```

## Methods

### `setAccount(account)`

![modifier: public](images/badges/modifier-public.svg)

Set an account to use in networkClient calls

Parameters | Type | Description
--- | --- | ---
__account__ | [Account](sdk-src_account.md) | *Set an account to use for record scanning functions.*

#### Examples

```javascript
import { Account, AleoNetworkClient } from "@provablehq/sdk/mainnet.js";

const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1");
const account = new Account();
networkClient.setAccount(account);
```

---

### `getAccount()`

![modifier: public](images/badges/modifier-public.svg)

Return the Aleo account used in the networkClient

#### Examples

```javascript
const account = networkClient.getAccount();
```

---

### `setHost(host, host)`

![modifier: public](images/badges/modifier-public.svg)

Set a new host for the networkClient

Parameters | Type | Description
--- | --- | ---
__host__ | `string` | *The address of a node hosting the Aleo API*
__host__ | `undefined` | **

#### Examples

```javascript
import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";

// Create a networkClient that connects to a local node.
const networkClient = new AleoNetworkClient("http://0.0.0.0:3030", undefined);

// Set the host to a public node.
networkClient.setHost("http://api.explorer.provable.com/v1");
```

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
import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";

// Create a networkClient
const networkClient = new AleoNetworkClient();

// Set the value of the `Accept-Language` header to `en-US`
networkClient.setHeader('Accept-Language', 'en-US');
```

---

### `fetchData(url)`

![modifier: public](images/badges/modifier-public.svg)

Fetches data from the Aleo network and returns it as a JSON object.

Parameters | Type | Description
--- | --- | ---
__url__ | `undefined` | *The URL to fetch data from.*

---

### `fetchRaw(url)`

![modifier: public](images/badges/modifier-public.svg)

Fetches data from the Aleo network and returns it as an unparsed string.

This method should be used when it is desired to reconstitute data returned
from the network into a WASM object.

Parameters | Type | Description
--- | --- | ---
__url__ | `undefined` | **

---

### `findRecords(startHeight, endHeight, unspent, programs, amounts, maxMicrocredits, nonces, privateKey) ► Promise.<Array.<RecordPlaintext>>`

![modifier: public](images/badges/modifier-public.svg)

Attempt to find records in the Aleo blockchain.

Parameters | Type | Description
--- | --- | ---
__startHeight__ | `number` | *The height at which to start searching for unspent records*
__endHeight__ | `number` | *The height at which to stop searching for unspent records*
__unspent__ | `boolean` | *Whether to search for unspent records only*
__programs__ | `Array.<string>` | *The program(s) to search for unspent records in*
__amounts__ | `Array.<number>` | *The amounts (in microcredits) to search for (eg. [100, 200, 3000])*
__maxMicrocredits__ | `number` | *The maximum number of microcredits to search for*
__nonces__ | `Array.<string>` | *The nonces of already found records to exclude from the search*
__privateKey__ | `string` | *An optional private key to use to find unspent records.*
__*return*__ | `Promise.<Array.<RecordPlaintext>>` | *An array of records belonging to the account configured in the network client.*

#### Examples

```javascript
import { Account, AleoNetworkClient } from "@provablehq/sdk/mainnet.js";

// Import an account from a ciphertext and password.
const account = Account.fromCiphertext(process.env.ciphertext, process.env.password);

// Create a network client.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
networkClient.setAccount(account);

// Find specific amounts
const startHeight = 500000;
const amounts = [600000, 1000000];
const records = networkClient.findRecords(startHeight, undefined, true, ["credits.aleo"] amounts);

// Find specific amounts with a maximum number of cumulative microcredits
const maxMicrocredits = 100000;
const records = networkClient.findRecords(startHeight, undefined, true, ["credits.aleo"] undefined, maxMicrocredits);
```

---

### `findUnspentRecords(startHeight, endHeight, programs, amounts, maxMicrocredits, nonces, privateKey) ► Promise.<Array.<RecordPlaintext>>`

![modifier: public](images/badges/modifier-public.svg)

Attempts to find unspent records in the Aleo blockchain.

Parameters | Type | Description
--- | --- | ---
__startHeight__ | `number` | *The height at which to start searching for unspent records*
__endHeight__ | `number` | *The height at which to stop searching for unspent records*
__programs__ | `Array.<string>` | *The program(s) to search for unspent records in*
__amounts__ | `Array.<number>` | *The amounts (in microcredits) to search for (eg. [100, 200, 3000])*
__maxMicrocredits__ | `number` | *The maximum number of microcredits to search for*
__nonces__ | `Array.<string>` | *The nonces of already found records to exclude from the search*
__privateKey__ | `string` | *An optional private key to use to find unspent records.*
__*return*__ | `Promise.<Array.<RecordPlaintext>>` | *An array of unspent records belonging to the account configured in the network client.*

#### Examples

```javascript
import { Account, AleoNetworkClient } from "@provablehq/sdk/mainnet.js";

const account = Account.fromCiphertext(process.env.ciphertext, process.env.password);

// Create a network client and set an account to search for records with.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
networkClient.setAccount(account);

// Find specific amounts
const startHeight = 500000;
const endHeight = 550000;
const amounts = [600000, 1000000];
const records = networkClient.findUnspentRecords(startHeight, endHeight, ["credits.aleo"], amounts);

// Find specific amounts with a maximum number of cumulative microcredits
const maxMicrocredits = 100000;
const records = networkClient.findUnspentRecords(startHeight, undefined, ["credits.aleo"], undefined, maxMicrocredits);
```

---

### `getBlock(blockHeight) ► Promise.<BlockJSON>`

![modifier: public](images/badges/modifier-public.svg)

Returns the contents of the block at the specified block height.

Parameters | Type | Description
--- | --- | ---
__blockHeight__ | `number` | *The height of the block to fetch*
__*return*__ | `Promise.<BlockJSON>` | *A javascript object containing the block at the specified height*

#### Examples

```javascript
const block = networkClient.getBlock(1234);
```

---

### `getBlockByHash(blockHash) ► Promise.<BlockJSON>`

![modifier: public](images/badges/modifier-public.svg)

Returns the contents of the block with the specified hash.

Parameters | Type | Description
--- | --- | ---
__blockHash__ | `string` | *The hash of the block to fetch.*
__*return*__ | `Promise.<BlockJSON>` | *A javascript object representation of the block matching the hash.*

#### Examples

```javascript
import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";

const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
const block = networkClient.getBlockByHash("ab19dklwl9vp63zu3hwg57wyhvmqf92fx5g8x0t6dr72py8r87pxupqfne5t9");
```

---

### `getBlockRange(start, end) ► Promise.<Array.<BlockJSON>>`

![modifier: public](images/badges/modifier-public.svg)

Returns a range of blocks between the specified block heights. A maximum of 50 blocks can be fetched at a time.

Parameters | Type | Description
--- | --- | ---
__start__ | `number` | *Starting block to fetch.*
__end__ | `number` | *Ending block to fetch. This cannot be more than 50 blocks ahead of the start block.*
__*return*__ | `Promise.<Array.<BlockJSON>>` | *An array of block objects*

#### Examples

```javascript
import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";

// Fetch 50 blocks.
const (start, end) = (2050, 2100);
const blockRange = networkClient.getBlockRange(start, end);

let cursor = start;
blockRange.forEach((block) => {
  assert(block.height == cursor);
  cursor += 1;
 }
```

---

### `getDeploymentTransactionIDForProgram(program) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Returns the deployment transaction id associated with the specified program.

Parameters | Type | Description
--- | --- | ---
__program__ | [Program](sdk-src_wasm.md) | *The name of the deployed program OR a wasm Program object.*
__*return*__ | `Promise.<string>` | *The transaction ID of the deployment transaction.*

#### Examples

```javascript
import { AleoNetworkClient } from "@provablehq/sdk/testnet.js";

// Get the transaction ID of the deployment transaction for a program.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
const transactionId = networkClient.getDeploymentTransactionIDForProgram("hello_hello.aleo");

// Get the transaction data for the deployment transaction.
const transaction = networkClient.getTransactionObject(transactionId);

// Get the verifying keys for the functions in the deployed program.
const verifyingKeys = transaction.verifyingKeys();
```

---

### `getDeploymentTransactionForProgram(program) ► Promise.<Transaction>`

![modifier: public](images/badges/modifier-public.svg)

Returns the deployment transaction associated with a specified program as a JSON object.

Parameters | Type | Description
--- | --- | ---
__program__ | [Program](sdk-src_wasm.md) | *The name of the deployed program OR a wasm Program object.*
__*return*__ | `Promise.<Transaction>` | *JSON representation of the deployment transaction.*

#### Examples

```javascript
import { AleoNetworkClient, DeploymentJSON } from "@provablehq/sdk/testnet.js";

// Get the transaction ID of the deployment transaction for a program.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
const transaction = networkClient.getDeploymentTransactionForProgram("hello_hello.aleo");

// Get the verifying keys for each function in the deployment.
const deployment = <DeploymentJSON>transaction.deployment;
const verifyingKeys = deployment.verifying_keys;
```

---

### `getDeploymentTransactionObjectForProgram(program) ► Promise.<Transaction>`

![modifier: public](images/badges/modifier-public.svg)

Returns the deployment transaction associated with a specified program as a wasm object.

Parameters | Type | Description
--- | --- | ---
__program__ | [Program](sdk-src_wasm.md) | *The name of the deployed program OR a wasm Program object.*
__*return*__ | `Promise.<Transaction>` | *Wasm object representation of the deployment transaction.*

#### Examples

```javascript
import { AleoNetworkClient } from "@provablehq/sdk/testnet.js";

// Get the transaction ID of the deployment transaction for a program.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
const transactionId = networkClient.getDeploymentTransactionIDForProgram("hello_hello.aleo");

// Get the transaction data for the deployment transaction.
const transaction = networkClient.getDeploymentTransactionObjectForProgram(transactionId);

// Get the verifying keys for the functions in the deployed program.
const verifyingKeys = transaction.verifyingKeys();
```

---

### `getLatestBlock() ► Promise.<BlockJSON>`

![modifier: public](images/badges/modifier-public.svg)

Returns the contents of the latest block as JSON.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<BlockJSON>` | *A javascript object containing the latest block*

#### Examples

```javascript
import { AleoNetworkClient } from "@provablehq/sdk/testnet.js";

// Create a network client.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);

const latestHeight = networkClient.getLatestBlock();
```

---

### `getLatestCommittee() ► Promise.<object>`

![modifier: public](images/badges/modifier-public.svg)

Returns the latest committee.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<object>` | *A javascript object containing the latest committee*

#### Examples

```javascript
import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";

// Create a network client.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);

// Create a network client and get the latest committee.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
const latestCommittee = await networkClient.getLatestCommittee();
```

---

### `getCommitteeByBlockHeight(blockHeight) ► Promise.<object>`

![modifier: public](images/badges/modifier-public.svg)

Returns the committee at the specified block height.

Parameters | Type | Description
--- | --- | ---
__blockHeight__ | `number` | *The height of the block to fetch the committee for*
__*return*__ | `Promise.<object>` | *A javascript object containing the committee*

#### Examples

```javascript
import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";

// Create a network client.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);

// Create a network client and get the committee for a specific block.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
const committee = await networkClient.getCommitteeByBlockHeight(1234);
```

---

### `getLatestHeight() ► Promise.<number>`

![modifier: public](images/badges/modifier-public.svg)

Returns the latest block height.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<number>` | *The latest block height.*

#### Examples

```javascript
import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";

// Create a network client.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);

const latestHeight = networkClient.getLatestHeight();
```

---

### `getLatestBlockHash() ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Returns the latest block hash.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<string>` | *The latest block hash.*

#### Examples

```javascript
import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";

// Create a network client.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);

// Get the latest block hash.
const latestHash = networkClient.getLatestBlockHash();
```

---

### `getProgram(programId) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Returns the source code of a program given a program ID.

Parameters | Type | Description
--- | --- | ---
__programId__ | `string` | *The program ID of a program deployed to the Aleo Network*
__*return*__ | `Promise.<string>` | *Source code of the program*

#### Examples

```javascript
import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";

// Create a network client.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);

const program = networkClient.getProgram("hello_hello.aleo");
const expectedSource = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n"
assert.equal(program, expectedSource);
```

---

### `getProgramObject(inputProgram) ► Promise.<Program>`

![modifier: public](images/badges/modifier-public.svg)

Returns a program object from a program ID or program source code.

Parameters | Type | Description
--- | --- | ---
__inputProgram__ | `string` | *The program ID or program source code of a program deployed to the Aleo Network*
__*return*__ | `Promise.<Program>` | *Source code of the program*

#### Examples

```javascript
import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";

// Create a network client.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);

const programID = "hello_hello.aleo";
const programSource = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n"

// Get program object from program ID or program source code
const programObjectFromID = await networkClient.getProgramObject(programID);
const programObjectFromSource = await networkClient.getProgramObject(programSource);

// Both program objects should be equal
assert(programObjectFromID.to_string() === programObjectFromSource.to_string());
```

---

### `getProgramImports(inputProgram) ► Promise.<ProgramImports>`

![modifier: public](images/badges/modifier-public.svg)

Returns an object containing the source code of a program and the source code of all programs it imports

Parameters | Type | Description
--- | --- | ---
__inputProgram__ | [Program](sdk-src_wasm.md) | *The program ID or program source code of a program deployed to the Aleo Network*
__*return*__ | `Promise.<ProgramImports>` | *Object of the form { &quot;program_id&quot;: &quot;program_source&quot;, .. } containing program id &amp; source code for all program imports*

#### Examples

```javascript
import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";

const double_test_source = "import multiply_test.aleo;\n\nprogram double_test.aleo;\n\nfunction double_it:\n    input r0 as u32.private;\n    call multiply_test.aleo/multiply 2u32 r0 into r1;\n    output r1 as u32.private;\n"
const double_test = Program.fromString(double_test_source);
const expectedImports = {
    "multiply_test.aleo": "program multiply_test.aleo;\n\nfunction multiply:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    mul r0 r1 into r2;\n    output r2 as u32.private;\n"
}

// Create a network client.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);

// Imports can be fetched using the program ID, source code, or program object
let programImports = await networkClient.getProgramImports("double_test.aleo");
assert.deepStrictEqual(programImports, expectedImports);

// Using the program source code
programImports = await networkClient.getProgramImports(double_test_source);
assert.deepStrictEqual(programImports, expectedImports);

// Using the program object
programImports = await networkClient.getProgramImports(double_test);
assert.deepStrictEqual(programImports, expectedImports);
```

---

### `getProgramImportNames(inputProgram) ► Array.<string>`

![modifier: public](images/badges/modifier-public.svg)

Get a list of the program names that a program imports.

Parameters | Type | Description
--- | --- | ---
__inputProgram__ | [Program](sdk-src_wasm.md) | *The program id or program source code to get the imports of*
__*return*__ | `Array.<string>` | *- The list of program names that the program imports*

#### Examples

```javascript
import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";

// Create a network client.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);

const programImportsNames = networkClient.getProgramImports("wrapped_credits.aleo");
const expectedImportsNames = ["credits.aleo"];
assert.deepStrictEqual(programImportsNames, expectedImportsNames);
```

---

### `getProgramMappingNames(programId) ► Promise.<Array.<string>>`

![modifier: public](images/badges/modifier-public.svg)

Returns the names of the mappings of a program.

Parameters | Type | Description
--- | --- | ---
__programId__ | `string` | *The program ID to get the mappings of (e.g. &quot;credits.aleo&quot;)*
__*return*__ | `Promise.<Array.<string>>` | *- The names of the mappings of the program.*

#### Examples

```javascript
import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";

// Create a network client.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);

const mappings = networkClient.getProgramMappingNames("credits.aleo");
const expectedMappings = [
  "committee",
  "delegated",
  "metadata",
  "bonded",
  "unbonding",
  "account",
  "withdraw"
];
assert.deepStrictEqual(mappings, expectedMappings);
```

---

### `getProgramMappingValue(programId, mappingName, key) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Returns the value of a program&#x27;s mapping for a specific key.

Parameters | Type | Description
--- | --- | ---
__programId__ | `string` | *The program ID to get the mapping value of (e.g. &quot;credits.aleo&quot;)*
__mappingName__ | `string` | *The name of the mapping to get the value of (e.g. &quot;account&quot;)*
__key__ | `string` | *The key to look up in the mapping (e.g. an address for the &quot;account&quot; mapping)*
__*return*__ | `Promise.<string>` | *String representation of the value of the mapping*

#### Examples

```javascript
import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";

// Create a network client.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);

// Get public balance of an account
const mappingValue = networkClient.getMappingValue("credits.aleo", "account", "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px");
const expectedValue = "0u64";
assert(mappingValue === expectedValue);
```

---

### `getProgramMappingPlaintext(programId, mappingName, key) ► Promise.<Plaintext>`

![modifier: public](images/badges/modifier-public.svg)

Returns the value of a mapping as a wasm Plaintext object. Returning an object in this format allows it to be converted to a Js type and for its internal members to be inspected if it&#x27;s a struct or array.

Parameters | Type | Description
--- | --- | ---
__programId__ | `string` | *The program ID to get the mapping value of (e.g. &quot;credits.aleo&quot;)*
__mappingName__ | `string` | *The name of the mapping to get the value of (e.g. &quot;bonded&quot;)*
__key__ | `string` | *The key to look up in the mapping (e.g. an address for the &quot;bonded&quot; mapping)*
__*return*__ | `Promise.<Plaintext>` | *String representation of the value of the mapping*

#### Examples

```javascript
import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";

// Create a network client.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);

// Get the bond state as an account.
const unbondedState = networkClient.getMappingPlaintext("credits.aleo", "bonded", "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px");

// Get the two members of the object individually.
const validator = unbondedState.getMember("validator");
const microcredits = unbondedState.getMember("microcredits");

// Ensure the expected values are correct.
assert.equal(validator, "aleo1u6940v5m0fzud859xx2c9tj2gjg6m5qrd28n636e6fdd2akvfcgqs34mfd");
assert.equal(microcredits, BigInt("9007199254740991"));

// Get a JS object representation of the unbonded state.
const unbondedStateObject = unbondedState.toObject();

const expectedState = {
    validator: "aleo1u6940v5m0fzud859xx2c9tj2gjg6m5qrd28n636e6fdd2akvfcgqs34mfd",
    microcredits: BigInt(9007199254740991)
};
assert.equal(unbondedState, expectedState);
```

---

### `getPublicBalance(address) ► Promise.<number>`

![modifier: public](images/badges/modifier-public.svg)

Returns the public balance of an address from the account mapping in credits.aleo

Parameters | Type | Description
--- | --- | ---
__address__ | [Address](sdk-src_wasm.md) | *A string or wasm object representing an address.*
__*return*__ | `Promise.<number>` | *The public balance of the address in microcredits.*

#### Examples

```javascript
import { AleoNetworkClient, Account } from "@provablehq/sdk/mainnet.js";

// Create a network client.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);

// Get the balance of an account from either an address object or address string.
const account = Account.fromCiphertext(process.env.ciphertext, process.env.password);
const publicBalance = await networkClient.getPublicBalance(account.address());
const publicBalanceFromString = await networkClient.getPublicBalance(account.address().to_string());
assert(publicBalance === publicBalanceFromString);
```

---

### `getStateRoot() ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Returns the latest state/merkle root of the Aleo blockchain.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<string>` | *A string representing the latest state root of the Aleo blockchain.*

#### Examples

```javascript
import { AleoNetworkClient, Account } from "@provablehq/sdk/mainnet.js";

// Create a network client.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);

// Get the latest state root.
const stateRoot = networkClient.getStateRoot();
```

---

### `getTransaction(transactionId) ► Promise.<TransactionJSON>`

![modifier: public](images/badges/modifier-public.svg)

Returns a transaction by its unique identifier.

Parameters | Type | Description
--- | --- | ---
__transactionId__ | `string` | *The transaction ID to fetch.*
__*return*__ | `Promise.<TransactionJSON>` | *A json representation of the transaction.*

#### Examples

```javascript
import { AleoNetworkClient, Account } from "@provablehq/sdk/mainnet.js";

// Create a network client.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);

const transaction = networkClient.getTransaction("at1handz9xjrqeynjrr0xay4pcsgtnczdksz3e584vfsgaz0dh0lyxq43a4wj");
```

---

### `getConfirmedTransaction(transactionId) ► Promise.<ConfirmedTransactionJSON>`

![modifier: public](images/badges/modifier-public.svg)

Returns a confirmed transaction by its unique identifier.

Parameters | Type | Description
--- | --- | ---
__transactionId__ | `string` | *The transaction ID to fetch.*
__*return*__ | `Promise.<ConfirmedTransactionJSON>` | *A json object containing the confirmed transaction.*

#### Examples

```javascript
import { AleoNetworkClient, Account } from "@provablehq/sdk/mainnet.js";

// Create a network client.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);

const transaction = networkClient.getConfirmedTransaction("at1handz9xjrqeynjrr0xay4pcsgtnczdksz3e584vfsgaz0dh0lyxq43a4wj");
assert.equal(transaction.status, "confirmed");
```

---

### `getTransactionObject(transactionId) ► Promise.<Transaction>`

![modifier: public](images/badges/modifier-public.svg)

Returns a transaction as a wasm object. Getting a transaction of this type will allow the ability for the inputs,
outputs, and records to be searched for and displayed.

Parameters | Type | Description
--- | --- | ---
__transactionId__ | `string` | *The unique identifier of the transaction to fetch*
__*return*__ | `Promise.<Transaction>` | *A wasm object representation of the transaction.*

#### Examples

```javascript
const transactionObject = networkClient.getTransaction("at1handz9xjrqeynjrr0xay4pcsgtnczdksz3e584vfsgaz0dh0lyxq43a4wj");
// Get the transaction inputs as a JS array.
const transactionInputs = transactionObject.inputs(true);

// Get the transaction outputs as a JS object.
const transactionOutputs = transactionObject.outputs(true);

// Get any records generated in transitions in the transaction as a JS object.
const records = transactionObject.records();

// Get the transaction type.
const transactionType = transactionObject.transactionType();
assert.equal(transactionType, "Execute");

// Get a JS representation of all inputs, outputs, and transaction metadata.
const transactionSummary = transactionObject.summary();
```

---

### `getTransactions(blockHeight) ► Promise.<Array.<ConfirmedTransactionJSON>>`

![modifier: public](images/badges/modifier-public.svg)

Returns the transactions present at the specified block height.

Parameters | Type | Description
--- | --- | ---
__blockHeight__ | `number` | *The block height to fetch the confirmed transactions at.*
__*return*__ | `Promise.<Array.<ConfirmedTransactionJSON>>` | *An array of confirmed transactions (in JSON format) for the block height.*

#### Examples

```javascript
import { AleoNetworkClient, Account } from "@provablehq/sdk/mainnet.js";

// Create a network client.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);

const transactions = networkClient.getTransactions(654);
```

---

### `getTransactionsByBlockHash(blockHash) ► Promise.<Array.<ConfirmedTransactionJSON>>`

![modifier: public](images/badges/modifier-public.svg)

Returns the confirmed transactions present in the block with the specified block hash.

Parameters | Type | Description
--- | --- | ---
__blockHash__ | `string` | *The block hash to fetch the confirmed transactions at.*
__*return*__ | `Promise.<Array.<ConfirmedTransactionJSON>>` | *An array of confirmed transactions (in JSON format) for the block hash.*

#### Examples

```javascript
import { AleoNetworkClient, Account } from "@provablehq/sdk/mainnet.js";

// Create a network client.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);

const transactions = networkClient.getTransactionsByBlockHash("ab19dklwl9vp63zu3hwg57wyhvmqf92fx5g8x0t6dr72py8r87pxupqfne5t9");
```

---

### `getTransactionsInMempool() ► Promise.<Array.<TransactionJSON>>`

![modifier: public](images/badges/modifier-public.svg)

Returns the transactions in the memory pool. This method requires access to a validator&#x27;s REST API.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<Array.<TransactionJSON>>` | *An array of transactions (in JSON format) currently in the mempool.*

#### Examples

```javascript
import { AleoNetworkClient, Account } from "@provablehq/sdk/mainnet.js";

// Create a network client.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);

// Get the current transactions in the mempool.
const transactions = networkClient.getTransactionsInMempool();
```

---

### `getTransitionId(inputOrOutputID) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Returns the transition ID of the transition corresponding to the ID of the input or output.

Parameters | Type | Description
--- | --- | ---
__inputOrOutputID__ | `string` | *The unique identifier of the input or output to find the transition ID for*
__*return*__ | `Promise.<string>` | *- The transition ID of the input or output ID.*

#### Examples

```javascript
const transitionId = networkClient.getTransitionId("2429232855236830926144356377868449890830704336664550203176918782554219952323field");
```

---

### `submitTransaction(transaction) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Submit an execute or deployment transaction to the Aleo network.

Parameters | Type | Description
--- | --- | ---
__transaction__ | [Transaction](sdk-src_wasm.md) | *The transaction to submit, either as a Transaction object or string representation*
__*return*__ | `Promise.<string>` | *- The transaction id of the submitted transaction or the resulting error*

---

### `submitSolution(solution) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Submit a solution to the Aleo network.

Parameters | Type | Description
--- | --- | ---
__solution__ | `string` | *The string representation of the solution to submit*
__*return*__ | `Promise.<string>` | *The solution id of the submitted solution or the resulting error.*

---

### `waitForTransactionConfirmation(transactionId, checkInterval, timeout) ► Promise.<Transaction>`

![modifier: public](images/badges/modifier-public.svg)

Await a submitted transaction to be confirmed or rejected on the Aleo network.

Parameters | Type | Description
--- | --- | ---
__transactionId__ | `string` | *The transaction ID to wait for confirmation*
__checkInterval__ | `number` | *The interval in milliseconds to check for confirmation (default: 2000)*
__timeout__ | `number` | *The maximum time in milliseconds to wait for confirmation (default: 45000)*
__*return*__ | `Promise.<Transaction>` | *The confirmed transaction object that returns if the transaction is confirmed.*

#### Examples

```javascript
import { AleoNetworkClient, Account, ProgramManager } from "@provablehq/sdk/mainnet.js";

// Create a network client and program manager.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
const programManager = new ProgramManager(networkClient);

// Set the account for the program manager.
programManager.setAccount(Account.fromCiphertext(process.env.ciphertext, process.env.password));

// Build a transfer transaction.
const tx = await programManager.buildTransferPublicTransaction(100, "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", 0);

// Submit the transaction to the network.
const transactionId = await networkClient.submitTransaction(tx);

// Wait for the transaction to be confirmed.
const transaction = await networkClient.waitForTransactionConfirmation(transactionId);
```

---

### `setAccount(account)`

![modifier: public](images/badges/modifier-public.svg)

Set an account to use in networkClient calls

Parameters | Type | Description
--- | --- | ---
__account__ | [Account](sdk-src_account.md) | *Set an account to use for record scanning functions.*

#### Examples

```javascript
import { Account, AleoNetworkClient } from "@provablehq/sdk/mainnet.js";

const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1");
const account = new Account();
networkClient.setAccount(account);
```

---

### `getAccount() ► Account`

![modifier: public](images/badges/modifier-public.svg)

Return the Aleo account used in the networkClient

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Account](sdk-src_account.md) | **

#### Examples

```javascript
const account = networkClient.getAccount();
```

---

### `setHost(host, host)`

![modifier: public](images/badges/modifier-public.svg)

Set a new host for the networkClient

Parameters | Type | Description
--- | --- | ---
__host__ | `string` | *The address of a node hosting the Aleo API*
__host__ | `undefined` | **

#### Examples

```javascript
import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";

// Create a networkClient that connects to a local node.
const networkClient = new AleoNetworkClient("http://0.0.0.0:3030", undefined);

// Set the host to a public node.
networkClient.setHost("http://api.explorer.provable.com/v1");
```

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
import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";

// Create a networkClient
const networkClient = new AleoNetworkClient();

// Set the value of the `Accept-Language` header to `en-US`
networkClient.setHeader('Accept-Language', 'en-US');
```

---

<<<<<<< HEAD
### `removeHeader(headerName)`

![modifier: public](images/badges/modifier-public.svg)

Remove a header from the &#x60;AleoNetworkClient&#x60;s header map

Parameters | Type | Description
--- | --- | ---
__headerName__ | `string` | *The name of the header to be removed*

#### Examples

```javascript
import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";

// Create a networkClient
const networkClient = new AleoNetworkClient();

// Remove the default `X-Aleo-SDK-Version` header
networkClient.removeHeader('X-Aleo-SDK-Version');
```

---

=======
>>>>>>> 250b119cf9aec51d67c2ec112753db9609026fbf
### `fetchData(url) ► Promise.<Type>`

![modifier: public](images/badges/modifier-public.svg)

Fetches data from the Aleo network and returns it as a JSON object.

Parameters | Type | Description
--- | --- | ---
__url__ | `undefined` | *The URL to fetch data from.*
__*return*__ | `Promise.<Type>` | **

---

### `fetchRaw(url) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Fetches data from the Aleo network and returns it as an unparsed string.

This method should be used when it is desired to reconstitute data returned
from the network into a WASM object.

Parameters | Type | Description
--- | --- | ---
__url__ | `undefined` | **
__*return*__ | `Promise.<string>` | **

---

### `findRecords(startHeight, endHeight, unspent, programs, amounts, maxMicrocredits, nonces, privateKey) ► Promise.<Array.<RecordPlaintext>>`

![modifier: public](images/badges/modifier-public.svg)

Attempt to find records in the Aleo blockchain.

Parameters | Type | Description
--- | --- | ---
__startHeight__ | `number` | *The height at which to start searching for unspent records*
__endHeight__ | `number` | *The height at which to stop searching for unspent records*
__unspent__ | `boolean` | *Whether to search for unspent records only*
__programs__ | `Array.<string>` | *The program(s) to search for unspent records in*
__amounts__ | `Array.<number>` | *The amounts (in microcredits) to search for (eg. [100, 200, 3000])*
__maxMicrocredits__ | `number` | *The maximum number of microcredits to search for*
__nonces__ | `Array.<string>` | *The nonces of already found records to exclude from the search*
__privateKey__ | `string` | *An optional private key to use to find unspent records.*
__*return*__ | `Promise.<Array.<RecordPlaintext>>` | *An array of records belonging to the account configured in the network client.*

#### Examples

```javascript
import { Account, AleoNetworkClient } from "@provablehq/sdk/mainnet.js";

// Import an account from a ciphertext and password.
const account = Account.fromCiphertext(process.env.ciphertext, process.env.password);

// Create a network client.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
networkClient.setAccount(account);

// Find specific amounts
const startHeight = 500000;
const amounts = [600000, 1000000];
const records = networkClient.findRecords(startHeight, undefined, true, ["credits.aleo"] amounts);

// Find specific amounts with a maximum number of cumulative microcredits
const maxMicrocredits = 100000;
const records = networkClient.findRecords(startHeight, undefined, true, ["credits.aleo"] undefined, maxMicrocredits);
```

---

### `findUnspentRecords(startHeight, endHeight, programs, amounts, maxMicrocredits, nonces, privateKey) ► Promise.<Array.<RecordPlaintext>>`

![modifier: public](images/badges/modifier-public.svg)

Attempts to find unspent records in the Aleo blockchain.

Parameters | Type | Description
--- | --- | ---
__startHeight__ | `number` | *The height at which to start searching for unspent records*
__endHeight__ | `number` | *The height at which to stop searching for unspent records*
__programs__ | `Array.<string>` | *The program(s) to search for unspent records in*
__amounts__ | `Array.<number>` | *The amounts (in microcredits) to search for (eg. [100, 200, 3000])*
__maxMicrocredits__ | `number` | *The maximum number of microcredits to search for*
__nonces__ | `Array.<string>` | *The nonces of already found records to exclude from the search*
__privateKey__ | `string` | *An optional private key to use to find unspent records.*
__*return*__ | `Promise.<Array.<RecordPlaintext>>` | *An array of unspent records belonging to the account configured in the network client.*

#### Examples

```javascript
import { Account, AleoNetworkClient } from "@provablehq/sdk/mainnet.js";

const account = Account.fromCiphertext(process.env.ciphertext, process.env.password);

// Create a network client and set an account to search for records with.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
networkClient.setAccount(account);

// Find specific amounts
const startHeight = 500000;
const endHeight = 550000;
const amounts = [600000, 1000000];
const records = networkClient.findUnspentRecords(startHeight, endHeight, ["credits.aleo"], amounts);

// Find specific amounts with a maximum number of cumulative microcredits
const maxMicrocredits = 100000;
const records = networkClient.findUnspentRecords(startHeight, undefined, ["credits.aleo"], undefined, maxMicrocredits);
```

---

### `getBlock(blockHeight) ► Promise.<BlockJSON>`

![modifier: public](images/badges/modifier-public.svg)

Returns the contents of the block at the specified block height.

Parameters | Type | Description
--- | --- | ---
__blockHeight__ | `number` | *The height of the block to fetch*
__*return*__ | `Promise.<BlockJSON>` | *A javascript object containing the block at the specified height*

#### Examples

```javascript
const block = networkClient.getBlock(1234);
```

---

### `getBlockByHash(blockHash) ► Promise.<BlockJSON>`

![modifier: public](images/badges/modifier-public.svg)

Returns the contents of the block with the specified hash.

Parameters | Type | Description
--- | --- | ---
__blockHash__ | `string` | *The hash of the block to fetch.*
__*return*__ | `Promise.<BlockJSON>` | *A javascript object representation of the block matching the hash.*

#### Examples

```javascript
import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";

const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
const block = networkClient.getBlockByHash("ab19dklwl9vp63zu3hwg57wyhvmqf92fx5g8x0t6dr72py8r87pxupqfne5t9");
```

---

### `getBlockRange(start, end) ► Promise.<Array.<BlockJSON>>`

![modifier: public](images/badges/modifier-public.svg)

Returns a range of blocks between the specified block heights. A maximum of 50 blocks can be fetched at a time.

Parameters | Type | Description
--- | --- | ---
__start__ | `number` | *Starting block to fetch.*
__end__ | `number` | *Ending block to fetch. This cannot be more than 50 blocks ahead of the start block.*
__*return*__ | `Promise.<Array.<BlockJSON>>` | *An array of block objects*

#### Examples

```javascript
import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";

// Fetch 50 blocks.
const (start, end) = (2050, 2100);
const blockRange = networkClient.getBlockRange(start, end);

let cursor = start;
blockRange.forEach((block) => {
  assert(block.height == cursor);
  cursor += 1;
 }
```

---

### `getDeploymentTransactionIDForProgram(program) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Returns the deployment transaction id associated with the specified program.

Parameters | Type | Description
--- | --- | ---
__program__ | [Program](sdk-src_wasm.md) | *The name of the deployed program OR a wasm Program object.*
__*return*__ | `Promise.<string>` | *The transaction ID of the deployment transaction.*

#### Examples

```javascript
import { AleoNetworkClient } from "@provablehq/sdk/testnet.js";

// Get the transaction ID of the deployment transaction for a program.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
const transactionId = networkClient.getDeploymentTransactionIDForProgram("hello_hello.aleo");

// Get the transaction data for the deployment transaction.
const transaction = networkClient.getTransactionObject(transactionId);

// Get the verifying keys for the functions in the deployed program.
const verifyingKeys = transaction.verifyingKeys();
```

---

### `getDeploymentTransactionForProgram(program) ► Promise.<Transaction>`

![modifier: public](images/badges/modifier-public.svg)

Returns the deployment transaction associated with a specified program as a JSON object.

Parameters | Type | Description
--- | --- | ---
__program__ | [Program](sdk-src_wasm.md) | *The name of the deployed program OR a wasm Program object.*
__*return*__ | `Promise.<Transaction>` | *JSON representation of the deployment transaction.*

#### Examples

```javascript
import { AleoNetworkClient, DeploymentJSON } from "@provablehq/sdk/testnet.js";

// Get the transaction ID of the deployment transaction for a program.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
const transaction = networkClient.getDeploymentTransactionForProgram("hello_hello.aleo");

// Get the verifying keys for each function in the deployment.
const deployment = <DeploymentJSON>transaction.deployment;
const verifyingKeys = deployment.verifying_keys;
```

---

### `getDeploymentTransactionObjectForProgram(program) ► Promise.<Transaction>`

![modifier: public](images/badges/modifier-public.svg)

Returns the deployment transaction associated with a specified program as a wasm object.

Parameters | Type | Description
--- | --- | ---
__program__ | [Program](sdk-src_wasm.md) | *The name of the deployed program OR a wasm Program object.*
__*return*__ | `Promise.<Transaction>` | *Wasm object representation of the deployment transaction.*

#### Examples

```javascript
import { AleoNetworkClient } from "@provablehq/sdk/testnet.js";

// Get the transaction ID of the deployment transaction for a program.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
const transactionId = networkClient.getDeploymentTransactionIDForProgram("hello_hello.aleo");

// Get the transaction data for the deployment transaction.
const transaction = networkClient.getDeploymentTransactionObjectForProgram(transactionId);

// Get the verifying keys for the functions in the deployed program.
const verifyingKeys = transaction.verifyingKeys();
```

---

### `getLatestBlock() ► Promise.<BlockJSON>`

![modifier: public](images/badges/modifier-public.svg)

Returns the contents of the latest block as JSON.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<BlockJSON>` | *A javascript object containing the latest block*

#### Examples

```javascript
import { AleoNetworkClient } from "@provablehq/sdk/testnet.js";

// Create a network client.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);

const latestHeight = networkClient.getLatestBlock();
```

---

### `getLatestCommittee() ► Promise.<object>`

![modifier: public](images/badges/modifier-public.svg)

Returns the latest committee.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<object>` | *A javascript object containing the latest committee*

#### Examples

```javascript
import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";

// Create a network client.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);

// Create a network client and get the latest committee.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
const latestCommittee = await networkClient.getLatestCommittee();
```

---

### `getCommitteeByBlockHeight(blockHeight) ► Promise.<object>`

![modifier: public](images/badges/modifier-public.svg)

Returns the committee at the specified block height.

Parameters | Type | Description
--- | --- | ---
__blockHeight__ | `number` | *The height of the block to fetch the committee for*
__*return*__ | `Promise.<object>` | *A javascript object containing the committee*

#### Examples

```javascript
import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";

// Create a network client.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);

// Create a network client and get the committee for a specific block.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
const committee = await networkClient.getCommitteeByBlockHeight(1234);
```

---

### `getLatestHeight() ► Promise.<number>`

![modifier: public](images/badges/modifier-public.svg)

Returns the latest block height.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<number>` | *The latest block height.*

#### Examples

```javascript
import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";

// Create a network client.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);

const latestHeight = networkClient.getLatestHeight();
```

---

### `getLatestBlockHash() ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Returns the latest block hash.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<string>` | *The latest block hash.*

#### Examples

```javascript
import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";

// Create a network client.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);

// Get the latest block hash.
const latestHash = networkClient.getLatestBlockHash();
```

---

### `getProgram(programId) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Returns the source code of a program given a program ID.

Parameters | Type | Description
--- | --- | ---
__programId__ | `string` | *The program ID of a program deployed to the Aleo Network*
__*return*__ | `Promise.<string>` | *Source code of the program*

#### Examples

```javascript
import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";

// Create a network client.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);

const program = networkClient.getProgram("hello_hello.aleo");
const expectedSource = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n"
assert.equal(program, expectedSource);
```

---

### `getProgramObject(inputProgram) ► Promise.<Program>`

![modifier: public](images/badges/modifier-public.svg)

Returns a program object from a program ID or program source code.

Parameters | Type | Description
--- | --- | ---
__inputProgram__ | `string` | *The program ID or program source code of a program deployed to the Aleo Network*
__*return*__ | `Promise.<Program>` | *Source code of the program*

#### Examples

```javascript
import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";

// Create a network client.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);

const programID = "hello_hello.aleo";
const programSource = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n"

// Get program object from program ID or program source code
const programObjectFromID = await networkClient.getProgramObject(programID);
const programObjectFromSource = await networkClient.getProgramObject(programSource);

// Both program objects should be equal
assert(programObjectFromID.to_string() === programObjectFromSource.to_string());
```

---

### `getProgramImports(inputProgram) ► Promise.<ProgramImports>`

![modifier: public](images/badges/modifier-public.svg)

Returns an object containing the source code of a program and the source code of all programs it imports

Parameters | Type | Description
--- | --- | ---
__inputProgram__ | [Program](sdk-src_wasm.md) | *The program ID or program source code of a program deployed to the Aleo Network*
__*return*__ | `Promise.<ProgramImports>` | *Object of the form { &quot;program_id&quot;: &quot;program_source&quot;, .. } containing program id &amp; source code for all program imports*

#### Examples

```javascript
import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";

const double_test_source = "import multiply_test.aleo;\n\nprogram double_test.aleo;\n\nfunction double_it:\n    input r0 as u32.private;\n    call multiply_test.aleo/multiply 2u32 r0 into r1;\n    output r1 as u32.private;\n"
const double_test = Program.fromString(double_test_source);
const expectedImports = {
    "multiply_test.aleo": "program multiply_test.aleo;\n\nfunction multiply:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    mul r0 r1 into r2;\n    output r2 as u32.private;\n"
}

// Create a network client.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);

// Imports can be fetched using the program ID, source code, or program object
let programImports = await networkClient.getProgramImports("double_test.aleo");
assert.deepStrictEqual(programImports, expectedImports);

// Using the program source code
programImports = await networkClient.getProgramImports(double_test_source);
assert.deepStrictEqual(programImports, expectedImports);

// Using the program object
programImports = await networkClient.getProgramImports(double_test);
assert.deepStrictEqual(programImports, expectedImports);
```

---

### `getProgramImportNames(inputProgram) ► Array.<string>`

![modifier: public](images/badges/modifier-public.svg)

Get a list of the program names that a program imports.

Parameters | Type | Description
--- | --- | ---
__inputProgram__ | [Program](sdk-src_wasm.md) | *The program id or program source code to get the imports of*
__*return*__ | `Array.<string>` | *- The list of program names that the program imports*

#### Examples

```javascript
import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";

// Create a network client.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);

const programImportsNames = networkClient.getProgramImports("wrapped_credits.aleo");
const expectedImportsNames = ["credits.aleo"];
assert.deepStrictEqual(programImportsNames, expectedImportsNames);
```

---

### `getProgramMappingNames(programId) ► Promise.<Array.<string>>`

![modifier: public](images/badges/modifier-public.svg)

Returns the names of the mappings of a program.

Parameters | Type | Description
--- | --- | ---
__programId__ | `string` | *The program ID to get the mappings of (e.g. &quot;credits.aleo&quot;)*
__*return*__ | `Promise.<Array.<string>>` | *- The names of the mappings of the program.*

#### Examples

```javascript
import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";

// Create a network client.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);

const mappings = networkClient.getProgramMappingNames("credits.aleo");
const expectedMappings = [
  "committee",
  "delegated",
  "metadata",
  "bonded",
  "unbonding",
  "account",
  "withdraw"
];
assert.deepStrictEqual(mappings, expectedMappings);
```

---

### `getProgramMappingValue(programId, mappingName, key) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Returns the value of a program&#x27;s mapping for a specific key.

Parameters | Type | Description
--- | --- | ---
__programId__ | `string` | *The program ID to get the mapping value of (e.g. &quot;credits.aleo&quot;)*
__mappingName__ | `string` | *The name of the mapping to get the value of (e.g. &quot;account&quot;)*
__key__ | `string` | *The key to look up in the mapping (e.g. an address for the &quot;account&quot; mapping)*
__*return*__ | `Promise.<string>` | *String representation of the value of the mapping*

#### Examples

```javascript
import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";

// Create a network client.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);

// Get public balance of an account
const mappingValue = networkClient.getMappingValue("credits.aleo", "account", "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px");
const expectedValue = "0u64";
assert(mappingValue === expectedValue);
```

---

### `getProgramMappingPlaintext(programId, mappingName, key) ► Promise.<Plaintext>`

![modifier: public](images/badges/modifier-public.svg)

Returns the value of a mapping as a wasm Plaintext object. Returning an object in this format allows it to be converted to a Js type and for its internal members to be inspected if it&#x27;s a struct or array.

Parameters | Type | Description
--- | --- | ---
__programId__ | `string` | *The program ID to get the mapping value of (e.g. &quot;credits.aleo&quot;)*
__mappingName__ | `string` | *The name of the mapping to get the value of (e.g. &quot;bonded&quot;)*
__key__ | `string` | *The key to look up in the mapping (e.g. an address for the &quot;bonded&quot; mapping)*
__*return*__ | `Promise.<Plaintext>` | *String representation of the value of the mapping*

#### Examples

```javascript
import { AleoNetworkClient } from "@provablehq/sdk/mainnet.js";

// Create a network client.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);

// Get the bond state as an account.
const unbondedState = networkClient.getMappingPlaintext("credits.aleo", "bonded", "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px");

// Get the two members of the object individually.
const validator = unbondedState.getMember("validator");
const microcredits = unbondedState.getMember("microcredits");

// Ensure the expected values are correct.
assert.equal(validator, "aleo1u6940v5m0fzud859xx2c9tj2gjg6m5qrd28n636e6fdd2akvfcgqs34mfd");
assert.equal(microcredits, BigInt("9007199254740991"));

// Get a JS object representation of the unbonded state.
const unbondedStateObject = unbondedState.toObject();

const expectedState = {
    validator: "aleo1u6940v5m0fzud859xx2c9tj2gjg6m5qrd28n636e6fdd2akvfcgqs34mfd",
    microcredits: BigInt(9007199254740991)
};
assert.equal(unbondedState, expectedState);
```

---

### `getPublicBalance(address) ► Promise.<number>`

![modifier: public](images/badges/modifier-public.svg)

Returns the public balance of an address from the account mapping in credits.aleo

Parameters | Type | Description
--- | --- | ---
__address__ | [Address](sdk-src_wasm.md) | *A string or wasm object representing an address.*
__*return*__ | `Promise.<number>` | *The public balance of the address in microcredits.*

#### Examples

```javascript
import { AleoNetworkClient, Account } from "@provablehq/sdk/mainnet.js";

// Create a network client.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);

// Get the balance of an account from either an address object or address string.
const account = Account.fromCiphertext(process.env.ciphertext, process.env.password);
const publicBalance = await networkClient.getPublicBalance(account.address());
const publicBalanceFromString = await networkClient.getPublicBalance(account.address().to_string());
assert(publicBalance === publicBalanceFromString);
```

---

### `getStateRoot() ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Returns the latest state/merkle root of the Aleo blockchain.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<string>` | *A string representing the latest state root of the Aleo blockchain.*

#### Examples

```javascript
import { AleoNetworkClient, Account } from "@provablehq/sdk/mainnet.js";

// Create a network client.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);

// Get the latest state root.
const stateRoot = networkClient.getStateRoot();
```

---

### `getTransaction(transactionId) ► Promise.<TransactionJSON>`

![modifier: public](images/badges/modifier-public.svg)

Returns a transaction by its unique identifier.

Parameters | Type | Description
--- | --- | ---
__transactionId__ | `string` | *The transaction ID to fetch.*
__*return*__ | `Promise.<TransactionJSON>` | *A json representation of the transaction.*

#### Examples

```javascript
import { AleoNetworkClient, Account } from "@provablehq/sdk/mainnet.js";

// Create a network client.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);

const transaction = networkClient.getTransaction("at1handz9xjrqeynjrr0xay4pcsgtnczdksz3e584vfsgaz0dh0lyxq43a4wj");
```

---

### `getConfirmedTransaction(transactionId) ► Promise.<ConfirmedTransactionJSON>`

![modifier: public](images/badges/modifier-public.svg)

Returns a confirmed transaction by its unique identifier.

Parameters | Type | Description
--- | --- | ---
__transactionId__ | `string` | *The transaction ID to fetch.*
__*return*__ | `Promise.<ConfirmedTransactionJSON>` | *A json object containing the confirmed transaction.*

#### Examples

```javascript
import { AleoNetworkClient, Account } from "@provablehq/sdk/mainnet.js";

// Create a network client.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);

const transaction = networkClient.getConfirmedTransaction("at1handz9xjrqeynjrr0xay4pcsgtnczdksz3e584vfsgaz0dh0lyxq43a4wj");
assert.equal(transaction.status, "confirmed");
```

---

### `getTransactionObject(transactionId) ► Promise.<Transaction>`

![modifier: public](images/badges/modifier-public.svg)

Returns a transaction as a wasm object. Getting a transaction of this type will allow the ability for the inputs,
outputs, and records to be searched for and displayed.

Parameters | Type | Description
--- | --- | ---
__transactionId__ | `string` | *The unique identifier of the transaction to fetch*
__*return*__ | `Promise.<Transaction>` | *A wasm object representation of the transaction.*

#### Examples

```javascript
const transactionObject = networkClient.getTransaction("at1handz9xjrqeynjrr0xay4pcsgtnczdksz3e584vfsgaz0dh0lyxq43a4wj");
// Get the transaction inputs as a JS array.
const transactionInputs = transactionObject.inputs(true);

// Get the transaction outputs as a JS object.
const transactionOutputs = transactionObject.outputs(true);

// Get any records generated in transitions in the transaction as a JS object.
const records = transactionObject.records();

// Get the transaction type.
const transactionType = transactionObject.transactionType();
assert.equal(transactionType, "Execute");

// Get a JS representation of all inputs, outputs, and transaction metadata.
const transactionSummary = transactionObject.summary();
```

---

### `getTransactions(blockHeight) ► Promise.<Array.<ConfirmedTransactionJSON>>`

![modifier: public](images/badges/modifier-public.svg)

Returns the transactions present at the specified block height.

Parameters | Type | Description
--- | --- | ---
__blockHeight__ | `number` | *The block height to fetch the confirmed transactions at.*
__*return*__ | `Promise.<Array.<ConfirmedTransactionJSON>>` | *An array of confirmed transactions (in JSON format) for the block height.*

#### Examples

```javascript
import { AleoNetworkClient, Account } from "@provablehq/sdk/mainnet.js";

// Create a network client.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);

const transactions = networkClient.getTransactions(654);
```

---

### `getTransactionsByBlockHash(blockHash) ► Promise.<Array.<ConfirmedTransactionJSON>>`

![modifier: public](images/badges/modifier-public.svg)

Returns the confirmed transactions present in the block with the specified block hash.

Parameters | Type | Description
--- | --- | ---
__blockHash__ | `string` | *The block hash to fetch the confirmed transactions at.*
__*return*__ | `Promise.<Array.<ConfirmedTransactionJSON>>` | *An array of confirmed transactions (in JSON format) for the block hash.*

#### Examples

```javascript
import { AleoNetworkClient, Account } from "@provablehq/sdk/mainnet.js";

// Create a network client.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);

const transactions = networkClient.getTransactionsByBlockHash("ab19dklwl9vp63zu3hwg57wyhvmqf92fx5g8x0t6dr72py8r87pxupqfne5t9");
```

---

### `getTransactionsInMempool() ► Promise.<Array.<TransactionJSON>>`

![modifier: public](images/badges/modifier-public.svg)

Returns the transactions in the memory pool. This method requires access to a validator&#x27;s REST API.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<Array.<TransactionJSON>>` | *An array of transactions (in JSON format) currently in the mempool.*

#### Examples

```javascript
import { AleoNetworkClient, Account } from "@provablehq/sdk/mainnet.js";

// Create a network client.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);

// Get the current transactions in the mempool.
const transactions = networkClient.getTransactionsInMempool();
```

---

### `getTransitionId(inputOrOutputID) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Returns the transition ID of the transition corresponding to the ID of the input or output.

Parameters | Type | Description
--- | --- | ---
__inputOrOutputID__ | `string` | *The unique identifier of the input or output to find the transition ID for*
__*return*__ | `Promise.<string>` | *- The transition ID of the input or output ID.*

#### Examples

```javascript
const transitionId = networkClient.getTransitionId("2429232855236830926144356377868449890830704336664550203176918782554219952323field");
```

---

### `submitTransaction(transaction) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Submit an execute or deployment transaction to the Aleo network.

Parameters | Type | Description
--- | --- | ---
__transaction__ | [Transaction](sdk-src_wasm.md) | *The transaction to submit, either as a Transaction object or string representation*
__*return*__ | `Promise.<string>` | *- The transaction id of the submitted transaction or the resulting error*

---

### `submitSolution(solution) ► Promise.<string>`

![modifier: public](images/badges/modifier-public.svg)

Submit a solution to the Aleo network.

Parameters | Type | Description
--- | --- | ---
__solution__ | `string` | *The string representation of the solution to submit*
__*return*__ | `Promise.<string>` | *The solution id of the submitted solution or the resulting error.*

---

### `waitForTransactionConfirmation(transactionId, checkInterval, timeout) ► Promise.<Transaction>`

![modifier: public](images/badges/modifier-public.svg)

Await a submitted transaction to be confirmed or rejected on the Aleo network.

Parameters | Type | Description
--- | --- | ---
__transactionId__ | `string` | *The transaction ID to wait for confirmation*
__checkInterval__ | `number` | *The interval in milliseconds to check for confirmation (default: 2000)*
__timeout__ | `number` | *The maximum time in milliseconds to wait for confirmation (default: 45000)*
__*return*__ | `Promise.<Transaction>` | *The confirmed transaction object that returns if the transaction is confirmed.*

#### Examples

```javascript
import { AleoNetworkClient, Account, ProgramManager } from "@provablehq/sdk/mainnet.js";

// Create a network client and program manager.
const networkClient = new AleoNetworkClient("http://api.explorer.provable.com/v1", undefined);
const programManager = new ProgramManager(networkClient);

// Set the account for the program manager.
programManager.setAccount(Account.fromCiphertext(process.env.ciphertext, process.env.password));

// Build a transfer transaction.
const tx = await programManager.buildTransferPublicTransaction(100, "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", 0);

// Submit the transaction to the network.
const transactionId = await networkClient.submitTransaction(tx);

// Wait for the transaction to be confirmed.
const transaction = await networkClient.waitForTransactionConfirmation(transactionId);
```

---

### `_sendPost(url, options) ► `

![modifier: private](images/badges/modifier-private.svg)

Wrapper around the POST helper to allow mocking in tests. Not meant for use in production.

Parameters | Type | Description
--- | --- | ---
__url__ | `undefined` | *The URL to POST to.*
__options__ | `undefined` | *The RequestInit options for the POST request.*
__*return*__ | `undefined` | *The Response object from the POST request.*

---

### `_sendPost(url, options) ► `

![modifier: private](images/badges/modifier-private.svg)

Wrapper around the POST helper to allow mocking in tests. Not meant for use in production.

Parameters | Type | Description
--- | --- | ---
__url__ | `undefined` | *The URL to POST to.*
__options__ | `undefined` | *The RequestInit options for the POST request.*
__*return*__ | `undefined` | *The Response object from the POST request.*

---
