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
pub fn test_transaction_kernel_from_str() {
    let transaction_kernel_string = "1148772ca2292978d0014d34f3addf24b762279c45ea9ff175f53eac884d9251e0631148772ca2292978d0014d34f3addf24b762279c45ea9ff175f53eac884d9251e0634f6d042c3bc73e412f4b4740ad27354a1b25bb9df93f29313350356aa88dca050080d1f008000000000000000000000000000000000000000000000000000000000000000000000000304e7ae3ef9577877ddcef8f8c5d9b5e3bf544c78c50c51213857f35c33c3502df12f0fb72a0d7c56ccd31a87dada92b00304e7ae3ef9577877ddcef8f8c5d9b5e3bf544c78c50c51213857f35c33c3502df12f0fb72a0d7c56ccd31a87dada92b003f07ea7279544031efc42c1c785f4f403146e6fdbfcae26bfaa61f2d2202fd0117df47122a693ceaf27c4ceabb3c4b619333f4663bb7e85a6e741252ba1c6e11af1e1c74edf8ae1963c3532ec6e05a07f96d6731334bc368f93b4284913430044f6d042c3bc73e412f4b4740ad27354a1b25bb9df93f29313350356aa88dca050100000000000000000000000000000000000000000000000000000000000000000000000000000000304e7ae3ef9577877ddcef8f8c5d9b5e3bf544c78c50c51213857f35c33c3502df12f0fb72a0d7c56ccd31a87dada92b00304e7ae3ef9577877ddcef8f8c5d9b5e3bf544c78c50c51213857f35c33c3502df12f0fb72a0d7c56ccd31a87dada92b00ee116128d006df840d6649fda0890ef81cb664781e6b7c73a235477e245b4b0f2882f371db8c58eb1627942f6ee91d8f9c9a1485d41c544fa67ec0649d3b8d0898049eacbe667c0d3d11ee085a1a9d5ad8ee40fadeff8fd68ab37cb2b4c532002e1e8d72315202bf93f4f141c4afe16edeaded2952a118060af802c3d2c0c20460a8f01ff49f58b3d9e8821020b281fb38e5344ddd54838e38eb48828c2c1c01335c1a538ee51cb9bc73ac2d4dd839e1e96edc2b89fe93997991f49ce99435062e296b07f2db9dd947ef4c472c5da2a70909b4e736838a0ba6f72bad5659ff0820c7706e87b98e0ec46fb7928f1af9bb554308900b3159e396aed9a30a8f24738720a442edb06a74e1610e0ede49778d3f2e0ffdcf4ff55340bd93222488307ca4684f6d042c3bc73e412f4b4740ad27354a1b25bb9df93f29313350356aa88dca050010270000000000000000000000000000000000000000000000000000000000000000000000000000304e7ae3ef9577877ddcef8f8c5d9b5e3bf544c78c50c51213857f35c33c3502df12f0fb72a0d7c56ccd31a87dada92b00304e7ae3ef9577877ddcef8f8c5d9b5e3bf544c78c50c51213857f35c33c3502df12f0fb72a0d7c56ccd31a87dada92b0088bdbc107b0f0a889266f410941390b9d3fad7cab1a636f48308a14b0fd06e0de830b5b91f3aef48cc095cb2fe11f54b1a72953f92e3f2a78b6bcbfea5134609a1b9e9996d3ae4dcfd6b3cc692bc93e233bdd8a9691ae092735e4a7e08bbef034f6d042c3bc73e412f4b4740ad27354a1b25bb9df93f29313350356aa88dca050100000000000000000000000000000000000000000000000000000000000000000000000000000000304e7ae3ef9577877ddcef8f8c5d9b5e3bf544c78c50c51213857f35c33c3502df12f0fb72a0d7c56ccd31a87dada92b00304e7ae3ef9577877ddcef8f8c5d9b5e3bf544c78c50c51213857f35c33c3502df12f0fb72a0d7c56ccd31a87dada92b00547e1ca3dcc570723bde952e359936fb006d6fc0984fd7b75751008123d4be035994b0b972ff52f208556bf4a1a36d73167331da845831925dfa53728a20e603d12f0e66ef7e1d4a0d6753f1a3f9adef62caae16d84db04497e8b944e69c5603fe8442371e2ef64e187723ee09edb4225878a0b02d10d52ff613ac5777d75088c2fd4d46a57765d27f13bccdf225902ea0cabb972513b99fd90f72369032bab7e830b5b91f3aef48cc095cb2fe11f54b1a72953f92e3f2a78b6bcbfea51346095994b0b972ff52f208556bf4a1a36d73167331da845831925dfa53728a20e603388bb297d21ed2f52275fccfe53b343c399d4bab9a486ae8f79f18fe37cd8a019a15d61372578ba2dd1db96899a77e7425e885579047a31cc7a72a643a00980108cd910dd065f4dc4b100d4dc2f1ed6058b1d2c5ab99bf04d0817964bbc736f7094e70236fccce96689ccaa2155cda524783d2d24b30fc8382c88323e9f7c67806776d067fa7e05ff25dbf0cb21b8ea25223a75b0946952f4f92acb4b8e85a7d0af92c055f0bbbb464583e0e9fba30bf05896bc71b61b82bd6bee6638a6cff1801eb9358098401f0adedb3794458d89fc8007d4a0cd2ca93775764c66b9967230f2c15aa119c52f4dce95de08a71e661e32ce071174ae55524d9b4475c914e180f67cb829f32e06c4c8ffe1afed7777c1df652bbd2ffe53f0e4c8af6e63d2c570e615b0c14f28b203e03e5cbf6f707edf601523f4e213ffcaed52d3f0f1c2819047f0008171a29032c85473731080e8ee1b378dba227773450223c14c835a12766377b0912fc42673d64a0c6e903b0c39619f124e8fa47cda38f584c2e90f88aa4f77d0066bffdb4c5698b32276ff48f2b8df5949fcd4f754ca489758a85b9c1196e660faac05ab2e2a675c39ae5cee77df2cdbf87baca0c0cffdf34ec4e24cb664cf905ade4d51c336021e8bea1c82f4b8dd87b91ae98252ccf0402fc9b85bece56f600218d224b9a9509a63e10bfabe01514de4d2f29636196cca71ebd647a66c1c60557c653230f20ccc57663b606c9b7dc303367fc64925c0c1f3fbd4ff1b8215200d9591ee7194a14c9a6a240efd4b3497dcdbfa3b6d1d516d3ee76e1f6dbfc9c053200db78cb2e6418189b5ecaa744179f892367422e19302e0c0b62955b955538b20e2ec527ce3af56f37c7058f1d8b1d355c40e814d1995c79aef25dcf108dbfbb11749a2a0617d56e4a0a1c3926632099893feae926ad3403649342357b4450df52855a4368b1c4d83a832f9123fb9c0287e05a50cb6b5595f3b2dcda5901ab7e607c15875dba848e27fcaf1490cffd3e5c7a46407e31c991001618a72b671c4e05bb872b8e72688bbb20b378077bdf77c84dda1015619a8d3f69b142a84b85e005e7fe3e858dcbb4e2315591aa074f7fbd4c7f5df789fd74ecb3e6e694ab953812125acd7488133b90ba0a099ec3fb643c312181c6f77cd9dc3e1f4f67bf6e11086cf6d344fbee8ffe4da6e7f18fc7ed6f32a9d678314fcdfbd673bb9aeed156067aa7ddafcf3cc62bdf03cf3eb4ff688c72b84f48da08b1c4c6440cd3e383510d060fa60eb4fe6b36e8c0b247d872f1c6b2d74b4957262729715c5d067b0bb30d7186698d8e43690e596379fdbeebae79189517c8365043b77c60b31556c03a014e461da861391df0bf80dcdc0390aa47b5b7a594f70f6a2d6a9f36d67c19c8034c725d05d94cbbaebaaaca9da76c4ccaa7713b57d40d96988d0394a5baa5c001efd2250d331acde4b6a888694a4c36090586185a78b06d4f31b4c4838725830470aaf00800000000e86b84f47915e3706208acb36ff57f3c593b50a2f3cc614f1bffe9ac97acb5eb01";
    let transaction_kernel = TransactionKernel::<Testnet1>::from_str(transaction_kernel_string);
    assert!(transaction_kernel.is_ok());

    let candidate_transaction_kernel = transaction_kernel.unwrap().to_string();
    assert_eq!(transaction_kernel_string, candidate_transaction_kernel);
}

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
        .add_output(address, 10000, payload, noop_program_id.clone(), noop_program_id);

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

    let builder = TransactionKernel::new().add_input(private_key, record).add_output(
        address,
        10000,
        payload,
        noop_program_id.clone(),
        noop_program_id,
    );

    let transaction_kernel = builder.build(rng);
    assert!(transaction_kernel.is_ok());

    let offline_transaction_string = transaction_kernel.unwrap().to_string();
    let recovered_transaction_kernel = TransactionKernel::<Testnet1>::from_str(&offline_transaction_string);
    assert!(recovered_transaction_kernel.is_ok());
}
