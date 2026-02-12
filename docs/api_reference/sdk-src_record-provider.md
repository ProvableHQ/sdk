# Module `src/record-provider`

![category:other](https://img.shields.io/badge/category-other-blue.svg?style=flat-square)



[Source file](../../sdk/src/record-provider.ts)

# Class `NetworkRecordProvider`

A record provider implementation that uses the official Aleo API to find records for usage in program execution and
deployment, wallet functionality, and other use cases.

## Methods

### `setAccount(account)`

![modifier: public](images/badges/modifier-public.svg)

Set the account used to search for records

Parameters | Type | Description
--- | --- | ---
__account__ | [Account](sdk-src_account.md) | *The account used to use for searching for records.*

---

### `findCreditsRecords(microcredits, searchParameters) ► Promise.<Array.<OwnedRecord>>`

![modifier: public](images/badges/modifier-public.svg)

Find a list of credit records with a given number of microcredits by via the official Aleo API

Parameters | Type | Description
--- | --- | ---
__microcredits__ | `Array.<number>` | *The number of microcredits to search for.*
__searchParameters__ | `RecordSearchParams` | *Additional parameters to search for.*
__*return*__ | `Promise.<Array.<OwnedRecord>>` | *The records if found, otherwise an error.*

#### Examples

```javascript
// Create a new NetworkRecordProvider
const networkClient = new AleoNetworkClient("https://api.provable.com/v2");
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);

// The record provider can be used to find records with a given number of microcredits
const record = await recordProvider.findCreditsRecord(5000, { unspent: true, nonces: [] });

// When a record is found but not yet used, it's nonce should be added to the nonces parameter so that it is not
// found again if a subsequent search is performed
const records = await recordProvider.findCreditsRecords(5000, { unspent: true, nonces: [record.nonce()] });

// When the program manager is initialized with the record provider it will be used to find automatically find
// fee records and amount records for value transfers so that they do not need to be specified manually
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
```

---

### `findCreditsRecord(microcredits, searchParameters) ► Promise.<OwnedRecord>`

![modifier: public](images/badges/modifier-public.svg)

Find a credit record with a given number of microcredits by via the official Aleo API

Parameters | Type | Description
--- | --- | ---
__microcredits__ | `number` | *The number of microcredits to search for.*
__searchParameters__ | `RecordSearchParams` | *Additional parameters to search for.*
__*return*__ | `Promise.<OwnedRecord>` | *The record if found, otherwise an error.*

#### Examples

```javascript
// Create a new NetworkRecordProvider
const networkClient = new AleoNetworkClient("https://api.provable.com/v2");
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);

// The record provider can be used to find records with a given number of microcredits
const record = await recordProvider.findCreditsRecord(5000, { unspent: true, nonces: [] });

// When a record is found but not yet used, it's nonce should be added to the nonces parameter so that it is not
// found again if a subsequent search is performed
const records = await recordProvider.findCreditsRecords(5000, { unspent: true, nonces: [record.nonce()] });

// When the program manager is initialized with the record provider it will be used to find automatically find
// fee records and amount records for value transfers so that they do not need to be specified manually
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
```

---

### `findRecord()`

![modifier: public](images/badges/modifier-public.svg)

Find an arbitrary record. WARNING: This function is not implemented yet and will throw an error.

---

### `findRecords()`

![modifier: public](images/badges/modifier-public.svg)

Find multiple records from a specified program.

---

### `setAccount(account)`

![modifier: public](images/badges/modifier-public.svg)

Set the account used to search for records

Parameters | Type | Description
--- | --- | ---
__account__ | [Account](sdk-src_account.md) | *The account used to use for searching for records.*

---

### `findCreditsRecords(microcredits, searchParameters) ► Promise.<Array.<OwnedRecord>>`

![modifier: public](images/badges/modifier-public.svg)

Find a list of credit records with a given number of microcredits by via the official Aleo API

Parameters | Type | Description
--- | --- | ---
__microcredits__ | `Array.<number>` | *The number of microcredits to search for.*
__searchParameters__ | `RecordSearchParams` | *Additional parameters to search for.*
__*return*__ | `Promise.<Array.<OwnedRecord>>` | *The records if found, otherwise an error.*

#### Examples

```javascript
// Create a new NetworkRecordProvider
const networkClient = new AleoNetworkClient("https://api.provable.com/v2");
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);

// The record provider can be used to find records with a given number of microcredits
const record = await recordProvider.findCreditsRecord(5000, { unspent: true, nonces: [] });

// When a record is found but not yet used, it's nonce should be added to the nonces parameter so that it is not
// found again if a subsequent search is performed
const records = await recordProvider.findCreditsRecords(5000, { unspent: true, nonces: [record.nonce()] });

// When the program manager is initialized with the record provider it will be used to find automatically find
// fee records and amount records for value transfers so that they do not need to be specified manually
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
```

---

### `findCreditsRecord(microcredits, searchParameters) ► Promise.<OwnedRecord>`

![modifier: public](images/badges/modifier-public.svg)

Find a credit record with a given number of microcredits by via the official Aleo API

Parameters | Type | Description
--- | --- | ---
__microcredits__ | `number` | *The number of microcredits to search for.*
__searchParameters__ | `RecordSearchParams` | *Additional parameters to search for.*
__*return*__ | `Promise.<OwnedRecord>` | *The record if found, otherwise an error.*

#### Examples

```javascript
// Create a new NetworkRecordProvider
const networkClient = new AleoNetworkClient("https://api.provable.com/v2");
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);

// The record provider can be used to find records with a given number of microcredits
const record = await recordProvider.findCreditsRecord(5000, { unspent: true, nonces: [] });

// When a record is found but not yet used, it's nonce should be added to the nonces parameter so that it is not
// found again if a subsequent search is performed
const records = await recordProvider.findCreditsRecords(5000, { unspent: true, nonces: [record.nonce()] });

// When the program manager is initialized with the record provider it will be used to find automatically find
// fee records and amount records for value transfers so that they do not need to be specified manually
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
```

---

### `findRecord(searchParameters) ► Promise.<OwnedRecord>`

![modifier: public](images/badges/modifier-public.svg)

Find an arbitrary record. WARNING: This function is not implemented yet and will throw an error.

Parameters | Type | Description
--- | --- | ---
__searchParameters__ | `RecordSearchParams` | **
__*return*__ | `Promise.<OwnedRecord>` | **

---

### `findRecords(searchParameters) ► Promise.<Array>`

![modifier: public](images/badges/modifier-public.svg)

Find multiple records from a specified program.

Parameters | Type | Description
--- | --- | ---
__searchParameters__ | `RecordSearchParams` | **
__*return*__ | `Promise.<Array>` | **

---

# Class `BlockHeightSearch`

BlockHeightSearch is a RecordSearchParams implementation that allows for searching for records within a given
block height range.

## Examples

```javascript
// Create a new BlockHeightSearch
const params = new BlockHeightSearch(89995, 99995);

// Create a new NetworkRecordProvider
const networkClient = new AleoNetworkClient("https://api.provable.com/v2");
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);

// The record provider can be used to find records with a given number of microcredits and the block height search
// can be used to find records within a given block height range
const record = await recordProvider.findCreditsRecord(5000, { unspent: true, nonces: [], ...params });
```
