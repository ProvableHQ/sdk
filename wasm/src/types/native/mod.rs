// Copyright (C) 2019-2025 Provable Inc.
// This file is part of the Provable SDK library.

// The Provable SDK library is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// The Provable SDK library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with the Provable SDK library. If not, see <https://www.gnu.org/licenses/>.

pub use super::networks::*;
use snarkvm_console::{
    account::{Address, ComputeKey, GraphKey, PrivateKey, Signature, ViewKey},
    algorithms::{BHP256, BHP512, BHP768, BHP1024, ECDSASignature, Pedersen64, Pedersen128, Poseidon2, Poseidon4, Poseidon8},
    program::{
        Argument,
        Ciphertext,
        Entry,
        Future,
        Identifier,
        Literal,
        Locator,
        Plaintext,
        ProgramID,
        ProgramOwner,
        Record,
        Request,
        Response,
        StatePath,
        Value,
        ValueType,
    },
    types::{Boolean, Field, Group, I8, I16, I32, I64, I128, Scalar, U8, U16, U32, U64, U128},
};
use snarkvm_ledger_block::{Deployment, Execution, Fee, Input, Output, Transaction, Transition};
use snarkvm_synthesizer::{
    Authorization,
    Process,
    Program,
    snark::{Certificate, ProvingKey, VerifyingKey},
};

mod request;
pub(crate) use request::ProvingRequestNative;

// Account types
pub type AddressNative = Address<CurrentNetwork>;
pub type ComputeKeyNative = ComputeKey<CurrentNetwork>;
pub type GraphKeyNative = GraphKey<CurrentNetwork>;
pub type PrivateKeyNative = PrivateKey<CurrentNetwork>;
pub type SignatureNative = Signature<CurrentNetwork>;
pub type ViewKeyNative = ViewKey<CurrentNetwork>;

// Algebraic & Primitive Data Types
pub type BooleanNative = Boolean<CurrentNetwork>;
pub type FieldNative = Field<CurrentNetwork>;
pub type GroupNative = Group<CurrentNetwork>;
pub type ScalarNative = Scalar<CurrentNetwork>;
pub type I8Native = I8<CurrentNetwork>;
pub type I16Native = I16<CurrentNetwork>;
pub type I32Native = I32<CurrentNetwork>;
pub type I64Native = I64<CurrentNetwork>;
pub type I128Native = I128<CurrentNetwork>;
pub type U8Native = U8<CurrentNetwork>;
pub type U16Native = U16<CurrentNetwork>;
pub type U32Native = U32<CurrentNetwork>;
pub type U64Native = U64<CurrentNetwork>;
pub type U128Native = U128<CurrentNetwork>;

// Algorithms
pub type BHP256Native = BHP256<CurrentNetwork>;
pub type BHP512Native = BHP512<CurrentNetwork>;
pub type BHP768Native = BHP768<CurrentNetwork>;
pub type BHP1024Native = BHP1024<CurrentNetwork>;
pub type CertificateNative = Certificate<CurrentNetwork>;
pub type ECDSASignatureNative = ECDSASignature<CurrentNetwork>;
pub type Pedersen64Native = Pedersen64<CurrentNetwork>;
pub type Pedersen128Native = Pedersen128<CurrentNetwork>;
pub type Poseidon2Native = Poseidon2<CurrentNetwork>;
pub type Poseidon4Native = Poseidon4<CurrentNetwork>;
pub type Poseidon8Native = Poseidon8<CurrentNetwork>;

// Program types
pub type ArgumentNative = Argument<CurrentNetwork>;
pub type CiphertextNative = Ciphertext<CurrentNetwork>;
pub type CiphertextEntryNative = Entry<CurrentNetwork, CiphertextNative>;
pub type FutureNative = Future<CurrentNetwork>;
pub type IdentifierNative = Identifier<CurrentNetwork>;
pub type LiteralNative = Literal<CurrentNetwork>;
pub type LocatorNative = Locator<CurrentNetwork>;
pub type PlaintextNative = Plaintext<CurrentNetwork>;
pub type PlaintextEntryNative = Entry<CurrentNetwork, PlaintextNative>;
pub type ProgramIDNative = ProgramID<CurrentNetwork>;
pub type ProgramNative = Program<CurrentNetwork>;
pub type RecordCiphertextNative = Record<CurrentNetwork, CiphertextNative>;
pub type RecordPlaintextNative = Record<CurrentNetwork, PlaintextNative>;
pub type ResponseNative = Response<CurrentNetwork>;
pub type ValueNative = Value<CurrentNetwork>;

// Ledger types
pub type DeploymentNative = Deployment<CurrentNetwork>;
pub type ExecutionNative = Execution<CurrentNetwork>;
pub type FeeNative = Fee<CurrentNetwork>;
pub type InputNative = Input<CurrentNetwork>;
pub type OutputNative = Output<CurrentNetwork>;
pub type ProgramOwnerNative = ProgramOwner<CurrentNetwork>;
pub type TransactionNative = Transaction<CurrentNetwork>;
pub type TransitionNative = Transition<CurrentNetwork>;
pub type ValueTypeNative = ValueType<CurrentNetwork>;

// Synthesizer types
pub type AuthorizationNative = Authorization<CurrentNetwork>;
pub type ProcessNative = Process<CurrentNetwork>;
pub type ProvingKeyNative = ProvingKey<CurrentNetwork>;
pub type RequestNative = Request<CurrentNetwork>;
pub type StatePathNative = StatePath<CurrentNetwork>;
pub type VerifyingKeyNative = VerifyingKey<CurrentNetwork>;
