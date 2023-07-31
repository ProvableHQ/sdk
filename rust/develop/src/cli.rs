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

use super::*;
use clap::Parser;

/// The Aleo Development Server is a tool to help developers build and deploy Aleo
/// programs. The server is built in Rust and performs the proving and verification
/// operations required to deploy and execute Aleo programs. Once it has performed
/// these operations, the resulting deployments or executions will be broadcast to the
/// Aleo Network. The server receives the information necessary to deploy and execute
/// programs from the user via a REST API. Developers can use any language of choice
/// (javascript, python, etc..) to send RESTful requests to the server. This server is
/// meant to be used in trusted contexts such as local dev environments or a trusted
/// private network within a cloud environment, etc. and should not be used to create
/// a public API. A javascript client for this server is available in the Aleo SDK -
/// <https://www.npmjs.com/package/@aleohq/sdk>
#[derive(Debug, Parser)]
#[clap(name = "Aleo Development Server", author = "The Aleo Team <hello@aleo.org>")]
pub struct CLI {
    /// Development Server subcommands
    #[clap(subcommand)]
    pub command: Command,
}

#[derive(Debug, Parser)]
pub enum Command {
    /// Start the development server - `aleo-develop start --help` for usage info
    Start {
        /// Optional `private key ciphertext` to start the development server with.
        /// If this is provided to the server on startup, the server will store this
        /// ciphertext in memory and look for an optional `password` field in the
        /// json body of the deploy, execute, and transfer requests it receives. If
        /// the `password` field is found in a request, it will attempt to use it
        /// to decrypt the `private key ciphertext` into a `private key` and use the
        /// `private key` to create program deployment and execution transactions on
        /// the Aleo Network.
        #[clap(short, long)]
        key_ciphertext: Option<Ciphertext<Testnet3>>,
        /// Uri and port the development server will listen on [default: 0.0.0.0:4040]
        #[clap(short = 'a', long)]
        server_address: Option<SocketAddr>,
        /// Aleo Network peer uri to connect to [default: https://vm.aleo.org/api].
        /// This is the peer the development server will send its completed deploy
        /// and execute transactions to. The peer must be running the testnet3 api
        /// <https://developer.aleo.org/testnet/getting_started/overview/> in order
        /// for the development server to successfully send transactions to the Aleo
        /// Network.
        #[clap(short, long)]
        peer: Option<String>,
        /// Start the server with debug logging enabled [default: false]
        #[clap(short, long)]
        debug: bool,
    },
}

impl Command {
    pub fn parse(self) -> Result<Rest<Testnet3>> {
        match self {
            Command::Start { server_address, key_ciphertext: key, peer, debug } => {
                Rest::initialize(server_address, key, peer, debug)
            }
        }
    }
}
