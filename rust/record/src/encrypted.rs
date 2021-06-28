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
use crate::{
    helpers::{
        decrypt::Decrypt,
        encrypt::{Encrypt, EncryptionRandomness},
    },
    EncryptedRecordError,
    Record,
};
use aleo_account::ViewKey;
use aleo_network::Network;

use snarkvm_utilities::{to_bytes, ToBytes};

use rand::Rng;
use std::{
    fmt,
    io::{Result as IoResult, Write},
    str::FromStr,
};

#[derive(Debug)]
pub struct EncryptedRecord {
    pub encrypted_record: Vec<u8>,
}

impl EncryptedRecord {
    /// Encrypt the given record and returns tuple (encryption randomness, encrypted record).
    pub fn from<R: Rng, N: Network>(
        record: &Record<N>,
        rng: &mut R,
    ) -> Result<(EncryptionRandomness, Self), EncryptedRecordError> {
        let (encryption_randomness, encrypted_record) = Encrypt::encrypt(record, rng)?;

        Ok((encryption_randomness, Self { encrypted_record }))
    }

    pub fn to_bytes(&self) -> Vec<u8> {
        let mut output = vec![];
        self.encrypted_record
            .write(&mut output)
            .expect("serialization to bytes failed");
        output
    }

    pub fn decrypt<N: Network>(&self, view_key: &ViewKey) -> Result<Record<N>, EncryptedRecordError> {
        Ok(Decrypt::decrypt(view_key, &*to_bytes![self]?)?)
    }
}

impl FromStr for EncryptedRecord {
    type Err = EncryptedRecordError;

    fn from_str(encrypted_record: &str) -> Result<Self, Self::Err> {
        Ok(Self {
            encrypted_record: hex::decode(encrypted_record)?,
        })
    }
}

impl fmt::Display for EncryptedRecord {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", hex::encode(&self.encrypted_record[..]))
    }
}

impl ToBytes for EncryptedRecord {
    fn write<W: Write>(&self, mut writer: W) -> IoResult<()> {
        self.encrypted_record.write(&mut writer)
    }
}
