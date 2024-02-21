// Copyright (C) 2019-2024 Aleo Systems Inc.
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

pub use snarkvm_circuit_network::{Aleo, AleoV0};
pub use snarkvm_console::{
    account::{Address, PrivateKey, Signature, ViewKey},
    network::{Network, Testnet3},
    program::{
        Ciphertext,
        Entry,
        EntryType,
        Identifier,
        Literal,
        Plaintext,
        PlaintextType,
        ProgramID,
        ProgramOwner,
        Record,
        Response,
        ValueType,
    },
    types::Field,
};
pub use snarkvm_ledger_block::{Execution, Transaction};
pub use snarkvm_ledger_query::Query;
pub use snarkvm_ledger_store::helpers::memory::BlockMemory;
pub use snarkvm_synthesizer::{
    cost_in_microcredits,
    deployment_cost,
    snark::{ProvingKey, VerifyingKey},
    Process,
    Program,
    VM,
};
pub use snarkvm_wasm::{
    console::network::Environment,
    fields::PrimeField,
    utilities::{FromBytes, ToBytes, Uniform},
};

// Account types
pub type AddressNative = Address<CurrentNetwork>;
pub type PrivateKeyNative = PrivateKey<CurrentNetwork>;
pub type SignatureNative = Signature<CurrentNetwork>;
pub type ViewKeyNative = ViewKey<CurrentNetwork>;

// Algebraic types
pub type FieldNative = Field<CurrentNetwork>;

// Network types
pub type CurrentNetwork = Testnet3;
pub type CurrentAleo = AleoV0;

// Record types
pub type CiphertextNative = Ciphertext<CurrentNetwork>;
pub type PlaintextNative = Plaintext<CurrentNetwork>;
pub type RecordCiphertextNative = Record<CurrentNetwork, CiphertextNative>;
pub type RecordPlaintextNative = Record<CurrentNetwork, PlaintextNative>;

// Program types
type CurrentBlockMemory = BlockMemory<CurrentNetwork>;
pub type ExecutionNative = Execution<CurrentNetwork>;
pub type IdentifierNative = Identifier<CurrentNetwork>;
pub type LiteralNative = Literal<CurrentNetwork>;
pub type ProcessNative = Process<CurrentNetwork>;
pub type ProgramIDNative = ProgramID<CurrentNetwork>;
pub type ProgramNative = Program<CurrentNetwork>;
pub type ProgramOwnerNative = ProgramOwner<CurrentNetwork>;
pub type ProvingKeyNative = ProvingKey<CurrentNetwork>;
pub type QueryNative = Query<CurrentNetwork, CurrentBlockMemory>;
pub type ResponseNative = Response<CurrentNetwork>;
pub type TransactionNative = Transaction<CurrentNetwork>;
pub type VerifyingKeyNative = VerifyingKey<CurrentNetwork>;
