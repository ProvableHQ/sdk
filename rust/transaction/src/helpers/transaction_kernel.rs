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

use snarkvm_dpc::testnet1::{LocalData, TransactionKernel as TransactionKernelTestnet1};
use snarkvm_utilities::{to_bytes, FromBytes, ToBytes};

use std::{
    convert::TryFrom,
    fmt,
    io::{Read, Result as IoResult, Write},
    str::FromStr,
};

/// Stores transaction data that is computed offline - without on-chain data.
/// To compute a transaction online, call `Transaction::from()` and provide `TransactionKernel` as an argument.
#[derive(Derivative)]
#[derivative(
    Clone(bound = "N: Network"),
    PartialEq(bound = "N: Network"),
    Eq(bound = "N: Network"),
    Debug(bound = "N: Network")
)]
pub struct TransactionKernel<N: Network>(pub(crate) TransactionKernelTestnet1<N::Components>);

impl<N: Network> TransactionKernel<N> {
    #[allow(clippy::new_ret_no_self)]
    pub fn new() -> TransactionKernelBuilder<N> {
        TransactionKernelBuilder { ..Default::default() }
    }

    #[allow(clippy::wrong_self_convention)]
    pub fn into_local_data(&self) -> LocalData<N::Components> {
        self.0.into_local_data()
    }

    pub fn to_bytes(&self) -> Vec<u8> {
        let mut output = vec![];
        self.0.write(&mut output).expect("serialization to bytes failed");
        output
    }
}

impl<N: Network> ToBytes for TransactionKernel<N> {
    #[inline]
    fn write<W: Write>(&self, mut writer: W) -> IoResult<()> {
        self.0.write(&mut writer)
    }
}

impl<N: Network> FromBytes for TransactionKernel<N> {
    #[inline]
    fn read<R: Read>(mut reader: R) -> IoResult<Self> {
        Ok(Self(FromBytes::read(&mut reader)?))
    }
}

impl<N: Network> FromStr for TransactionKernel<N> {
    type Err = TransactionError;

    fn from_str(kernel: &str) -> Result<Self, Self::Err> {
        Ok(Self(TransactionKernelTestnet1::<N::Components>::read(
            &hex::decode(kernel)?[..],
        )?))
    }
}

impl<N: Network> TryFrom<&str> for TransactionKernel<N> {
    type Error = TransactionError;

    fn try_from(kernel: &str) -> Result<Self, Self::Error> {
        Self::from_str(kernel)
    }
}

impl<N: Network> fmt::Display for TransactionKernel<N> {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "{}",
            hex::encode(to_bytes![self.0].expect("couldn't serialize to bytes"))
        )
    }
}
