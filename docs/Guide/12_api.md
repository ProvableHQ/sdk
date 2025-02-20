# Provable API
Documentation for the Provable API

## Version: 1.0.0

### /latest/block

#### GET
##### Summary:

Get latest block

##### Description:

Retrieves the latest block from the Aleo blockchain.

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | The full Aleo block object. This object contains block level information including: metadata, ratifications, solutions, and transactions. |
| 404 | Block not found |
| 500 | Server error |

### /latest/height

#### GET
##### Summary:

Get latest block height

##### Description:

Retrieves the latest block height from the Aleo blockchain.

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | The latest block height, i.e. tip of chain, retrieved from the Aleo blockchain.  |
| 404 | Block not found |
| 500 | Server error |

### /latest/committee

#### GET
##### Summary:

Get latest committee

##### Description:

Retrieves the latest committee from the Aleo blockchain. The committee represents the Validator set at this given point in time.

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | The full committee object containing the list of validators, staked amount, bonding state, and commission rate.  |
| 404 | Committee not found |
| 500 | Server error |

### /latest/hash

#### GET
##### Summary:

Get latest block hash

##### Description:

Retrieves the latest block hash from the Aleo blockchain.

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | A block hash of the latest block from the canonical Aleo blockchain. |
| 404 | Block not found |
| 500 | Server error |

### /latest/stateRoot

#### GET
##### Summary:

Get latest stateRoot

##### Description:

Retrieves the latest stateRoot from the Aleo blockchain. The stateRoot is the merkle root of all previous block hashes. 

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | The state root of the canonical Aleo blockchain.  |
| 404 | State Root not found |
| 500 | Server error |

### /find/blockHash/{transactionID}

#### GET
##### Summary:

Get block hash for transaction ID

##### Description:

Retrieves the block hash associated with the given Transaction ID.

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| transactionID | path | The transactionID hash | Yes | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | A block hash of the block in which the transaction was added to. |
| 404 | Block not found |
| 500 | Server error |

### /find/transactionID/deployment/{programID}

#### GET
##### Summary:

Get transaction ID of program deployment

##### Description:

Retrieves the Transaction ID associated to the deployment of the given Program.

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| programID | path | The program ID of the specified program | Yes | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | The deployment transactionID for when the program was deployed on the Aleo blockchain. |
| 404 | Transaction not found |
| 500 | Server error |

### /find/transactionID/{transitionID}

#### GET
##### Summary:

Get transaction ID from transition ID

##### Description:

Retrieves the Transaction ID associated with a Transition ID.

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| transitionID | path | The transition ID | Yes | string |
| transitionID | path | The transition ID | Yes | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | The transactionID in which the transition is part of.  |
| 404 | Transaction not found |
| 500 | Server error |

### /find/transitionID/{inputOrOutputID}

#### GET
##### Summary:

Get transition ID for input or output ID

##### Description:

Retrieves the Transition ID associated with a given input our output ID. Input and output IDs can be found via the associated field elements of an input or output.

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| inputOrOutputID | path | Either the input or output ID of a given transition | Yes | string |
| inputOrOutputID | path | Input or output ID | Yes | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | The transaction ID |
| 404 | Transition not found |
| 500 | Server error |

### /program/{programID}

#### GET
##### Summary:

Get program by ID

##### Description:

Retrieves program details by Program ID.

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| programID | path | The program ID for a given program | Yes | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | The program source code. |
| 404 | Program not found |
| 500 | Server error |

### /program/{programID}/mappings

#### GET
##### Summary:

Get mappings for program by ID

##### Description:

Retrieves mappings for a given program by Program ID. These mappings can then be queried through additional endpoints.

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| programID | path |  | Yes | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | An array of mappings for the given program. |
| 404 | Program not found |
| 500 | Server error |

### /program/{programID}/mapping/{name}/{key}

#### GET
##### Summary:

Get mapping result of program given name/key

##### Description:

Retrieves a mapping value given the name of the mapping and the associated key. The available mappings for a given program can be obtained via the [/program/{programID}/mappings](swagger.json/paths/~1program~1{programID}~1mappings/get) query. 

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| name | path | The name of the mapping | Yes | string |
| key | path | The key of the mapping | Yes | string |
| programID | path | The ID of the program to retrieve mappings for | Yes | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | A mapping object pertaining to the revelant information that the program holds in the associated mapping. |
| 404 | Program not found |
| 500 | Server error |

### /transaction/{ID}

#### GET
##### Summary:

Get transaction by ID

##### Description:

Retrieves the full transaction object given a Transaction ID.

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| ID | path | The transaction ID | Yes | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | A Transaction object containing all inputs, outputs, and fee object. |
| 404 | Transaction not found |
| 500 | Server error |

### /transaction/confirmed/{ID}

#### GET
##### Summary:

Get confirmation status of transaction

##### Description:

Retrieves the confirmation status of a transaction that was submitted to the Aleo blockchain.

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| ID | path |  | Yes | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | A Transaction object containing confirmation status, all inputs, outputs, and fee object. |
| 404 | Transaction not found |
| 500 | Server error |

### /transaction/broadcast

#### POST
##### Summary:

Broadcast transaction

##### Description:

Broadcast a transaction to the Aleo blockchain.

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| transaction | body | The serialized transaction. | Yes | object |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | A string either indicating why the transaction failed or the successfully broadcasted transaction id. |
| 404 | Failed to post to route |
| 500 | Server error |

### /block/{height}/transactions

#### GET
##### Summary:

Get transactions by block height

##### Description:

Retrieves all transactions that are included in a block given the block height.

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| height | path | block height s | Yes | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | An array of transactions in the given block. |
| 404 | Transactions not found |
| 500 | Server error |

### /latest/totalSupply

#### GET
##### Summary:

Get latest total supply

##### Description:

Retrieves the latest total supply for the Aleo blockchain. **Note: This is only available for mainnet currently.**

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | The latest total supply in credits, retrieved from the Aleo blockchain.  |
| 404 | Supply not found |
| 500 | Server error |

### /latest/circulatingSupply

#### GET
##### Summary:

Get latest circulating supply

##### Description:

Retrieves the latest circulating supply for the Aleo blockchain. **Note: This is only available for mainnet currently.**

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | The latest circulating supply in credits, retrieved from the Aleo blockchain. |
| 404 | Supply not found |
| 500 | Server error |

### /block/height/latest

#### GET
##### Summary:

Get height of latest block

##### Description:

Retrieves the latest block height from the Aleo blockchain.

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | The latest block height, i.e. tip of chain, retrieved from the Aleo blockchain.  |
| 404 | Block not found |
| 500 | Server error |

### /block/hash/latest

#### GET
##### Summary:

Get hash of latest block

##### Description:

Retrieves the latest block hash from the Aleo blockchain.

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | A block hash of the latest block from the Aleo blockchain. |
| 404 | Block not found |
| 500 | Server error |

### /block/latest

#### GET
##### Summary:

Get most recent block

##### Description:

Retrieves the latest block from the Aleo blockchain.

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | A block hash of the latest block from the Aleo blockchain. |
| 404 | Block not found |
| 500 | Server error |

### /block/{height_or_hash}

#### GET
##### Summary:

Get block by height or hash

##### Description:

Retrieves the latest block from the Aleo blockchain via the block's height or blockhash. 

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| height_or_hash | path |  | Yes | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | A block hash of the latest block from the Aleo blockchain. |
| 404 | Block not found |
| 500 | Server error |

### /block/{hash}/transactions

#### GET
##### Summary:

Get transactions by block hash

##### Description:

Retrieves all transactions for a block the block's height or blockhash. 

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| hash | path |  | Yes | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | An array of transactions in the given block. |
| 404 | Block not found |
| 500 | Server error |
