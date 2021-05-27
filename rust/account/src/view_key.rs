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

use crate::{PrivateKey, ViewKeyError};

use snarkvm_algorithms::traits::SignatureScheme;
use snarkvm_dpc::{
    account::AccountViewKey,
    base_dpc::{instantiated::Components, parameters::SystemParameters},
    traits::DPCComponents,
};
use snarkvm_utilities::{
    bytes::{FromBytes, ToBytes},
    to_bytes,
};

use rand::{CryptoRng, Rng};
use std::{fmt, str::FromStr};

#[derive(Debug)]
pub struct ViewKey {
    pub view_key: AccountViewKey<Components>,
}

impl ViewKey {
    pub fn from(private_key: &PrivateKey) -> Result<Self, ViewKeyError> {
        let parameters = SystemParameters::<Components>::load()?;
        let view_key = AccountViewKey::<Components>::from_private_key(
            &parameters.account_signature,
            &parameters.account_commitment,
            &private_key.private_key,
        )?;
        Ok(Self { view_key })
    }

    /// Sign message with the view key.
    pub fn sign<R: Rng + CryptoRng>(&self, message: &[u8], rng: &mut R) -> Result<Signature, ViewKeyError> {
        let parameters = SystemParameters::<Components>::load()?;

        let signature = parameters
            .account_encryption
            .sign(&self.view_key.decryption_key, message, rng)?;

        Ok(Signature(signature))
    }
}

impl FromStr for ViewKey {
    type Err = ViewKeyError;

    fn from_str(view_key: &str) -> Result<Self, Self::Err> {
        Ok(Self {
            view_key: AccountViewKey::<Components>::from_str(view_key)?,
        })
    }
}

impl fmt::Display for ViewKey {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.view_key.to_string())
    }
}

/// An account view key signature.
pub struct Signature(pub <<Components as DPCComponents>::AccountEncryption as SignatureScheme>::Output);

impl FromStr for Signature {
    type Err = ViewKeyError;

    fn from_str(signature: &str) -> Result<Self, Self::Err> {
        let signature_bytes = hex::decode(signature)?;
        let signature: <<Components as DPCComponents>::AccountEncryption as SignatureScheme>::Output =
            FromBytes::read(&signature_bytes[..])?;

        Ok(Self(signature))
    }
}

impl fmt::Display for Signature {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "{}",
            hex::encode(to_bytes![self.0].expect("failed to convert to bytes"))
        )
    }
}
