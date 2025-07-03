# Module `src/account`

![category:other](https://img.shields.io/badge/category-other-blue.svg?style=flat-square)



[Source file](../../sdk/src/account.ts)

# Class `Account`

Key Management class. Enables the creation of a new Aleo Account, importation of an existing account from
an existing private key or seed, and message signing and verification functionality. An Aleo Account is generated
from a randomly generated seed (number) from which an account private key, view key, and a public account address are
derived. The private key lies at the root of an Aleo account. It is a highly sensitive secret and should be protected
as it allows for creation of Aleo Program executions and arbitrary value transfers. The View Key allows for decryption
of a user&#x27;s activity on the blockchain. The Address is the public address to which other users of Aleo can send Aleo
credits and other records to. This class should only be used in environments where the safety of the underlying key
material can be assured.

## Examples

```javascript
import { Account } from "@provablehq/sdk/testnet.js";

// Create a new account
const myRandomAccount = new Account();

// Create an account from a randomly generated seed
const seed = new Uint8Array([94, 91, 52, 251, 240, 230, 226, 35, 117, 253, 224, 210, 175, 13, 205, 120, 155, 214, 7, 169, 66, 62, 206, 50, 188, 40, 29, 122, 40, 250, 54, 18]);
const mySeededAccount = new Account({seed: seed});

// Create an account from an existing private key
const myExistingAccount = new Account({privateKey: process.env.privateKey});

// Sign a message
const hello_world = Uint8Array.from([104, 101, 108, 108, 111 119, 111, 114, 108, 100]);
const signature = myRandomAccount.sign(hello_world);

// Verify a signature
assert(myRandomAccount.verify(hello_world, signature));
```

## Methods

### `fromCiphertext(ciphertext, password) ► Account`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Attempts to create an account from a private key ciphertext

Parameters | Type | Description
--- | --- | ---
__ciphertext__ | [PrivateKeyCiphertext](sdk-src_wasm.md) | *The encrypted private key ciphertext or its string representation*
__password__ | `string` | *The password used to decrypt the private key ciphertext*
__*return*__ | [Account](sdk-src_account.md) | *A new Account instance created from the decrypted private key*

#### Examples

```javascript
import { Account } from "@provablehq/sdk/testnet.js";

// Create an account object from a previously encrypted ciphertext and password.
const account = Account.fromCiphertext(process.env.ciphertext, process.env.password);
```

---

### `privateKeyFromParams(params) ► PrivateKey`

![modifier: public](images/badges/modifier-public.svg)

Creates a PrivateKey from the provided parameters.

Parameters | Type | Description
--- | --- | ---
__params__ | `AccountParam` | *The parameters containing either a private key string or a seed*
__*return*__ | [PrivateKey](sdk-src_wasm.md) | *A PrivateKey instance derived from the provided parameters*

---

### `privateKey() ► PrivateKey`

![modifier: public](images/badges/modifier-public.svg)

Returns the PrivateKey associated with the account.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [PrivateKey](sdk-src_wasm.md) | *The private key of the account*

#### Examples

```javascript
import { Account } from "@provablehq/sdk/testnet.js";

const account = new Account();
const privateKey = account.privateKey();
```

---

### `viewKey() ► ViewKey`

![modifier: public](images/badges/modifier-public.svg)

Returns the ViewKey associated with the account.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `ViewKey` | *The view key of the account*

#### Examples

```javascript
import { Account } from "@provablehq/sdk/testnet.js";

const account = new Account();
const viewKey = account.viewKey();
```

---

### `computeKey() ► ComputeKey`

![modifier: public](images/badges/modifier-public.svg)

Returns the ComputeKey associated with the account.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `ComputeKey` | *The compute key of the account*

#### Examples

```javascript
import { Account } from "@provablehq/sdk/testnet.js";

const account = new Account();
const computeKey = account.computeKey();
```

---

### `address() ► Address`

![modifier: public](images/badges/modifier-public.svg)

Returns the Aleo address associated with the account.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Address](sdk-src_wasm.md) | *The public address of the account*

#### Examples

```javascript
import { Account } from "@provablehq/sdk/testnet.js";

const account = new Account();
const address = account.address();
```

---

### `clone() ► Account`

![modifier: public](images/badges/modifier-public.svg)

Deep clones the Account.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Account](sdk-src_account.md) | *A new Account instance with the same private key*

#### Examples

```javascript
import { Account } from "@provablehq/sdk/testnet.js";

const account = new Account();
const clonedAccount = account.clone();
```

---

### `toString() ► string`

![modifier: public](images/badges/modifier-public.svg)

Returns the address of the account in a string representation.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `string` | *The string representation of the account address*

---

### `encryptAccount(password) ► PrivateKeyCiphertext`

![modifier: public](images/badges/modifier-public.svg)

Encrypts the account&#x27;s private key with a password.

Parameters | Type | Description
--- | --- | ---
__password__ | `string` | *Password to encrypt the private key.*
__*return*__ | [PrivateKeyCiphertext](sdk-src_wasm.md) | *The encrypted private key ciphertext*

#### Examples

```javascript
import { Account } from "@provablehq/sdk/testnet.js";

const account = new Account();
const ciphertext = account.encryptAccount("password");
process.env.ciphertext = ciphertext.toString();
```

---

### `decryptRecord(ciphertext) ► RecordPlaintext`

![modifier: public](images/badges/modifier-public.svg)

Decrypts an encrypted record string into a plaintext record object.

Parameters | Type | Description
--- | --- | ---
__ciphertext__ | `string` | *A string representing the ciphertext of a record.*
__*return*__ | [RecordPlaintext](sdk-src_wasm.md) | *The decrypted record plaintext*

#### Examples

```javascript
// Import the AleoNetworkClient and Account classes
import { AleoNetworkClient, Account } from "@provablehq/sdk/testnet.js";

// Create a connection to the Aleo network and an account
const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
const account = Account.fromCiphertext(process.env.ciphertext!, process.env.password!);

// Get the record ciphertexts from a transaction.
const transaction = await networkClient.getTransactionObject("at1fjy6s9md2v4rgcn3j3q4qndtfaa2zvg58a4uha0rujvrn4cumu9qfazxdd");
const records = transaction.records();

// Decrypt any records the account owns.
const decryptedRecords = [];
for (const record of records) {
   if (account.decryptRecord(record)) {
     decryptedRecords.push(record);
   }
}
```

---

### `decryptRecords(ciphertexts) ► Array.<RecordPlaintext>`

![modifier: public](images/badges/modifier-public.svg)

Decrypts an array of Record ciphertext strings into an array of record plaintext objects.

Parameters | Type | Description
--- | --- | ---
__ciphertexts__ | `Array.<string>` | *An array of strings representing the ciphertexts of records.*
__*return*__ | `Array.<RecordPlaintext>` | *An array of decrypted record plaintexts*

#### Examples

```javascript
// Import the AleoNetworkClient and Account classes
import { AleoNetworkClient, Account } from "@provablehq/sdk/testnet.js";

// Create a connection to the Aleo network and an account
const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
const account = Account.fromCiphertext(process.env.ciphertext!, process.env.password!);

// Get the record ciphertexts from a transaction.
const transaction = await networkClient.getTransactionObject("at1fjy6s9md2v4rgcn3j3q4qndtfaa2zvg58a4uha0rujvrn4cumu9qfazxdd");
const records = transaction.records();

// Decrypt any records the account owns. If the account owns no records, the array will be empty.
const decryptedRecords = account.decryptRecords(records);
```

---

### `generateRecordViewKey(recordCiphertext) ► Field`

![modifier: public](images/badges/modifier-public.svg)

Generates a record view key from the account owner&#x27;s view key and the record ciphertext.
This key can be used to decrypt the record without revealing the account&#x27;s view key.

Parameters | Type | Description
--- | --- | ---
__recordCiphertext__ | [RecordCiphertext](sdk-src_wasm.md) | *The record ciphertext to generate the view key for*
__*return*__ | [Field](sdk-src_wasm.md) | *The record view key*

#### Examples

```javascript
// Import the Account class
import { Account } from "@provablehq/sdk/testnet.js";

// Create an account object from a previously encrypted ciphertext and password.
const account = Account.fromCiphertext(process.env.ciphertext!, process.env.password!);

// Generate a record view key from the account's view key and a record ciphertext
const recordCiphertext = RecordCiphertext.fromString("your_record_ciphertext_here");
const recordViewKey = account.generateRecordViewKey(recordCiphertext);
```

---

### `generateTransitionViewKey(tpk) ► Field`

![modifier: public](images/badges/modifier-public.svg)

Generates a transition view key from the account owner&#x27;s view key and the transition public key.
This key can be used to decrypt the private inputs and outputs of a the transition without
revealing the account&#x27;s view key.

Parameters | Type | Description
--- | --- | ---
__tpk__ | `string` | *The transition public key*
__*return*__ | [Field](sdk-src_wasm.md) | *The transition view key*

#### Examples

```javascript
// Import the Account class
import { Account } from "@provablehq/sdk/testnet.js";

// Generate a transition view key from the account's view key and a transition public key
const tpk = Group.fromString("your_transition_public_key_here");

const transitionViewKey = account.generateTransitionViewKey(tpk);
```

---

### `ownsRecordCiphertext(ciphertext) ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Determines whether the account owns a ciphertext record.

Parameters | Type | Description
--- | --- | ---
__ciphertext__ | [RecordCiphertext](sdk-src_wasm.md) | *The record ciphertext to check ownership of*
__*return*__ | `boolean` | *True if the account owns the record, false otherwise*

#### Examples

```javascript
// Import the AleoNetworkClient and Account classes
import { AleoNetworkClient, Account } from "@provablehq/sdk/testnet.js";

// Create a connection to the Aleo network and an account
const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
const account = Account.fromCiphertext(process.env.ciphertext!, process.env.password!);

// Get the record ciphertexts from a transaction and check ownership of them.
const transaction = await networkClient.getTransactionObject("at1fjy6s9md2v4rgcn3j3q4qndtfaa2zvg58a4uha0rujvrn4cumu9qfazxdd");
const records = transaction.records();

// Check if the account owns any of the record ciphertexts present in the transaction.
const ownedRecords = [];
for (const record of records) {
   if (account.ownsRecordCiphertext(record)) {
     ownedRecords.push(record);
   }
}
```

---

### `sign(message) ► Signature`

![modifier: public](images/badges/modifier-public.svg)

Signs a message with the account&#x27;s private key.
Returns a Signature.

Parameters | Type | Description
--- | --- | ---
__message__ | `Uint8Array` | *Message to be signed.*
__*return*__ | [Signature](sdk-src_wasm.md) | *Signature over the message in bytes.*

#### Examples

```javascript
// Import the Account class
import { Account } from "@provablehq/sdk/testnet.js";

// Create a connection to the Aleo network and an account
const account = Account.fromCiphertext(process.env.ciphertext, process.env.password);

// Create an account and a message to sign.
const account = new Account();
const message = Uint8Array.from([104, 101, 108, 108, 111 119, 111, 114, 108, 100])
const signature = account.sign(message);

// Verify the signature.
assert(account.verify(message, signature));
```

---

### `verify(message, signature) ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Verifies the Signature on a message.

Parameters | Type | Description
--- | --- | ---
__message__ | `Uint8Array` | *Message in bytes to be signed.*
__signature__ | [Signature](sdk-src_wasm.md) | *Signature to be verified.*
__*return*__ | `boolean` | *True if the signature is valid, false otherwise.*

#### Examples

```javascript
// Import the Account class
import { Account } from "@provablehq/sdk/testnet.js";

// Create a connection to the Aleo network and an account
const account = Account.fromCiphertext(process.env.ciphertext, process.env.password);

// Sign a message.
const message = Uint8Array.from([104, 101, 108, 108, 111 119, 111, 114, 108, 100])
const signature = account.sign(message);

// Verify the signature.
assert(account.verify(message, signature));
```

---

### `fromCiphertext(ciphertext, password) ► Account`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Attempts to create an account from a private key ciphertext

Parameters | Type | Description
--- | --- | ---
__ciphertext__ | [PrivateKeyCiphertext](sdk-src_wasm.md) | *The encrypted private key ciphertext or its string representation*
__password__ | `string` | *The password used to decrypt the private key ciphertext*
__*return*__ | [Account](sdk-src_account.md) | *A new Account instance created from the decrypted private key*

#### Examples

```javascript
import { Account } from "@provablehq/sdk/testnet.js";

// Create an account object from a previously encrypted ciphertext and password.
const account = Account.fromCiphertext(process.env.ciphertext, process.env.password);
```

---

### `privateKey() ► PrivateKey`

![modifier: public](images/badges/modifier-public.svg)

Returns the PrivateKey associated with the account.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [PrivateKey](sdk-src_wasm.md) | *The private key of the account*

#### Examples

```javascript
import { Account } from "@provablehq/sdk/testnet.js";

const account = new Account();
const privateKey = account.privateKey();
```

---

### `viewKey() ► ViewKey`

![modifier: public](images/badges/modifier-public.svg)

Returns the ViewKey associated with the account.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `ViewKey` | *The view key of the account*

#### Examples

```javascript
import { Account } from "@provablehq/sdk/testnet.js";

const account = new Account();
const viewKey = account.viewKey();
```

---

### `computeKey() ► Field`

![modifier: public](images/badges/modifier-public.svg)

Returns the Transition View Key associated with the transition public key.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Field](sdk-src_wasm.md) | *The transition view key*

#### Examples

```javascript
import { Account } from "@provablehq/sdk/testnet.js";
const account =
```

---

### `address() ► Address`

![modifier: public](images/badges/modifier-public.svg)

Returns the Aleo address associated with the account.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Address](sdk-src_wasm.md) | *The public address of the account*

#### Examples

```javascript
import { Account } from "@provablehq/sdk/testnet.js";

const account = new Account();
const address = account.address();
```

---

### `clone() ► Account`

![modifier: public](images/badges/modifier-public.svg)

Deep clones the Account.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Account](sdk-src_account.md) | *A new Account instance with the same private key*

#### Examples

```javascript
import { Account } from "@provablehq/sdk/testnet.js";

const account = new Account();
const clonedAccount = account.clone();
```

---

### `toString() ► string`

![modifier: public](images/badges/modifier-public.svg)

Returns the address of the account in a string representation.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `string` | *The string representation of the account address*

---

### `encryptAccount(password) ► PrivateKeyCiphertext`

![modifier: public](images/badges/modifier-public.svg)

Encrypts the account&#x27;s private key with a password.

Parameters | Type | Description
--- | --- | ---
__password__ | `string` | *Password to encrypt the private key.*
__*return*__ | [PrivateKeyCiphertext](sdk-src_wasm.md) | *The encrypted private key ciphertext*

#### Examples

```javascript
import { Account } from "@provablehq/sdk/testnet.js";

const account = new Account();
const ciphertext = account.encryptAccount("password");
process.env.ciphertext = ciphertext.toString();
```

---

### `decryptRecord(ciphertext) ► RecordPlaintext`

![modifier: public](images/badges/modifier-public.svg)

Decrypts an encrypted record string into a plaintext record object.

Parameters | Type | Description
--- | --- | ---
__ciphertext__ | `string` | *A string representing the ciphertext of a record.*
__*return*__ | [RecordPlaintext](sdk-src_wasm.md) | *The decrypted record plaintext*

#### Examples

```javascript
// Import the AleoNetworkClient and Account classes
import { AleoNetworkClient, Account } from "@provablehq/sdk/testnet.js";

// Create a connection to the Aleo network and an account
const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
const account = Account.fromCiphertext(process.env.ciphertext!, process.env.password!);

// Get the record ciphertexts from a transaction.
const transaction = await networkClient.getTransactionObject("at1fjy6s9md2v4rgcn3j3q4qndtfaa2zvg58a4uha0rujvrn4cumu9qfazxdd");
const records = transaction.records();

// Decrypt any records the account owns.
const decryptedRecords = [];
for (const record of records) {
   if (account.decryptRecord(record)) {
     decryptedRecords.push(record);
   }
}
```

---

### `decryptRecords(ciphertexts) ► Array.<RecordPlaintext>`

![modifier: public](images/badges/modifier-public.svg)

Decrypts an array of Record ciphertext strings into an array of record plaintext objects.

Parameters | Type | Description
--- | --- | ---
__ciphertexts__ | `Array.<string>` | *An array of strings representing the ciphertexts of records.*
__*return*__ | `Array.<RecordPlaintext>` | *An array of decrypted record plaintexts*

#### Examples

```javascript
// Import the AleoNetworkClient and Account classes
import { AleoNetworkClient, Account } from "@provablehq/sdk/testnet.js";

// Create a connection to the Aleo network and an account
const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
const account = Account.fromCiphertext(process.env.ciphertext!, process.env.password!);

// Get the record ciphertexts from a transaction.
const transaction = await networkClient.getTransactionObject("at1fjy6s9md2v4rgcn3j3q4qndtfaa2zvg58a4uha0rujvrn4cumu9qfazxdd");
const records = transaction.records();

// Decrypt any records the account owns. If the account owns no records, the array will be empty.
const decryptedRecords = account.decryptRecords(records);
```

---

### `generateRecordViewKey(recordCiphertext) ► Field`

![modifier: public](images/badges/modifier-public.svg)

Generates a record view key from the account owner&#x27;s view key and the record ciphertext.
This key can be used to decrypt the record without revealing the account&#x27;s view key.

Parameters | Type | Description
--- | --- | ---
__recordCiphertext__ | [RecordCiphertext](sdk-src_wasm.md) | *The record ciphertext to generate the view key for*
__*return*__ | [Field](sdk-src_wasm.md) | *The record view key*

#### Examples

```javascript
// Import the Account class
import { Account } from "@provablehq/sdk/testnet.js";

// Create an account object from a previously encrypted ciphertext and password.
const account = Account.fromCiphertext(process.env.ciphertext!, process.env.password!);

// Generate a record view key from the account's view key and a record ciphertext
const recordCiphertext = RecordCiphertext.fromString("your_record_ciphertext_here");
const recordViewKey = account.generateRecordViewKey(recordCiphertext);
```

---

### `generateTransitionViewKey(tpk) ► Field`

![modifier: public](images/badges/modifier-public.svg)

Generates a transition view key from the account owner&#x27;s view key and the transition public key.
This key can be used to decrypt the private inputs and outputs of a the transition without 
revealing the account&#x27;s view key.

Parameters | Type | Description
--- | --- | ---
__tpk__ | `string` | *The transition public key*
__*return*__ | [Field](sdk-src_wasm.md) | *The transition view key*

#### Examples

```javascript
// Import the Account class
import { Account } from "@provablehq/sdk/testnet.js";

// Generate a transition view key from the account's view key and a transition public key
const tpk = Group.fromString("your_transition_public_key_here");

const transitionViewKey = account.generateTransitionViewKey(tpk);
```

---

### `ownsRecordCiphertext(ciphertext) ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Determines whether the account owns a ciphertext record.

Parameters | Type | Description
--- | --- | ---
__ciphertext__ | [RecordCiphertext](sdk-src_wasm.md) | *The record ciphertext to check ownership of*
__*return*__ | `boolean` | *True if the account owns the record, false otherwise*

#### Examples

```javascript
// Import the AleoNetworkClient and Account classes
import { AleoNetworkClient, Account } from "@provablehq/sdk/testnet.js";

// Create a connection to the Aleo network and an account
const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
const account = Account.fromCiphertext(process.env.ciphertext!, process.env.password!);

// Get the record ciphertexts from a transaction and check ownership of them.
const transaction = await networkClient.getTransactionObject("at1fjy6s9md2v4rgcn3j3q4qndtfaa2zvg58a4uha0rujvrn4cumu9qfazxdd");
const records = transaction.records();

// Check if the account owns any of the record ciphertexts present in the transaction.
const ownedRecords = [];
for (const record of records) {
   if (account.ownsRecordCiphertext(record)) {
     ownedRecords.push(record);
   }
}
```

---

### `sign(message) ► Signature`

![modifier: public](images/badges/modifier-public.svg)

Signs a message with the account&#x27;s private key.
Returns a Signature.

Parameters | Type | Description
--- | --- | ---
__message__ | `Uint8Array` | *Message to be signed.*
__*return*__ | [Signature](sdk-src_wasm.md) | *Signature over the message in bytes.*

#### Examples

```javascript
// Import the Account class
import { Account } from "@provablehq/sdk/testnet.js";

// Create a connection to the Aleo network and an account
const account = Account.fromCiphertext(process.env.ciphertext, process.env.password);

// Create an account and a message to sign.
const account = new Account();
const message = Uint8Array.from([104, 101, 108, 108, 111 119, 111, 114, 108, 100])
const signature = account.sign(message);

// Verify the signature.
assert(account.verify(message, signature));
```

---

### `verify(message, signature) ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Verifies the Signature on a message.

Parameters | Type | Description
--- | --- | ---
__message__ | `Uint8Array` | *Message in bytes to be signed.*
__signature__ | [Signature](sdk-src_wasm.md) | *Signature to be verified.*
__*return*__ | `boolean` | *True if the signature is valid, false otherwise.*

#### Examples

```javascript
// Import the Account class
import { Account } from "@provablehq/sdk/testnet.js";

// Create a connection to the Aleo network and an account
const account = Account.fromCiphertext(process.env.ciphertext, process.env.password);

// Sign a message.
const message = Uint8Array.from([104, 101, 108, 108, 111 119, 111, 114, 108, 100])
const signature = account.sign(message);

// Verify the signature.
assert(account.verify(message, signature));
```

---

### `privateKeyFromParams(params) ► PrivateKey`

![modifier: private](images/badges/modifier-private.svg)

Creates a PrivateKey from the provided parameters.

Parameters | Type | Description
--- | --- | ---
__params__ | `AccountParam` | *The parameters containing either a private key string or a seed*
__*return*__ | [PrivateKey](sdk-src_wasm.md) | *A PrivateKey instance derived from the provided parameters*

---
