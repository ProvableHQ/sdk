# Module `src/wasm`

![category:other](https://img.shields.io/badge/category-other-blue.svg?style=flat-square)



[Source file](../../sdk/src/wasm.ts)

# Class `Address`

Public address of an Aleo account

## Methods

### `from_private_key(private_key) ► Address`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Derive an Aleo address from a private key

Parameters | Type | Description
--- | --- | ---
__private_key__ | [PrivateKey](sdk-src_wasm.md) | *The private key to derive the address from*
__*return*__ | [Address](sdk-src_wasm.md) | *Address corresponding to the private key*

---

### `from_view_key(view_key) ► Address`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Derive an Aleo address from a view key

Parameters | Type | Description
--- | --- | ---
__view_key__ | [ViewKey](sdk-src_wasm.md) | *The view key to derive the address from*
__*return*__ | [Address](sdk-src_wasm.md) | *Address corresponding to the view key*

---

### `from_compute_key(compute_key) ► Address`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Derive an Aleo address from a compute key.

Parameters | Type | Description
--- | --- | ---
__compute_key__ | [ComputeKey](sdk-src_wasm.md) | *The compute key to derive the address from*
__*return*__ | [Address](sdk-src_wasm.md) | **

---

### `from_string(address) ► Address`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create an aleo address object from a string representation of an address

Parameters | Type | Description
--- | --- | ---
__address__ | `string` | *String representation of an addressm*
__*return*__ | [Address](sdk-src_wasm.md) | *Address*

---

### `to_string(Address) ► string`

![modifier: public](images/badges/modifier-public.svg)

Get a string representation of an Aleo address object

Parameters | Type | Description
--- | --- | ---
__Address__ | [Address](sdk-src_wasm.md) | **
__*return*__ | `string` | *String representation of the address*

---

### `verify(Byte) ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Verify a signature for a message signed by the address

Parameters | Type | Description
--- | --- | ---
__Byte__ | `Uint8Array` | *array representing a message signed by the address*
__*return*__ | `boolean` | *Boolean representing whether or not the signature is valid*

---

# Class `Ciphertext`

SnarkVM Ciphertext object. A Ciphertext represents an symmetrically encrypted plaintext. This
object provides decryption methods to recover the plaintext from the ciphertext (given the
api consumer has the proper decryption materials).

## Methods

### `decrypt(The, The) ► Plaintext`

![modifier: public](images/badges/modifier-public.svg)

Decrypt the ciphertext using the given view key.

Parameters | Type | Description
--- | --- | ---
__The__ | [ViewKey](sdk-src_wasm.md) | *view key of the account that encrypted the ciphertext.*
__The__ | [Group](sdk-src_wasm.md) | *nonce used to encrypt the ciphertext.*
__*return*__ | [Plaintext](sdk-src_wasm.md) | *The decrypted plaintext.*

---

### `decryptSymmetric(transition_view_key) ► Plaintext`

![modifier: public](images/badges/modifier-public.svg)

Decrypts a ciphertext into plaintext using the given transition view key.

Parameters | Type | Description
--- | --- | ---
__transition_view_key__ | [Field](sdk-src_wasm.md) | *The transition view key that was used to encrypt the ciphertext.*
__*return*__ | [Plaintext](sdk-src_wasm.md) | *The decrypted plaintext.*

---

### `fromBytesLe(bytes) ► Ciphertext`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Deserialize a left endian byte array into a Ciphertext.

Parameters | Type | Description
--- | --- | ---
__bytes__ | `Uint8Array` | *The byte array representing the Ciphertext.*
__*return*__ | [Ciphertext](sdk-src_wasm.md) | *The Ciphertext object.*

---

### `fromString(ciphertext) ► Ciphertext`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Deserialize a Ciphertext string into a Ciphertext object.

Parameters | Type | Description
--- | --- | ---
__ciphertext__ | `string` | *A string representation of the ciphertext.*
__*return*__ | [Ciphertext](sdk-src_wasm.md) | *The Ciphertext object.*

---

### `toBytes() ► Uint8Array`

![modifier: public](images/badges/modifier-public.svg)

Serialize a Ciphertext object into a byte array.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Uint8Array` | *The serialized Ciphertext.*

---

### `toString() ► string`

![modifier: public](images/badges/modifier-public.svg)

Serialize a Ciphertext into a js string.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `string` | *The serialized Ciphertext.*

---

# Class `ComputeKey`

Compute key of an Aleo account

## Methods

### `from_private_key(private_key) ► ComputeKey`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a new compute key from a private key.

Parameters | Type | Description
--- | --- | ---
__private_key__ | [PrivateKey](sdk-src_wasm.md) | *Private key*
__*return*__ | [ComputeKey](sdk-src_wasm.md) | *Compute key*

---

### `address() ► Address`

![modifier: public](images/badges/modifier-public.svg)

Get the address from the compute key.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Address](sdk-src_wasm.md) | **

---

### `sk_prf() ► Scalar`

![modifier: public](images/badges/modifier-public.svg)

Get the sk_prf of the compute key.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Scalar](sdk-src_wasm.md) | *sk_prf*

---

### `pk_sig() ► Group`

![modifier: public](images/badges/modifier-public.svg)

Get the pr_tag of the compute key.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Group](sdk-src_wasm.md) | *pr_tag*

---

### `pr_sig() ► Group`

![modifier: public](images/badges/modifier-public.svg)

Get the pr_sig of the compute key.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Group](sdk-src_wasm.md) | *pr_sig*

---

# Class `Execution`

Execution of an Aleo program.

## Methods

### `toString() ► string`

![modifier: public](images/badges/modifier-public.svg)

Returns the string representation of the execution.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `string` | *The string representation of the execution.*

---

### `fromString(execution) ► Execution`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Creates an execution object from a string representation of an execution.

Parameters | Type | Description
--- | --- | ---
__execution__ | `string` | **
__*return*__ | [Execution](sdk-src_wasm.md) | *The wasm representation of an execution object.*

---

### `globalStateRoot() ► Execution`

![modifier: public](images/badges/modifier-public.svg)

Returns the global state root of the execution.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Execution](sdk-src_wasm.md) | *The global state root used in the execution.*

---

### `proof() ► string`

![modifier: public](images/badges/modifier-public.svg)

Returns the proof of the execution.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `string` | *The execution proof.*

---

### `transitions() ► `

![modifier: public](images/badges/modifier-public.svg)

Returns the transitions present in the execution.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `undefined` | *Array&lt;Transition&gt; the array of transitions present in the execution.*

---

# Class `ExecutionResponse`

Webassembly Representation of an Aleo function execution response

This object is returned by the execution of an Aleo function off-chain. It provides methods for
retrieving the outputs of the function execution.

## Methods

### `getOutputs() ► Array`

![modifier: public](images/badges/modifier-public.svg)

Get the outputs of the executed function

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Array` | *Array of strings representing the outputs of the function*

---

### `getExecution() ► Execution`

![modifier: public](images/badges/modifier-public.svg)

Returns the execution object if present, null if otherwise.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Execution](sdk-src_wasm.md) | *The execution object if present, null if otherwise*

---

### `getKeys() ► KeyPair`

![modifier: public](images/badges/modifier-public.svg)

Returns the program keys if present

Parameters | Type | Description
--- | --- | ---
__*return*__ | [KeyPair](sdk-src_wasm.md) | **

---

### `getProvingKey() ► ProvingKey`

![modifier: public](images/badges/modifier-public.svg)

Returns the proving_key if the proving key was cached in the Execution response.
Note the proving key is removed from the response object after the first call to this
function. Subsequent calls will return null.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [ProvingKey](sdk-src_wasm.md) | *The proving key*

---

### `getVerifyingKey() ► VerifyingKey`

![modifier: public](images/badges/modifier-public.svg)

Returns the verifying_key associated with the program

Parameters | Type | Description
--- | --- | ---
__*return*__ | [VerifyingKey](sdk-src_wasm.md) | *The verifying key*

---

### `getFunctionId() ► string`

![modifier: public](images/badges/modifier-public.svg)

Returns the function identifier

Parameters | Type | Description
--- | --- | ---
__*return*__ | `string` | **

---

### `getProgram() ► Program`

![modifier: public](images/badges/modifier-public.svg)

Returns the program

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Program](sdk-src_wasm.md) | **

---

# Class `Field`

Field element.

## Methods

### `fromString(field) ► Field`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Creates a field object from a string representation of a field.

Parameters | Type | Description
--- | --- | ---
__field__ | `string` | **
__*return*__ | [Field](sdk-src_wasm.md) | **

---

### `toPlaintext() ► Plaintext`

![modifier: public](images/badges/modifier-public.svg)

Create a plaintext element from a group element.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Plaintext](sdk-src_wasm.md) | **

---

### `toString() ► string`

![modifier: public](images/badges/modifier-public.svg)

Returns the string representation of the field.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `string` | **

---

### `random() ► Field`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Generate a random field element.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Field](sdk-src_wasm.md) | **

---

### `add(other) ► Field`

![modifier: public](images/badges/modifier-public.svg)

Add two field elements.

Parameters | Type | Description
--- | --- | ---
__other__ | [Field](sdk-src_wasm.md) | **
__*return*__ | [Field](sdk-src_wasm.md) | **

---

### `subtract(other) ► Field`

![modifier: public](images/badges/modifier-public.svg)

Subtract two field elements.

Parameters | Type | Description
--- | --- | ---
__other__ | [Field](sdk-src_wasm.md) | **
__*return*__ | [Field](sdk-src_wasm.md) | **

---

### `multiply(other) ► Field`

![modifier: public](images/badges/modifier-public.svg)

Multiply two field elements.

Parameters | Type | Description
--- | --- | ---
__other__ | [Field](sdk-src_wasm.md) | **
__*return*__ | [Field](sdk-src_wasm.md) | **

---

### `divide(other) ► Field`

![modifier: public](images/badges/modifier-public.svg)

Divide two field elements.

Parameters | Type | Description
--- | --- | ---
__other__ | [Field](sdk-src_wasm.md) | **
__*return*__ | [Field](sdk-src_wasm.md) | **

---

### `pow(other) ► Field`

![modifier: public](images/badges/modifier-public.svg)

Power of a field element.

Parameters | Type | Description
--- | --- | ---
__other__ | [Field](sdk-src_wasm.md) | **
__*return*__ | [Field](sdk-src_wasm.md) | **

---

### `inverse() ► Field`

![modifier: public](images/badges/modifier-public.svg)

Invert the field element.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Field](sdk-src_wasm.md) | **

---

### `zero() ► Field`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Get the zero element of the field.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Field](sdk-src_wasm.md) | **

---

### `one() ► Field`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Get the one element of the field.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Field](sdk-src_wasm.md) | **

---

### `double() ► Field`

![modifier: public](images/badges/modifier-public.svg)

Double the field element.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Field](sdk-src_wasm.md) | **

---

### `equals(other) ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Check if one field element equals another.

Parameters | Type | Description
--- | --- | ---
__other__ | [Field](sdk-src_wasm.md) | **
__*return*__ | `boolean` | **

---

# Class `GraphKey`

Graph key used to calculate the tag of a record

## Methods

### `from_view_key(view_key) ► GraphKey`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a new graph key from a view key.

Parameters | Type | Description
--- | --- | ---
__view_key__ | [ViewKey](sdk-src_wasm.md) | *View key*
__*return*__ | [GraphKey](sdk-src_wasm.md) | *Graph key*

---

### `from_string(graph_key) ► GraphKey`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a new graph key from a string representation of a graph key

Parameters | Type | Description
--- | --- | ---
__graph_key__ | `string` | *String representation of a graph key*
__*return*__ | [GraphKey](sdk-src_wasm.md) | *Graph key*

---

### `to_string() ► string`

![modifier: public](images/badges/modifier-public.svg)

Get a string representation of a graph key

Parameters | Type | Description
--- | --- | ---
__*return*__ | `string` | *String representation of a graph key*

---

### `sk_tag() ► Field`

![modifier: public](images/badges/modifier-public.svg)

Get the sk_tag of the graph key. Used to determine ownership of records.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Field](sdk-src_wasm.md) | **

---

# Class `Group`

Elliptic curve element.

## Methods

### `fromString(group) ► Group`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Creates a group object from a string representation of a group.

Parameters | Type | Description
--- | --- | ---
__group__ | `string` | **
__*return*__ | [Group](sdk-src_wasm.md) | **

---

### `toString() ► string`

![modifier: public](images/badges/modifier-public.svg)

Returns the string representation of the group.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `string` | **

---

### `toXCoordinate() ► Field`

![modifier: public](images/badges/modifier-public.svg)

Get the x-coordinate of the group element.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Field](sdk-src_wasm.md) | **

---

### `toPlaintext() ► Plaintext`

![modifier: public](images/badges/modifier-public.svg)

Create a plaintext element from a group element.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Plaintext](sdk-src_wasm.md) | **

---

### `random() ► Group`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Generate a random group element.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Group](sdk-src_wasm.md) | **

---

### `add(other) ► Group`

![modifier: public](images/badges/modifier-public.svg)

Add two group elements.

Parameters | Type | Description
--- | --- | ---
__other__ | [Group](sdk-src_wasm.md) | **
__*return*__ | [Group](sdk-src_wasm.md) | **

---

### `subtract(other) ► Group`

![modifier: public](images/badges/modifier-public.svg)

Subtract two group elements (equivalently: add the inverse of an element).

Parameters | Type | Description
--- | --- | ---
__other__ | [Group](sdk-src_wasm.md) | **
__*return*__ | [Group](sdk-src_wasm.md) | **

---

### `scalarMultiply(scalar) ► Group`

![modifier: public](images/badges/modifier-public.svg)

Multiply a group element by a scalar element.

Parameters | Type | Description
--- | --- | ---
__scalar__ | [Scalar](sdk-src_wasm.md) | **
__*return*__ | [Group](sdk-src_wasm.md) | **

---

### `double() ► Group`

![modifier: public](images/badges/modifier-public.svg)

Double the group element.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Group](sdk-src_wasm.md) | **

---

### `inverse() ► Group`

![modifier: public](images/badges/modifier-public.svg)

Get the inverse of the group element. This is the reflection of the point about the axis
of symmetry i.e. (x,y) -&gt; (x, -y).

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Group](sdk-src_wasm.md) | **

---

### `equals(other) ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Check if one group element equals another.

Parameters | Type | Description
--- | --- | ---
__other__ | [Group](sdk-src_wasm.md) | **
__*return*__ | `boolean` | **

---

### `zero() ► Group`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Get the group identity element under the group operation (i.e. the point at infinity.)

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Group](sdk-src_wasm.md) | **

---

### `generator() ► Group`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Get the generator of the group.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Group](sdk-src_wasm.md) | **

---

# Class `KeyPair`

Key pair object containing both the function proving and verifying keys

## Constructors


### `KeyPair(proving_key, verifying_key)`

Create new key pair from proving and verifying keys

Parameters | Type | Description
--- | --- | ---
__proving_key__ | [ProvingKey](sdk-src_wasm.md) | *Proving key corresponding to a function in an Aleo program*
__verifying_key__ | [VerifyingKey](sdk-src_wasm.md) | *Verifying key corresponding to a function in an Aleo program*
__*return*__ | [KeyPair](sdk-src_wasm.md) | *Key pair object containing both the function proving and verifying keys*

---

## Methods

### `provingKey() ► ProvingKey`

![modifier: public](images/badges/modifier-public.svg)

Get the proving key. This method will remove the proving key from the key pair

Parameters | Type | Description
--- | --- | ---
__*return*__ | [ProvingKey](sdk-src_wasm.md) | **

---

### `verifyingKey() ► VerifyingKey`

![modifier: public](images/badges/modifier-public.svg)

Get the verifying key. This method will remove the verifying key from the key pair

Parameters | Type | Description
--- | --- | ---
__*return*__ | [VerifyingKey](sdk-src_wasm.md) | **

---

# Class `Metadata`

Helper struct that specifies where to find proving and verifying key material for credits.aleo

# Class `OfflineQuery`

An offline query object used to insert the global state root and state paths needed to create
a valid inclusion proof offline.

## Constructors


### `OfflineQuery(block_height, state_root)`

Creates a new offline query object. The state root is required to be passed in as a string

Parameters | Type | Description
--- | --- | ---
__block_height__ | `number` | **
__state_root__ | `string` | **

---

## Methods

### `addBlockHeight(block_height) ► void`

![modifier: public](images/badges/modifier-public.svg)

Add a new block height to the offline query object.

Parameters | Type | Description
--- | --- | ---
__block_height__ | `number` | **
__*return*__ | `void` | **

---

### `addStatePath(commitment:, state_path:) ► void`

![modifier: public](images/badges/modifier-public.svg)

Add a new state path to the offline query object.

Parameters | Type | Description
--- | --- | ---
__commitment:__ | `string` | *The commitment corresponding to a record inpout*
__state_path:__ | `string` | *The state path corresponding to the commitment*
__*return*__ | `void` | **

---

### `toString() ► string`

![modifier: public](images/badges/modifier-public.svg)

Get a json string representation of the offline query object

Parameters | Type | Description
--- | --- | ---
__*return*__ | `string` | **

---

### `fromString(s) ► OfflineQuery`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create an offline query object from a json string representation

Parameters | Type | Description
--- | --- | ---
__s__ | `string` | **
__*return*__ | [OfflineQuery](sdk-src_wasm.md) | **

---

# Class `Plaintext`

SnarkVM Plaintext object. Plaintext is a fundamental monadic type used to represent Aleo
primitive types (boolean, field, group, i8, i16, i32, i64, i128, u8, u16, u32, u64, u128,
scalar, and signature), struct types, and array types.

In the context of a web or NodeJS application, this type is useful for turning an Aleo type into
a JS value, object, or array that might be necessary for performing computations within the
application.

## Examples

```javascript
// Get the bond state of an existing address.
const bondState = await fetch(https://api.explorer.provable.com/v1/mainnet/program/credits.aleo/mapping/bond_state/aleo12zlythl7htjdtjjjz3ahdj4vl6wk3zuzm37s80l86qpx8fyx95fqnxcn2f);
// Convert the bond state to a Plaintext object.
const bondStatePlaintext = Plaintext.fromString(bond_state);
// Convert the Plaintext object to a JS object.
const bondStateObject = bond_state_plaintext.toObject();
// Check if the bond state matches the expected object.
const expectedObject = { validator: "aleo12zlythl7htjdtjjjz3ahdj4vl6wk3zuzm37s80l86qpx8fyx95fqnxcn2f", microcredits: 100000000u64 };
assert( JSON.stringify(bondStateObject) === JSON.stringify(expectedObject) );
```

## Methods

### `find(name) ► Plaintext`

![modifier: public](images/badges/modifier-public.svg)

Find plaintext member if the plaintext is a struct. Returns &#x60;null&#x60; if the plaintext is not
a struct or the member does not exist.

Parameters | Type | Description
--- | --- | ---
__name__ | `string` | *The name of the plaintext member to find.*
__*return*__ | [Plaintext](sdk-src_wasm.md) | *The plaintext member.*

---

### `encrypt(address, randomizer) ► Ciphertext`

![modifier: public](images/badges/modifier-public.svg)

Encrypt a plaintext with an address and randomizer.

Parameters | Type | Description
--- | --- | ---
__address__ | [Address](sdk-src_wasm.md) | **
__randomizer__ | [Scalar](sdk-src_wasm.md) | **
__*return*__ | [Ciphertext](sdk-src_wasm.md) | **

---

### `encryptSymmetric(transition_view_key) ► Ciphertext`

![modifier: public](images/badges/modifier-public.svg)

Encrypt a plaintext with a transition view key.

Parameters | Type | Description
--- | --- | ---
__transition_view_key__ | [Field](sdk-src_wasm.md) | **
__*return*__ | [Ciphertext](sdk-src_wasm.md) | **

---

### `fromString(plaintext) ► Plaintext`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Creates a plaintext object from a string representation of a plaintext.

Parameters | Type | Description
--- | --- | ---
__plaintext__ | `string` | *The string representation of the plaintext.*
__*return*__ | [Plaintext](sdk-src_wasm.md) | *The plaintext object.*

---

### `fromBytesLe(bytes) ► Plaintext`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Get a plaintext object from a series of bytes.

Parameters | Type | Description
--- | --- | ---
__bytes__ | `Uint8Array` | *A left endian byte array representing the plaintext.*
__*return*__ | [Plaintext](sdk-src_wasm.md) | *The plaintext object.*

---

### `toBytesLe(bytes) ► Uint8Array`

![modifier: public](images/badges/modifier-public.svg)

Generate a random plaintext element from a series of bytes.

Parameters | Type | Description
--- | --- | ---
__bytes__ | `Uint8Array` | *A left endian byte array representing the plaintext.*
__*return*__ | `Uint8Array` | **

---

### `toString() ► string`

![modifier: public](images/badges/modifier-public.svg)

Returns the string representation of the plaintext.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `string` | *The string representation of the plaintext.*

---

### `plaintextType() ► string`

![modifier: public](images/badges/modifier-public.svg)

Gives the type of the plaintext.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `string` | *The type of the plaintext.*

---

### `toObject() ► Object`

![modifier: public](images/badges/modifier-public.svg)

Attempt to convert the plaintext to a JS object.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Object` | *The JS object representation of the plaintext.*

---

# Class `PrivateKey`

Private key of an Aleo account

## Constructors


### `PrivateKey()`

Generate a new private key using a cryptographically secure random number generator

Parameters | Type | Description
--- | --- | ---
__*return*__ | [PrivateKey](sdk-src_wasm.md) | **

---

## Methods

### `from_seed_unchecked(seed) ► PrivateKey`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Get a private key from a series of unchecked bytes

Parameters | Type | Description
--- | --- | ---
__seed__ | `Uint8Array` | *Unchecked 32 byte long Uint8Array acting as the seed for the private key*
__*return*__ | [PrivateKey](sdk-src_wasm.md) | **

---

### `from_string(seed) ► PrivateKey`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Get a private key from a string representation of a private key

Parameters | Type | Description
--- | --- | ---
__seed__ | `string` | *String representation of a private key*
__*return*__ | [PrivateKey](sdk-src_wasm.md) | **

---

### `to_string() ► string`

![modifier: public](images/badges/modifier-public.svg)

Get a string representation of the private key. This function should be used very carefully
as it exposes the private key plaintext

Parameters | Type | Description
--- | --- | ---
__*return*__ | `string` | *String representation of a private key*

---

### `to_view_key() ► ViewKey`

![modifier: public](images/badges/modifier-public.svg)

Get the view key corresponding to the private key

Parameters | Type | Description
--- | --- | ---
__*return*__ | [ViewKey](sdk-src_wasm.md) | **

---

### `to_address() ► Address`

![modifier: public](images/badges/modifier-public.svg)

Get the address corresponding to the private key

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Address](sdk-src_wasm.md) | **

---

### `sign(Byte) ► Signature`

![modifier: public](images/badges/modifier-public.svg)

Sign a message with the private key

Parameters | Type | Description
--- | --- | ---
__Byte__ | `Uint8Array` | *array representing a message signed by the address*
__*return*__ | [Signature](sdk-src_wasm.md) | *Signature generated by signing the message with the address*

---

### `newEncrypted(secret) ► PrivateKeyCiphertext`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Get a new randomly generated private key ciphertext using a secret. The secret is sensitive
and will be needed to decrypt the private key later, so it should be stored securely

Parameters | Type | Description
--- | --- | ---
__secret__ | `string` | *Secret used to encrypt the private key*
__*return*__ | [PrivateKeyCiphertext](sdk-src_wasm.md) | *Ciphertext representation of the private key*

---

### `toCiphertext(secret) ► PrivateKeyCiphertext`

![modifier: public](images/badges/modifier-public.svg)

Encrypt an existing private key with a secret. The secret is sensitive and will be needed to
decrypt the private key later, so it should be stored securely

Parameters | Type | Description
--- | --- | ---
__secret__ | `string` | *Secret used to encrypt the private key*
__*return*__ | [PrivateKeyCiphertext](sdk-src_wasm.md) | *Ciphertext representation of the private key*

---

### `fromPrivateKeyCiphertext(ciphertext, secret) ► PrivateKey`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Get private key from a private key ciphertext and secret originally used to encrypt it

Parameters | Type | Description
--- | --- | ---
__ciphertext__ | [PrivateKeyCiphertext](sdk-src_wasm.md) | *Ciphertext representation of the private key*
__secret__ | `string` | *Secret originally used to encrypt the private key*
__*return*__ | [PrivateKey](sdk-src_wasm.md) | *Private key*

---

# Class `PrivateKeyCiphertext`

Private Key in ciphertext form

## Methods

### `encryptPrivateKey(private_key, secret) ► PrivateKeyCiphertext`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Encrypt a private key using a secret string. The secret is sensitive and will be needed to
decrypt the private key later, so it should be stored securely

Parameters | Type | Description
--- | --- | ---
__private_key__ | [PrivateKey](sdk-src_wasm.md) | *Private key to encrypt*
__secret__ | `string` | *Secret to encrypt the private key with*
__*return*__ | [PrivateKeyCiphertext](sdk-src_wasm.md) | *Private key ciphertext*

---

### `decryptToPrivateKey(secret) ► PrivateKey`

![modifier: public](images/badges/modifier-public.svg)

Decrypts a private ciphertext using a secret string. This must be the same secret used to
encrypt the private key

Parameters | Type | Description
--- | --- | ---
__secret__ | `string` | *Secret used to encrypt the private key*
__*return*__ | [PrivateKey](sdk-src_wasm.md) | *Private key*

---

### `toString() ► string`

![modifier: public](images/badges/modifier-public.svg)

Returns the ciphertext string

Parameters | Type | Description
--- | --- | ---
__*return*__ | `string` | *Ciphertext string*

---

### `fromString(ciphertext) ► PrivateKeyCiphertext`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Creates a PrivateKeyCiphertext from a string

Parameters | Type | Description
--- | --- | ---
__ciphertext__ | `string` | *Ciphertext string*
__*return*__ | [PrivateKeyCiphertext](sdk-src_wasm.md) | *Private key ciphertext*

---

# Class `Program`

Webassembly Representation of an Aleo program

## Methods

### `fromString(program) ► Program`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a program from a program string

Parameters | Type | Description
--- | --- | ---
__program__ | `string` | *Aleo program source code*
__*return*__ | [Program](sdk-src_wasm.md) | *Program object*

---

### `toString() ► string`

![modifier: public](images/badges/modifier-public.svg)

Get a string representation of the program

Parameters | Type | Description
--- | --- | ---
__*return*__ | `string` | *String containing the program source code*

---

### `hasFunction(functionName) ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Determine if a function is present in the program

Parameters | Type | Description
--- | --- | ---
__functionName__ | `string` | *Name of the function to check for*
__*return*__ | `boolean` | *True if the program is valid, false otherwise*

---

### `getFunctions() ► Array`

![modifier: public](images/badges/modifier-public.svg)

Get javascript array of functions names in the program

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Array` | *Array of all function names present in the program*

#### Examples

```javascript
const expected_functions = [
  "mint",
  "transfer_private",
  "transfer_private_to_public",
  "transfer_public",
  "transfer_public_to_private",
  "join",
  "split",
  "fee"
]

const credits_program = aleo_wasm.Program.getCreditsProgram();
const credits_functions = credits_program.getFunctions();
console.log(credits_functions === expected_functions); // Output should be "true"
```

---

### `getFunctionInputs(function_name) ► Array`

![modifier: public](images/badges/modifier-public.svg)

Get a javascript object representation of the function inputs and types. This can be used
to generate a web form to capture user inputs for an execution of a function.

Parameters | Type | Description
--- | --- | ---
__function_name__ | `string` | *Name of the function to get inputs for*
__*return*__ | `Array` | *Array of function inputs*

#### Examples

```javascript
const expected_inputs = [
    {
      type:"record",
      visibility:"private",
      record:"credits",
      members:[
        {
          name:"microcredits",
          type:"u64",
          visibility:"private"
        }
      ],
      register:"r0"
    },
    {
      type:"address",
      visibility:"private",
      register:"r1"
    },
    {
      type:"u64",
      visibility:"private",
      register:"r2"
    }
];

const credits_program = aleo_wasm.Program.getCreditsProgram();
const transfer_function_inputs = credits_program.getFunctionInputs("transfer_private");
console.log(transfer_function_inputs === expected_inputs); // Output should be "true"
```

---

### `getMappings() ► Array`

![modifier: public](images/badges/modifier-public.svg)

Get a the list of a program&#x27;s mappings and the names/types of their keys and values.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Array` | *- An array of objects representing the mappings in the program*

#### Examples

```javascript
const expected_mappings = [
   {
      name: "account",
      key_name: "owner",
      key_type: "address",
      value_name: "microcredits",
      value_type: "u64"
   }
]

const credits_program = aleo_wasm.Program.getCreditsProgram();
const credits_mappings = credits_program.getMappings();
console.log(credits_mappings === expected_mappings); // Output should be "true"
```

---

### `getRecordMembers(record_name) ► Object`

![modifier: public](images/badges/modifier-public.svg)

Get a javascript object representation of a program record and its types

Parameters | Type | Description
--- | --- | ---
__record_name__ | `string` | *Name of the record to get members for*
__*return*__ | `Object` | *Object containing the record name, type, and members*

#### Examples

```javascript
const expected_record = {
    type: "record",
    record: "Credits",
    members: [
      {
        name: "owner",
        type: "address",
        visibility: "private"
      },
      {
        name: "microcredits",
        type: "u64",
        visibility: "private"
      }
    ];
 };

const credits_program = aleo_wasm.Program.getCreditsProgram();
const credits_record = credits_program.getRecordMembers("Credits");
console.log(credits_record === expected_record); // Output should be "true"
```

---

### `getStructMembers(struct_name) ► Array`

![modifier: public](images/badges/modifier-public.svg)

Get a javascript object representation of a program struct and its types

Parameters | Type | Description
--- | --- | ---
__struct_name__ | `string` | *Name of the struct to get members for*
__*return*__ | `Array` | *Array containing the struct members*

#### Examples

```javascript
const STRUCT_PROGRAM = "program token_issue.aleo;

struct token_metadata:
    network as u32;
    version as u32;

struct token:
    token_id as u32;
    metadata as token_metadata;

function no_op:
   input r0 as u64;
   output r0 as u64;"

const expected_struct_members = [
   {
     name: "token_id",
     type: "u32",
   },
   {
     name: "metadata",
     type: "struct",
     struct_id: "token_metadata",
     members: [
      {
        name: "network",
        type: "u32",
      }
      {
        name: "version",
        type: "u32",
      }
    ]
  }
];

const program = aleo_wasm.Program.fromString(STRUCT_PROGRAM);
const struct_members = program.getStructMembers("token");
console.log(struct_members === expected_struct_members); // Output should be "true"
```

---

### `getCreditsProgram() ► Program`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Get the credits.aleo program

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Program](sdk-src_wasm.md) | *The credits.aleo program*

---

### `id() ► string`

![modifier: public](images/badges/modifier-public.svg)

Get the id of the program

Parameters | Type | Description
--- | --- | ---
__*return*__ | `string` | *The id of the program*

---

### `address() ► Address`

![modifier: public](images/badges/modifier-public.svg)

Get a unique address of the program

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Address](sdk-src_wasm.md) | *The address of the program*

---

### `isEqual(other) ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Determine equality with another program

Parameters | Type | Description
--- | --- | ---
__other__ | [Program](sdk-src_wasm.md) | *The other program to compare*
__*return*__ | `boolean` | *True if the programs are equal, false otherwise*

---

### `getImports() ► Array`

![modifier: public](images/badges/modifier-public.svg)

Get program_imports

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Array` | *The program imports*

#### Examples

```javascript
const DOUBLE_TEST = "import multiply_test.aleo;

program double_test.aleo;

function double_it:
    input r0 as u32.private;
    call multiply_test.aleo/multiply 2u32 r0 into r1;
    output r1 as u32.private;";

const expected_imports = [
   "multiply_test.aleo"
];

const program = aleo_wasm.Program.fromString(DOUBLE_TEST_PROGRAM);
const imports = program.getImports();
console.log(imports === expected_imports); // Output should be "true"
```

---

# Class `ProgramManager`

Managment object that handles the deployment and execution of Aleo programs

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

// Create the deployment transaction.
const tx = await programManager.buildDeploymentTransaction(program, fee, false);
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
const tx_id = await programManager.deploy(program, fee, false);

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

### `buildDeploymentTransaction(program, fee, privateFee, recordSearchParams, feeRecord, privateKey) ► string`

![modifier: public](images/badges/modifier-public.svg)

Builds a deployment transaction for submission to the Aleo network.

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

// Create the deployment transaction.
const tx = await programManager.buildDeploymentTransaction(program, fee, false);
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
const tx_id = await programManager.deploy(program, fee, false);

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

### `buildDeploymentTransaction(private_key, program, imports, fee_credits, fee_record, url, imports, fee_proving_key, fee_verifying_key) ► Transaction`

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
__fee_credits__ | `undefined` | *The amount of credits to pay as a fee*
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

### `buildExecutionTransaction(private_key, program, function, inputs, fee_credits, fee_record, url, imports, proving_key, verifying_key, fee_proving_key, fee_verifying_key) ► Transaction`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Execute Aleo function and create an Aleo execution transaction

Parameters | Type | Description
--- | --- | ---
__private_key__ | `undefined` | *The private key of the sender*
__program__ | `undefined` | *The source code of the program being executed*
__function__ | `undefined` | *The name of the function to execute*
__inputs__ | `undefined` | *A javascript array of inputs to the function*
__fee_credits__ | `undefined` | *The amount of credits to pay as a fee*
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

### `buildJoinTransaction(private_key, record_1, record_2, fee_credits, fee_record, url, join_proving_key, join_verifying_key, fee_proving_key, fee_verifying_key) ► Transaction`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Join two records together to create a new record with an amount of credits equal to the sum
of the credits of the two original records

Parameters | Type | Description
--- | --- | ---
__private_key__ | `undefined` | *The private key of the sender*
__record_1__ | `undefined` | *The first record to combine*
__record_2__ | `undefined` | *The second record to combine*
__fee_credits__ | `undefined` | *The amount of credits to pay as a fee*
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

### `buildTransferTransaction(private_key, amount_credits, recipient, transfer_type, amount_record, fee_credits, fee_record, url, transfer_verifying_key, fee_proving_key, fee_verifying_key) ► Transaction`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Send credits from one Aleo account to another

Parameters | Type | Description
--- | --- | ---
__private_key__ | `undefined` | *The private key of the sender*
__amount_credits__ | `undefined` | *The amount of credits to send*
__recipient__ | `undefined` | *The recipient of the transaction*
__transfer_type__ | `undefined` | *The type of the transfer (options: &quot;private&quot;, &quot;public&quot;, &quot;private_to_public&quot;, &quot;public_to_private&quot;)*
__amount_record__ | `undefined` | *The record to fund the amount from*
__fee_credits__ | `undefined` | *The amount of credits to pay as a fee*
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

# Class `ProvingKey`

Proving key for a function within an Aleo program

## Methods

### `isBondPublicProver() ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Verify if the proving key is for the bond_public function

Parameters | Type | Description
--- | --- | ---
__*return*__ | `boolean` | *returns true if the proving key is for the bond_public function, false if otherwise*

#### Examples

```javascript
const provingKey = ProvingKey.fromBytes("bond_public_proving_key.bin");
provingKey.isBondPublicProver() ? console.log("Key verified") : throw new Error("Invalid key");
```

---

### `isBondValidatorProver() ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Verify if the proving key is for the bond_validator function

Parameters | Type | Description
--- | --- | ---
__*return*__ | `boolean` | *returns true if the proving key is for the bond_validator function, false if otherwise*

#### Examples

```javascript
const provingKey = ProvingKey.fromBytes("bond_validator_proving_key.bin");
provingKey.isBondPublicProver() ? console.log("Key verified") : throw new Error("Invalid key");
```

---

### `isClaimUnbondPublicProver() ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Verify if the proving key is for the claim_unbond function

Parameters | Type | Description
--- | --- | ---
__*return*__ | `boolean` | *returns true if the proving key is for the claim_unbond function, false if otherwise*

#### Examples

```javascript
const provingKey = ProvingKey.fromBytes("claim_unbond_proving_key.bin");
provingKey.isClaimUnbondProver() ? console.log("Key verified") : throw new Error("Invalid key");
```

---

### `isFeePrivateProver() ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Verify if the proving key is for the fee_private function

Parameters | Type | Description
--- | --- | ---
__*return*__ | `boolean` | *returns true if the proving key is for the fee_private function, false if otherwise*

#### Examples

```javascript
const provingKey = ProvingKey.fromBytes("fee_private_proving_key.bin");
provingKey.isFeePrivateProver() ? console.log("Key verified") : throw new Error("Invalid key");
```

---

### `isFeePublicProver() ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Verify if the proving key is for the fee_public function

Parameters | Type | Description
--- | --- | ---
__*return*__ | `boolean` | *returns true if the proving key is for the fee_public function, false if otherwise*

#### Examples

```javascript
const provingKey = ProvingKey.fromBytes("fee_public_proving_key.bin");
provingKey.isFeePublicProver() ? console.log("Key verified") : throw new Error("Invalid key");
```

---

### `isInclusionProver() ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Verify if the proving key is for the inclusion function

Parameters | Type | Description
--- | --- | ---
__*return*__ | `boolean` | *returns true if the proving key is for the inclusion function, false if otherwise*

#### Examples

```javascript
const provingKey = ProvingKey.fromBytes("inclusion_proving_key.bin");
provingKey.isInclusionProver() ? console.log("Key verified") : throw new Error("Invalid key");
```

---

### `isJoinProver() ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Verify if the proving key is for the join function

Parameters | Type | Description
--- | --- | ---
__*return*__ | `boolean` | *returns true if the proving key is for the join function, false if otherwise*

#### Examples

```javascript
const provingKey = ProvingKey.fromBytes("join_proving_key.bin");
provingKey.isJoinProver() ? console.log("Key verified") : throw new Error("Invalid key");
```

---

### `isSetValidatorStateProver() ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Verify if the proving key is for the set_validator_state function

Parameters | Type | Description
--- | --- | ---
__*return*__ | `boolean` | *returns true if the proving key is for the set_validator_state function, false if otherwise*

#### Examples

```javascript
const provingKey = ProvingKey.fromBytes("set_validator_set_proving_key.bin");
provingKey.isSetValidatorStateProver() ? console.log("Key verified") : throw new Error("Invalid key");
```

---

### `isSplitProver() ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Verify if the proving key is for the split function

Parameters | Type | Description
--- | --- | ---
__*return*__ | `boolean` | *returns true if the proving key is for the split function, false if otherwise*

#### Examples

```javascript
const provingKey = ProvingKey.fromBytes("split_proving_key.bin");
provingKey.isSplitProver() ? console.log("Key verified") : throw new Error("Invalid key");
```

---

### `isTransferPrivateProver() ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Verify if the proving key is for the transfer_private function

Parameters | Type | Description
--- | --- | ---
__*return*__ | `boolean` | *returns true if the proving key is for the transfer_private function, false if otherwise*

#### Examples

```javascript
const provingKey = ProvingKey.fromBytes("transfer_private_proving_key.bin");
provingKey.isTransferPrivateProver() ? console.log("Key verified") : throw new Error("Invalid key");
```

---

### `isTransferPrivateToPublicProver() ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Verify if the proving key is for the transfer_private_to_public function

Parameters | Type | Description
--- | --- | ---
__*return*__ | `boolean` | *returns true if the proving key is for the transfer_private_to_public function, false if otherwise*

#### Examples

```javascript
const provingKey = ProvingKey.fromBytes("transfer_private_to_public_proving_key.bin");
provingKey.isTransferPrivateToPublicProver() ? console.log("Key verified") : throw new Error("Invalid key");
```

---

### `isTransferPublicProver() ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Verify if the proving key is for the transfer_public function

Parameters | Type | Description
--- | --- | ---
__*return*__ | `boolean` | *returns true if the proving key is for the transfer_public function, false if otherwise*

#### Examples

```javascript
const provingKey = ProvingKey.fromBytes("transfer_public_proving_key.bin");
provingKey.isTransferPublicProver() ? console.log("Key verified") : throw new Error("Invalid key");
```

---

### `isTransferPublicAsSignerProver() ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Verify if the proving key is for the transfer_public_as_signer function

Parameters | Type | Description
--- | --- | ---
__*return*__ | `boolean` | *returns true if the proving key is for the transfer_public function, false if otherwise*

#### Examples

```javascript
const provingKey = ProvingKey.fromBytes("transfer_public_as_signer_proving_key.bin");
provingKey.isTransferPublicAsSignerProver() ? console.log("Key verified") : throw new Error("Invalid key");
```

---

### `isTransferPublicToPrivateProver() ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Verify if the proving key is for the transfer_public_to_private function

Parameters | Type | Description
--- | --- | ---
__*return*__ | `boolean` | *returns true if the proving key is for the transfer_public_to_private function, false if otherwise*

#### Examples

```javascript
const provingKey = ProvingKey.fromBytes("transfer_public_to_private_proving_key.bin");
provingKey.isTransferPublicToPrivateProver() ? console.log("Key verified") : throw new Error("Invalid key");
```

---

### `isUnbondPublicProver() ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Verify if the proving key is for the unbond_public function

Parameters | Type | Description
--- | --- | ---
__*return*__ | `boolean` | *returns true if the proving key is for the unbond_public_prover function, false if otherwise*

#### Examples

```javascript
const provingKey = ProvingKey.fromBytes("unbond_public.bin");
provingKey.isUnbondPublicProver() ? console.log("Key verified") : throw new Error("Invalid key");
```

---

### `checksum() ► string`

![modifier: public](images/badges/modifier-public.svg)

Return the checksum of the proving key

Parameters | Type | Description
--- | --- | ---
__*return*__ | `string` | *Checksum of the proving key*

---

### `copy() ► ProvingKey`

![modifier: public](images/badges/modifier-public.svg)

Create a copy of the proving key

Parameters | Type | Description
--- | --- | ---
__*return*__ | [ProvingKey](sdk-src_wasm.md) | *A copy of the proving key*

---

### `fromBytes(bytes) ► ProvingKey`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Construct a new proving key from a byte array

Parameters | Type | Description
--- | --- | ---
__bytes__ | `Uint8Array` | *Byte array representation of a proving key*
__*return*__ | [ProvingKey](sdk-src_wasm.md) | **

---

### `fromString(String) ► ProvingKey`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a proving key from string

Parameters | Type | Description
--- | --- | ---
__String__ | `string` | *representation of the proving key*
__*return*__ | [ProvingKey](sdk-src_wasm.md) | **

---

### `toBytes() ► Uint8Array`

![modifier: public](images/badges/modifier-public.svg)

Return the byte representation of a proving key

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Uint8Array` | *Byte array representation of a proving key*

---

### `toString() ► string`

![modifier: public](images/badges/modifier-public.svg)

Get a string representation of the proving key

Parameters | Type | Description
--- | --- | ---
__*return*__ | `string` | *String representation of the proving key*

---

# Class `RecordCiphertext`

Encrypted Aleo record

## Methods

### `fromString(record) ► RecordCiphertext`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a record ciphertext from a string

Parameters | Type | Description
--- | --- | ---
__record__ | `string` | *String representation of a record ciphertext*
__*return*__ | [RecordCiphertext](sdk-src_wasm.md) | *Record ciphertext*

---

### `toString() ► string`

![modifier: public](images/badges/modifier-public.svg)

Return the string reprensentation of the record ciphertext

Parameters | Type | Description
--- | --- | ---
__*return*__ | `string` | *String representation of the record ciphertext*

---

### `decrypt(view_key) ► RecordPlaintext`

![modifier: public](images/badges/modifier-public.svg)

Decrypt the record ciphertext into plaintext using the view key. The record will only
decrypt if the record was encrypted by the account corresponding to the view key

Parameters | Type | Description
--- | --- | ---
__view_key__ | [ViewKey](sdk-src_wasm.md) | *View key used to decrypt the ciphertext*
__*return*__ | [RecordPlaintext](sdk-src_wasm.md) | *Record plaintext object*

---

### `isOwner(view_key) ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Determines if the account corresponding to the view key is the owner of the record

Parameters | Type | Description
--- | --- | ---
__view_key__ | [ViewKey](sdk-src_wasm.md) | *View key used to decrypt the ciphertext*
__*return*__ | `boolean` | **

---

### `tag(graph, commitment) ► Field`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Get the tag of the record using the graph key.

Parameters | Type | Description
--- | --- | ---
__graph__ | [GraphKey](sdk-src_wasm.md) | *key of the account associatd with the record.*
__commitment__ | [Field](sdk-src_wasm.md) | *of the record.*
__*return*__ | [Field](sdk-src_wasm.md) | *tag of the record.*

---

# Class `RecordPlaintext`

Plaintext representation of an Aleo record

## Methods

### `fromString(record) ► RecordPlaintext`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Return a record plaintext from a string.

Parameters | Type | Description
--- | --- | ---
__record__ | `string` | *String representation of a plaintext representation of an Aleo record*
__*return*__ | [RecordPlaintext](sdk-src_wasm.md) | *Record plaintext*

---

### `owner() ► Address`

![modifier: public](images/badges/modifier-public.svg)

Get the owner of the record.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Address](sdk-src_wasm.md) | **

---

### `toJsObject() ► Object`

![modifier: public](images/badges/modifier-public.svg)

Get a representation of a record as a javascript object for usage in client side
computations. Note that this is not a reversible operation and exists for the convenience
of discovering and using properties of the record.

The conversion guide is as follows:
- u8, u16, u32, i8, i16 i32 --&gt; Number
- u64, u128, i64, i128 --&gt; BigInt
- Address, Field, Group, Scalar --&gt; String.

Address, Field, Group, and Scalar will all be converted to their bech32 string
representation. These string representations can be converted back to their respective wasm
types using the fromString method on the Address, Field, Group, and Scalar objects in this
library.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Object` | *Javascript object representation of the record*

#### Examples

```javascript
# Create a wasm record from a record string.
let record_plaintext_wasm = RecordPlainext.from_string("{
  owner: aleo1kh5t7m30djl0ecdn4f5vuzp7dx0tcwh7ncquqjkm4matj2p2zqpqm6at48.private,
  metadata: {
    player1: aleo1kh5t7m30djl0ecdn4f5vuzp7dx0tcwh7ncquqjkm4matj2p2zqpqm6at48.private,
    player2: aleo1dreuxnmg9cny8ee9v2u0wr4v4affnwm09u2pytfwz0f2en2shgqsdsfjn6.private,
    nonce: 660310649780728486489183263981322848354071976582883879926426319832534836534field.private
  },
  id: 1953278585719525811355617404139099418855053112960441725284031425961000152405field.private,
  positions: 50794271u64.private,
  attempts: 0u64.private,
  hits: 0u64.private,
  _nonce: 5668100912391182624073500093436664635767788874314097667746354181784048204413group.public
}");

let expected_object = {
  owner: "aleo1kh5t7m30djl0ecdn4f5vuzp7dx0tcwh7ncquqjkm4matj2p2zqpqm6at48",
  metadata: {
    player1: "aleo1kh5t7m30djl0ecdn4f5vuzp7dx0tcwh7ncquqjkm4matj2p2zqpqm6at48",
    player2: "aleo1dreuxnmg9cny8ee9v2u0wr4v4affnwm09u2pytfwz0f2en2shgqsdsfjn6",
    nonce: "660310649780728486489183263981322848354071976582883879926426319832534836534field"
  },
  id: "1953278585719525811355617404139099418855053112960441725284031425961000152405field",
  positions: 50794271,
  attempts: 0,
  hits: 0,
  _nonce: "5668100912391182624073500093436664635767788874314097667746354181784048204413group"
};

# Create the expected object
let record_plaintext_object = record_plaintext_wasm.to_js_object();
assert(JSON.stringify(record_plaintext_object) == JSON.stringify(expected_object));
```

---

### `toString() ► string`

![modifier: public](images/badges/modifier-public.svg)

Returns the record plaintext string

Parameters | Type | Description
--- | --- | ---
__*return*__ | `string` | *String representation of the record plaintext*

---

### `microcredits() ► u64`

![modifier: public](images/badges/modifier-public.svg)

Returns the amount of microcredits in the record

Parameters | Type | Description
--- | --- | ---
__*return*__ | `u64` | *Amount of microcredits in the record*

---

### `nonce() ► string`

![modifier: public](images/badges/modifier-public.svg)

Returns the nonce of the record. This can be used to uniquely identify a record.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `string` | *Nonce of the record*

---

### `serialNumberString(private_key, program_id, record_name) ► string`

![modifier: public](images/badges/modifier-public.svg)

Attempt to get the serial number of a record to determine whether or not is has been spent

Parameters | Type | Description
--- | --- | ---
__private_key__ | [PrivateKey](sdk-src_wasm.md) | *Private key of the account that owns the record*
__program_id__ | `string` | *Program ID of the program that the record is associated with*
__record_name__ | `string` | *Name of the record*
__*return*__ | `string` | *Serial number of the record*

---

### `tag(graph_key, commitment) ► Field`

![modifier: public](images/badges/modifier-public.svg)

Get the tag of the record using the graph key.

Parameters | Type | Description
--- | --- | ---
__graph_key__ | [GraphKey](sdk-src_wasm.md) | **
__commitment__ | [Field](sdk-src_wasm.md) | **
__*return*__ | [Field](sdk-src_wasm.md) | **

---

# Class `Scalar`

Scalar field element.

## Methods

### `toString() ► string`

![modifier: public](images/badges/modifier-public.svg)

Returns the string representation of the group.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `string` | **

---

### `toPlaintext() ► Plaintext`

![modifier: public](images/badges/modifier-public.svg)

Create a plaintext element from a group element.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Plaintext](sdk-src_wasm.md) | **

---

### `fromString(group) ► Scalar`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Creates a group object from a string representation of a group.

Parameters | Type | Description
--- | --- | ---
__group__ | `string` | **
__*return*__ | [Scalar](sdk-src_wasm.md) | **

---

### `random() ► Scalar`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Generate a random group element.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Scalar](sdk-src_wasm.md) | **

---

### `add(other) ► Scalar`

![modifier: public](images/badges/modifier-public.svg)

Add two scalar elements.

Parameters | Type | Description
--- | --- | ---
__other__ | [Scalar](sdk-src_wasm.md) | **
__*return*__ | [Scalar](sdk-src_wasm.md) | **

---

### `subtract(other) ► Scalar`

![modifier: public](images/badges/modifier-public.svg)

Subtract two scalar elements.

Parameters | Type | Description
--- | --- | ---
__other__ | [Scalar](sdk-src_wasm.md) | **
__*return*__ | [Scalar](sdk-src_wasm.md) | **

---

### `multiply(other) ► Scalar`

![modifier: public](images/badges/modifier-public.svg)

Multiply two scalar elements.

Parameters | Type | Description
--- | --- | ---
__other__ | [Scalar](sdk-src_wasm.md) | **
__*return*__ | [Scalar](sdk-src_wasm.md) | **

---

### `divide(other) ► Scalar`

![modifier: public](images/badges/modifier-public.svg)

Divide two scalar elements.

Parameters | Type | Description
--- | --- | ---
__other__ | [Scalar](sdk-src_wasm.md) | **
__*return*__ | [Scalar](sdk-src_wasm.md) | **

---

### `double() ► Scalar`

![modifier: public](images/badges/modifier-public.svg)

Double the scalar element.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Scalar](sdk-src_wasm.md) | **

---

### `pow(other) ► Scalar`

![modifier: public](images/badges/modifier-public.svg)

Power of a scalar element.

Parameters | Type | Description
--- | --- | ---
__other__ | [Scalar](sdk-src_wasm.md) | **
__*return*__ | [Scalar](sdk-src_wasm.md) | **

---

### `inverse() ► Scalar`

![modifier: public](images/badges/modifier-public.svg)

Invert the scalar element.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Scalar](sdk-src_wasm.md) | **

---

### `one() ► Scalar`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Creates a one valued element of the scalar field.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Scalar](sdk-src_wasm.md) | **

---

### `zero() ► Scalar`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Creates a zero valued element of the scalar field

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Scalar](sdk-src_wasm.md) | **

---

### `equals(other) ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Check if one scalar element equals another.

Parameters | Type | Description
--- | --- | ---
__other__ | [Scalar](sdk-src_wasm.md) | **
__*return*__ | `boolean` | **

---

# Class `Signature`

Cryptographic signature of a message signed by an Aleo account

## Methods

### `sign(private_key, message) ► Signature`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Sign a message with a private key

Parameters | Type | Description
--- | --- | ---
__private_key__ | [PrivateKey](sdk-src_wasm.md) | *The private key to sign the message with*
__message__ | `Uint8Array` | *Byte representation of the message to sign*
__*return*__ | [Signature](sdk-src_wasm.md) | *Signature of the message*

---

### `to_address() ► Address`

![modifier: public](images/badges/modifier-public.svg)

Get an address from a signature.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Address](sdk-src_wasm.md) | *Address object*

---

### `challenge() ► Scalar`

![modifier: public](images/badges/modifier-public.svg)

Get the challenge of a signature.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Scalar](sdk-src_wasm.md) | **

---

### `response() ► Scalar`

![modifier: public](images/badges/modifier-public.svg)

Get the response of a signature.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Scalar](sdk-src_wasm.md) | **

---

### `verify(address, message) ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Verify a signature of a message with an address

Parameters | Type | Description
--- | --- | ---
__address__ | [Address](sdk-src_wasm.md) | *The address to verify the signature with*
__message__ | `Uint8Array` | *Byte representation of the message to verify*
__*return*__ | `boolean` | *True if the signature is valid, false otherwise*

---

### `from_string(signature) ► Signature`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Get a signature from a string representation of a signature

Parameters | Type | Description
--- | --- | ---
__signature__ | `string` | *String representation of a signature*
__*return*__ | [Signature](sdk-src_wasm.md) | *Signature*

---

### `to_string() ► string`

![modifier: public](images/badges/modifier-public.svg)

Get a string representation of a signature

Parameters | Type | Description
--- | --- | ---
__*return*__ | `string` | *String representation of a signature*

---

# Class `Transaction`

Webassembly Representation of an Aleo transaction

This object is created when generating an on-chain function deployment or execution and is the
object that should be submitted to the Aleo Network in order to deploy or execute a function.

## Methods

### `fromString(transaction) ► Transaction`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a transaction from a string

Parameters | Type | Description
--- | --- | ---
__transaction__ | `string` | *String representation of a transaction*
__*return*__ | [Transaction](sdk-src_wasm.md) | **

---

### `fromBytesLe(Uint8Array) ► Transaction`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a transaction from a Uint8Array of left endian bytes.

Parameters | Type | Description
--- | --- | ---
__Uint8Array__ | `Uint8Array` | *of left endian bytes encoding a Transaction.*
__*return*__ | [Transaction](sdk-src_wasm.md) | **

---

### `toString() ► string`

![modifier: public](images/badges/modifier-public.svg)

Get the transaction as a string. If you want to submit this transaction to the Aleo Network
this function will create the string that should be submitted in the &#x60;POST&#x60; data.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `string` | *String representation of the transaction*

---

### `toBytesLe() ► Uint8Array`

![modifier: public](images/badges/modifier-public.svg)

Get the transaction as a Uint8Array of left endian bytes.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Uint8Array` | *Uint8Array representation of the transaction*

---

### `constainsSerialNumber(True) ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Returns true if the transaction contains the given serial number.

Parameters | Type | Description
--- | --- | ---
__True__ | `boolean` | *if the transaction contains the given serial number.*
__*return*__ | `boolean` | **

---

### `constainsCommitment(True) ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Returns true if the transaction contains the given commitment.

Parameters | Type | Description
--- | --- | ---
__True__ | `boolean` | *if the transaction contains the given commitment.*
__*return*__ | `boolean` | **

---

### `findRecord(commitment) ► RecordCiphertext`

![modifier: public](images/badges/modifier-public.svg)

Find a record in the transaction by the record&#x27;s commitment.

Parameters | Type | Description
--- | --- | ---
__commitment__ | [Field](sdk-src_wasm.md) | **
__*return*__ | [RecordCiphertext](sdk-src_wasm.md) | **

---

### `baseFeeAmount() ► bigint`

![modifier: public](images/badges/modifier-public.svg)

Returns the transaction&#x27;s base fee.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `bigint` | **

---

### `feeAmount() ► bigint`

![modifier: public](images/badges/modifier-public.svg)

Returns the transaction&#x27;s total fee.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `bigint` | **

---

### `priorityFeeAmount() ► bigint`

![modifier: public](images/badges/modifier-public.svg)

Returns the transaction&#x27;s priority fee.

returns {bigint} The transaction&#x27;s priority fee.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `bigint` | **

---

### `isDeploy() ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Returns true if the transaction is a deployment transaction.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `boolean` | *True if the transaction is a deployment transaction*

---

### `isExecute() ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Returns true if the transaction is an execution transaction.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `boolean` | *True if the transaction is an execution transaction*

---

### `isFee() ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Returns true if the transaction is a fee transaction.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `boolean` | *True if the transaction is a fee transaction*

---

### `deployedProgram() ► Program`

![modifier: public](images/badges/modifier-public.svg)

Returns the program deployed within the transaction if the transaction is a deployment
transaction.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Program](sdk-src_wasm.md) | *The program deployed within the transaction.*

---

### `execution() ► Execution`

![modifier: public](images/badges/modifier-public.svg)

Returns the execution within the transaction (if present).

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Execution](sdk-src_wasm.md) | *The execution within the transaction.*

---

### `ownedRecords(view_key) ► Array.<RecordPlaintext>`

![modifier: public](images/badges/modifier-public.svg)

Get the record plaintext present in a transaction owned by a specific view key.

Parameters | Type | Description
--- | --- | ---
__view_key__ | [ViewKey](sdk-src_wasm.md) | *View key used to decrypt the ciphertext*
__*return*__ | `Array.<RecordPlaintext>` | *Array of record plaintext objects*

---

### `records() ► Array.<{commitment: Field, record: RecordCiphertext}>`

![modifier: public](images/badges/modifier-public.svg)

Get the records present in a transaction and their commitments.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Array.<{commitment: Field, record: RecordCiphertext}>` | *Array of record ciphertext objects*

---

### `summary(convert_to_js) ► Object`

![modifier: public](images/badges/modifier-public.svg)

Get a summary of the transaction within a javascript object.

If the transaction is an execution transaction, this function will return a list of the
transitions and their inputs and outputs.

If the transaction is a deployment transaction, this function will return the program id and
a list of the functions and their verifying keys, constraint, and variable counts.

Parameters | Type | Description
--- | --- | ---
__convert_to_js__ | `boolean` | *If true the inputs and outputs will be converted to JS objects,
if false the inputs and outputs will be in wasm format.*
__*return*__ | `Object` | *Transaction summary*

---

### `id() ► string`

![modifier: public](images/badges/modifier-public.svg)

Get the id of the transaction. This is the merkle root of the transaction&#x27;s inclusion proof.

This value can be used to query the status of the transaction on the Aleo Network to see
if it was successful. If successful, the transaction will be included in a block and this
value can be used to lookup the transaction data on-chain.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `string` | *TransactionId*

---

### `transactionType() ► string`

![modifier: public](images/badges/modifier-public.svg)

Get the
Get the type of the transaction (will return &quot;deploy&quot; or &quot;execute&quot;)

Parameters | Type | Description
--- | --- | ---
__*return*__ | `string` | *Transaction type*

---

### `transitions() ► Array.<Transition>`

![modifier: public](images/badges/modifier-public.svg)

Get the transitions in a transaction.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Array.<Transition>` | *Array of transition objects*

---

### `verifyingKeys() ► Array.<Object>`

![modifier: public](images/badges/modifier-public.svg)

Get the verifying keys in a transaction.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Array.<Object>` | *Array of verifying keys.*

---

# Class `Transition`

Webassembly Representation of an Aleo transition

This object is representative of an
atomic unit of chain state change

## Methods

### `id() ► string`

![modifier: public](images/badges/modifier-public.svg)

Get the transition ID

Parameters | Type | Description
--- | --- | ---
__*return*__ | `string` | *The transition ID*

---

### `fromString(transition) ► Transition`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a transition from a string

Parameters | Type | Description
--- | --- | ---
__transition__ | `string` | *String representation of a transition*
__*return*__ | [Transition](sdk-src_wasm.md) | **

---

### `fromBytesLe(Uint8Array) ► Transition`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a transition from a Uint8Array of left endian bytes.

Parameters | Type | Description
--- | --- | ---
__Uint8Array__ | `Uint8Array` | *of left endian bytes encoding a Transition.*
__*return*__ | [Transition](sdk-src_wasm.md) | **

---

### `toString() ► string`

![modifier: public](images/badges/modifier-public.svg)

Get the transition as a string. If you want to submit this transition to the Aleo Network
this function will create the string that should be submitted in the &#x60;POST&#x60; data.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `string` | *String representation of the transition*

---

### `toBytesLe() ► Uint8Array`

![modifier: public](images/badges/modifier-public.svg)

Get the transition as a Uint8Array of left endian bytes.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Uint8Array` | *Uint8Array representation of the transition*

---

### `programId() ► string`

![modifier: public](images/badges/modifier-public.svg)

Get the program ID of the transition.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `string` | **

---

### `functionName() ► string`

![modifier: public](images/badges/modifier-public.svg)

Get the function name of the transition.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `string` | **

---

### `containsCommitment(True) ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Returns true if the transition contains the given commitment.

Parameters | Type | Description
--- | --- | ---
__True__ | `boolean` | *if the transition contains the given commitment.*
__*return*__ | `boolean` | **

---

### `containsSerialNumber(serial_number) ► bool`

![modifier: public](images/badges/modifier-public.svg)

Check if the transition contains a serial number.

Parameters | Type | Description
--- | --- | ---
__serial_number__ | [Field](sdk-src_wasm.md) | *The serial number to check for*
__*return*__ | `bool` | *True if the transition contains a serial number, false otherwise*

---

### `findRecord(commitment) ► RecordCiphertext`

![modifier: public](images/badges/modifier-public.svg)

Find a record in the transition by the record&#x27;s commitment.

Parameters | Type | Description
--- | --- | ---
__commitment__ | [Field](sdk-src_wasm.md) | **
__*return*__ | [RecordCiphertext](sdk-src_wasm.md) | **

---

### `ownedRecords(view_key) ► Array.<RecordPlaintext>`

![modifier: public](images/badges/modifier-public.svg)

Get the record plaintext present in a transition owned by a specific view key.

Parameters | Type | Description
--- | --- | ---
__view_key__ | [ViewKey](sdk-src_wasm.md) | *The view key of the record owner.*
__*return*__ | `Array.<RecordPlaintext>` | *Array of record plaintext objects*

---

### `records() ► Array.<{commitment: Field, record: RecordCiphertext}>`

![modifier: public](images/badges/modifier-public.svg)

Get the records present in a transition and their commitments.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Array.<{commitment: Field, record: RecordCiphertext}>` | *Array of record ciphertext objects*

---

### `inputs(convert_to_js) ► Array`

![modifier: public](images/badges/modifier-public.svg)

Get the inputs of the transition.

Parameters | Type | Description
--- | --- | ---
__convert_to_js__ | `bool` | *If true the inputs will be converted to JS objects, if false
the inputs will be in wasm format.*
__*return*__ | `Array` | *Array of inputs*

---

### `outputs(convert_to_js) ► Array`

![modifier: public](images/badges/modifier-public.svg)

Get the outputs of the transition.

Parameters | Type | Description
--- | --- | ---
__convert_to_js__ | `bool` | *If true the outputs will be converted to JS objects, if false
the outputs will be in wasm format.*
__*return*__ | `Array` | *Array of outputs*

---

### `tpk() ► Group`

![modifier: public](images/badges/modifier-public.svg)

Get the transition public key of the transition.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Group](sdk-src_wasm.md) | **

---

### `tcm() ► Field`

![modifier: public](images/badges/modifier-public.svg)

Get the transition commitment of the transition.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Field](sdk-src_wasm.md) | **

---

### `scm() ► Field`

![modifier: public](images/badges/modifier-public.svg)

Get the transition signer commitment of the transition.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Field](sdk-src_wasm.md) | **

---

# Class `VerifyingKey`

Verifying key for a function within an Aleo program

## Methods

### `bondPublicVerifier() ► VerifyingKey`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Returns the verifying key for the bond_public function

Parameters | Type | Description
--- | --- | ---
__*return*__ | [VerifyingKey](sdk-src_wasm.md) | *Verifying key for the bond_public function*

---

### `bondValidatorVerifier() ► VerifyingKey`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Returns the verifying key for the bond_validator function

Parameters | Type | Description
--- | --- | ---
__*return*__ | [VerifyingKey](sdk-src_wasm.md) | *Verifying key for the bond_validator function*

---

### `claimUnbondPublicVerifier() ► VerifyingKey`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Returns the verifying key for the claim_delegator function

Parameters | Type | Description
--- | --- | ---
__*return*__ | [VerifyingKey](sdk-src_wasm.md) | *Verifying key for the claim_unbond_public function*

---

### `feePrivateVerifier() ► VerifyingKey`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Returns the verifying key for the fee_private function

Parameters | Type | Description
--- | --- | ---
__*return*__ | [VerifyingKey](sdk-src_wasm.md) | *Verifying key for the fee_private function*

---

### `feePublicVerifier() ► VerifyingKey`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Returns the verifying key for the fee_public function

Parameters | Type | Description
--- | --- | ---
__*return*__ | [VerifyingKey](sdk-src_wasm.md) | *Verifying key for the fee_public function*

---

### `inclusionVerifier() ► VerifyingKey`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Returns the verifying key for the inclusion function

Parameters | Type | Description
--- | --- | ---
__*return*__ | [VerifyingKey](sdk-src_wasm.md) | *Verifying key for the inclusion function*

---

### `joinVerifier() ► VerifyingKey`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Returns the verifying key for the join function

Parameters | Type | Description
--- | --- | ---
__*return*__ | [VerifyingKey](sdk-src_wasm.md) | *Verifying key for the join function*

---

### `setValidatorStateVerifier() ► VerifyingKey`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Returns the verifying key for the set_validator_state function

Parameters | Type | Description
--- | --- | ---
__*return*__ | [VerifyingKey](sdk-src_wasm.md) | *Verifying key for the set_validator_state function*

---

### `splitVerifier() ► VerifyingKey`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Returns the verifying key for the split function

Parameters | Type | Description
--- | --- | ---
__*return*__ | [VerifyingKey](sdk-src_wasm.md) | *Verifying key for the split function*

---

### `transferPrivateVerifier() ► VerifyingKey`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Returns the verifying key for the transfer_private function

Parameters | Type | Description
--- | --- | ---
__*return*__ | [VerifyingKey](sdk-src_wasm.md) | *Verifying key for the transfer_private function*

---

### `transferPrivateToPublicVerifier() ► VerifyingKey`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Returns the verifying key for the transfer_private_to_public function

Parameters | Type | Description
--- | --- | ---
__*return*__ | [VerifyingKey](sdk-src_wasm.md) | *Verifying key for the transfer_private_to_public function*

---

### `transferPublicVerifier() ► VerifyingKey`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Returns the verifying key for the transfer_public function

Parameters | Type | Description
--- | --- | ---
__*return*__ | [VerifyingKey](sdk-src_wasm.md) | *Verifying key for the transfer_public function*

---

### `transferPublicAsSignerVerifier() ► VerifyingKey`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Returns the verifying key for the transfer_public_as_signer function

Parameters | Type | Description
--- | --- | ---
__*return*__ | [VerifyingKey](sdk-src_wasm.md) | *Verifying key for the transfer_public_as_signer function*

---

### `transferPublicToPrivateVerifier() ► VerifyingKey`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Returns the verifying key for the transfer_public_to_private function

Parameters | Type | Description
--- | --- | ---
__*return*__ | [VerifyingKey](sdk-src_wasm.md) | *Verifying key for the transfer_public_to_private function*

---

### `unbondPublicVerifier() ► VerifyingKey`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Returns the verifying key for the unbond_public function

Parameters | Type | Description
--- | --- | ---
__*return*__ | [VerifyingKey](sdk-src_wasm.md) | *Verifying key for the unbond_public function*

---

### `isBondPublicVerifier() ► VerifyingKey`

![modifier: public](images/badges/modifier-public.svg)

Returns the verifying key for the bond_public function

Parameters | Type | Description
--- | --- | ---
__*return*__ | [VerifyingKey](sdk-src_wasm.md) | *Verifying key for the bond_public function*

---

### `isBondValidatorVerifier() ► VerifyingKey`

![modifier: public](images/badges/modifier-public.svg)

Returns the verifying key for the bond_validator function

Parameters | Type | Description
--- | --- | ---
__*return*__ | [VerifyingKey](sdk-src_wasm.md) | *Verifying key for the bond_validator function*

---

### `isClaimUnbondPublicVerifier() ► bool`

![modifier: public](images/badges/modifier-public.svg)

Verifies the verifying key is for the claim_delegator function

Parameters | Type | Description
--- | --- | ---
__*return*__ | `bool` | **

---

### `isFeePrivateVerifier() ► bool`

![modifier: public](images/badges/modifier-public.svg)

Verifies the verifying key is for the fee_private function

Parameters | Type | Description
--- | --- | ---
__*return*__ | `bool` | **

---

### `isFeePublicVerifier() ► bool`

![modifier: public](images/badges/modifier-public.svg)

Verifies the verifying key is for the fee_public function

Parameters | Type | Description
--- | --- | ---
__*return*__ | `bool` | **

---

### `isInclusionVerifier() ► bool`

![modifier: public](images/badges/modifier-public.svg)

Verifies the verifying key is for the inclusion function

Parameters | Type | Description
--- | --- | ---
__*return*__ | `bool` | **

---

### `isJoinVerifier() ► bool`

![modifier: public](images/badges/modifier-public.svg)

Verifies the verifying key is for the join function

Parameters | Type | Description
--- | --- | ---
__*return*__ | `bool` | **

---

### `isSetValidatorStateVerifier() ► bool`

![modifier: public](images/badges/modifier-public.svg)

Verifies the verifying key is for the set_validator_state function

Parameters | Type | Description
--- | --- | ---
__*return*__ | `bool` | **

---

### `isSplitVerifier() ► bool`

![modifier: public](images/badges/modifier-public.svg)

Verifies the verifying key is for the split function

Parameters | Type | Description
--- | --- | ---
__*return*__ | `bool` | **

---

### `isTransferPrivateVerifier() ► bool`

![modifier: public](images/badges/modifier-public.svg)

Verifies the verifying key is for the transfer_private function

Parameters | Type | Description
--- | --- | ---
__*return*__ | `bool` | **

---

### `isTransferPrivateToPublicVerifier() ► bool`

![modifier: public](images/badges/modifier-public.svg)

Verifies the verifying key is for the transfer_private_to_public function

Parameters | Type | Description
--- | --- | ---
__*return*__ | `bool` | **

---

### `isTransferPublicVerifier() ► bool`

![modifier: public](images/badges/modifier-public.svg)

Verifies the verifying key is for the transfer_public function

Parameters | Type | Description
--- | --- | ---
__*return*__ | `bool` | **

---

### `isTransferPublicAsSignerVerifier() ► bool`

![modifier: public](images/badges/modifier-public.svg)

Verifies the verifying key is for the transfer_public_as_signer function

Parameters | Type | Description
--- | --- | ---
__*return*__ | `bool` | **

---

### `isTransferPublicToPrivateVerifier() ► bool`

![modifier: public](images/badges/modifier-public.svg)

Verifies the verifying key is for the transfer_public_to_private function

Parameters | Type | Description
--- | --- | ---
__*return*__ | `bool` | **

---

### `isUnbondPublicVerifier() ► bool`

![modifier: public](images/badges/modifier-public.svg)

Verifies the verifying key is for the unbond_public function

Parameters | Type | Description
--- | --- | ---
__*return*__ | `bool` | **

---

### `checksum() ► string`

![modifier: public](images/badges/modifier-public.svg)

Get the checksum of the verifying key

Parameters | Type | Description
--- | --- | ---
__*return*__ | `string` | *Checksum of the verifying key*

---

### `copy() ► VerifyingKey`

![modifier: public](images/badges/modifier-public.svg)

Create a copy of the verifying key

Parameters | Type | Description
--- | --- | ---
__*return*__ | [VerifyingKey](sdk-src_wasm.md) | *A copy of the verifying key*

---

### `fromBytes(bytes) ► VerifyingKey`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Construct a new verifying key from a byte array

Parameters | Type | Description
--- | --- | ---
__bytes__ | `Uint8Array` | *Byte representation of a verifying key*
__*return*__ | [VerifyingKey](sdk-src_wasm.md) | **

---

### `fromString(string) ► VerifyingKey`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a verifying key from string

Parameters | Type | Description
--- | --- | ---
__string__ | `String` | *String representation of a verifying key*
__*return*__ | [VerifyingKey](sdk-src_wasm.md) | **

---

### `toBytes() ► Uint8Array`

![modifier: public](images/badges/modifier-public.svg)

Create a byte array from a verifying key

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Uint8Array` | *Byte representation of a verifying key*

---

### `toString() ► String`

![modifier: public](images/badges/modifier-public.svg)

Get a string representation of the verifying key

Parameters | Type | Description
--- | --- | ---
__*return*__ | `String` | *String representation of the verifying key*

---

# Class `ViewKey`

View key of an Aleo account

## Methods

### `from_private_key(private_key) ► ViewKey`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a new view key from a private key

Parameters | Type | Description
--- | --- | ---
__private_key__ | [PrivateKey](sdk-src_wasm.md) | *Private key*
__*return*__ | [ViewKey](sdk-src_wasm.md) | *View key*

---

### `from_string(view_key) ► ViewKey`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a new view key from a string representation of a view key

Parameters | Type | Description
--- | --- | ---
__view_key__ | `string` | *String representation of a view key*
__*return*__ | [ViewKey](sdk-src_wasm.md) | *View key*

---

### `to_string() ► string`

![modifier: public](images/badges/modifier-public.svg)

Get a string representation of a view key

Parameters | Type | Description
--- | --- | ---
__*return*__ | `string` | *String representation of a view key*

---

### `to_address() ► Address`

![modifier: public](images/badges/modifier-public.svg)

Get the address corresponding to a view key

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Address](sdk-src_wasm.md) | *Address*

---

### `to_scalar() ► Scalar`

![modifier: public](images/badges/modifier-public.svg)

Get the underlying scalar of a view key.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Scalar](sdk-src_wasm.md) | **

---

### `decrypt(ciphertext) ► string`

![modifier: public](images/badges/modifier-public.svg)

Decrypt a record ciphertext with a view key

Parameters | Type | Description
--- | --- | ---
__ciphertext__ | `string` | *String representation of a record ciphertext*
__*return*__ | `string` | *String representation of a record plaintext*

---
