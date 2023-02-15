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

use snarkvm_synthesizer::{
    Process as AleoProcess,
    Program as AleoProgram,
    Transaction as AleoTransaction,
    ProvingKey
};
use snarkvm_wasm::{
    account::{Address, PrivateKey, Signature, ViewKey},
    network::{Testnet3}
};
use snarkvm_console::{
    program::{Ciphertext, Identifier as AleoIdentifier, Plaintext, Record},
};

pub use snarkvm_wasm::{network::Environment, FromBytes, PrimeField, ToBytes};

// Account types
pub type AddressNative = Address<CurrentNetwork>;
pub type PrivateKeyNative = PrivateKey<CurrentNetwork>;
pub type SignatureNative = Signature<CurrentNetwork>;
pub type ViewKeyNative = ViewKey<CurrentNetwork>;

// Network types
pub type Aleo = snarkvm_wasm::AleoV0;
pub type CurrentNetwork = Testnet3;
pub type ProvingKeyNative = ProvingKey<CurrentNetwork>;

// Program types
pub type Identifier = AleoIdentifier<CurrentNetwork>;
pub type Process = AleoProcess<CurrentNetwork>;
pub type Program = AleoProgram<CurrentNetwork>;
pub type TransactionNative = AleoTransaction<CurrentNetwork>;

// Record types
pub type CiphertextNative = Ciphertext<CurrentNetwork>;
pub type PlaintextNative = Plaintext<CurrentNetwork>;
pub type RecordCiphertextNative = Record<CurrentNetwork, CiphertextNative>;
pub type RecordPlaintextNative = Record<CurrentNetwork, PlaintextNative>;

// Utility types
pub type Encryptor = aleo_rust::Encryptor<CurrentNetwork>;
