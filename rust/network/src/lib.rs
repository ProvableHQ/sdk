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

pub mod testnet1;
pub use testnet1::*;

use snarkvm_dpc::{testnet1::BaseDPCComponents, DPCComponents};
use snarkvm_utilities::{FromBytes, ToBytes};

/// This trait defines network-specific configurations and parameters.
pub trait Network {
    const ID: u8;
    const NODE_PORT: u16 = 4130 + Self::ID as u16;
    const RPC_PORT: u16 = 3030;

    type Components: DPCComponents + BaseDPCComponents;
    type Payload: FromBytes + ToBytes + Default + PartialEq;
}
