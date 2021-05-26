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

use crate::{CommitmentRandomness, Record, RecordPayload, RecordSerializerError, SerialNumberNonce};

use snarkvm_curves::edwards_sw6::{EdwardsParameters, EdwardsProjective as EdwardsBls};
use snarkvm_dpc::{base_dpc::instantiated::Components, RecordSerializer as RecordSerializerNative};

pub struct SerializedRecord {
    data: Vec<EdwardsBls>,
    final_sign_high: bool,
}

pub struct DeserializedRecord {
    pub serial_number_nonce: SerialNumberNonce,
    pub commitment_randomness: CommitmentRandomness,
    pub birth_program_id: Vec<u8>,
    pub death_program_id: Vec<u8>,
    pub payload: RecordPayload,
    pub value: u64,
}

pub(crate) type RecordSerializer = RecordSerializerNative<Components, EdwardsParameters, EdwardsBls>;

/// Records are serialized in a specialized format to be space-saving.
///
/// Serialized element 1 - [ Serial number nonce ]
/// Serialized element 2 - [ Commitment randomness ]
/// Serialized element 3 - [ Birth program id (part 1) ]
/// Serialized element 4 - [ Death program id (part 1) ]
/// Serialized element 5 - [ Birth program id (part 2) || Death program id (part 2) ]
/// Serialized element 6 - [ Payload (part 1) || 1 ]
/// Serialized element 7 - [ 1 || Sign high bits (7 bits) || Value || Payload (part 2) ]
///
pub fn serialize_record(record: Record) -> Result<SerializedRecord, RecordSerializerError> {
    unimplemented!()
}

/// Deserialize and return the record components
pub fn deserialize_record(serialized_record: SerializedRecord) -> Result<DeserializedRecord, RecordSerializerError> {
    unimplemented!()
}
