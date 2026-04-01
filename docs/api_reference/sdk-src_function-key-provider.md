# Module `src/function-key-provider`

![category:other](https://img.shields.io/badge/category-other-blue.svg?style=flat-square)



[Source file](../../packages/provable-core/src/keys/provider/interface.ts)

# Class `AleoKeyProviderParams`

AleoKeyProviderParams search parameter for the AleoKeyProvider. It allows for the specification of a proverUri and
verifierUri to fetch keys via HTTP from a remote resource as well as a unique cacheKey to store the keys in memory.

## Constructors


### `AleoKeyProviderParams(params)`

Create a new AleoKeyProviderParams object which implements the KeySearchParams interface. Users can optionally
specify a url for the proverUri &amp; verifierUri to fetch keys via HTTP from a remote resource as well as a unique
cacheKey to store the keys in memory for future use. If no proverUri or verifierUri is specified, a cachekey must
be provided.

Parameters | Type | Description
--- | --- | ---
__params__ | `AleoKeyProviderInitParams` | *Optional search parameters*

---

# Class `AleoKeyProvider`

AleoKeyProvider class. Implements the KeyProvider interface. Enables the retrieval of Aleo program proving and
verifying keys for the credits.aleo program over http from official Aleo sources and storing and retrieving function
keys from a local memory cache.

## Methods

### `useCache(useCache)`

![modifier: public](images/badges/modifier-public.svg)

Use local memory to store keys

Parameters | Type | Description
--- | --- | ---
__useCache__ | `boolean` | *whether to store keys in local memory*

---

### `clearCache()`

![modifier: public](images/badges/modifier-public.svg)

Clear the key cache

---

### `cacheKeys(keyId, keys)`

![modifier: public](images/badges/modifier-public.svg)

Cache a set of keys. This will overwrite any existing keys with the same keyId. The user can check if a keyId
exists in the cache using the containsKeys method prior to calling this method if overwriting is not desired.

Parameters | Type | Description
--- | --- | ---
__keyId__ | `string` | *access key for the cache*
__keys__ | `FunctionKeyPair` | *keys to cache*

---

### `containsKeys(keyId) ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Determine if a keyId exists in the cache

Parameters | Type | Description
--- | --- | ---
__keyId__ | `string` | *keyId of a proving and verifying key pair*
__*return*__ | `boolean` | *true if the keyId exists in the cache, false otherwise*

---

### `deleteKeys(keyId) ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Delete a set of keys from the cache

Parameters | Type | Description
--- | --- | ---
__keyId__ | `string` | *keyId of a proving and verifying key pair to delete from memory*
__*return*__ | `boolean` | *true if the keyId exists in the cache and was deleted, false if the key did not exist*

---

### `getKeys(keyId) ► FunctionKeyPair`

![modifier: public](images/badges/modifier-public.svg)

Get a set of keys from the cache

Parameters | Type | Description
--- | --- | ---
__keyId__ | `undefined` | *keyId of a proving and verifying key pair*
__*return*__ | `FunctionKeyPair` | *Proving and verifying keys for the specified program*

---

### `functionKeys(params) ► Promise.<FunctionKeyPair>`

![modifier: public](images/badges/modifier-public.svg)

Get arbitrary function keys from a provider

Parameters | Type | Description
--- | --- | ---
__params__ | `KeySearchParams` | *parameters for the key search in form of: {proverUri: string, verifierUri: string, cacheKey: string}*
__*return*__ | `Promise.<FunctionKeyPair>` | *Proving and verifying keys for the specified program*

#### Examples

```javascript
// Create a new object which implements the KeyProvider interface
const networkClient = new AleoNetworkClient("https://api.provable.com/v2");
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);

// Initialize a program manager with the key provider to automatically fetch keys for value transfers
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);

// Keys can also be fetched manually using the key provider
const keySearchParams = { "cacheKey": "myProgram:myFunction" };
const [transferPrivateProvingKey, transferPrivateVerifyingKey] = await keyProvider.functionKeys(keySearchParams);
```

---

### `fetchRemoteKeys(verifierUrl, proverUrl, cacheKey) ► Promise.<FunctionKeyPair>`

![modifier: public](images/badges/modifier-public.svg)

Returns the proving and verifying keys for a specified program from a specified url.

Parameters | Type | Description
--- | --- | ---
__verifierUrl__ | `string` | *Url of the proving key*
__proverUrl__ | `string` | *Url the verifying key*
__cacheKey__ | `string` | *Key to store the keys in the cache*
__*return*__ | `Promise.<FunctionKeyPair>` | *Proving and verifying keys for the specified program*

#### Examples

```javascript
// Create a new AleoKeyProvider object
const networkClient = new AleoNetworkClient("https://api.provable.com/v2");
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);

// Initialize a program manager with the key provider to automatically fetch keys for value transfers
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);

// Keys can also be fetched manually
const [transferPrivateProvingKey, transferPrivateVerifyingKey] = await keyProvider.fetchKeys(
    CREDITS_PROGRAM_KEYS.transfer_private.prover,
    CREDITS_PROGRAM_KEYS.transfer_private.verifier,
);
```

---

### `transferKeys(visibility) ► Promise.<FunctionKeyPair>`

![modifier: public](images/badges/modifier-public.svg)

Returns the proving and verifying keys for the transfer functions in the credits.aleo program

Parameters | Type | Description
--- | --- | ---
__visibility__ | `string` | *Visibility of the transfer function*
__*return*__ | `Promise.<FunctionKeyPair>` | *Proving and verifying keys for the transfer functions*

#### Examples

```javascript
// Create a new AleoKeyProvider
const networkClient = new AleoNetworkClient("https://api.provable.com/v2");
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);

// Initialize a program manager with the key provider to automatically fetch keys for value transfers
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);

// Keys can also be fetched manually
const [transferPublicProvingKey, transferPublicVerifyingKey] = await keyProvider.transferKeys("public");
```

---

### `transferPublicKeys() ► Promise.<FunctionKeyPair>`

![modifier: public](images/badges/modifier-public.svg)

Returns the proving and verifying keys for the transfer_public function.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<FunctionKeyPair>` | *Proving and verifying keys for the transfer_public function*

---

### `inclusionKeys() ► Promise.<FunctionKeyPair>`

![modifier: public](images/badges/modifier-public.svg)

Returns the proving and verifying keys for the inclusion proof.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<FunctionKeyPair>` | *Proving and verifying keys for the inclusion proof.*

---

### `joinKeys() ► Promise.<FunctionKeyPair>`

![modifier: public](images/badges/modifier-public.svg)

Returns the proving and verifying keys for the join function in the credits.aleo program

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<FunctionKeyPair>` | *Proving and verifying keys for the join function*

---

### `splitKeys() ► Promise.<FunctionKeyPair>`

![modifier: public](images/badges/modifier-public.svg)

Returns the proving and verifying keys for the split function in the credits.aleo program

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<FunctionKeyPair>` | *Proving and verifying keys for the split function*

---

### `feePrivateKeys() ► Promise.<FunctionKeyPair>`

![modifier: public](images/badges/modifier-public.svg)

Returns the proving and verifying keys for the fee_private function in the credits.aleo program

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<FunctionKeyPair>` | *Proving and verifying keys for the fee function*

---

### `feePublicKeys() ► Promise.<FunctionKeyPair>`

![modifier: public](images/badges/modifier-public.svg)

Returns the proving and verifying keys for the fee_public function in the credits.aleo program

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<FunctionKeyPair>` | *Proving and verifying keys for the fee function*

---

### `getVerifyingKey() ► Promise.<VerifyingKey>`

![modifier: public](images/badges/modifier-public.svg)

Gets a verifying key. If the verifying key is for a credits.aleo function, get it from the wasm cache otherwise

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<VerifyingKey>` | *Verifying key for the function*

---

### `useCache(useCache)`

![modifier: public](images/badges/modifier-public.svg)

Use local memory to store keys

Parameters | Type | Description
--- | --- | ---
__useCache__ | `boolean` | *whether to store keys in local memory*

---

### `clearCache()`

![modifier: public](images/badges/modifier-public.svg)

Clear the key cache

---

### `cacheKeys(keyId, keys)`

![modifier: public](images/badges/modifier-public.svg)

Cache a set of keys. This will overwrite any existing keys with the same keyId. The user can check if a keyId
exists in the cache using the containsKeys method prior to calling this method if overwriting is not desired.

Parameters | Type | Description
--- | --- | ---
__keyId__ | `string` | *access key for the cache*
__keys__ | `FunctionKeyPair` | *keys to cache*

---

### `containsKeys(keyId) ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Determine if a keyId exists in the cache

Parameters | Type | Description
--- | --- | ---
__keyId__ | `string` | *keyId of a proving and verifying key pair*
__*return*__ | `boolean` | *true if the keyId exists in the cache, false otherwise*

---

### `deleteKeys(keyId) ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Delete a set of keys from the cache

Parameters | Type | Description
--- | --- | ---
__keyId__ | `string` | *keyId of a proving and verifying key pair to delete from memory*
__*return*__ | `boolean` | *true if the keyId exists in the cache and was deleted, false if the key did not exist*

---

### `getKeys(keyId) ► FunctionKeyPair`

![modifier: public](images/badges/modifier-public.svg)

Get a set of keys from the cache

Parameters | Type | Description
--- | --- | ---
__keyId__ | `undefined` | *keyId of a proving and verifying key pair*
__*return*__ | `FunctionKeyPair` | *Proving and verifying keys for the specified program*

---

### `functionKeys(params) ► Promise.<FunctionKeyPair>`

![modifier: public](images/badges/modifier-public.svg)

Get arbitrary function keys from a provider

Parameters | Type | Description
--- | --- | ---
__params__ | `KeySearchParams` | *parameters for the key search in form of: {proverUri: string, verifierUri: string, cacheKey: string}*
__*return*__ | `Promise.<FunctionKeyPair>` | *Proving and verifying keys for the specified program*

#### Examples

```javascript
// Create a new object which implements the KeyProvider interface
const networkClient = new AleoNetworkClient("https://api.provable.com/v2");
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);

// Initialize a program manager with the key provider to automatically fetch keys for value transfers
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);

// Keys can also be fetched manually using the key provider
const keySearchParams = { "cacheKey": "myProgram:myFunction" };
const [transferPrivateProvingKey, transferPrivateVerifyingKey] = await keyProvider.functionKeys(keySearchParams);
```

---

### `fetchRemoteKeys(verifierUrl, proverUrl, cacheKey) ► Promise.<FunctionKeyPair>`

![modifier: public](images/badges/modifier-public.svg)

Returns the proving and verifying keys for a specified program from a specified url.

Parameters | Type | Description
--- | --- | ---
__verifierUrl__ | `string` | *Url of the proving key*
__proverUrl__ | `string` | *Url the verifying key*
__cacheKey__ | `string` | *Key to store the keys in the cache*
__*return*__ | `Promise.<FunctionKeyPair>` | *Proving and verifying keys for the specified program*

#### Examples

```javascript
// Create a new AleoKeyProvider object
const networkClient = new AleoNetworkClient("https://api.provable.com/v2");
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);

// Initialize a program manager with the key provider to automatically fetch keys for value transfers
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);

// Keys can also be fetched manually
const [transferPrivateProvingKey, transferPrivateVerifyingKey] = await keyProvider.fetchKeys(
    CREDITS_PROGRAM_KEYS.transfer_private.prover,
    CREDITS_PROGRAM_KEYS.transfer_private.verifier,
);
```

---

### `transferKeys(visibility) ► Promise.<FunctionKeyPair>`

![modifier: public](images/badges/modifier-public.svg)

Returns the proving and verifying keys for the transfer functions in the credits.aleo program

Parameters | Type | Description
--- | --- | ---
__visibility__ | `string` | *Visibility of the transfer function*
__*return*__ | `Promise.<FunctionKeyPair>` | *Proving and verifying keys for the transfer functions*

#### Examples

```javascript
// Create a new AleoKeyProvider
const networkClient = new AleoNetworkClient("https://api.provable.com/v2");
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);

// Initialize a program manager with the key provider to automatically fetch keys for value transfers
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);

// Keys can also be fetched manually
const [transferPublicProvingKey, transferPublicVerifyingKey] = await keyProvider.transferKeys("public");
```

---

### `transferPublicKeys() ► Promise.<FunctionKeyPair>`

![modifier: public](images/badges/modifier-public.svg)

Returns the proving and verifying keys for the transfer_public function.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<FunctionKeyPair>` | *Proving and verifying keys for the transfer_public function*

---

### `inclusionKeys() ► Promise.<FunctionKeyPair>`

![modifier: public](images/badges/modifier-public.svg)

Returns the proving and verifying keys for the inclusion proof.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<FunctionKeyPair>` | *Proving and verifying keys for the inclusion proof.*

---

### `joinKeys() ► Promise.<FunctionKeyPair>`

![modifier: public](images/badges/modifier-public.svg)

Returns the proving and verifying keys for the join function in the credits.aleo program

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<FunctionKeyPair>` | *Proving and verifying keys for the join function*

---

### `splitKeys() ► Promise.<FunctionKeyPair>`

![modifier: public](images/badges/modifier-public.svg)

Returns the proving and verifying keys for the split function in the credits.aleo program

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<FunctionKeyPair>` | *Proving and verifying keys for the split function*

---

### `feePrivateKeys() ► Promise.<FunctionKeyPair>`

![modifier: public](images/badges/modifier-public.svg)

Returns the proving and verifying keys for the fee_private function in the credits.aleo program

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<FunctionKeyPair>` | *Proving and verifying keys for the fee function*

---

### `feePublicKeys() ► Promise.<FunctionKeyPair>`

![modifier: public](images/badges/modifier-public.svg)

Returns the proving and verifying keys for the fee_public function in the credits.aleo program

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<FunctionKeyPair>` | *Proving and verifying keys for the fee function*

---

### `getVerifyingKey(verifierUri) ► Promise.<VerifyingKey>`

![modifier: public](images/badges/modifier-public.svg)

Gets a verifying key. If the verifying key is for a credits.aleo function, get it from the wasm cache otherwise

Parameters | Type | Description
--- | --- | ---
__verifierUri__ | `string` | **
__*return*__ | `Promise.<VerifyingKey>` | *Verifying key for the function*

---
