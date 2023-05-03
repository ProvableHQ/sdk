[View code on GitHub](https://github.com/AleoHQ/aleo/.autodoc/docs/json/wasm)

The code in the `.autodoc/docs/json/wasm` folder provides a high-level interface for managing accounts, programs, and records within the Aleo library. It is organized into three main modules: `account`, `programs`, and `record`, each responsible for handling different aspects of the Aleo library.

The `account` module manages user accounts within the Aleo library, providing essential cryptographic components for creating and manipulating Aleo addresses, private keys, view keys, and signatures. These components are crucial for sending and receiving transactions, proving ownership of an address, and providing read-only access to an address's transaction history. For example:

```rust
use aleo::account::{Account, PrivateKey, Address, Signature};

let my_account = Account::new();
let private_key = PrivateKey::new();
let address = Address::from_private_key(&private_key);
let message = b"Hello, Aleo!";
let signature = private_key.sign(message);
let is_valid = signature.verify(&address, &message);
```

The `programs` module manages Aleo programs, transactions, and fees in a web environment, providing WebAssembly (WASM) representations and utilities for creating on-chain program execution transactions and interacting with Aleo functions in a web environment. For example:

```rust
use aleo::programs::{Program, Transaction};

let program_string = ProgramNative::credits().unwrap().to_string();
let program = Program::from_string(&program_string).unwrap();
let functions = program.get_functions();
let function_inputs = program.get_function_inputs("transfer".to_string()).unwrap();

let transaction = Transaction::from_string(transaction_string).unwrap();
let transaction_string = transaction.to_string();
let transaction_id = transaction.transaction_id();
let transaction_type = transaction.transaction_type();
```

The `record` module manages records within the Aleo library, providing functionality for handling records in both encrypted (ciphertext) and decrypted (plaintext) forms. Records store information about transactions and other data. For example:

```rust
use aleo::record::{RecordCiphertext, RecordPlaintext, ViewKey};

let record = RecordCiphertext::from_string(OWNER_CIPHERTEXT).unwrap();
let view_key = ViewKey::from_string(OWNER_VIEW_KEY);
let plaintext = record.decrypt(&view_key).unwrap();

let record = RecordPlaintext::from_string(RECORD).unwrap();
let record_str = record.to_string();
let microcredits = record.microcredits();
```

Additionally, there is a `types` module marked as `pub(crate)`, which contains internal types and utilities used by the other modules in this file. These type aliases make it easier for developers to work with the Aleo library, as they can use the native types without worrying about the underlying implementation details.

In summary, this code provides a high-level interface for managing accounts, programs, and records within the Aleo library, making it easier for developers to interact with and build upon the Aleo project.
