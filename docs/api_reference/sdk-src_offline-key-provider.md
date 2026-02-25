# Module `src/offline-key-provider`

![category:other](https://img.shields.io/badge/category-other-blue.svg?style=flat-square)



[Source file](../../sdk/src/keys/provider/offline.ts)

# Class `OfflineSearchParams`

Search parameters for the offline key provider. This class implements the KeySearchParams interface and includes
a convenience method for creating a new instance of this class for each function of the credits.aleo program.

## Examples

```javascript
// If storing a key for a custom program function
offlineSearchParams = new OfflineSearchParams("myprogram.aleo/myfunction");

// If storing a key for a credits.aleo program function
bondPublicKeyParams = OfflineSearchParams.bondPublicKeyParams();
```

## Constructors


### `OfflineSearchParams(cacheKey, verifyCreditsKeys)`

Create a new OfflineSearchParams instance.

Parameters | Type | Description
--- | --- | ---
__cacheKey__ | `string` | *Key used to store the local function proving &amp; verifying keys. This should be stored
under the naming convention &quot;programName/functionName&quot; (i.e. &quot;myprogram.aleo/myfunction&quot;)*
__verifyCreditsKeys__ | `boolean` | *Whether to verify the keys against the credits.aleo program,
defaults to false, but should be set to true if using keys from the credits.aleo program*

---

## Methods

### `bondPublicKeyParams()`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a new OfflineSearchParams instance for the bond_public function of the credits.aleo program.

---

### `bondValidatorKeyParams()`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a new OfflineSearchParams instance for the bond_validator function of the credits.aleo program.

---

### `claimUnbondPublicKeyParams()`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a new OfflineSearchParams instance for the claim_unbond_public function of the

---

### `feePrivateKeyParams()`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a new OfflineSearchParams instance for the fee_private function of the credits.aleo program.

---

### `feePublicKeyParams()`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a new OfflineSearchParams instance for the fee_public function of the credits.aleo program.

---

### `inclusionKeyParams()`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a new OfflineSearchParams instance for the inclusion prover function.

---

### `joinKeyParams()`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a new OfflineSearchParams instance for the join function of the credits.aleo program.

---

### `setValidatorStateKeyParams()`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a new OfflineSearchParams instance for the set_validator_state function of the credits.aleo program.

---

### `splitKeyParams()`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a new OfflineSearchParams instance for the split function of the credits.aleo program.

---

### `transferPrivateKeyParams()`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a new OfflineSearchParams instance for the transfer_private function of the credits.aleo program.

---

### `transferPrivateToPublicKeyParams()`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a new OfflineSearchParams instance for the transfer_private_to_public function of the credits.aleo program.

---

### `transferPublicKeyParams()`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a new OfflineSearchParams instance for the transfer_public function of the credits.aleo program.

---

### `transferPublicAsSignerKeyParams()`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a new OfflineSearchParams instance for the transfer_public_as_signer function of the credits.aleo program.

---

### `transferPublicToPrivateKeyParams()`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a new OfflineSearchParams instance for the transfer_public_to_private function of the credits.aleo program.

---

### `unbondPublicKeyParams()`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a new OfflineSearchParams instance for the unbond_public function of the credits.aleo program.

---

### `bondPublicKeyParams() ► OfflineSearchParams`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a new OfflineSearchParams instance for the bond_public function of the credits.aleo program.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [OfflineSearchParams](sdk-src_offline-key-provider.md) | **

---

### `bondValidatorKeyParams() ► OfflineSearchParams`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a new OfflineSearchParams instance for the bond_validator function of the credits.aleo program.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [OfflineSearchParams](sdk-src_offline-key-provider.md) | **

---

### `claimUnbondPublicKeyParams() ► OfflineSearchParams`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a new OfflineSearchParams instance for the claim_unbond_public function of the

Parameters | Type | Description
--- | --- | ---
__*return*__ | [OfflineSearchParams](sdk-src_offline-key-provider.md) | **

---

### `feePrivateKeyParams() ► OfflineSearchParams`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a new OfflineSearchParams instance for the fee_private function of the credits.aleo program.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [OfflineSearchParams](sdk-src_offline-key-provider.md) | **

---

### `feePublicKeyParams() ► OfflineSearchParams`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a new OfflineSearchParams instance for the fee_public function of the credits.aleo program.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [OfflineSearchParams](sdk-src_offline-key-provider.md) | **

---

### `inclusionKeyParams() ► OfflineSearchParams`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a new OfflineSearchParams instance for the inclusion prover function.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [OfflineSearchParams](sdk-src_offline-key-provider.md) | **

---

### `joinKeyParams() ► OfflineSearchParams`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a new OfflineSearchParams instance for the join function of the credits.aleo program.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [OfflineSearchParams](sdk-src_offline-key-provider.md) | **

---

### `setValidatorStateKeyParams() ► OfflineSearchParams`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a new OfflineSearchParams instance for the set_validator_state function of the credits.aleo program.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [OfflineSearchParams](sdk-src_offline-key-provider.md) | **

---

### `splitKeyParams() ► OfflineSearchParams`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a new OfflineSearchParams instance for the split function of the credits.aleo program.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [OfflineSearchParams](sdk-src_offline-key-provider.md) | **

---

### `transferPrivateKeyParams() ► OfflineSearchParams`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a new OfflineSearchParams instance for the transfer_private function of the credits.aleo program.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [OfflineSearchParams](sdk-src_offline-key-provider.md) | **

---

### `transferPrivateToPublicKeyParams() ► OfflineSearchParams`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a new OfflineSearchParams instance for the transfer_private_to_public function of the credits.aleo program.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [OfflineSearchParams](sdk-src_offline-key-provider.md) | **

---

### `transferPublicKeyParams() ► OfflineSearchParams`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a new OfflineSearchParams instance for the transfer_public function of the credits.aleo program.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [OfflineSearchParams](sdk-src_offline-key-provider.md) | **

---

### `transferPublicAsSignerKeyParams() ► OfflineSearchParams`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a new OfflineSearchParams instance for the transfer_public_as_signer function of the credits.aleo program.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [OfflineSearchParams](sdk-src_offline-key-provider.md) | **

---

### `transferPublicToPrivateKeyParams() ► OfflineSearchParams`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a new OfflineSearchParams instance for the transfer_public_to_private function of the credits.aleo program.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [OfflineSearchParams](sdk-src_offline-key-provider.md) | **

---

### `unbondPublicKeyParams() ► OfflineSearchParams`

![modifier: public](images/badges/modifier-public.svg) ![modifier: static](images/badges/modifier-static.svg)

Create a new OfflineSearchParams instance for the unbond_public function of the credits.aleo program.

Parameters | Type | Description
--- | --- | ---
__*return*__ | [OfflineSearchParams](sdk-src_offline-key-provider.md) | **

---

# Class `OfflineKeyProvider`

A key provider meant for building transactions offline on devices such as hardware wallets. This key provider is not
able to contact the internet for key material and instead relies on the user to insert Aleo function proving &amp;
verifying keys from local storage prior to usage.

## Examples

```javascript
// Create an offline program manager
const programManager = new ProgramManager();

// Create a temporary account for the execution of the program
const account = new Account();
programManager.setAccount(account);

// Create the proving keys from the key bytes on the offline machine
console.log("Creating proving keys from local key files");
const program = "program hello_hello.aleo; function hello: input r0 as u32.public; input r1 as u32.private; add r0 r1 into r2; output r2 as u32.private;";
const myFunctionProver = await getLocalKey("/path/to/my/function/hello_hello.prover");
const myFunctionVerifier = await getLocalKey("/path/to/my/function/hello_hello.verifier");
const feePublicProvingKeyBytes = await getLocalKey("/path/to/credits.aleo/feePublic.prover");

myFunctionProvingKey = ProvingKey.fromBytes(myFunctionProver);
myFunctionVerifyingKey = VerifyingKey.fromBytes(myFunctionVerifier);
const feePublicProvingKey = ProvingKey.fromBytes(feePublicKeyBytes);

// Create an offline key provider
console.log("Creating offline key provider");
const offlineKeyProvider = new OfflineKeyProvider();

// Cache the keys
// Cache the proving and verifying keys for the custom hello function
OfflineKeyProvider.cacheKeys("hello_hello.aleo/hello", myFunctionProvingKey, myFunctionVerifyingKey);

// Cache the proving key for the fee_public function (the verifying key is automatically cached)
OfflineKeyProvider.insertFeePublicKey(feePublicProvingKey);

// Create an offline query using the latest state root in order to create the inclusion proof
const offlineQuery = new OfflineQuery("latestStateRoot");

// Insert the key provider into the program manager
programManager.setKeyProvider(offlineKeyProvider);

// Create the offline search params
const offlineSearchParams = new OfflineSearchParams("hello_hello.aleo/hello");

// Create the offline transaction
const offlineExecuteTx = <Transaction>await this.buildExecutionTransaction("hello_hello.aleo", "hello", 1, false, ["5u32", "5u32"], undefined, offlineSearchParams, undefined, undefined, undefined, undefined, offlineQuery, program);

// Broadcast the transaction later on a machine with internet access
const networkClient = new AleoNetworkClient("https://api.provable.com/v2");
const txId = await networkClient.broadcastTransaction(offlineExecuteTx);
```

## Methods

### `bondPublicKeys() ► Promise.<FunctionKeyPair>`

![modifier: public](images/badges/modifier-public.svg)

Get bond_public function keys from the credits.aleo program. The keys must be cached prior to calling this
method for it to work.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<FunctionKeyPair>` | *Proving and verifying keys for the bond_public function*

---

### `bondValidatorKeys() ► Promise.<FunctionKeyPair>`

![modifier: public](images/badges/modifier-public.svg)

Get bond_validator function keys from the credits.aleo program. The keys must be cached prior to calling this
method for it to work.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<FunctionKeyPair>` | *Proving and verifying keys for the bond_public function*

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

### `claimUnbondPublicKeys() ► Promise.<FunctionKeyPair>`

![modifier: public](images/badges/modifier-public.svg)

Get unbond_public function keys from the credits.aleo program. The keys must be cached prior to calling this
method for it to work.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<FunctionKeyPair>` | *Proving and verifying keys for the unbond_public function*

---

### `functionKeys(params) ► Promise.<FunctionKeyPair>`

![modifier: public](images/badges/modifier-public.svg)

Get arbitrary function key from the offline key provider cache.

Parameters | Type | Description
--- | --- | ---
__params__ | `KeySearchParams` | *Optional search parameters for the key provider*
__*return*__ | `Promise.<FunctionKeyPair>` | *Proving and verifying keys for the specified program*

#### Examples

```javascript
/// First cache the keys from local offline resources
const offlineKeyProvider = new OfflineKeyProvider();
const myFunctionVerifyingKey = VerifyingKey.fromString("verifier...");
const myFunctionProvingKeyBytes = await readBinaryFile('./resources/myfunction.prover');
const myFunctionProvingKey = ProvingKey.fromBytes(myFunctionProvingKeyBytes);

/// Cache the keys for future use with a memorable locator
offlineKeyProvider.cacheKeys("myprogram.aleo/myfunction", [myFunctionProvingKey, myFunctionVerifyingKey]);

/// When they're needed, retrieve the keys from the cache

/// First create a search parameter object with the same locator used to cache the keys
const keyParams = new OfflineSearchParams("myprogram.aleo/myfunction");

/// Then retrieve the keys
const [myFunctionProver, myFunctionVerifier] = await offlineKeyProvider.functionKeys(keyParams);
```

---

### `verifyCreditsKeys() ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Determines if the keys for a given credits function match the expected keys.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `boolean` | *Whether the keys match the expected keys*

---

### `feePrivateKeys() ► Promise.<FunctionKeyPair>`

![modifier: public](images/badges/modifier-public.svg)

Get fee_private function keys from the credits.aleo program. The keys must be cached prior to calling this
method for it to work.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<FunctionKeyPair>` | *Proving and verifying keys for the join function*

---

### `feePublicKeys() ► Promise.<FunctionKeyPair>`

![modifier: public](images/badges/modifier-public.svg)

Get fee_public function keys from the credits.aleo program. The keys must be cached prior to calling this
method for it to work.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<FunctionKeyPair>` | *Proving and verifying keys for the join function*

---

### `inclusionKeys() ► Promise.<FunctionKeyPair>`

![modifier: public](images/badges/modifier-public.svg)

Get the inclusion prover keys from. The keys must be cached prior to calling this method for it to work.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<FunctionKeyPair>` | *Proving and verifying keys for the inclusion prover*

---

### `joinKeys() ► Promise.<FunctionKeyPair>`

![modifier: public](images/badges/modifier-public.svg)

Get join function keys from the credits.aleo program. The keys must be cached prior to calling this
method for it to work.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<FunctionKeyPair>` | *Proving and verifying keys for the join function*

---

### `splitKeys() ► Promise.<FunctionKeyPair>`

![modifier: public](images/badges/modifier-public.svg)

Get split function keys from the credits.aleo program. The keys must be cached prior to calling this
method for it to work.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<FunctionKeyPair>` | *Proving and verifying keys for the join function*

---

### `transferKeys(visibility) ► Promise.<FunctionKeyPair>`

![modifier: public](images/badges/modifier-public.svg)

Get keys for a variant of the transfer function from the credits.aleo program.

Parameters | Type | Description
--- | --- | ---
__visibility__ | `string` | *Visibility of the transfer function (private, public, privateToPublic, publicToPrivate)*
__*return*__ | `Promise.<FunctionKeyPair>` | *Proving and verifying keys for the specified transfer function*

#### Examples

```javascript
// Create a new OfflineKeyProvider
const offlineKeyProvider = new OfflineKeyProvider();

// Cache the keys for future use with the official locator
const transferPublicProvingKeyBytes = await readBinaryFile('./resources/transfer_public.prover.a74565e');
const transferPublicProvingKey = ProvingKey.fromBytes(transferPublicProvingKeyBytes);

// Cache the transfer_public keys for future use with the OfflinKeyProvider's convenience method for
// transfer_public (the verifying key will be cached automatically)
offlineKeyProvider.insertTransferPublicKeys(transferPublicProvingKey);

/// When they're needed, retrieve the keys from the cache
const [transferPublicProvingKey, transferPublicVerifyingKey] = await keyProvider.transferKeys("public");
```

---

### `unBondPublicKeys() ► Promise.<FunctionKeyPair>`

![modifier: public](images/badges/modifier-public.svg)

Get unbond_public function keys from the credits.aleo program

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<FunctionKeyPair>` | *Proving and verifying keys for the join function*

---

### `insertBondPublicKeys(provingKey)`

![modifier: public](images/badges/modifier-public.svg)

Insert the proving and verifying keys for the bond_public function into the cache. Only the proving key needs
to be inserted, the verifying key is automatically inserted by the SDK. This function will automatically check
that the keys match the expected checksum for bond_public before inserting them into the cache.

Parameters | Type | Description
--- | --- | ---
__provingKey__ | `undefined` | **

---

### `insertClaimUnbondPublicKeys(provingKey)`

![modifier: public](images/badges/modifier-public.svg)

Insert the proving and verifying keys for the claim_unbond_public function into the cache. Only the proving key needs
to be inserted, the verifying key is automatically inserted by the SDK. This function will automatically check
that the keys match the expected checksum for claim_unbond_public before inserting them into the cache.

Parameters | Type | Description
--- | --- | ---
__provingKey__ | `undefined` | **

---

### `insertFeePrivateKeys(provingKey)`

![modifier: public](images/badges/modifier-public.svg)

Insert the proving and verifying keys for the fee_private function into the cache. Only the proving key needs
to be inserted, the verifying key is automatically inserted by the SDK. This function will automatically check
that the keys match the expected checksum for fee_private before inserting them into the cache.

Parameters | Type | Description
--- | --- | ---
__provingKey__ | `undefined` | **

---

### `insertFeePublicKeys(provingKey)`

![modifier: public](images/badges/modifier-public.svg)

Insert the proving and verifying keys for the fee_public function into the cache. Only the proving key needs
to be inserted, the verifying key is automatically inserted by the SDK. This function will automatically check
that the keys match the expected checksum for fee_public before inserting them into the cache.

Parameters | Type | Description
--- | --- | ---
__provingKey__ | `undefined` | **

---

### `insertInclusionKeys(provingKey)`

![modifier: public](images/badges/modifier-public.svg)

Insert the proving and verifying keys for the inclusion prover into the cache. Only the proving key needs
to be inserted, the verifying key is automatically inserted by the SDK. This function will automatically check
that the keys match the expected checksum for the inclusion prover.

Parameters | Type | Description
--- | --- | ---
__provingKey__ | `undefined` | **

---

### `insertJoinKeys(provingKey)`

![modifier: public](images/badges/modifier-public.svg)

Insert the proving and verifying keys for the join function into the cache. Only the proving key needs
to be inserted, the verifying key is automatically inserted by the SDK. This function will automatically check
that the keys match the expected checksum for join before inserting them into the cache.

Parameters | Type | Description
--- | --- | ---
__provingKey__ | `undefined` | **

---

### `insertSetValidatorStateKeys(provingKey)`

![modifier: public](images/badges/modifier-public.svg)

Insert the proving and verifying keys for the set_validator_state function into the cache. Only the proving key needs
to be inserted, the verifying key is automatically inserted by the SDK. This function will automatically check
that the keys match the expected checksum for set_validator_state before inserting them into the cache.

Parameters | Type | Description
--- | --- | ---
__provingKey__ | `undefined` | **

---

### `insertSplitKeys(provingKey)`

![modifier: public](images/badges/modifier-public.svg)

Insert the proving and verifying keys for the split function into the cache. Only the proving key needs
to be inserted, the verifying key is automatically inserted by the SDK. This function will automatically check
that the keys match the expected checksum for split before inserting them into the cache.

Parameters | Type | Description
--- | --- | ---
__provingKey__ | `undefined` | **

---

### `insertTransferPrivateKeys(provingKey)`

![modifier: public](images/badges/modifier-public.svg)

Insert the proving and verifying keys for the transfer_private function into the cache. Only the proving key needs
to be inserted, the verifying key is automatically inserted by the SDK. This function will automatically check
that the keys match the expected checksum for transfer_private before inserting them into the cache.

Parameters | Type | Description
--- | --- | ---
__provingKey__ | `undefined` | **

---

### `insertTransferPrivateToPublicKeys(provingKey)`

![modifier: public](images/badges/modifier-public.svg)

Insert the proving and verifying keys for the transfer_private_to_public function into the cache. Only the proving key needs
to be inserted, the verifying key is automatically inserted by the SDK. This function will automatically check
that the keys match the expected checksum for transfer_private_to_public before inserting them into the cache.

Parameters | Type | Description
--- | --- | ---
__provingKey__ | `undefined` | **

---

### `insertTransferPublicKeys(provingKey)`

![modifier: public](images/badges/modifier-public.svg)

Insert the proving and verifying keys for the transfer_public function into the cache. Only the proving key needs
to be inserted, the verifying key is automatically inserted by the SDK. This function will automatically check
that the keys match the expected checksum for transfer_public before inserting them into the cache.

Parameters | Type | Description
--- | --- | ---
__provingKey__ | `undefined` | **

---

### `insertTransferPublicToPrivateKeys(provingKey)`

![modifier: public](images/badges/modifier-public.svg)

Insert the proving and verifying keys for the transfer_public_to_private function into the cache. Only the proving key needs
to be inserted, the verifying key is automatically inserted by the SDK. This function will automatically check
that the keys match the expected checksum for transfer_public_to_private before inserting them into the cache.

Parameters | Type | Description
--- | --- | ---
__provingKey__ | `undefined` | **

---

### `bondPublicKeys() ► Promise.<FunctionKeyPair>`

![modifier: public](images/badges/modifier-public.svg)

Get bond_public function keys from the credits.aleo program. The keys must be cached prior to calling this
method for it to work.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<FunctionKeyPair>` | *Proving and verifying keys for the bond_public function*

---

### `bondValidatorKeys() ► Promise.<FunctionKeyPair>`

![modifier: public](images/badges/modifier-public.svg)

Get bond_validator function keys from the credits.aleo program. The keys must be cached prior to calling this
method for it to work.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<FunctionKeyPair>` | *Proving and verifying keys for the bond_public function*

---

### `cacheKeys(keyId, keys) ► void`

![modifier: public](images/badges/modifier-public.svg)

Cache a set of keys. This will overwrite any existing keys with the same keyId. The user can check if a keyId
exists in the cache using the containsKeys method prior to calling this method if overwriting is not desired.

Parameters | Type | Description
--- | --- | ---
__keyId__ | `string` | *access key for the cache*
__keys__ | `FunctionKeyPair` | *keys to cache*
__*return*__ | `void` | **

---

### `claimUnbondPublicKeys() ► Promise.<FunctionKeyPair>`

![modifier: public](images/badges/modifier-public.svg)

Get unbond_public function keys from the credits.aleo program. The keys must be cached prior to calling this
method for it to work.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<FunctionKeyPair>` | *Proving and verifying keys for the unbond_public function*

---

### `functionKeys(params) ► Promise.<FunctionKeyPair>`

![modifier: public](images/badges/modifier-public.svg)

Get arbitrary function key from the offline key provider cache.

Parameters | Type | Description
--- | --- | ---
__params__ | `KeySearchParams` | *Optional search parameters for the key provider*
__*return*__ | `Promise.<FunctionKeyPair>` | *Proving and verifying keys for the specified program*

#### Examples

```javascript
/// First cache the keys from local offline resources
const offlineKeyProvider = new OfflineKeyProvider();
const myFunctionVerifyingKey = VerifyingKey.fromString("verifier...");
const myFunctionProvingKeyBytes = await readBinaryFile('./resources/myfunction.prover');
const myFunctionProvingKey = ProvingKey.fromBytes(myFunctionProvingKeyBytes);

/// Cache the keys for future use with a memorable locator
offlineKeyProvider.cacheKeys("myprogram.aleo/myfunction", [myFunctionProvingKey, myFunctionVerifyingKey]);

/// When they're needed, retrieve the keys from the cache

/// First create a search parameter object with the same locator used to cache the keys
const keyParams = new OfflineSearchParams("myprogram.aleo/myfunction");

/// Then retrieve the keys
const [myFunctionProver, myFunctionVerifier] = await offlineKeyProvider.functionKeys(keyParams);
```

---

### `verifyCreditsKeys(locator, provingKey, verifyingKey) ► boolean`

![modifier: public](images/badges/modifier-public.svg)

Determines if the keys for a given credits function match the expected keys.

Parameters | Type | Description
--- | --- | ---
__locator__ | `string` | **
__provingKey__ | [ProvingKey](sdk-src_wasm.md) | **
__verifyingKey__ | [VerifyingKey](sdk-src_wasm.md) | **
__*return*__ | `boolean` | *Whether the keys match the expected keys*

---

### `feePrivateKeys() ► Promise.<FunctionKeyPair>`

![modifier: public](images/badges/modifier-public.svg)

Get fee_private function keys from the credits.aleo program. The keys must be cached prior to calling this
method for it to work.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<FunctionKeyPair>` | *Proving and verifying keys for the join function*

---

### `feePublicKeys() ► Promise.<FunctionKeyPair>`

![modifier: public](images/badges/modifier-public.svg)

Get fee_public function keys from the credits.aleo program. The keys must be cached prior to calling this
method for it to work.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<FunctionKeyPair>` | *Proving and verifying keys for the join function*

---

### `inclusionKeys() ► Promise.<FunctionKeyPair>`

![modifier: public](images/badges/modifier-public.svg)

Get the inclusion prover keys from. The keys must be cached prior to calling this method for it to work.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<FunctionKeyPair>` | *Proving and verifying keys for the inclusion prover*

---

### `joinKeys() ► Promise.<FunctionKeyPair>`

![modifier: public](images/badges/modifier-public.svg)

Get join function keys from the credits.aleo program. The keys must be cached prior to calling this
method for it to work.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<FunctionKeyPair>` | *Proving and verifying keys for the join function*

---

### `splitKeys() ► Promise.<FunctionKeyPair>`

![modifier: public](images/badges/modifier-public.svg)

Get split function keys from the credits.aleo program. The keys must be cached prior to calling this
method for it to work.

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<FunctionKeyPair>` | *Proving and verifying keys for the join function*

---

### `transferKeys(visibility) ► Promise.<FunctionKeyPair>`

![modifier: public](images/badges/modifier-public.svg)

Get keys for a variant of the transfer function from the credits.aleo program.

Parameters | Type | Description
--- | --- | ---
__visibility__ | `string` | *Visibility of the transfer function (private, public, privateToPublic, publicToPrivate)*
__*return*__ | `Promise.<FunctionKeyPair>` | *Proving and verifying keys for the specified transfer function*

#### Examples

```javascript
// Create a new OfflineKeyProvider
const offlineKeyProvider = new OfflineKeyProvider();

// Cache the keys for future use with the official locator
const transferPublicProvingKeyBytes = await readBinaryFile('./resources/transfer_public.prover.a74565e');
const transferPublicProvingKey = ProvingKey.fromBytes(transferPublicProvingKeyBytes);

// Cache the transfer_public keys for future use with the OfflinKeyProvider's convenience method for
// transfer_public (the verifying key will be cached automatically)
offlineKeyProvider.insertTransferPublicKeys(transferPublicProvingKey);

/// When they're needed, retrieve the keys from the cache
const [transferPublicProvingKey, transferPublicVerifyingKey] = await keyProvider.transferKeys("public");
```

---

### `unBondPublicKeys() ► Promise.<FunctionKeyPair>`

![modifier: public](images/badges/modifier-public.svg)

Get unbond_public function keys from the credits.aleo program

Parameters | Type | Description
--- | --- | ---
__*return*__ | `Promise.<FunctionKeyPair>` | *Proving and verifying keys for the join function*

---

### `insertBondPublicKeys(provingKey)`

![modifier: public](images/badges/modifier-public.svg)

Insert the proving and verifying keys for the bond_public function into the cache. Only the proving key needs
to be inserted, the verifying key is automatically inserted by the SDK. This function will automatically check
that the keys match the expected checksum for bond_public before inserting them into the cache.

Parameters | Type | Description
--- | --- | ---
__provingKey__ | `undefined` | **

---

### `insertClaimUnbondPublicKeys(provingKey)`

![modifier: public](images/badges/modifier-public.svg)

Insert the proving and verifying keys for the claim_unbond_public function into the cache. Only the proving key needs
to be inserted, the verifying key is automatically inserted by the SDK. This function will automatically check
that the keys match the expected checksum for claim_unbond_public before inserting them into the cache.

Parameters | Type | Description
--- | --- | ---
__provingKey__ | `undefined` | **

---

### `insertFeePrivateKeys(provingKey)`

![modifier: public](images/badges/modifier-public.svg)

Insert the proving and verifying keys for the fee_private function into the cache. Only the proving key needs
to be inserted, the verifying key is automatically inserted by the SDK. This function will automatically check
that the keys match the expected checksum for fee_private before inserting them into the cache.

Parameters | Type | Description
--- | --- | ---
__provingKey__ | `undefined` | **

---

### `insertFeePublicKeys(provingKey)`

![modifier: public](images/badges/modifier-public.svg)

Insert the proving and verifying keys for the fee_public function into the cache. Only the proving key needs
to be inserted, the verifying key is automatically inserted by the SDK. This function will automatically check
that the keys match the expected checksum for fee_public before inserting them into the cache.

Parameters | Type | Description
--- | --- | ---
__provingKey__ | `undefined` | **

---

### `insertInclusionKeys(provingKey)`

![modifier: public](images/badges/modifier-public.svg)

Insert the proving and verifying keys for the inclusion prover into the cache. Only the proving key needs
to be inserted, the verifying key is automatically inserted by the SDK. This function will automatically check
that the keys match the expected checksum for the inclusion prover.

Parameters | Type | Description
--- | --- | ---
__provingKey__ | `undefined` | **

---

### `insertJoinKeys(provingKey)`

![modifier: public](images/badges/modifier-public.svg)

Insert the proving and verifying keys for the join function into the cache. Only the proving key needs
to be inserted, the verifying key is automatically inserted by the SDK. This function will automatically check
that the keys match the expected checksum for join before inserting them into the cache.

Parameters | Type | Description
--- | --- | ---
__provingKey__ | `undefined` | **

---

### `insertSetValidatorStateKeys(provingKey)`

![modifier: public](images/badges/modifier-public.svg)

Insert the proving and verifying keys for the set_validator_state function into the cache. Only the proving key needs
to be inserted, the verifying key is automatically inserted by the SDK. This function will automatically check
that the keys match the expected checksum for set_validator_state before inserting them into the cache.

Parameters | Type | Description
--- | --- | ---
__provingKey__ | `undefined` | **

---

### `insertSplitKeys(provingKey)`

![modifier: public](images/badges/modifier-public.svg)

Insert the proving and verifying keys for the split function into the cache. Only the proving key needs
to be inserted, the verifying key is automatically inserted by the SDK. This function will automatically check
that the keys match the expected checksum for split before inserting them into the cache.

Parameters | Type | Description
--- | --- | ---
__provingKey__ | `undefined` | **

---

### `insertTransferPrivateKeys(provingKey)`

![modifier: public](images/badges/modifier-public.svg)

Insert the proving and verifying keys for the transfer_private function into the cache. Only the proving key needs
to be inserted, the verifying key is automatically inserted by the SDK. This function will automatically check
that the keys match the expected checksum for transfer_private before inserting them into the cache.

Parameters | Type | Description
--- | --- | ---
__provingKey__ | `undefined` | **

---

### `insertTransferPrivateToPublicKeys(provingKey)`

![modifier: public](images/badges/modifier-public.svg)

Insert the proving and verifying keys for the transfer_private_to_public function into the cache. Only the proving key needs
to be inserted, the verifying key is automatically inserted by the SDK. This function will automatically check
that the keys match the expected checksum for transfer_private_to_public before inserting them into the cache.

Parameters | Type | Description
--- | --- | ---
__provingKey__ | `undefined` | **

---

### `insertTransferPublicKeys(provingKey)`

![modifier: public](images/badges/modifier-public.svg)

Insert the proving and verifying keys for the transfer_public function into the cache. Only the proving key needs
to be inserted, the verifying key is automatically inserted by the SDK. This function will automatically check
that the keys match the expected checksum for transfer_public before inserting them into the cache.

Parameters | Type | Description
--- | --- | ---
__provingKey__ | `undefined` | **

---

### `insertTransferPublicToPrivateKeys(provingKey)`

![modifier: public](images/badges/modifier-public.svg)

Insert the proving and verifying keys for the transfer_public_to_private function into the cache. Only the proving key needs
to be inserted, the verifying key is automatically inserted by the SDK. This function will automatically check
that the keys match the expected checksum for transfer_public_to_private before inserting them into the cache.

Parameters | Type | Description
--- | --- | ---
__provingKey__ | `undefined` | **

---
