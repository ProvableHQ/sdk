# Aleo Rust SDK
[![Crates.io](https://img.shields.io/crates/v/aleo-rust.svg?color=neon)](https://crates.io/crates/aleo-rust)
[![Authors](https://img.shields.io/badge/authors-Aleo-orange.svg)](https://aleo.org)
[![License](https://img.shields.io/badge/License-GPLv3-blue.svg)](./LICENSE.md)

[![github]](https://github.com/AleoHQ/sdk)&ensp;[![crates-io]](https://crates.io/crates/aleo-rust)&ensp;[![docs-rs]](https://docs.rs/aleo-rust/latest/aleo_rust/)

[github]: https://img.shields.io/badge/github-8da0cb?style=for-the-badge&labelColor=555555&logo=github
[crates-io]: https://img.shields.io/badge/crates.io-fc8d62?style=for-the-badge&labelColor=555555&logo=rust
[docs-rs]: https://img.shields.io/badge/docs.rs-66c2a5?style=for-the-badge&labelColor=555555&logo=docs.rs

The Aleo Rust SDK provides a set of tools for deploying and executing programs as well as tools for communicating with the Aleo Network.

## Aleo Network Interaction
Users of the SDK can interact with the Aleo network via the AleoAPIClient struct.

The Aleo Network has nodes within the network which provide a REST API for interacting with the network. The 
AleoAPIClient struct provides a 1:1 mapping of those REST API endpoints as well as several convenience methods for 
interacting with the network.

Some key usages of the Aleo API client are:
* Finding records to spend in value transfers, program executions and program deployments
* Locating programs deployed on the network
* Sending transactions to the network
* Inspecting chain data such as block content, transaction content, etc.

### Example Usage
```rust
use aleo_rust::AleoAPIClient;
use snarkvm_console::{
    account::PrivateKey,
    network::Testnet3, 
};
use rand::thread_rng;

// Create a client that interacts with the testnet3 program
let api_client = AleoAPIClient::<Testnet3>testnet3();

// FIND A PROGRAM ON THE ALEO NETWORK
let hello = api_client.get_program("hello.aleo").unwrap();
println!("Hello program: {hello:?}");

// FIND RECORDS THAT BELONG TO A PRIVATE KEY
let mut rng = thread_rng();
// Create a private key (in practice, this would be an existing user's private key)
let private_key = PrivateKey::new(&mut rng).unwrap();
// Get the latest block height
let end_height = api_client.latest_height().unwrap();
// Look back 1000 blocks
let start_height = end_height - 1000u32;
// Find records with these gate amounts (requires an account with a balance)
let amounts_to_find = vec![100u64, 200u64];
let records = api_client.get_unspent_records(&private_key, (start_height..end_height), None, Some(&amounts_to_find)).unwrap();
```

## Program Execution and Deployment
The Aleo ProgramManager provides a set of tools for deploying and executing programs locally and on the Aleo Network. The 
RecordFinder struct is used in conjunction with the program manager to find records to spend in value transfers and 
program execution/deployments fees.

The program deployment and execution flow are shown in the example below.

### Example Usage
```rust
use aleo_rust::{AleoAPIClient, Encryptor, ProgramManager, RecordFinder};
use snarkvm_console::{
  account::{Address, PrivateKey},
  network::Testnet3,
};
use snarkvm_synthesizer::Program;
use rand::thread_rng;
use std::str::FromStr;

// Create the necessary components to create the program manager
let mut rng = thread_rng();
// Create an api client to query the network state
let api_client = AleoAPIClient::<Testnet3>::testnet3();
// Create a private key (in practice, this would be a user's private key)
let private_key = PrivateKey::<Testnet3>::new(&mut rng).unwrap();
// Encrypt the private key with a password
let private_key_ciphertext = Encryptor::<Testnet3>::encrypt_private_key_with_secret(&private_key, "password").unwrap();

// Create the program manager
// (Note: An optional local directory can be provided to manage local program data)
let mut program_manager = ProgramManager::<Testnet3>::new(None, Some(private_key_ciphertext), Some(api_client), None).unwrap();

// ------------------
// EXECUTE PROGRAM STEPS
// ------------------

// Execute the function `hello` of the hello.aleo program with the arguments 5u32 and 3u32.
// Specify 0 for the fee and provide a password to decrypt the private key stored in the program manager
program_manager.execute_program("hello.aleo", "hello", ["5u32", "3u32"].into_iter(), 0, None, Some("password")).unwrap();

// ------------------
// DEPLOY PROGRAM STEPS
// ------------------

// Note - Deployment requires a mandatory deployment fee, so an account with an existing
// balance is required to deploy a program

// Create a program name (note: change this to something unique)
let program_name = "yourownprogram.aleo";
// Create a test program
let test_program = format!("program {};\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n", program_name);
// Create a program object from the program string
let program = Program::from_str(&test_program).unwrap();
// Add the program to the program manager (this can also be done by providing a path to
// the program on disk when the program manager is created)
program_manager.add_program(&program).unwrap();
// Create a record finder to find records to fund the deployment fee
let record_finder = RecordFinder::<Testnet3>::new(AleoAPIClient::testnet3());
// Set the fee for the deployment transaction (in units of gates)
let fee_gates = 600000;
// Find a record to fund the deployment fee (requires an account with a balance)
let record = record_finder.find_one_record(&private_key, fee_gates).unwrap();
// Deploy the program to the network
program_manager.deploy_program(program_name, fee_gates, record, Some("password")).unwrap();

// Wait several minutes.. then check the program exists on the network
let api_client = AleoAPIClient::<Testnet3>::testnet3();
let program_on_chain = api_client.get_program(program_name).unwrap();
let program_on_chain_name = program_on_chain.id().to_string();
assert_eq!(&program_on_chain_name, program_name);

// ------------------
// TRANSFER STEPS
// ------------------

// Create a recipient (in practice, the recipient would send their address to the sender)
let recipient_key = PrivateKey::<Testnet3>::new(&mut rng).unwrap();
let recipient_address = Address::try_from(recipient_key).unwrap();
// Create amount and fee (both in units of gates)
let amount = 30000;
let fee = 100;
// Find records to fund the transfer
let (amount_record, fee_record) = record_finder.find_amount_and_fee_records(amount, fee, &private_key).unwrap();
// Create a transfer
program_manager.transfer(amount, fee, recipient_address, Some("password"), amount_record, Some(fee_record)).unwrap();
```
This API is currently under active development and is expected to change in the future in order to provide a more streamlined 
experience for program execution and deployment.
