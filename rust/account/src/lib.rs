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

#![forbid(unsafe_code)]

#[cfg(test)]
pub mod tests;

use snarkvm_wasm::{
    account::{
        Address as AleoAddress,
        PrivateKey as AleoPrivateKey,
        Signature as AleoSignature,
        ViewKey as AleoViewKey,
    },
    network::Testnet3,
    program::{Ciphertext as AleoCiphertext, Plaintext as AleoPlaintext, Record as AleoRecord},
};

pub use snarkvm_wasm::{network::Environment, FromBytes, PrimeField, ToBytes};

// Account management types
pub type Address = AleoAddress<CurrentNetwork>;
pub type PrivateKey = AleoPrivateKey<CurrentNetwork>;
pub type Signature = AleoSignature<CurrentNetwork>;
pub type ViewKey = AleoViewKey<CurrentNetwork>;

// Network types
pub type CurrentNetwork = Testnet3;

// Record management types
pub type CipherTextRecord = AleoRecord<CurrentNetwork, AleoCiphertext<CurrentNetwork>>;
pub type PlainTextRecord = AleoRecord<CurrentNetwork, AleoPlaintext<CurrentNetwork>>;
