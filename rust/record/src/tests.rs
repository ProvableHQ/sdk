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
use crate::Record;

use snarkvm_algorithms::traits::CRH;
use snarkvm_dpc::testnet1::{
    instantiated::{Components, ProgramVerificationKeyCRH},
    payload::Payload,
    NoopProgramSNARKParameters,
    SystemParameters,
};
use snarkvm_utilities::{to_bytes, ToBytes};

use rand::SeedableRng;
use rand_chacha::ChaChaRng;

#[test]
fn test_build_dummy_record() {
    // Deterministically derive randomness
    let rng = &mut ChaChaRng::seed_from_u64(1231275789u64);

    // Load system parameters for the ledger, commitment schemes, CRH, and the
    // "always-accept" program.
    let system_parameters = SystemParameters::<Components>::load().unwrap();
    let program_snark_pp = NoopProgramSNARKParameters::<Components>::load().unwrap();

    let noop_program_id = to_bytes![
        ProgramVerificationKeyCRH::hash(
            &system_parameters.program_verification_key_crh,
            &to_bytes![program_snark_pp.verification_key].unwrap()
        )
        .unwrap()
    ]
    .unwrap();

    // Generate new dummy record from randomness
    let dummy_record = Record::new_dummy(rng).unwrap();

    // Check is_dummy: true
    assert!(dummy_record.is_dummy);

    // Check value: 0u64
    assert_eq!(dummy_record.value, 0u64);

    // Check payload: 0
    assert_eq!(dummy_record.payload, Payload::default());

    // Check birth_program_id: noop_program_id
    assert_eq!(dummy_record.birth_program_id, noop_program_id);

    // Check death_program_id: noop_program_id
    assert_eq!(dummy_record.death_program_id, noop_program_id);
}
