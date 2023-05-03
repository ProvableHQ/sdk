[View code on GitHub](https://github.com/AleoHQ/aleo/.autodoc/docs/json/wasm/src/programs)

The code in the `.autodoc/docs/json/wasm/src/programs` folder provides WebAssembly (WASM) representations and utilities for working with Aleo programs, transactions, and fees. These representations are essential for creating on-chain program execution transactions and interacting with Aleo functions in a web environment.

For example, the `fee.rs` file defines a `FeeExecution` struct that wraps around the native `FeeNative` type, providing a WASM-compatible interface for interacting with the fee execution response. This is useful when creating a transaction that requires a fee, as shown in the following example:

```rust
let fee_native = FeeNative::new(100);
let fee_execution = FeeExecution::from(fee_native);
let fee_amount = fee_execution.fee().unwrap();
let fee_native_converted = FeeNative::from(fee_execution);
```

The `macros.rs` file contains three macros that are used to execute programs, generate inclusion proofs, and generate fee inclusion proofs. These macros simplify the process of executing programs securely and privately, generating inclusion proofs for proving the correctness of a program's execution, and generating fee inclusion proofs for proving the correctness of fee payments.

The `mod.rs` file serves as a foundation for the Aleo library, providing essential functionality for various aspects of the Aleo network, such as fee calculation, response handling, program execution, and transaction processing.

The `program.rs` file provides a `Program` struct with several methods for interacting with Aleo programs in a web environment. This makes it easier to create web forms for input capture and work with Aleo programs in a JavaScript context, as shown in the following example:

```rust
let program_string = ProgramNative::credits().unwrap().to_string();
let program = Program::from_string(&program_string).unwrap();
let functions = program.get_functions();
let function_inputs = program.get_function_inputs("transfer".to_string()).unwrap();
let record_members = program.get_record_members("credits".to_string()).unwrap();
let struct_members = program.get_struct_members("token_metadata".to_string()).unwrap();
```

The `response.rs` file defines a `ExecutionResponse` struct that provides a WASM-compatible representation of an Aleo function execution response. This allows for easy interaction with the function execution response when creating on-chain program execution transactions.

Finally, the `transaction.rs` file defines a `Transaction` struct for representing Aleo transactions, which is essential for generating on-chain function deployment or execution. The `Transaction` struct provides methods for creating and interacting with Aleo transactions, as shown in the following example:

```rust
let transaction = Transaction::from_string(transaction_string).unwrap();
let transaction_string = transaction.to_string();
let transaction_id = transaction.transaction_id();
let transaction_type = transaction.transaction_type();
```

In summary, the code in this folder provides essential functionality for working with Aleo programs, transactions, and fees in a web environment, making it easier to create and interact with on-chain program execution transactions.
