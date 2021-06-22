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

use snarkos_storage::mem::MemDb;
use snarkvm_dpc::{
    testnet1::{
        instantiated::Components as Testnet1Components,
        payload::Payload as Testnet1Payload,
        transaction::amount::AleoAmount,
        BaseDPCComponents,
    },
    DPCComponents,
    Storage,
};
use snarkvm_utilities::{FromBytes, ToBytes};

use std::{fmt::Debug, hash::Hash};

/// The target environment for building records, and transactions.
pub trait Network {
    type Components: DPCComponents + BaseDPCComponents;

    /// Record components
    type Payload: FromBytes + ToBytes + Default + PartialEq;

    /// Transaction components
    type Amount: Debug + Copy + Clone + PartialEq + Eq + PartialOrd + Ord + Hash;
    type Memorandum: FromBytes + ToBytes;

    /// Ledger Components
    type Storage: Storage;
}

/// The testnet1 environment
pub struct Testnet1;

impl Network for Testnet1 {
    type Amount = AleoAmount;
    type Components = Testnet1Components;
    type Memorandum = [u8; 32];
    type Payload = Testnet1Payload;
    type Storage = MemDb;
}
