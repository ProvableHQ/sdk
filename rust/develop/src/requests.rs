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

/// Request to deploy a new program
#[derive(Deserialize, Serialize)]
#[serde(bound(serialize = "N: Serialize", deserialize = "N: for<'a> Deserialize<'a>"))]
pub(crate) struct DeployRequest<N: Network> {
    pub program: Program<N>,
    pub private_key: Option<PrivateKey<N>>,
    pub password: Option<String>,
    pub fee: u64,
    pub fee_record: Option<Record<N, Plaintext<N>>>,
    pub peer_url: Option<String>,
}

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

/// Request to make transfer of Aleo credits
#[derive(Deserialize, Serialize)]
#[serde(bound(serialize = "N: Serialize", deserialize = "N: for<'a> Deserialize<'a>"))]
pub(crate) struct TransferRequest<N: Network> {
    pub amount: u64,
    pub fee: u64,
    pub recipient: Address<N>,
    pub transfer_type: String,
    pub private_key: Option<PrivateKey<N>>,
    pub password: Option<String>,
    pub fee_record: Option<Record<N, Plaintext<N>>>,
    pub amount_record: Option<Record<N, Plaintext<N>>>,
    pub peer_url: Option<String>,
}
