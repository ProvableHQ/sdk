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

use crate::{TransactionKernel, TransactionKernelBuilder};
use aleo_account::{Address, PrivateKey};
use aleo_network::{Network, Testnet1};
use aleo_record::Record;

use snarkvm_algorithms::CRH;
use snarkvm_dpc::testnet1::{payload::Payload, NoopProgramSNARKParameters, SystemParameters};
use snarkvm_utilities::{to_bytes, ToBytes};

use rand::SeedableRng;
use rand_chacha::ChaChaRng;
use std::str::FromStr;

#[test]
pub fn transaction_kernel_builder_test() {
    let rng = &mut ChaChaRng::seed_from_u64(1231275789u64);

    let private_key = PrivateKey::from_str("APrivateKey1tvv5YV1dipNiku2My8jMkqpqCyYKvR5Jq4y2mtjw7s77Zpn").unwrap();
    let address = Address::from(&private_key).unwrap();

    let record_string = "4f6d042c3bc73e412f4b4740ad27354a1b25bb9df93f29313350356aa88dca050080d1f008000000000000000000000000000000000000000000000000000000000000000000000000304e7ae3ef9577877ddcef8f8c5d9b5e3bf544c78c50c51213857f35c33c3502df12f0fb72a0d7c56ccd31a87dada92b00304e7ae3ef9577877ddcef8f8c5d9b5e3bf544c78c50c51213857f35c33c3502df12f0fb72a0d7c56ccd31a87dada92b003f07ea7279544031efc42c1c785f4f403146e6fdbfcae26bfaa61f2d2202fd0117df47122a693ceaf27c4ceabb3c4b619333f4663bb7e85a6e741252ba1c6e11af1e1c74edf8ae1963c3532ec6e05a07f96d6731334bc368f93b428491343004";
    let record = Record::<Testnet1>::from_str(record_string).unwrap();

    // Create noop program id
    let parameters = SystemParameters::<<Testnet1 as Network>::Components>::load().unwrap();
    let noop_program_snark_parameters =
        NoopProgramSNARKParameters::<<Testnet1 as Network>::Components>::load().unwrap();
    let noop_program_id = to_bytes![
        parameters
            .program_verification_key_crh
            .hash(&to_bytes![noop_program_snark_parameters.verification_key].unwrap())
            .unwrap()
    ]
    .unwrap();

    // Create payload: 0
    let payload = Payload::default();

    let builder = TransactionKernelBuilder::new()
        .add_input(private_key, record)
        .add_output(address, 10000, payload, noop_program_id.clone(), noop_program_id)
        .network_id(1);

    let transaction_kernel = builder.build(rng);
    assert!(transaction_kernel.is_ok());

    let transaction_kernel_string = transaction_kernel.unwrap().to_string();
    let recovered_transaction_kernel = TransactionKernel::<Testnet1>::from_str(&transaction_kernel_string);
    assert!(recovered_transaction_kernel.is_ok());
}

#[test]
pub fn transaction_kernel_test() {
    let rng = &mut ChaChaRng::seed_from_u64(1231275789u64);

    let private_key = PrivateKey::from_str("APrivateKey1tvv5YV1dipNiku2My8jMkqpqCyYKvR5Jq4y2mtjw7s77Zpn").unwrap();
    let address = Address::from(&private_key).unwrap();

    let record_string = "4f6d042c3bc73e412f4b4740ad27354a1b25bb9df93f29313350356aa88dca050080d1f008000000000000000000000000000000000000000000000000000000000000000000000000304e7ae3ef9577877ddcef8f8c5d9b5e3bf544c78c50c51213857f35c33c3502df12f0fb72a0d7c56ccd31a87dada92b00304e7ae3ef9577877ddcef8f8c5d9b5e3bf544c78c50c51213857f35c33c3502df12f0fb72a0d7c56ccd31a87dada92b003f07ea7279544031efc42c1c785f4f403146e6fdbfcae26bfaa61f2d2202fd0117df47122a693ceaf27c4ceabb3c4b619333f4663bb7e85a6e741252ba1c6e11af1e1c74edf8ae1963c3532ec6e05a07f96d6731334bc368f93b428491343004";
    let record = Record::<Testnet1>::from_str(record_string).unwrap();

    // Create noop program id
    let parameters = SystemParameters::<<Testnet1 as Network>::Components>::load().unwrap();
    let noop_program_snark_parameters =
        NoopProgramSNARKParameters::<<Testnet1 as Network>::Components>::load().unwrap();
    let noop_program_id = to_bytes![
        parameters
            .program_verification_key_crh
            .hash(&to_bytes![noop_program_snark_parameters.verification_key].unwrap())
            .unwrap()
    ]
    .unwrap();

    // Create payload: 0
    let payload = Payload::default();

    let builder = TransactionKernel::new()
        .add_input(private_key, record)
        .add_output(address, 10000, payload, noop_program_id.clone(), noop_program_id)
        .network_id(1);

    let transaction_kernel = builder.build(rng);
    assert!(transaction_kernel.is_ok());

    let offline_transaction_string = transaction_kernel.unwrap().to_string();
    let recovered_transaction_kernel = TransactionKernel::<Testnet1>::from_str(&offline_transaction_string);
    assert!(recovered_transaction_kernel.is_ok());
}
