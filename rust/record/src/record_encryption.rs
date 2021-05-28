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

use crate::{DecodedRecord, Record, RecordEncoder, RecordEncryptionError, Payload};

use aleo_account::{Address, ViewKey};
use rand::Rng;
use snarkvm_algorithms::{CommitmentScheme, EncryptionScheme};
use snarkvm_dpc::{
    base_dpc::instantiated::Components,
    BaseDPCComponents,
    DPCComponents,
    EncryptedRecord as EncryptedRecordNative,
    Record as RecordInterface,
    RecordSerializerScheme,
    SystemParameters,
};
use snarkvm_utilities::{to_bytes, FromBytes, ToBytes};

pub struct EncryptedRecord(Vec<u8>);

impl EncryptedRecord {
    pub fn new(data: Vec<u8>) -> EncryptedRecord {
        EncryptedRecord(data)
    }

    pub fn from_native(
        encrypted_record_native: EncryptedRecordNative<Components>,
    ) -> Result<Self, RecordEncryptionError> {
        Ok(Self(to_bytes![encrypted_record_native]?))
    }

    pub fn to_native(&self) -> Result<EncryptedRecordNative<Components>, RecordEncryptionError> {
        let encrypted_record_native: EncryptedRecordNative<Components> = FromBytes::read(&self.0[..])?;
        Ok(encrypted_record_native)
    }
}

pub(crate) type EncryptionRandomness =
    <<Components as DPCComponents>::AccountEncryption as EncryptionScheme>::Randomness;

impl Record {
    /// Encrypt the given vector of records and returns
    /// 1. Encryption randomness.
    /// 2. Encrypted record
    pub fn encrypt<R: Rng>(
        &self,
        rng: &mut R,
    ) -> Result<(EncryptionRandomness, EncryptedRecord), RecordEncryptionError> {
        let system_parameters = SystemParameters::<Components>::load()?;

        // Serialize the record into group elements and fq_high bits
        let (serialized_record, final_fq_high_selector) = RecordEncoder::serialize(&self)?;

        let mut record_plaintexts = Vec::with_capacity(serialized_record.len());
        for element in serialized_record.iter() {
            // Construct the plaintext element from the serialized group elements
            // This value will be used in the inner circuit to validate the encryption
            let plaintext_element = <<Components as DPCComponents>::AccountEncryption as EncryptionScheme>::Text::read(
                &to_bytes![element]?[..],
            )?;
            record_plaintexts.push(plaintext_element);
        }

        // Encrypt the record plaintext
        let record_public_key = self.owner().address.into_repr();
        let encryption_randomness = system_parameters
            .account_encryption
            .generate_randomness(record_public_key, rng)?;

        let encrypted_record = <Components as DPCComponents>::AccountEncryption::encrypt(
            &system_parameters.account_encryption,
            record_public_key,
            &encryption_randomness,
            &record_plaintexts,
        )?;

        let encrypted_record_native = EncryptedRecordNative {
            encrypted_record,
            final_fq_high_selector,
        };

        let encrypted_record = EncryptedRecord::from_native(encrypted_record_native)?;

        Ok((encryption_randomness, encrypted_record))
    }

    /// Decrypt and reconstruct the encrypted record
    pub fn decrypt(view_key: &ViewKey, encrypted_record: &EncryptedRecord) -> Result<Record, RecordEncryptionError> {
        let system_parameters = SystemParameters::<Components>::load()?;
        let encrypted_record = encrypted_record.to_native()?;

        // Decrypt the encrypted record
        let plaintext_elements = <Components as DPCComponents>::AccountEncryption::decrypt(
            &system_parameters.account_encryption,
            &view_key.view_key.decryption_key,
            &encrypted_record.encrypted_record,
        )?;

        let mut plaintext = Vec::with_capacity(plaintext_elements.len());
        for element in plaintext_elements {
            let plaintext_element = <Components as BaseDPCComponents>::EncryptionGroup::read(&to_bytes![element]?[..])?;

            plaintext.push(plaintext_element);
        }

        // Decode the plaintext record
        let record_components = RecordEncoder::deserialize(plaintext, encrypted_record.final_fq_high_selector)?;

        let DecodedRecord {
            serial_number_nonce,
            commitment_randomness,
            birth_program_id,
            death_program_id,
            payload,
            value,
        } = record_components;

        // Construct the record account address

        let owner = Address::from_view_key(&view_key)?;

        // Determine if the record is dummy record

        // TODO (raychu86) Establish `is_dummy` flag properly by checking that the value is 0 and the programs are equivalent to a global dummy
        let dummy_program = birth_program_id.clone();

        let is_dummy = (value == 0)
            && (payload == Payload::default())
            && (death_program_id == dummy_program)
            && (birth_program_id == dummy_program);

        // Calculate record commitment

        let commitment_input = to_bytes![
            owner.to_bytes(),
            is_dummy,
            value,
            payload,
            birth_program_id,
            death_program_id,
            serial_number_nonce
        ]?;

        let commitment = <Components as DPCComponents>::RecordCommitment::commit(
            &system_parameters.record_commitment,
            &commitment_input,
            &commitment_randomness,
        )?;

        Ok(Record {
            owner,
            is_dummy,
            value,
            payload,
            birth_program_id,
            death_program_id,
            serial_number_nonce,
            commitment,
            commitment_randomness,
        })
    }
}

impl From<String> for EncryptedRecord {
    fn from(_data: String) -> EncryptedRecord {
        unimplemented!()
    }
}

impl From<&String> for EncryptedRecord {
    fn from(_data: &String) -> EncryptedRecord {
        unimplemented!()
    }
}
