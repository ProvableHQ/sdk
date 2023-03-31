// Copyright (C) 2019-2023 Aleo Systems Inc.
// This file is part of the Aleo library.

// The Aleo library is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// The Aleo library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with the Aleo library. If not, see <https://www.gnu.org/licenses/>.

#![forbid(unsafe_code)]

#[macro_use]
extern crate tracing;

mod cli;
pub use cli::*;

mod helpers;
pub use helpers::*;

mod routes;
pub use routes::*;

use aleo_rust::{AleoAPIClient, Encryptor, ProgramManager, RecordFinder};
use snarkvm::{
    console::{
        account::{Address, PrivateKey},
        program::{Ciphertext, Identifier, Plaintext, ProgramID, Record},
    },
    prelude::{Network, Testnet3},
    synthesizer::program::Program,
};

use anyhow::Result;
use colored::*;
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use warp::{reject, reply, Filter, Rejection, Reply};

/// A REST API server for the ledger.
#[derive(Clone)]
pub struct Rest<N: Network> {
    api_client: AleoAPIClient<N>,
    /// Private key ciphertext for the account being used with the server
    private_key_ciphertext: Option<Ciphertext<N>>,
    /// Record finder for finding records
    record_finder: RecordFinder<N>,
    /// Socket address for the server
    socket_address: SocketAddr,
}

impl<N: Network> Rest<N> {
    /// Initializes a new instance of the server.
    pub fn initialize(
        socket_address: SocketAddr,
        private_key_ciphertext: Option<Ciphertext<N>>,
        peer_url: Option<String>,
    ) -> Result<Self> {
        let peer = peer_url.unwrap_or("https://vm.aleo.org/api".to_string());
        let api_client = AleoAPIClient::new(&peer, "testnet3")?;
        let record_finder = RecordFinder::new(api_client.clone());

        let key_warning = if private_key_ciphertext.is_some() {
            format!("{}", "Using configured private key ciphertext for main development account, authentication will be required for all requests\n".bright_blue())
        } else {
            "".to_string()
        };

        // Initialize the server.
        let server = Self { api_client, private_key_ciphertext, record_finder, socket_address };
        // Return the server.

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
    /// Initializes the server.
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

        // Initialize the routes.
        let routes = self.routes();

        env_logger::init();
        //fmt::Subscriber::builder()
        //    .with_env_filter("info")
        //    .init();

        // Add custom logging for each request.
        let custom_log = warp::log::custom(|info| match info.remote_addr() {
            Some(addr) => info!("Received '{} {}' from '{addr}' ({})", info.method(), info.path(), info.status()),
            None => info!("Received '{} {}' ({})", info.method(), info.path(), info.status()),
        });

        println!("{}", "✅ Launching Aleo Development Server!".bright_blue().bold());
        warp::serve(routes.with(cors).with(custom_log)).run(self.socket_address).await;
    }
}
