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

/// Request to execute a program
#[derive(Deserialize, Serialize)]
#[serde(bound(serialize = "N: Serialize", deserialize = "N: for<'a> Deserialize<'a>"))]
pub(crate) struct ExecuteRequest<N: Network> {
    pub program_id: ProgramID<N>,
    pub program_function: Identifier<N>,
    pub inputs: Vec<String>,
    pub private_key: Option<PrivateKey<N>>,
    pub password: Option<String>,
    pub fee: u64,
    pub fee_record: Option<Record<N, Plaintext<N>>>,
    pub peer_url: Option<String>,
}

impl<N: Network> TransactionRequest<N> for ExecuteRequest<N> {
    fn fee(&self) -> u64 {
        self.fee
    }

    fn fee_record(&mut self) -> Option<Record<N, Plaintext<N>>> {
        self.fee_record.take()
    }

    fn inputs(&mut self) -> Option<Vec<String>> {
        Some(self.inputs.clone())
    }

    fn password(&mut self) -> Option<String> {
        self.password.take()
    }

    fn peer_url(&mut self) -> Option<String> {
        self.peer_url.take()
    }

    fn private_key(&mut self) -> Option<PrivateKey<N>> {
        self.private_key.take()
    }

    fn program_id(&self) -> Option<ProgramID<N>> {
        Some(self.program_id)
    }

    fn program_function(&mut self) -> Option<Identifier<N>> {
        Some(self.program_function)
    }

    fn type_of(&self) -> &'static str {
        "execute"
    }
}
