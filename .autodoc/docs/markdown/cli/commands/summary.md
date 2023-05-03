[View code on GitHub](https://github.com/AleoHQ/aleo/.autodoc/docs/json/cli/commands)

The code in the `cli/commands` folder of the Aleo project provides a set of subcommands for the Aleo command-line interface (CLI). These subcommands allow users to perform various operations related to Aleo accounts, smart contracts, and transactions. Each file in this folder defines a struct representing a specific subcommand and implements a `parse` method responsible for executing the subcommand.

For example, the `account.rs` file defines the `Account` enum with four variants for managing Aleo accounts: `New`, `Import`, `Encrypt`, and `Decrypt`. The `parse` method executes the corresponding command based on the variant:

```rust
let account = Account::New { seed: None, encrypt: false, write: false, password: None };
let result = account.parse();
```

The `deploy.rs` file defines the `Deploy` struct for deploying an Aleo program to the Aleo network. The `parse` method performs the deployment process:

```rust
let deploy = Deploy::try_parse_from(["aleo", "hello.aleo", "-f", "0.5", "-k", &private_key.to_string()]);
let result = deploy.unwrap().parse();
```

The `execute.rs` file defines the `Execute` struct for executing an Aleo program function. The `parse` method handles the execution:

```sh
aleo execute <program_id> <function> <inputs> --fee 0.7 -k <private_key>
```

The `mod.rs` file defines the `CLI` struct as the main entry point for the CLI, which contains a `verbosity` field to control the level of output and a `command` field to specify the subcommand to be executed. The `Command` enum lists all available subcommands, each of which is associated with a corresponding module and struct.

In summary, the code in the `cli/commands` folder provides a user-friendly interface for interacting with the Aleo library, enabling users to perform various operations related to Aleo accounts, smart contracts, and transactions.
