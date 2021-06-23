// Copyright (C) 2019-2021 Aleo Systems Inc.
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

use crate::{errors::TransactionError, TransactionKernelBuilder};
use aleo_network::Network;

use snarkvm_dpc::testnet1::{LocalData, TransactionKernel as TransactionKernelNative};
use snarkvm_utilities::{to_bytes, FromBytes, ToBytes};

use std::{fmt, str::FromStr};

/// Stores transaction data that is computed offline - without on-chain data.
/// To compute a transaction online, call `Transaction::from()` and provide `TransactionKernel` as an argument.
#[derive(Derivative)]
#[derivative(
    Clone(bound = "N: Network"),
    PartialEq(bound = "N: Network"),
    Eq(bound = "N: Network"),
    Debug(bound = "N: Network")
)]
pub struct TransactionKernel<N: Network> {
    pub(crate) transaction_kernel: TransactionKernelNative<N::Components>,
}

impl<N: Network> TransactionKernel<N> {
    pub fn new() -> TransactionKernelBuilder<N> {
        TransactionKernelBuilder { ..Default::default() }
    }

    pub fn into_local_data(&self) -> LocalData<N::Components> {
        self.transaction_kernel.into_local_data()
    }

    pub fn to_bytes(&self) -> Vec<u8> {
        let mut output = vec![];
        self.transaction_kernel
            .write(&mut output)
            .expect("serialization to bytes failed");
        output
    }
}

impl<N: Network> FromStr for TransactionKernel<N> {
    type Err = TransactionError;

    fn from_str(transaction_kernel: &str) -> Result<Self, Self::Err> {
        Ok(Self {
            transaction_kernel: TransactionKernelNative::<N::Components>::read(&hex::decode(transaction_kernel)?[..])?,
        })
    }
}

impl<N: Network> fmt::Display for TransactionKernel<N> {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "{}",
            hex::encode(to_bytes![self.transaction_kernel].expect("couldn't serialize to bytes"))
        )
    }
}
