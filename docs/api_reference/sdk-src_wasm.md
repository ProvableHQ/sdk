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
__view_key__ | `ViewKey` | *The view key to derive the address from*
__*return*__ | [Address](sdk-src_wasm.md) | *Address corresponding to the view key*

---

### `from_compute_key(compute_key) ► Address`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Derive an Aleo address from a compute key.

Parameters | Type | Description
--- | --- | ---
__compute_key__ | `ComputeKey` | *The compute key to derive the address from*
__*return*__ | [Address](sdk-src_wasm.md) | **

---

### `fromBytesLe(bytes) ► Address`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Get an address from a series of bytes.

Parameters | Type | Description
--- | --- | ---
__bytes__ | `Uint8Array` | *A left endian byte array representing the address.*
__*return*__ | [Address](sdk-src_wasm.md) | *The address object.*

---

### `toBytesLe() ► Uint8Array`

![modifier: public](images/badges/modifier-public.svg)

Get the left endian byte array representation of the address.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Uint8Array` | **

---

### `fromBitsLe(bits) ► Address`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Get an address from a series of bits represented as a boolean array.

Parameters | Type | Description
--- | --- | ---
__bits__ | `Array` | *A left endian boolean array representing the bits of the address.*
__*return*__ | [Address](sdk-src_wasm.md) | *The address object.*

---

### `toBitsLe() ► Array.<any>`

![modifier: public](images/badges/modifier-public.svg)

Get the left endian boolean array representation of the bits of the address.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Array.<any>` | **

---

### `fromFields(fields) ► Plaintext`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Get an address object from an array of fields.

Parameters | Type | Description
--- | --- | ---
__fields__ | `Array` | *An array of fields.*
__*return*__ | [Plaintext](sdk-src_wasm.md) | *The address object.*

---

### `toFields() ► Array.<any>`

![modifier: public](images/badges/modifier-public.svg)

Get the field array representation of the address.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Array.<any>` | **

---

### `fromGroup(group) ► Address`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Get an address object from a group.

Parameters | Type | Description
--- | --- | ---
__group__ | [Group](sdk-src_wasm.md) | *The group object.*
__*return*__ | [Address](sdk-src_wasm.md) | *The address object.*

---

### `toGroup() ► Group`

![modifier: public](images/badges/modifier-public.svg)

Get the group representation of the address object.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Group](sdk-src_wasm.md) | **

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

### `toPlaintext() ► Plaintext`

![modifier: public](images/badges/modifier-public.svg)

Get the plaintext representation of the address.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Plaintext](sdk-src_wasm.md) | **

---

### `verify(Byte) ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Verify a signature for a message signed by the address

Parameters | Type | Description
--- | --- | ---
__Byte__ | `Uint8Array` | *array representing a message signed by the address*
__*return*__ | `boolean` | *Boolean representing whether or not the signature is valid*

---

# Class `Authorization`

Authorization object containing the authorization for a transaction.

## Methods

### `new(request) ► Authorization`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a new authorization from a request object.

Parameters | Type | Description
--- | --- | ---
__request__ | `ExecutionRequest` | *The ExecutionRequest to build the authorization from.*
__*return*__ | [Authorization](sdk-src_wasm.md) | **

---

### `replicate() ► Authorization`

![modifier: public](images/badges/modifier-public.svg)

Returns a new and independent replica of the Authorization.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Authorization](sdk-src_wasm.md) | **

---

### `toString() ► string`

![modifier: public](images/badges/modifier-public.svg)

Returns the string representation of the Authorization.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `string` | **

---

### `fromString(authorization) ► Authorization`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Reconstructs an Authorization object from its string representation.

Parameters | Type | Description
--- | --- | ---
__authorization__ | `String` | *The string representation of the Authorization.*
__*return*__ | [Authorization](sdk-src_wasm.md) | **

---

### `toBytesLe() ► Uint8Array`

![modifier: public](images/badges/modifier-public.svg)

Returns the left-endian byte representation of the Authorization.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Uint8Array` | **

---

### `fromBytesLe(bytes) ► Authorization`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Creates an authorization object from a left-endian byte representation of an Authorization.

Parameters | Type | Description
--- | --- | ---
__bytes__ | `Uint8Array` | *Left-endian bytes representing the Authorization.*
__*return*__ | [Authorization](sdk-src_wasm.md) | **

---

### `equals(other) ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Check if an Authorization object is the same as another.

Parameters | Type | Description
--- | --- | ---
__other__ | [Authorization](sdk-src_wasm.md) | *The Authorization object to determine equality with.*
__*return*__ | `boolean` | **

---

### `len() ► number`

![modifier: public](images/badges/modifier-public.svg)

Returns the number of &#x60;Request&#x60;s in the Authorization.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `number` | **

---

### `isEmpty() ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Return &#x60;true&#x60; if the Authorization is empty.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `boolean` | **

---

### `isFeePrivate() ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Returns &#x60;true&#x60; if the Authorization is for &#x60;credits.aleo/fee_private&#x60;.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `boolean` | **

---

### `isFeePublic() ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Returns &#x60;true&#x60; if the Authorization is for &#x60;credits.aleo/fee_public&#x60;.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `boolean` | **

---

### `isSplit() ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Returns &#x60;true&#x60; if the Authorization is for &#x60;credits.aleo/split&#x60;.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `boolean` | **

---

### `insertTransition(transition) ► void`

![modifier: public](images/badges/modifier-public.svg)

Insert a transition into the Authorization.

Parameters | Type | Description
--- | --- | ---
__transition__ | `Transition` | *The transition object to insert into the Authorization.*
__*return*__ | `void` | **

---

### `transitions() ► Array.<Transition>`

![modifier: public](images/badges/modifier-public.svg)

Get the transitions in an Authorization.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Array.<Transition>` | *Array of transition objects*

---

### `toExecutionId() ► Field`

![modifier: public](images/badges/modifier-public.svg)

Returns the execution ID for the Authorization.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Field](sdk-src_wasm.md) | *The execution ID for the Authorization, call toString() after this result to get the string representation.*

---

# Class `Ciphertext`

SnarkVM Ciphertext object. A Ciphertext represents an symmetrically encrypted plaintext. This
object provides decryption methods to recover the plaintext from the ciphertext (given the
api consumer has the proper decryption materials).

## Methods

### `decrypt(viewKey, nonce) ► Plaintext`

![modifier: public](images/badges/modifier-public.svg)

Decrypt the ciphertext using the given view key.

Parameters | Type | Description
--- | --- | ---
__viewKey__ | `ViewKey` | *The view key of the account that encrypted the ciphertext.*
__nonce__ | [Group](sdk-src_wasm.md) | *The nonce used to encrypt the ciphertext.*
__*return*__ | [Plaintext](sdk-src_wasm.md) | *The decrypted plaintext.*

---

### `decryptWithTransitionInfo(view_key, transition_public_key, program, function_name, index) ► Plaintext`

![modifier: public](images/badges/modifier-public.svg)

Decrypt a ciphertext using the view key of the transition signer, transition public key, and
(program, function, index) tuple.

Parameters | Type | Description
--- | --- | ---
__view_key__ | `ViewKey` | *The view key of the transition signer.*
__transition_public_key__ | [Group](sdk-src_wasm.md) | *The transition public key used to encrypt the ciphertext.*
__program__ | `string` | *The program ID associated with the ciphertext.*
__function_name__ | `string` | *The name of the function associated with the encrypted inputs and outputs.*
__index__ | `u16` | *The index of the input or output parameter that was encrypted.*
__*return*__ | [Plaintext](sdk-src_wasm.md) | *The decrypted plaintext.*

---

### `decryptWithTransitionViewKey(transition_view_key, program, function_name, index) ► Plaintext`

![modifier: public](images/badges/modifier-public.svg)

Decrypt a ciphertext using the transition view key and a (program, function, index) tuple.

Parameters | Type | Description
--- | --- | ---
__transition_view_key__ | [Field](sdk-src_wasm.md) | *The transition view key that was used to encrypt the ciphertext.*
__program__ | `string` | *The program ID associated with the ciphertext.*
__function_name__ | `string` | *The name of the function associated with the encrypted inputs and outputs.*
__index__ | `u16` | *The index of the input or output parameter that was encrypted.*
__*return*__ | [Plaintext](sdk-src_wasm.md) | *The decrypted plaintext.*

---

### `decryptSymmetric(transition_view_key) ► Plaintext`

![modifier: public](images/badges/modifier-public.svg)

Decrypts a ciphertext into plaintext using the given ciphertext view key.

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

### `toBytesLe() ► Uint8Array`

![modifier: public](images/badges/modifier-public.svg)

Get the left endian byte array representation of the ciphertext.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Uint8Array` | **

---

### `fromBitsLe(bits) ► Ciphertext`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Get a ciphertext object from a series of bits represented as a boolean array.

Parameters | Type | Description
--- | --- | ---
__bits__ | `Array` | *A left endian boolean array representing the bits of the ciphertext.*
__*return*__ | [Ciphertext](sdk-src_wasm.md) | *The ciphertext object.*

---

### `toBitsLe() ► Array.<any>`

![modifier: public](images/badges/modifier-public.svg)

Get the left endian boolean array representation of the bits of the ciphertext.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Array.<any>` | **

---

### `fromFields(fields) ► Ciphertext`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Get a ciphertext object from an array of fields.

Parameters | Type | Description
--- | --- | ---
__fields__ | `Array` | *An array of fields.*
__*return*__ | [Ciphertext](sdk-src_wasm.md) | *The ciphertext object.*

---

### `toFields() ► Array.<any>`

![modifier: public](images/badges/modifier-public.svg)

Get the field array representation of the ciphertext.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Array.<any>` | **

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

Creates a field object from a string representation of a field element.

Parameters | Type | Description
--- | --- | ---
__field__ | `string` | **
__*return*__ | [Field](sdk-src_wasm.md) | **

---

### `toString() ► string`

![modifier: public](images/badges/modifier-public.svg)

Returns the string representation of the field element.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `string` | **

---

### `fromBytesLe(bytes) ► Field`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a field element from a Uint8Array of left endian bytes.

Parameters | Type | Description
--- | --- | ---
__bytes__ | `Uint8Array` | **
__*return*__ | [Field](sdk-src_wasm.md) | **

---

### `toBytesLe() ► Uint8Array`

![modifier: public](images/badges/modifier-public.svg)

Encode the field element as a Uint8Array of left endian bytes.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Uint8Array` | **

---

### `fromBitsLe(bits) ► Field`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Reconstruct a field element from a boolean array representation.

Parameters | Type | Description
--- | --- | ---
__bits__ | `Array.<any>` | **
__*return*__ | [Field](sdk-src_wasm.md) | **

---

### `toBitsLe() ► Array.<any>`

![modifier: public](images/badges/modifier-public.svg)

Get the left endian boolean array representation of the field element.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Array.<any>` | **

---

### `toPlaintext() ► Plaintext`

![modifier: public](images/badges/modifier-public.svg)

Create a plaintext from the field element.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Plaintext](sdk-src_wasm.md) | **

---

### `clone() ► Field`

![modifier: public](images/badges/modifier-public.svg)

Clone the field element.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Field](sdk-src_wasm.md) | **

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

Get the additive identity element of the field.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Field](sdk-src_wasm.md) | **

---

### `one() ► Field`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Get the multiplicative identity of the field.

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

# Class `Group`

Elliptic curve element.

## Methods

### `fromString(group) ► Group`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Creates a group object from a string representation of a group element.

Parameters | Type | Description
--- | --- | ---
__group__ | `string` | **
__*return*__ | [Group](sdk-src_wasm.md) | **

---

### `toString() ► string`

![modifier: public](images/badges/modifier-public.svg)

Returns the string representation of the group element.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `string` | **

---

### `fromBytesLe(bytes) ► Group`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a group element from a Uint8Array of left endian bytes.

Parameters | Type | Description
--- | --- | ---
__bytes__ | `Uint8Array` | **
__*return*__ | [Group](sdk-src_wasm.md) | **

---

### `toBytesLe() ► Uint8Array`

![modifier: public](images/badges/modifier-public.svg)

Encode the group element as a Uint8Array of left endian bytes.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Uint8Array` | **

---

### `fromBitsLe(bits) ► Group`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Reconstruct a group element from a boolean array representation.

Parameters | Type | Description
--- | --- | ---
__bits__ | `Array.<any>` | **
__*return*__ | [Group](sdk-src_wasm.md) | **

---

### `toBitsLe() ► Array.<any>`

![modifier: public](images/badges/modifier-public.svg)

Get the left endian boolean array representation of the group element.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Array.<any>` | **

---

### `toFields() ► Array.<any>`

![modifier: public](images/badges/modifier-public.svg)

Get the field array representation of the group.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Array.<any>` | **

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

### `clone() ► Group`

![modifier: public](images/badges/modifier-public.svg)

Clone the group element.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Group](sdk-src_wasm.md) | **

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

# Class `OfflineQuery`

An offline query object used to insert the global state root and state paths needed to create
a valid inclusion proof offline.

## Constructors


### `OfflineQuery(block_height, state_root)`

Creates a new offline query object. The state root is required to be passed in as a string

Parameters | Type | Description
--- | --- | ---
__block_height__ | `u32` | *The block height.*
__state_root__ | `string` | *The state root of the current network.*
__*return*__ | [OfflineQuery](sdk-src_wasm.md) | *The newly created offline query object.*

---

## Methods

### `addBlockHeight(block_height) ► void`

![modifier: public](images/badges/modifier-public.svg)

Add a new block height to the offline query object.

Parameters | Type | Description
--- | --- | ---
__block_height__ | `u32` | *The block height to add.*
__*return*__ | `void` | **

---

### `addStatePath(commitment:, state_path:) ► void`

![modifier: public](images/badges/modifier-public.svg)

Add a new state path to the offline query object.

Parameters | Type | Description
--- | --- | ---
__commitment:__ | `string` | *The commitment corresponding to a record input.*
__state_path:__ | `string` | *The state path corresponding to the commitment.*
__*return*__ | `void` | **

---

### `toString() ► string`

![modifier: public](images/badges/modifier-public.svg)

Get a json string representation of the offline query object.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `string` | *JSON string representation of the offline query object.*

---

### `fromString(JSON) ► OfflineQuery`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create an offline query object from a json string representation.

Parameters | Type | Description
--- | --- | ---
__JSON__ | `string` | *string representation of the offline query object.*
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
__address__ | [Address](sdk-src_wasm.md) | *The address to encrypt the plaintext for.*
__randomizer__ | [Scalar](sdk-src_wasm.md) | *The randomizer to use for encryption.*
__*return*__ | [Ciphertext](sdk-src_wasm.md) | *The encrypted ciphertext.*

---

### `encryptSymmetric(transition_view_key) ► Ciphertext`

![modifier: public](images/badges/modifier-public.svg)

Encrypt a plaintext with a transition view key.

Parameters | Type | Description
--- | --- | ---
__transition_view_key__ | [Field](sdk-src_wasm.md) | *The transition view key of the transition
associated with the plaintext.*
__*return*__ | [Ciphertext](sdk-src_wasm.md) | *The encrypted ciphertext.*

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

### `toBytesLe() ► Uint8Array`

![modifier: public](images/badges/modifier-public.svg)

Get the left endian byte array representation of the plaintext.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Uint8Array` | *The left endian byte array representation of the plaintext.*

---

### `fromBitsLe(bits) ► Plaintext`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Get a plaintext object from a series of bits represented as a boolean array.

Parameters | Type | Description
--- | --- | ---
__bits__ | `Array` | *A left endian boolean array representing the bits plaintext.*
__*return*__ | [Plaintext](sdk-src_wasm.md) | *The plaintext object.*

---

### `toBitsLe() ► Array`

![modifier: public](images/badges/modifier-public.svg)

Get the left endian boolean array representation of the bits of the plaintext.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Array` | *The left endian boolean array representation of the bits of the plaintext.*

---

### `fromFields(fields) ► Plaintext`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Get a plaintext object from an array of fields.

Parameters | Type | Description
--- | --- | ---
__fields__ | `Array` | *An array of fields.*
__*return*__ | [Plaintext](sdk-src_wasm.md) | *The plaintext object.*

---

### `toFields() ► Array`

![modifier: public](images/badges/modifier-public.svg)

Get the field array representation of the plaintext.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Array` | *The field array representation of the plaintext.*

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
__*return*__ | `ViewKey` | **

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

Return the string representation of the record ciphertext

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
__view_key__ | `ViewKey` | *View key used to decrypt the ciphertext*
__*return*__ | [RecordPlaintext](sdk-src_wasm.md) | *Record plaintext object*

---

### `recordViewKey(view_key) ► Group`

![modifier: public](images/badges/modifier-public.svg)

Generate the record view key. The record view key can only decrypt record if the
supplied view key belongs to the record owner.

Parameters | Type | Description
--- | --- | ---
__view_key__ | `ViewKey` | *View key used to generate the record view key*
__*return*__ | [Group](sdk-src_wasm.md) | *record view key*

---

### `isOwner(view_key) ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Determines if the account corresponding to the view key is the owner of the record

Parameters | Type | Description
--- | --- | ---
__view_key__ | `ViewKey` | *View key used to decrypt the ciphertext*
__*return*__ | `boolean` | **

---

### `tag(graph, commitment) ► Field`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Get the tag of the record using the graph key.

Parameters | Type | Description
--- | --- | ---
__graph__ | `GraphKey` | *key of the account associatd with the record.*
__commitment__ | [Field](sdk-src_wasm.md) | *of the record.*
__*return*__ | [Field](sdk-src_wasm.md) | *tag of the record.*

---

### `fromBytesLe(bytes) ► RecordCiphertext`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Get a record ciphertext object from a series of bytes.

Parameters | Type | Description
--- | --- | ---
__bytes__ | `Uint8Array` | *A left endian byte array representing the record ciphertext.*
__*return*__ | [RecordCiphertext](sdk-src_wasm.md) | **

---

### `toBytesLe() ► Uint8Array`

![modifier: public](images/badges/modifier-public.svg)

Get the left endian byte array representation of the record ciphertext.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Uint8Array` | *Left endian byte array representation of the record ciphertext.*

---

### `toBitsLe() ► Array.<any>`

![modifier: public](images/badges/modifier-public.svg)

Get the left endian boolean array representation of the record ciphertext bits.

returns {Array} Left endian boolean array representation of the bits of the record ciphertext.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Array.<any>` | **

---

### `toFields() ► Array`

![modifier: public](images/badges/modifier-public.svg)

Get the field array representation of the record ciphertext.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Array` | *Field array representation of the record ciphertext.*

---

### `decryptWithRecordViewKey(record_vk) ► RecordPlaintext`

![modifier: public](images/badges/modifier-public.svg)

Decrypt the record ciphertext into plaintext using a record view key.

Parameters | Type | Description
--- | --- | ---
__record_vk__ | [Field](sdk-src_wasm.md) | *Record view key used to decrypt the record.*
__*return*__ | [RecordPlaintext](sdk-src_wasm.md) | **

---

### `nonce() ► Group`

![modifier: public](images/badges/modifier-public.svg)

Get the record nonce.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Group](sdk-src_wasm.md) | *The record nonce.*

---

# Class `RecordPlaintext`

Plaintext representation of an Aleo record

## Methods

### `fromString(record) ► RecordPlaintext`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Return a record plaintext from a string.

Parameters | Type | Description
--- | --- | ---
__record__ | `string` | *String representation of a plaintext representation of an Aleo record.*
__*return*__ | [RecordPlaintext](sdk-src_wasm.md) | *Record plaintext*

---

### `getMember(input) ► Plaintext`

![modifier: public](images/badges/modifier-public.svg)

Get the record entry matching a key.

Parameters | Type | Description
--- | --- | ---
__input__ | `string` | *The key to retrieve the value in the record data field.*
__*return*__ | [Plaintext](sdk-src_wasm.md) | *The plaintext value corresponding to the key.*

---

### `owner() ► Address`

![modifier: public](images/badges/modifier-public.svg)

Get the owner of the record.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Address](sdk-src_wasm.md) | *Address of the owner of the record.*

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

### `fromBytesLe(bytes) ► RecordPlaintext`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Get a record plaintext object from a series of bytes.

Parameters | Type | Description
--- | --- | ---
__bytes__ | `Uint8Array` | *A left endian byte array representing the record plaintext.*
__*return*__ | [RecordPlaintext](sdk-src_wasm.md) | *The record plaintext.*

---

### `toBytesLe() ► Uint8Array`

![modifier: public](images/badges/modifier-public.svg)

Returns the left endian byte array representation of the record plaintext.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Uint8Array` | *Byte array representation of the record plaintext.*

---

### `toBitsLe() ► Array`

![modifier: public](images/badges/modifier-public.svg)

Returns the left endian boolean array representation of the record plaintext bits.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Array` | *Boolean array representation of the record plaintext bits.*

---

### `toFields() ► Array.<any>`

![modifier: public](images/badges/modifier-public.svg)

Get the field array representation of the record plaintext.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Array.<any>` | **

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

### `serialNumberString(private_key, program_id, record_name, record_view_key) ► string`

![modifier: public](images/badges/modifier-public.svg)

Attempt to get the serial number of a record to determine whether or not is has been spent

Parameters | Type | Description
--- | --- | ---
__private_key__ | [PrivateKey](sdk-src_wasm.md) | *Private key of the account that owns the record*
__program_id__ | `string` | *Program ID of the program that the record is associated with*
__record_name__ | `string` | *Name of the record*
__record_view_key__ | `string` | *The string representation of the record view key.*
__*return*__ | `string` | *Serial number of the record*

---

### `tag(graph_key, commitment) ► Field`

![modifier: public](images/badges/modifier-public.svg)

Get the tag of the record using the graph key.

Parameters | Type | Description
--- | --- | ---
__graph_key__ | `GraphKey` | **
__commitment__ | [Field](sdk-src_wasm.md) | **
__*return*__ | [Field](sdk-src_wasm.md) | **

---

### `recordViewKey(view_key) ► Group`

![modifier: public](images/badges/modifier-public.svg)

Generate the record view key. The record view key can only decrypt record if the
supplied view key belongs to the record owner.

Parameters | Type | Description
--- | --- | ---
__view_key__ | `ViewKey` | *View key used to generate the record view key*
__*return*__ | [Group](sdk-src_wasm.md) | *record view key*

---

# Class `Scalar`

Scalar field element.

## Methods

### `fromString(group) ► Scalar`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Creates a scalar object from a string representation of a scalar element.

Parameters | Type | Description
--- | --- | ---
__group__ | `string` | **
__*return*__ | [Scalar](sdk-src_wasm.md) | **

---

### `toString() ► string`

![modifier: public](images/badges/modifier-public.svg)

Returns the string representation of the scalar element.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `string` | **

---

### `fromBytesLe(bytes) ► Scalar`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a scalar element from a Uint8Array of left endian bytes.

Parameters | Type | Description
--- | --- | ---
__bytes__ | `Uint8Array` | **
__*return*__ | [Scalar](sdk-src_wasm.md) | **

---

### `toBytesLe() ► Uint8Array`

![modifier: public](images/badges/modifier-public.svg)

Encode the scalar element as a Uint8Array of left endian bytes.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Uint8Array` | **

---

### `fromBitsLe(bits) ► Scalar`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Reconstruct a scalar element from a boolean array representation.

Parameters | Type | Description
--- | --- | ---
__bits__ | `Array.<any>` | **
__*return*__ | [Scalar](sdk-src_wasm.md) | **

---

### `toBitsLe() ► Array.<any>`

![modifier: public](images/badges/modifier-public.svg)

Get the left endian boolean array representation of the scalar element.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Array.<any>` | **

---

### `toPlaintext() ► Plaintext`

![modifier: public](images/badges/modifier-public.svg)

Create a plaintext element from a scalar element.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Plaintext](sdk-src_wasm.md) | **

---

### `clone() ► Scalar`

![modifier: public](images/badges/modifier-public.svg)

Clone the scalar element.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Scalar](sdk-src_wasm.md) | **

---

### `random() ► Scalar`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Generate a random scalar element.

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

Get the multiplicative identity of the scalar field.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Scalar](sdk-src_wasm.md) | **

---

### `zero() ► Scalar`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Get the additive identity of the scalar field.

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

### `fromBytesLe(bytes) ► Signature`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Get a signature from a series of bytes.

Parameters | Type | Description
--- | --- | ---
__bytes__ | `Uint8Array` | *A left endian byte array representing the signature.*
__*return*__ | [Signature](sdk-src_wasm.md) | *The signature object.*

---

### `toBytesLe() ► Uint8Array`

![modifier: public](images/badges/modifier-public.svg)

Get the left endian byte array representation of the signature.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Uint8Array` | **

---

### `fromBitsLe(bits) ► Signature`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Get a signature from a series of bits represented as a boolean array.

Parameters | Type | Description
--- | --- | ---
__bits__ | `Array` | *A left endian boolean array representing the bits of the signature.*
__*return*__ | [Signature](sdk-src_wasm.md) | *The signature object.*

---

### `toBitsLe() ► Array.<any>`

![modifier: public](images/badges/modifier-public.svg)

Get the left endian boolean array representation of the bits of the signature.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Array.<any>` | **

---

### `toFields() ► Array.<any>`

![modifier: public](images/badges/modifier-public.svg)

Get the field array representation of the signature.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Array.<any>` | **

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

### `toPlaintext() ► Plaintext`

![modifier: public](images/badges/modifier-public.svg)

Get the plaintext representation of the signature.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [Plaintext](sdk-src_wasm.md) | **

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
__view_key__ | `ViewKey` | *View key used to decrypt the ciphertext*
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
