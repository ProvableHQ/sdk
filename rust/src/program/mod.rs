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

use crate::api::AleoAPIClient;
use snarkvm_console::{
    account::PrivateKey,
    program::{Ciphertext, Network},
};
use snarkvm_synthesizer::Transaction;

pub mod build;
pub use build::*;

pub mod config;
pub use config::*;

pub mod deploy;
pub use deploy::*;

pub mod execute;
pub use execute::*;

pub mod resolver;
pub use resolver::*;

pub mod transfer;
use crate::NetworkConfig;
pub use transfer::*;

/// Program management object for loading programs for building, execution, and deployment
///
/// This object is meant to be a software abstraction that can be consumed by software like
/// CLI tools, IDE plugins, Server-side stack components and other software that needs to
/// interact with the Aleo network.
pub struct ProgramManager<N: Network> {
    pub(crate) private_key: Option<PrivateKey<N>>,
    pub(crate) private_key_ciphertext: Option<Ciphertext<N>>,
    pub(crate) network_config: Option<NetworkConfig>,
}

impl<N: Network> ProgramManager<N> {
    pub fn send_transaction(&self, transaction: Transaction<N>) -> anyhow::Result<()> {
        if let Some(config) = &self.network_config {
            let api_client = AleoAPIClient::<N>::from(config);
            api_client.transaction_broadcast(transaction)?;
            Ok(())
        } else {
            anyhow::bail!("No API client found")
        }
    }
}
