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

use snarkvm::synthesizer::{Process as AleoProcess, Program as AleoProgram, Transaction as AleoTransaction};
use snarkvm_wasm::{
    account::{
        Address as AleoAddress,
        PrivateKey as AleoPrivateKey,
        Signature as AleoSignature,
        ViewKey as AleoViewKey,
    },
    network::Testnet3,
    program::{Ciphertext as AleoCiphertext, Plaintext as AleoPlaintext, Record as AleoRecord, Request as AleoRequest},
};

pub use snarkvm_wasm::{network::Environment, FromBytes, PrimeField, ToBytes};

// Account types
pub type Address = AleoAddress<CurrentNetwork>;
pub type PrivateKey = AleoPrivateKey<CurrentNetwork>;
pub type Signature = AleoSignature<CurrentNetwork>;
pub type ViewKey = AleoViewKey<CurrentNetwork>;

// Network types
pub type Aleo = snarkvm::circuit::AleoV0;
pub type CurrentNetwork = Testnet3;

// Record types
pub type RecordCiphertext = AleoRecord<CurrentNetwork, AleoCiphertext<CurrentNetwork>>;
pub type RecordPlaintext = AleoRecord<CurrentNetwork, AleoPlaintext<CurrentNetwork>>;

// Execution types
pub type Request = AleoRequest<CurrentNetwork>;
pub type Process = AleoProcess<CurrentNetwork>;
pub type Program = AleoProgram<CurrentNetwork>;
pub type Transaction = AleoTransaction<CurrentNetwork>;
