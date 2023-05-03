[View code on GitHub](https://github.com/AleoHQ/aleo/sdk/src/aleo_network_client.ts)

The `AleoNetworkClient` class in this code is responsible for managing connections and making REST calls to publicly exposed endpoints of Aleo nodes. It provides methods to interact with the Aleo blockchain, such as fetching blocks, transactions, and other relevant information.

To create a connection to a local or public Aleo node, you can instantiate the `AleoNetworkClient` class with the appropriate host URL:

```javascript
let local_connection = new AleoNetworkClient("http://localhost:3030");
let public_connection = new AleoNetworkClient("https://vm.aleo.org/api");
```

The class provides methods to fetch information about blocks, such as getting a specific block by height, a range of blocks, or the latest block:

```javascript
let block = connection.getBlock(1234);
let blockRange = connection.getBlockRange(2050, 2100);
let latestBlock = connection.getLatestBlock();
```

It also provides methods to fetch information about transactions, such as getting a transaction by its unique identifier, transactions present at a specified block height, or transactions in the memory pool:

```javascript
let transaction = connection.getTransaction("transaction_id");
let transactions = connection.getTransactions(654);
let mempoolTransactions = connection.getTransactionsInMempool();
```

Additionally, the class provides methods to fetch other relevant information, such as the source code of a program, the latest block height, the latest state/merkle root of the Aleo blockchain, and the transition id by its unique identifier:

```javascript
let program = connection.getProgram("foo.aleo");
let latestHeight = connection.getLatestHeight();
let stateRoot = connection.getStateRoot();
let transition = connection.getTransitionId("transition_id");
```

The `findUnspentRecords` method allows users to find unspent records in the Aleo blockchain for a specified private key, with optional parameters to search for specific amounts or a maximum number of cumulative microcredits:

```javascript
const privateKey = "[PRIVATE_KEY]";
let records = connection.findUnspentRecords(0, undefined, privateKey);
```

This class is essential for developers who want to interact with the Aleo blockchain, as it provides a convenient way to fetch and manage data from the network.
## Questions: 
 1. **Question**: What is the purpose of the `AleoNetworkClient` class and how do I connect to a local or public Aleo node?
   **Answer**: The `AleoNetworkClient` class is a connection management class that encapsulates REST calls to publicly exposed endpoints of Aleo nodes. It provides methods to interact with the Aleo Blockchain. To connect to a local node, use `let local_connection = new AleoNetworkClient("http://localhost:3030");`. To connect to a public beacon node, use `let public_connection = new AleoNetworkClient("https://vm.aleo.org/api");`.

2. **Question**: How can I set an account for the `AleoNetworkClient` instance and retrieve it later?
   **Answer**: To set an account for the `AleoNetworkClient` instance, use the `setAccount(account: Account)` method, e.g., `connection.setAccount(account);`. To retrieve the account later, use the `getAccount(): Account | undefined` method, e.g., `let account = connection.getAccount();`.

3. **Question**: How can I find unspent records in the Aleo blockchain for a specified private key using the `AleoNetworkClient` class?
   **Answer**: To find unspent records, use the `findUnspentRecords` method with the required parameters, e.g., `let records = connection.findUnspentRecords(startHeight, undefined, privateKey, amounts, maxMicrocredits);`. This method searches for unspent records in the Aleo blockchain based on the specified private key, start height, end height, amounts, and maximum microcredits.