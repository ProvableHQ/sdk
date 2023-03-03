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

use crate::{AleoAPIClient, ProgramManager, Resolver};
use snarkvm_console::program::Network;
use snarkvm_synthesizer::Transaction;
use std::any::Any;

use anyhow::{anyhow, Result};

impl<N: Network, R: Resolver<N>> ProgramManager<N, R> {
    /// Broadcast a transaction to the network
    pub fn broadcast_transaction(&self, transaction: Transaction<N>) -> Result<String> {
        let transaction_type = if let Transaction::Deploy(_, _, _) = &transaction { "Deployment" } else { "Execute" };
        let api_client = self.api_client()?;
        let result = api_client.transaction_broadcast(transaction);
        if result.is_ok() {
            println!("✅ {} Transaction successfully posted to {}", transaction_type, api_client.base_url());
        } else {
            println!("❌ {} Transaction failed to post to {}", transaction_type, api_client.base_url());
        }
        result
    }

    /// Get API client
    pub fn api_client(&self) -> Result<&AleoAPIClient<N>> {
        self.api_client.as_ref().ok_or_else(|| anyhow!("No API client found"))
    }

    /// Get the resolver
    pub fn resolver(&self) -> &R {
        &self.resolver
    }
}
