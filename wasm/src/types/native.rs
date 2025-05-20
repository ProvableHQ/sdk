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
pub use snarkvm_console::{
    account::{Address, ComputeKey, GraphKey, PrivateKey, Signature, ViewKey},
    algorithms::{BHP256, BHP512, BHP768, BHP1024, Pedersen64, Pedersen128, Poseidon2, Poseidon4, Poseidon8},
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
        Request,
        Response,
        Value,
        ValueType,
    },
    types::{Field, Group, Scalar, U64},
};
use snarkvm_ledger_block::{Execution, Input, Output, Transaction, Transition};
pub use snarkvm_ledger_query::Query;
pub use snarkvm_ledger_store::helpers::memory::BlockMemory;
pub use snarkvm_synthesizer::{
    Authorization,
    Process,
    Program,
    process::{cost_in_microcredits_v2, deployment_cost},
    snark::{ProvingKey, VerifyingKey},
};
pub use snarkvm_wasm::{
    console::network::Environment,
    fields::PrimeField,
    utilities::{FromBytes, ToBytes, Uniform, error},
};

use serde::{Deserialize, Serialize};
use std::{
    fmt,
    fmt::{Debug, Display, Formatter},
    io,
    io::{Read, Write},
    str::FromStr,
};

// Account types
pub type AddressNative = Address<CurrentNetwork>;
pub type ComputeKeyNative = ComputeKey<CurrentNetwork>;
pub type GraphKeyNative = GraphKey<CurrentNetwork>;
pub type PrivateKeyNative = PrivateKey<CurrentNetwork>;
pub type SignatureNative = Signature<CurrentNetwork>;
pub type ViewKeyNative = ViewKey<CurrentNetwork>;

// Algebraic & Primitive Data Types
pub type FieldNative = Field<CurrentNetwork>;
pub type GroupNative = Group<CurrentNetwork>;
pub type ScalarNative = Scalar<CurrentNetwork>;
pub type U64Native = U64<CurrentNetwork>;

// Algorithms
pub type BHP256Native = BHP256<CurrentNetwork>;
pub type BHP512Native = BHP512<CurrentNetwork>;
pub type BHP768Native = BHP768<CurrentNetwork>;
pub type BHP1024Native = BHP1024<CurrentNetwork>;
pub type Pedersen64Native = Pedersen64<CurrentNetwork>;
pub type Pedersen128Native = Pedersen128<CurrentNetwork>;
pub type Poseidon2Native = Poseidon2<CurrentNetwork>;
pub type Poseidon4Native = Poseidon4<CurrentNetwork>;
pub type Poseidon8Native = Poseidon8<CurrentNetwork>;

// Program & AST data types
pub type ArgumentNative = Argument<CurrentNetwork>;
pub type CiphertextNative = Ciphertext<CurrentNetwork>;
pub type EntryNative = Entry<CurrentNetwork, PlaintextNative>;
pub type FutureNative = Future<CurrentNetwork>;
pub type IdentifierNative = Identifier<CurrentNetwork>;
pub type LiteralNative = Literal<CurrentNetwork>;
pub type PlaintextNative = Plaintext<CurrentNetwork>;
pub type ProgramIDNative = ProgramID<CurrentNetwork>;
pub type ProgramNative = Program<CurrentNetwork>;
pub type RecordCiphertextNative = Record<CurrentNetwork, CiphertextNative>;
pub type RecordPlaintextNative = Record<CurrentNetwork, PlaintextNative>;
pub type ResponseNative = Response<CurrentNetwork>;
pub type ValueNative = Value<CurrentNetwork>;
pub type ValueTypeNative = ValueType<CurrentNetwork>;

// Ledger types
type CurrentBlockMemory = BlockMemory<CurrentNetwork>;
pub type ExecutionNative = Execution<CurrentNetwork>;
pub type InputNative = Input<CurrentNetwork>;
pub type OutputNative = Output<CurrentNetwork>;
pub type ProgramOwnerNative = ProgramOwner<CurrentNetwork>;
pub type QueryNative = Query<CurrentNetwork, CurrentBlockMemory>;
pub type TransactionNative = Transaction<CurrentNetwork>;
pub type TransitionNative = Transition<CurrentNetwork>;

// Synthesizer types
pub type AuthorizationNative = Authorization<CurrentNetwork>;
pub type RequestNative = Request<CurrentNetwork>;
pub type ProcessNative = Process<CurrentNetwork>;
pub type ProvingKeyNative = ProvingKey<CurrentNetwork>;
pub type VerifyingKeyNative = VerifyingKey<CurrentNetwork>;

// Service Types
#[derive(Clone, Eq, PartialEq, Serialize, Deserialize)]
pub struct ProvingRequestNative {
    pub authorization: AuthorizationNative,
    pub fee_authorization: AuthorizationNative,
    pub broadcast: bool,
}

impl ProvingRequestNative {
    /// Creates a new `ProvingRequestNative` from the given authorization and fee authorization.
    pub fn new(
        authorization: &crate::Authorization,
        fee_authorization: &crate::Authorization,
        broadcast: bool,
    ) -> Self {
        Self {
            authorization: AuthorizationNative::from(authorization),
            fee_authorization: AuthorizationNative::from(fee_authorization),
            broadcast,
        }
    }

    /// Creates a new `ProvingRequest` from native authorization types.
    pub fn new_from_native(
        authorization: AuthorizationNative,
        fee_authorization: AuthorizationNative,
        broadcast: bool,
    ) -> Self {
        Self { authorization, fee_authorization, broadcast }
    }

    /// Gets the authorization of the function the `signer` is attempting to call.
    pub fn authorization(&self) -> &AuthorizationNative {
        &self.authorization
    }

    /// Gets the fee authorization of the proving request.
    pub fn fee_authorization(&self) -> &AuthorizationNative {
        &self.fee_authorization
    }

    /// Returns the broadcast flag.
    pub fn broadcast(&self) -> bool {
        self.broadcast
    }
}

impl FromStr for ProvingRequestNative {
    type Err = String;

    /// Initializes the request from a JSON-string.
    fn from_str(request: &str) -> Result<Self, String> {
        Ok(serde_json::from_str(request).map_err(|e| e.to_string())?)
    }
}

impl Debug for ProvingRequestNative {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        write!(f, "{}", serde_json::to_string(self).unwrap())
    }
}

impl Display for ProvingRequestNative {
    fn fmt(&self, f: &mut Formatter) -> fmt::Result {
        Display::fmt(self, f)
    }
}

impl ToBytes for ProvingRequestNative {
    fn write_le<W: Write>(&self, mut writer: W) -> io::Result<()>
    where
        Self: Sized,
    {
        // Write the version flag.
        1u8.write_le(&mut writer)?;

        // Write the authorization, fee authorization, and broadcast flag.
        self.authorization.write_le(&mut writer)?;
        self.fee_authorization.write_le(&mut writer)?;
        self.broadcast.write_le(&mut writer)?;

        Ok(())
    }
}

impl FromBytes for ProvingRequestNative {
    fn read_le<R: Read>(reader: &mut R) -> io::Result<Self>
    where
        Self: Sized,
    {
        // Read the version flag.
        let version = u8::read_le(reader)?;
        if version != 1 {
            return Err(error("Invalid proving request version"));
        }

        // Read the authorization, fee authorization, and broadcast flag.
        let authorization = FromBytes::read_le(reader)?;
        let fee_authorization = FromBytes::read_le(reader)?;
        let broadcast = bool::read_le(reader)?;

        Ok(Self::new_from_native(authorization, fee_authorization, broadcast))
    }
}
