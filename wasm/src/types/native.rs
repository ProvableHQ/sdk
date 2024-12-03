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

pub use super::networks::*;

pub use snarkvm_console::{
    account::{Address, ComputeKey, GraphKey, PrivateKey, Signature, ViewKey},
    network::Network,
    program::{
        Argument,
        Ciphertext,
        Entry,
        EntryType,
        Future,
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
    types::{Field, Group, Scalar, U64},
};
use snarkvm_ledger_block::{Execution, Input, Output, Transaction, Transition};
pub use snarkvm_ledger_query::Query;
pub use snarkvm_ledger_store::helpers::memory::BlockMemory;
pub use snarkvm_synthesizer::{
    Process,
    Program,
    process::{cost_in_microcredits, deployment_cost},
    snark::{ProvingKey, VerifyingKey},
};
pub use snarkvm_wasm::{
    console::network::Environment,
    fields::PrimeField,
    utilities::{FromBytes, ToBytes, Uniform},
};

// Account types
pub type AddressNative = Address<CurrentNetwork>;
pub type ComputeKeyNative = ComputeKey<CurrentNetwork>;
pub type GraphKeyNative = GraphKey<CurrentNetwork>;
pub type PrivateKeyNative = PrivateKey<CurrentNetwork>;
pub type SignatureNative = Signature<CurrentNetwork>;
pub type ViewKeyNative = ViewKey<CurrentNetwork>;

// Algebraic types
pub type FieldNative = Field<CurrentNetwork>;
pub type GroupNative = Group<CurrentNetwork>;
pub type ScalarNative = Scalar<CurrentNetwork>;
pub type U64Native = U64<CurrentNetwork>;

// Record types
pub type CiphertextNative = Ciphertext<CurrentNetwork>;
pub type EntryNative = Entry<CurrentNetwork, PlaintextNative>;
pub type RecordCiphertextNative = Record<CurrentNetwork, CiphertextNative>;
pub type RecordPlaintextNative = Record<CurrentNetwork, PlaintextNative>;

// Program types
pub type ArgumentNative = Argument<CurrentNetwork>;
type CurrentBlockMemory = BlockMemory<CurrentNetwork>;
pub type ExecutionNative = Execution<CurrentNetwork>;
pub type FutureNative = Future<CurrentNetwork>;
pub type IdentifierNative = Identifier<CurrentNetwork>;
pub type InputNative = Input<CurrentNetwork>;
pub type LiteralNative = Literal<CurrentNetwork>;
pub type OutputNative = Output<CurrentNetwork>;
pub type PlaintextNative = Plaintext<CurrentNetwork>;
pub type ProcessNative = Process<CurrentNetwork>;
pub type ProgramIDNative = ProgramID<CurrentNetwork>;
pub type ProgramNative = Program<CurrentNetwork>;
pub type ProgramOwnerNative = ProgramOwner<CurrentNetwork>;
pub type ProvingKeyNative = ProvingKey<CurrentNetwork>;
pub type QueryNative = Query<CurrentNetwork, CurrentBlockMemory>;
pub type ResponseNative = Response<CurrentNetwork>;
pub type TransactionNative = Transaction<CurrentNetwork>;
pub type TransitionNative = Transition<CurrentNetwork>;
pub type VerifyingKeyNative = VerifyingKey<CurrentNetwork>;
