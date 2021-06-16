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

use aleo_account::Address;

use snarkvm_algorithms::{
    traits::{CommitmentScheme, CRH},
    SignatureScheme,
};
use snarkvm_dpc::{
    testnet1::{
        instantiated::Components as Testnet1Components,
        payload::Payload as Testnet1Payload,
        BaseDPCComponents,
    },
    DPCComponents,
};
use snarkvm_utilities::{FromBytes, ToBytes};

use std::hash::Hash;

/// The target environment for building records, and transactions.
pub trait Environment {
    type Components: DPCComponents + BaseDPCComponents;

    /// Record interface
    type Commitment: FromBytes + ToBytes;
    type CommitmentRandomness;
    type Owner;
    type Payload: FromBytes + ToBytes + Default + PartialEq;
    type SerialNumberNonce;
    type SerialNumber: Clone + Eq + Hash + FromBytes + ToBytes;
    type Value: FromBytes + ToBytes;
}

/// The testnet1 environment
pub struct Testnet1;

impl Environment for Testnet1 {
    type Commitment =
        <<<Self as Environment>::Components as DPCComponents>::RecordCommitment as CommitmentScheme>::Output;
    type CommitmentRandomness =
        <<<Self as Environment>::Components as DPCComponents>::RecordCommitment as CommitmentScheme>::Randomness;
    type Components = Testnet1Components;
    type Owner = Address;
    type Payload = Testnet1Payload;
    type SerialNumber =
        <<<Self as Environment>::Components as DPCComponents>::AccountSignature as SignatureScheme>::PublicKey;
    type SerialNumberNonce =
        <<<Self as Environment>::Components as DPCComponents>::SerialNumberNonceCRH as CRH>::Output;
    type Value = u64;
}

// /// The target environment for building records, and transactions.
// pub enum Environment {
//     Testnet1(Testnet1),
//     //Testnet2(Testnet2),
// }
//
// impl Environment {
//     pub fn components(self) -> impl DPCComponents {
//         match self {
//             Environment::Testnet1(testnet1) => testnet1.components,
//         }
//     }
//
//     pub fn payload(self) -> impl ToBytes + FromBytes {
//         match self {
//             Environment::Testnet1(testnet1) => testnet1.payload,
//         }
//     }
// }
