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

use crate::RecordError;
use aleo_account::{Address, PrivateKey};
use snarkvm_algorithms::CRH;
use snarkvm_dpc::{
    base_dpc::{
        instantiated::{Components, InstantiatedDPC},
        record::DPCRecord,
    },
    record_payload::RecordPayload,
    PublicParameters,
};
use snarkvm_utilities::{to_bytes, ToBytes};

use rand::{CryptoRng, Rng};

/// Returns a dummy record
pub fn create_dummy_record<R: Rng + CryptoRng>(rng: &mut R) -> Result<DPCRecord<Components>, RecordError> {
    let parameters = PublicParameters::<Components>::load(true)?;

    let spender = PrivateKey::new(rng)?;

    let sn_randomness: [u8; 32] = rng.gen();
    let old_sn_nonce = parameters
        .system_parameters
        .serial_number_nonce
        .hash(&sn_randomness)
        .unwrap();

    let noop_program_id = to_bytes![
        parameters
            .system_parameters
            .program_verification_key_crh
            .hash(&to_bytes![parameters.noop_program_snark_parameters.verification_key]?)
            .unwrap()
    ]
    .unwrap();

    let address = Address::from(&spender)?;

    let dummy_record = InstantiatedDPC::generate_record(
        &parameters.system_parameters,
        old_sn_nonce,
        address.address,
        true,
        0,
        RecordPayload::default(),
        noop_program_id.clone(),
        noop_program_id.clone(),
        rng,
    )?;

    Ok(dummy_record)
}
