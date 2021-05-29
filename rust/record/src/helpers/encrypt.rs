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

use crate::{Record, RecordError};

use aleo_account::ViewKey;
use rand::Rng;
use snarkvm_algorithms::EncryptionScheme;
use snarkvm_dpc::{
    base_dpc::instantiated::Components,
    DPCComponents,
    DPCRecord,
    EncryptedRecord as EncryptedRecordNative,
    RecordEncryption,
    SystemParameters,
};
use snarkvm_utilities::{to_bytes, FromBytes, ToBytes};

pub(crate) type EncryptionRandomness =
    <<Components as DPCComponents>::AccountEncryption as EncryptionScheme>::Randomness;

pub(crate) struct Encrypt;

impl Encrypt {
    /// Encrypt the given vector of records and returns tuple (encryption randomness, encrypted record).
    pub fn encrypt<R: Rng>(record: &Record, rng: &mut R) -> Result<(EncryptionRandomness, Vec<u8>), RecordError> {
        let system_parameters = SystemParameters::<Components>::load()?;

        let record: DPCRecord<Components> = FromBytes::read(&to_bytes![record]?[..])?;

        let (encryption_randomness, encrypted_record) =
            RecordEncryption::<Components>::encrypt_record(&system_parameters, &record, rng)?;

        Ok((encryption_randomness, to_bytes![encrypted_record]?))
    }
}

impl Record {
    /// Decrypt and reconstruct the encrypted record
    pub fn decrypt(view_key: &ViewKey, encrypted_record: &[u8]) -> Result<Record, RecordError> {
        let system_parameters = SystemParameters::<Components>::load()?;

        let record_native = RecordEncryption::<Components>::decrypt_record(
            &system_parameters,
            &view_key.view_key,
            &FromBytes::read(&encrypted_record[..])?,
        )?;

        let mut record_bytes = vec![];
        record_native.write(&mut record_bytes)?;

        Ok(Record::read(&record_bytes[..])?)
    }
}
