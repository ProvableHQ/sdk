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

use snarkvm_algorithms::CRH;
use snarkvm_dpc::{
    account::{AccountAddress, AccountPrivateKey},
    base_dpc::{
        instantiated::{Components, InstantiatedDPC},
        record::DPCRecord,
    },
    record_payload::RecordPayload,
    PublicParameters,
};
use snarkvm_utilities::{to_bytes, ToBytes};

use rand::{Rng, SeedableRng};

pub fn create_record<R: Rng>(rng: &mut R) -> anyhow::Result<DPCRecord<Components>> {
    let parameters = PublicParameters::<Components>::load(false).unwrap();

    let spender = AccountPrivateKey::<Components>::new(
        &parameters.system_parameters.account_signature,
        &parameters.system_parameters.account_commitment,
        rng,
    )?;

    let sn_randomness: [u8; 32] = rng.gen();
    let old_sn_nonce = parameters.system_parameters.serial_number_nonce.hash(&sn_randomness)?;

    let noop_program_id = to_bytes![
        parameters
            .system_parameters
            .program_verification_key_crh
            .hash(&to_bytes![parameters.noop_program_snark_parameters.verification_key]?)?
    ]?;

    let address = AccountAddress::<Components>::from_private_key(
        parameters.account_signature_parameters(),
        parameters.account_commitment_parameters(),
        parameters.account_encryption_parameters(),
        &spender,
    )?;

    let record = InstantiatedDPC::generate_record(
        &parameters.system_parameters,
        old_sn_nonce,
        address,
        true,
        0,
        RecordPayload::default(),
        noop_program_id.clone(),
        noop_program_id.clone(),
        rng,
    )?;

    Ok(record)
}

#[test]
fn test_create_record() {
    use rand_xorshift::XorShiftRng;

    let mut rng = XorShiftRng::seed_from_u64(1231275789u64);

    let record = create_record(&mut rng).unwrap();

    println!("done");
}
