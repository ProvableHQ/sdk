[View code on GitHub](https://github.com/AleoHQ/aleo/.autodoc/docs/json/rust/src/program/helpers)

The code in the `helpers` folder of the Aleo project focuses on providing utility functions and structures for managing state and records within the Aleo system. It consists of two main parts: state management and records management.

**State Management**: The `state.rs` file defines an enumeration called `OnChainProgramState`, which represents the possible states of a program on the blockchain compared to a local program with the same name. This enumeration is useful for tracking the deployment status and consistency of a program between the local and on-chain versions. Developers can use this enumeration to determine if their local program needs to be deployed or updated on the blockchain, ensuring that their local programs are consistent with the on-chain versions.

Example usage:

```rust
match on_chain_program_state {
    OnChainProgramState::Different => {
        // Deploy the updated local program to the blockchain
    }
    OnChainProgramState::Same => {
        // The local and on-chain programs are consistent, no action needed
    }
    OnChainProgramState::NotDeployed => {
        // Deploy the local program to the blockchain
    }
}
```

**Records Management**: The `records.rs` file provides a `RecordFinder` struct that serves as a helper for finding records on the Aleo blockchain during program development. It provides methods to search for records with specific amounts and fees, as well as to find unspent records on the chain. The struct takes an `AleoAPIClient` as a parameter, which is used to interact with the Aleo network.

Example usage:

```rust
let (amount_record, fee_record) = record_finder.find_amount_and_fee_records(amount, fee, private_key)?;
```

By providing these utility functions and structures, the code in the `helpers` folder makes it easy for other parts of the Aleo project to access and use the state and records management functionalities. For example, a developer working on the Aleo project could simply import the state and records modules using the following code:

```rust
use aleo::state::*;
use aleo::records::*;
```

This would give them access to all the functions and structures defined in the `state` and `records` modules, allowing them to easily integrate state and records management into their part of the Aleo project.
