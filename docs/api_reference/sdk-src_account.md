# Module `src/account`

![category:other](https://img.shields.io/badge/category-other-blue.svg?style=flat-square)



[Source file](../../sdk/src/account.ts)

# Class `Account`

Key Management class. Enables the creation of a new Aleo Account, importation of an existing account from
an existing private key or seed, and message signing and verification functionality.

An Aleo Account is generated from a randomly generated seed (number) from which an account private key, view key,
and a public account address are derived. The private key lies at the root of an Aleo account. It is a highly
sensitive secret and should be protected as it allows for creation of Aleo Program executions and arbitrary value
transfers. The View Key allows for decryption of a user&#x27;s activity on the blockchain. The Address is the public
address to which other users of Aleo can send Aleo credits and other records to. This class should only be used
environments where the safety of the underlying key material can be assured.

## Examples

```javascript
// Create a new account
const myRandomAccount = new Account();

// Create an account from a randomly generated seed
const seed = new Uint8Array([94, 91, 52, 251, 240, 230, 226, 35, 117, 253, 224, 210, 175, 13, 205, 120, 155, 214, 7, 169, 66, 62, 206, 50, 188, 40, 29, 122, 40, 250, 54, 18]);
const mySeededAccount = new Account({seed: seed});

// Create an account from an existing private key
const myExistingAccount = new Account({privateKey: 'myExistingPrivateKey'})

// Sign a message
const hello_world = Uint8Array.from([104, 101, 108, 108, 111 119, 111, 114, 108, 100])
const signature = myRandomAccount.sign(hello_world)

// Verify a signature
myRandomAccount.verify(hello_world, signature)
```

## Methods

### `fromCiphertext(ciphertext, password) ► PrivateKey`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Attempts to create an account from a private key ciphertext

Parameters | Type | Description
--- | --- | ---
__ciphertext__ | [PrivateKeyCiphertext](sdk-src_wasm.md) | **
__password__ | `string` | **
__*return*__ | [PrivateKey](sdk-src_wasm.md) | **

#### Examples

```javascript
const ciphertext = PrivateKey.newEncrypted("password");
const account = Account.fromCiphertext(process.env.ciphertext, process.env.password);
```

---

### `encryptAccount(ciphertext) ► PrivateKeyCiphertext`

![modifier: public](images/badges/modifier-public.svg)

Encrypt the account&#x27;s private key with a password

Parameters | Type | Description
--- | --- | ---
__ciphertext__ | `string` | **
__*return*__ | [PrivateKeyCiphertext](sdk-src_wasm.md) | **

#### Examples

```javascript
const account = new Account();
const ciphertext = account.encryptAccount("password");
```

---

### `decryptRecord(ciphertext) ► Record`

![modifier: public](images/badges/modifier-public.svg)

Decrypts a Record in ciphertext form into plaintext

Parameters | Type | Description
--- | --- | ---
__ciphertext__ | `string` | **
__*return*__ | `Record` | **

#### Examples

```javascript
const account = new Account();
const record = account.decryptRecord("record1ciphertext");
```

---

### `decryptRecords(ciphertexts) ► Array.<Record>`

![modifier: public](images/badges/modifier-public.svg)

Decrypts an array of Records in ciphertext form into plaintext

Parameters | Type | Description
--- | --- | ---
__ciphertexts__ | `Array.<string>` | **
__*return*__ | `Array.<Record>` | **

#### Examples

```javascript
const account = new Account();
const record = account.decryptRecords(["record1ciphertext", "record2ciphertext"]);
```

---

### `ownsRecordCiphertext(ciphertext) ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Determines whether the account owns a ciphertext record

Parameters | Type | Description
--- | --- | ---
__ciphertext__ | `RecordCipherText` | **
__*return*__ | `boolean` | **

#### Examples

```javascript
// Create a connection to the Aleo network and an account
const connection = new AleoNetworkClient("https://api.explorer.provable.com/v1");
const account = Account.fromCiphertext(process.env.ciphertext, process.env.password);

// Get a record from the network
const record = connection.getBlock(1234);
const recordCipherText = record.transactions[0].execution.transitions[0].id;

// Check if the account owns the record
if account.ownsRecord(recordCipherText) {
    // Then one can do something like:
    // Decrypt the record and check if it's spent
    // Store the record in a local database
    // Etc.
}
```

---

### `sign(message) ► Signature`

![modifier: public](images/badges/modifier-public.svg)

Signs a message with the account&#x27;s private key.
Returns a Signature.

Parameters | Type | Description
--- | --- | ---
__message__ | `Uint8Array` | **
__*return*__ | [Signature](sdk-src_wasm.md) | **

#### Examples

```javascript
const account = new Account();
const message = Uint8Array.from([104, 101, 108, 108, 111 119, 111, 114, 108, 100])
account.sign(message);
```

---

### `verify(message, signature) ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Verifies the Signature on a message.

Parameters | Type | Description
--- | --- | ---
__message__ | `Uint8Array` | **
__signature__ | [Signature](sdk-src_wasm.md) | **
__*return*__ | `boolean` | **

#### Examples

```javascript
const account = new Account();
const message = Uint8Array.from([104, 101, 108, 108, 111 119, 111, 114, 108, 100])
const signature = account.sign(message);
account.verify(message, signature);
```

---

### `fromCiphertext(ciphertext, password) ► PrivateKey`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Attempts to create an account from a private key ciphertext

Parameters | Type | Description
--- | --- | ---
__ciphertext__ | [PrivateKeyCiphertext](sdk-src_wasm.md) | **
__password__ | `string` | **
__*return*__ | [PrivateKey](sdk-src_wasm.md) | **

#### Examples

```javascript
const ciphertext = PrivateKey.newEncrypted("password");
const account = Account.fromCiphertext(process.env.ciphertext, process.env.password);
```

---

### `encryptAccount(ciphertext) ► PrivateKeyCiphertext`

![modifier: public](images/badges/modifier-public.svg)

Encrypt the account&#x27;s private key with a password

Parameters | Type | Description
--- | --- | ---
__ciphertext__ | `string` | **
__*return*__ | [PrivateKeyCiphertext](sdk-src_wasm.md) | **

#### Examples

```javascript
const account = new Account();
const ciphertext = account.encryptAccount("password");
```

---

### `decryptRecord(ciphertext) ► Record`

![modifier: public](images/badges/modifier-public.svg)

Decrypts a Record in ciphertext form into plaintext

Parameters | Type | Description
--- | --- | ---
__ciphertext__ | `string` | **
__*return*__ | `Record` | **

#### Examples

```javascript
const account = new Account();
const record = account.decryptRecord("record1ciphertext");
```

---

### `decryptRecords(ciphertexts) ► Array.<Record>`

![modifier: public](images/badges/modifier-public.svg)

Decrypts an array of Records in ciphertext form into plaintext

Parameters | Type | Description
--- | --- | ---
__ciphertexts__ | `Array.<string>` | **
__*return*__ | `Array.<Record>` | **

#### Examples

```javascript
const account = new Account();
const record = account.decryptRecords(["record1ciphertext", "record2ciphertext"]);
```

---

### `ownsRecordCiphertext(ciphertext) ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Determines whether the account owns a ciphertext record

Parameters | Type | Description
--- | --- | ---
__ciphertext__ | `RecordCipherText` | **
__*return*__ | `boolean` | **

#### Examples

```javascript
// Create a connection to the Aleo network and an account
const connection = new AleoNetworkClient("https://api.explorer.provable.com/v1");
const account = Account.fromCiphertext(process.env.ciphertext, process.env.password);

// Get a record from the network
const record = connection.getBlock(1234);
const recordCipherText = record.transactions[0].execution.transitions[0].id;

// Check if the account owns the record
if account.ownsRecord(recordCipherText) {
    // Then one can do something like:
    // Decrypt the record and check if it's spent
    // Store the record in a local database
    // Etc.
}
```

---

### `sign(message) ► Signature`

![modifier: public](images/badges/modifier-public.svg)

Signs a message with the account&#x27;s private key.
Returns a Signature.

Parameters | Type | Description
--- | --- | ---
__message__ | `Uint8Array` | **
__*return*__ | [Signature](sdk-src_wasm.md) | **

#### Examples

```javascript
const account = new Account();
const message = Uint8Array.from([104, 101, 108, 108, 111 119, 111, 114, 108, 100])
account.sign(message);
```

---

### `verify(message, signature) ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Verifies the Signature on a message.

Parameters | Type | Description
--- | --- | ---
__message__ | `Uint8Array` | **
__signature__ | [Signature](sdk-src_wasm.md) | **
__*return*__ | `boolean` | **

#### Examples

```javascript
const account = new Account();
const message = Uint8Array.from([104, 101, 108, 108, 111 119, 111, 114, 108, 100])
const signature = account.sign(message);
account.verify(message, signature);
```

---
