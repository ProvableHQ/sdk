[View code on GitHub](https://github.com/AleoHQ/aleo/.autodoc/docs/json/rust/src/program)

The code in the `program` folder of the Aleo project is responsible for managing programs on the Aleo network. It provides functionalities for deploying, executing, and managing programs, as well as transferring funds between addresses. The main component of this folder is the `ProgramManager` struct, which is designed to be used by various software tools, such as CLI tools, IDE plugins, and server-side components, to interact with the Aleo network.

For example, the `deploy.rs` file contains the `deploy_program` function, which is responsible for deploying a program to the Aleo network. It ensures that the program is not already deployed and that all its imports are also deployed. The function can be used as follows:

```rust
let program_id = "my_program.aleo";
let fee = 1000;
let fee_record = get_fee_record(); // Assume this function returns a valid fee record
let password = Some("my_password");

program_manager.deploy_program(program_id, fee, fee_record, password)?;
```

The `execute.rs` file defines the `execute_program` method, which is responsible for executing a program on the Aleo network. It takes a program ID, function name, inputs, fee, fee record, and an optional password as arguments. The method ensures that the program exists on the Aleo network and constructs an execution transaction, which is then broadcasted to the network.

The `transfer.rs` file defines a `transfer` method for the `ProgramManager` struct, which is responsible for executing a transfer of funds between two addresses in the Aleo network. The method takes parameters such as the amount, fee, recipient address, password, input record, and fee record. After constructing the transfer transaction, it is broadcasted to the network.

The `resolver.rs` file provides methods for finding and loading programs and their imports from both the local disk and the Aleo network. It includes methods like `find_program`, `find_program_on_disk`, `find_program_on_chain`, and `find_program_imports`.

The `helpers` subfolder contains utility functions and structures for managing state and records within the Aleo system. It consists of two main parts: state management and records management. The `state.rs` file defines an enumeration called `OnChainProgramState`, which represents the possible states of a program on the blockchain compared to a local program with the same name. The `records.rs` file provides a `RecordFinder` struct that serves as a helper for finding records on the Aleo blockchain during program development.

Overall, the code in the `program` folder plays a crucial role in the Aleo project by providing functionalities for deploying, executing, and managing programs on the Aleo network, as well as transferring funds between addresses.
