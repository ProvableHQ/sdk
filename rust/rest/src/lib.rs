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

mod helpers;
pub use helpers::*;

mod routes;
pub use routes::*;

use aleo_rust::{Encryptor, ProgramManager, RecordFinder};
use snarkvm::{
    console::{account::{Address, PrivateKey}, program::{Ciphertext, ProgramID}, types::Field},
    prelude::{cfg_into_iter, Network},
    synthesizer::{ConsensusStorage, Program, Transaction},
};

use anyhow::Result;
use http::header::HeaderName;
use serde::{Deserialize, Serialize};
use std::{net::SocketAddr, str::FromStr, sync::Arc};
use tokio::task::JoinHandle;
use warp::{reject, reply, Filter, Rejection, Reply};

/// A REST API server for the ledger.
#[derive(Clone)]
pub struct Rest<N: Network> {
    /// The server handles.
    handles: Vec<Arc<JoinHandle<()>>>,
    phantom: std::marker::PhantomData<N>,
}

impl<N: Network> Rest<N> {
    /// Initializes a new instance of the server.
    pub fn start(
        rest_ip: SocketAddr,
    ) -> Result<Self> {
        // Initialize the server.
        let mut server = Self { handles: vec![], phantom: std::marker::PhantomData };
        // Spawn the server.
        server.spawn_server(rest_ip);
        // Return the server.
        Ok(server)
    }
}

impl<N: Network> Rest<N> {
    /// Returns the handles.
    pub const fn handles(&self) -> &Vec<Arc<JoinHandle<()>>> {
        &self.handles
    }

    /// Initializes the server.
    fn spawn_server(&mut self, rest_ip: SocketAddr) {
        let cors = warp::cors()
            .allow_any_origin()
            .allow_header(HeaderName::from_static("content-type"))
            .allow_methods(vec!["GET", "POST", "OPTIONS"]);

        // Initialize the routes.
        let routes = self.routes();

        // Add custom logging for each request.
        let custom_log = warp::log::custom(|info| match info.remote_addr() {
            Some(addr) => debug!("Received '{} {}' from '{addr}' ({})", info.method(), info.path(), info.status()),
            None => debug!("Received '{} {}' ({})", info.method(), info.path(), info.status()),
        });

        // Spawn the server.
        self.handles.push(Arc::new(tokio::spawn(async move {
            // Start the server.
            warp::serve(routes.with(cors).with(custom_log)).run(rest_ip).await
        })))
    }
}
