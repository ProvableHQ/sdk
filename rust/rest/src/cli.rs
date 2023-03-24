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

use super::*;
use clap::Parser;

/// Aleo Development Server Startup Options
#[derive(Debug, Parser)]
#[clap(name = "myaleo", author = "The Aleo Team <hello@aleo.org>")]
pub struct CLI {
    /// Development Server subcommands
    #[clap(subcommand)]
    pub command: Command,
}

#[derive(Debug, Parser)]
pub enum Command {
    Start {
        /// Optional Private Key Ciphertext to use the development server with
        #[clap(short, long)]
        key: Option<Ciphertext<Testnet3>>,
        /// Uri and port to use for the development server
        #[clap(short, long)]
        uri: SocketAddr,
        /// Peer uri
        #[clap(short, long)]
        peer: Option<String>,
    },
}

impl Command {
    pub fn parse(self) -> Result<Rest<Testnet3>> {
        match self {
            Command::Start { uri, key, peer } => Rest::initialize(uri, key, peer),
        }
    }
}
