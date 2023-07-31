// Copyright (C) 2019-2023 Aleo Systems Inc.
// This file is part of the Aleo SDK library.

// The Aleo SDK library is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// The Aleo SDK library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with the Aleo SDK library. If not, see <https://www.gnu.org/licenses/>.

//! [![github]](https://github.com/AleoHQ/sdk)&ensp;[![crates-io]](https://crates.io/crates/aleo-development-server)&ensp;[![docs-rs]](https://docs.rs/aleo-rust/latest/aleo-development-server/)
//!
//! [github]: https://img.shields.io/badge/github-8da0cb?style=for-the-badge&labelColor=555555&logo=github
//! [crates-io]: https://img.shields.io/badge/crates.io-fc8d62?style=for-the-badge&labelColor=555555&logo=rust
//! [docs-rs]: https://img.shields.io/badge/docs.rs-66c2a5?style=for-the-badge&labelColor=555555&logo=docs.rs
//!
//! <br/>
//! The Aleo Development Server is a REST server that can perform the proving and verification
//! operations necessary to create Aleo program deployments/executions and broadcast them to the
//! Aleo network. It is intended to be used within a trusted context such as a local development
//! environment, CI/CD pipeline, or a private network within a cloud.
//! <br/>
//! <br/>
//! It *SHOULD NOT* be used to create a public API.
//!
//! # RESTFUL Program Execution & Deployment
//!
//! The Aleo Development Server provides REST endpoints that allow developers to send the necessary
//! data needed to create program deployments and executions to the Aleo network. Currently there
//! are three endpoints:
//! - `/deploy` - Create a program deployment
//! - `/execute` - Create a program execution
//! - `/transfer` - Create a transfer of Aleo credits
//!
//! ## Installation & Configuration
//! The development server can be installed with:
//!
//! `cargo install aleo-develop` - Install from crates.io
//!
//! `cargo install --path . --locked` - Install from source
//!
//! Once installed the following command can be used to start the server:
//!
//! `aleo-develop start` - Start the server at `0.0.0.0:4040` (by default the server sends transactions to the Aleo testnet3 network)
//!
//! `aleo-develop start --help` - Show all available options for configuring the server
//!
//! #### Configuring Encrypted Private Keys
//! The server can be started with an encrypted private key. If this option is used, the server
//! will look for a password field in the body of incoming requests. If a password is provided
//! (and the password is correct), the server will decrypt the private key and use it to build
//! and send the transaction to the network. This mode of operation can be invoked with:
//!
//! `aleo-develop start --key-ciphertext <encrypted_private_key>`
//!
//! ## Usage
//! Once started, the endpoints have the following options. All requests should be sent as a POST request with a json body.
//!
//! #### Javascript API
//! A javascript client for this server is available in the [Aleo SDK](https://www.npmjs.com/package/@aleohq/sdk)
//!
//! #### Endpoints
//! `\develop`
//! * `program`: Text representation of the program to be deployed
//! * `fee`: Required fee to be paid for the program deployment
//! * `private_key`: Optional private key of the user who is deploying the program
//! * `password`: If the development server is started with an encrypted private key, the password will decrypt the private key
//! * `fee_record`: Optional record in text format to be used for the fee. If not provided, the server will search the network for a suitable record to pay the fee.
//! * `returns`: The transaction ID of the deployment transaction if successful
//!
//! `\execute`
//! * `program_id` The program ID of the program to be executed (e.g. hello.aleo)
//! * `program_function` The function to execute within the program (e.g. hello)
//! * `fee` Optional fee to be paid for the transfer, specify 0 for no fee
//! * `inputs` Array of inputs to be passed to the program
//! * `private_key` Optional private key of the user who is executing the program
//! * `password`: If the development server is started with an encrypted private key, the password will decrypt the private key
//! * `fee_record`: Optional record in text format to be used for the fee. If not provided, the server will search the network for a suitable record to pay the fee
//! * `returns`: The transaction ID of the execution transaction if successful
//!
//! `\transfer`
//! * `amount` The amount of credits to be sent (e.g. 1.5)
//! * `fee` Optional fee to be paid for the transfer, specify 0 for no fee
//! * `recipient` The recipient of the transfer
//! * `privateKey` Optional private key of the user who is sending the transfer
//! * `password`: If the development server is started with an encrypted private key, the password will decrypt the private key
//! * `amount_record` Optional record in text format to be used to fund the transfer. If not provided, the server will search the network for a suitable record to fund the amount
//! * `fee_record` Optional record in text format to be used for the fee. If not provided, the server will search the network for a suitable record to pay the fee
//! @returns {string | Error} The transaction ID of the execution transaction if successful
//!
//! #### Curl Examples
//! Example curl requests for the above endpoints:
//! ```bash
//! ## Deploy a program
//! curl -X POST -H "Content-Type: application/json" \
//! -d '{
//!     "program": "program hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n",
//!     "fee": 100000,
//!     "private_key": "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH"
//! }' \
//! http://0.0.0.0:4040/testnet3/deploy
//!
//! ## Execute a program
//! curl -X POST -H "Content-Type: application/json" \
//! -d '{
//!     "program_id": "hello.aleo",
//!     "program_function": "hello",
//!     "inputs": ["5u32", "5u32"],
//!     "private_key": "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH",
//!     "fee": 0
//! }' \
//! http://0.0.0.0:4040/testnet3/execute
//!
//! ## Create a value transfer
//! curl -X POST -H "Content-Type: application/json" \
//! -d '{
//!     "amount": 1000,
//!     "fee": 0,
//!     "recipient": "aleo1trtljxr7rw6cn368v2pslnxgl2vzk9pgfunev59k53x645hvrygs5v4f2e",
//!     "private_key": "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH"
//! }' \
//! http://0.0.0.0:4040/testnet3/transfer
//! ```
//!
//! This API of this server is currently under active development and is expected to change in the
//! future in order to provide a more streamlined experience for program execution and deployment.
//!

#![forbid(unsafe_code)]

#[macro_use]
extern crate tracing;

mod cli;
pub use cli::*;

mod helpers;
pub use helpers::*;

mod requests;
use requests::*;

mod routes;
pub use routes::*;

use aleo_rust::{AleoAPIClient, Encryptor, ProgramManager, RecordFinder, TransferType};
use snarkvm::{
    console::{
        account::{Address, PrivateKey},
        program::{Ciphertext, Identifier, Plaintext, ProgramID, Record},
    },
    prelude::{Network, Testnet3},
    synthesizer::Program,
};
use tracing_subscriber::fmt;

use anyhow::{anyhow, Result};
use colored::*;
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use warp::{reject, reply, Filter, Rejection, Reply};

/// Server object for the Aleo Development Server
#[derive(Clone)]
pub struct Rest<N: Network> {
    api_client: AleoAPIClient<N>,
    /// Private key ciphertext for the account being used with the server
    private_key_ciphertext: Option<Ciphertext<N>>,
    /// Record finder for finding records
    record_finder: RecordFinder<N>,
    /// Socket address for the server
    socket_address: SocketAddr,
    /// Debug mode flag
    debug: bool,
}

impl<N: Network> Rest<N> {
    /// Initializes a new instance of the server.
    pub fn initialize(
        socket_address: Option<SocketAddr>,
        private_key_ciphertext: Option<Ciphertext<N>>,
        peer_url: Option<String>,
        debug: bool,
    ) -> Result<Self> {
        // If no socket address was specified, use the default of 0.0.0.0:4040
        let socket_address = socket_address.unwrap_or_else(|| SocketAddr::from(([0, 0, 0, 0], 4040)));

        // If no peer url was specified, use the default of https://vm.aleo.org/api
        let peer = peer_url.unwrap_or("https://vm.aleo.org/api".to_string());

        // Initialize an API client configured for the specified network.
        let api_client = AleoAPIClient::new(&peer, "testnet3")?;
        let record_finder = RecordFinder::new(api_client.clone());

        let key_warning = if private_key_ciphertext.is_some() {
            format!("{}", "Using configured private key ciphertext for main development account, authentication will be required for all requests\n".bright_blue())
        } else {
            "".to_string()
        };

        // Initialize the server.
        let server = Self { api_client, private_key_ciphertext, record_finder, socket_address, debug };

        // Print an initialization message and return the server
        println!("{}", "\nStarting Aleo development server...".bright_blue());
        println!(
            "{}{}{}{}",
            "Listening on ".bright_blue(),
            socket_address.to_string().bright_green().bold(),
            " with remote peer ".bright_blue(),
            peer
        );
        println!("{}", key_warning);
        Ok(server)
    }
}

impl<N: Network> Rest<N> {
    /// Initializes the development server
    pub async fn start(&mut self) {
        let cors = warp::cors().allow_any_origin().allow_methods(vec!["GET", "POST", "OPTIONS"]).allow_headers(vec![
            "access-control-allow-origin",
            "access-control-request-method",
            "access-control-request-headers",
            "referer",
            "referrer-policy",
            "user-agent",
            "origin",
            "accept",
            "content-type",
            "authorization",
        ]);

        // Initialize the routes
        let routes = self.routes();

        // Initialize the logger with configured level
        let level = if self.debug { "debug" } else { "info" };
        fmt::Subscriber::builder().with_env_filter(level).init();

        // Add custom logging for each request.
        let custom_log = warp::log::custom(|info| match info.remote_addr() {
            Some(addr) => info!("Received '{} {}' from '{addr}' ({})", info.method(), info.path(), info.status()),
            None => info!("Received '{} {}' ({})", info.method(), info.path(), info.status()),
        });

        // Start the server
        println!("{}", "✅ Launching Aleo Development Server!".bright_blue().bold());
        warp::serve(routes.with(cors).with(custom_log)).run(self.socket_address).await;
    }
}
