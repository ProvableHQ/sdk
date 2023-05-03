[View code on GitHub](https://github.com/AleoHQ/aleo/.autodoc/docs/json/wasm/src/record)

The code in the `record` folder of the Aleo project provides functionality for handling records in both encrypted (ciphertext) and decrypted (plaintext) forms. Records are a fundamental component of the Aleo platform, as they store information about transactions and other data.

The folder contains two main files: `record_ciphertext.rs` and `record_plaintext.rs`. These files define the `RecordCiphertext` and `RecordPlaintext` structs, respectively, along with their associated methods for creating, converting, and decrypting records.

For example, to work with encrypted records, you can use the `RecordCiphertext` struct and its methods:

```rust
use aleo::record_ciphertext::{RecordCiphertext};

// Create a new encrypted record from a string
let record = RecordCiphertext::from_string(OWNER_CIPHERTEXT).unwrap();

// Convert the encrypted record back to a string
let ciphertext_string = record.to_string();

// Decrypt the encrypted record using a view key
let view_key = ViewKey::from_string(OWNER_VIEW_KEY);
let plaintext = record.decrypt(&view_key).unwrap();

// Check if a view key can decrypt the record
let incorrect_view_key = ViewKey::from_string(NON_OWNER_VIEW_KEY);
assert!(!record.is_owner(&incorrect_view_key));
```

Similarly, to work with decrypted records, you can use the `RecordPlaintext` struct and its methods:

```rust
use aleo::record_plaintext::{RecordPlaintext};

// Create a new decrypted record from a string
let record = RecordPlaintext::from_string(RECORD).unwrap();

// Convert the decrypted record back to a string
let record_str = record.to_string();

// Get the amount of microcredits in the record
let microcredits = record.microcredits();

// Get the serial number of a record
let serial_number = record.serial_number_string(&private_key, "credits.aleo", "credits").unwrap();
```

The `mod.rs` file in the folder organizes the code into two modules: `record_ciphertext` and `record_plaintext`. It also re-exports the contents of these modules, making them available for other parts of the Aleo project to use. This allows other components of the project to import and use the functionality provided by these modules without having to directly reference the module files.

In summary, the code in the `record` folder provides the functionality to handle encrypted and decrypted records in the Aleo project, making it easier for other components to work with records while maintaining modularity and separation of concerns.
