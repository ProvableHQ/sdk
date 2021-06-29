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
use crate::{EmptyLedger, Transaction, TransactionKernel};
use aleo_account::{Address, PrivateKey};
use aleo_network::{Network, Testnet1};
use aleo_record::Record;

use snarkvm_algorithms::{MerkleParameters, CRH};
use snarkvm_dpc::{
    testnet1::{
        record::payload::Payload,
        BaseDPCComponents,
        NoopProgram,
        PublicParameters,
        Transaction as DPCTransaction,
        DPC,
    },
    AccountAddress as DPCAddress,
    AccountPrivateKey as DPCPrivateKey,
    DPCComponents,
    DPCScheme,
    LedgerScheme,
    ProgramScheme,
    RecordScheme,
};
use snarkvm_parameters::{testnet1::GenesisBlock, Genesis, LedgerMerkleTreeParameters, Parameter};
use snarkvm_utilities::{to_bytes, FromBytes, ToBytes};

use rand::{Rng, SeedableRng};
use rand_chacha::ChaChaRng;
use std::{str::FromStr, sync::Arc};

type L = EmptyLedger<
    DPCTransaction<<Testnet1 as Network>::Components>,
    <<Testnet1 as Network>::Components as BaseDPCComponents>::MerkleParameters,
>;

#[test]
fn test_transaction_from_str() {
    let transaction_string = "d4250898482e32a1fefeb313cbefaa7dcc25d00645ab6571d6d4327bdb9f420c8f533e6878db495cf48a3fd369b5c252841649bf2c7af24f12db71def8bc4b815326430827df133cbeb7327186bdd61aef3bca2a2909ab26dc37240ea0095c01d5f2dfdf9584ebc8d12ae172a24dd988fec718b48129040813764dbc2fb4ff0832031b17412d02b96dbf7af844f38b935ff1f7697e7359a4ef5c29aab90d903c09ad79ed197ab2323f62d50f616a2e62b0ff598ad1fd32932e15e7853213b20184f313ea49db0e697c0c17e590a818a35d218bf710c984008d1c1d02834b124ef839763d51350b5bc4e950baa790a3001bbec654e49be23da1f8bd45cc6fbb0f546b6076c570285ae724ee248009b0291864be4169076c62ccc63b914405b85be61d50da3200a38af92e9fe01a9addeef7adc183983fdf1d801f3d52e31144b1b6561248e570dbee55c0604e82c4d1009eb0ed7564623b9b87441a5b58c746277ff137b0564e3743ce073e4ed9c96a76aa6a53942adda2f91a2e7f7dc85e03838f194e7836bfc0e163b0b8ab0050beec4a3b99b442269ad77bccd01925918950a9bbc6424ce7d2bbb4f138648f141e01f0b815031b5bbca206fc0c30b687318b2fc5d80135b2b0a164cc8496a6cc3e5735fd422f9b3ab71e3ecbc21718028260293682ed310d2ef2fde95c1e297f6d90fe45da6aa44990ea17ef5c8be26047e0a9991745df9192b9033bcf3d13dcbe0001aa1a8a2df69ff4bb91f54c9e64cb65ae4bff7f2ecda0cdaa49b937eb54f5afd0ae9f938eb42d91b23f5af14689792d5ac703317b773f1199452dba5a2845780d000000000000000001f3ebc62d392930dc1cfc1998ddcad33e4f7847339578f4462d525e5f0d81a003687edb34d9d2ee7255c30e31ffb33a38e149be22fa3dbef328a0501bd2577203abc7b01e70eb1af7bbb00b517d805867962d97feb9c478cb669d0f0241ed15031f505998d21b5cf0fd10d555e220d52db6ec2eba9c47cd5c3ef8277c93bb6c0408b4ea012a5fdcf4105d7af11d146a4a8c03e8b65778c7b719c3ede5a988c3731060b94ae317025724d0f281a7fff3082b48e14e46135225e267f226ae91fa3c0b6da225f9e39975e4db859956279e1faa41225790bc1fe86c31955c94c979c80c8820e2cf7b0d6315901a96136d3c75e12bfc40e959671258ce764026a520ea0d73482bcaf00d523fb5cf18076f14aadd667a01f36afaa2c5246496f4f5ba6612c942774ade4a1f0362d84dc771652cf3e20e55e9a38e69fb31ed7d62421ba6112dd08c04ea5ee528cce772a599b4d2a0609c907cd02eb9748c308a4c7378db06186bcc0c0dc821f6bbd1c0402ee6eb41b30881cc520580e2de25a23b13024111c300086885b5b56c4f1c6265cf13682e70e0b365e36fe7b7db946bfb1b838fe986ce0f810af771d7bb08f8067124d90ccbde0de1e7a7a29da14068e19f340974f4bd05eaac7c78fae56593906ed0d9c6ef03bb40fff89c89d932d177bfae6784064f0ef5ce5a835efdcea7b193c3cbfaa4cc9994859bb9a7b21446056323a179509b0b538445dfeb307bbe2d4961c6e7e14277bbd1012e452edc2314c6d60fbbeb3502e92a465f6751fa7eb4bc2149c24edc49fa854394a42c663d3557f280e5401e0bea0a3d6a5fb8689f92d56fda34238a12cd1ca695faf66f361ceb31969fdbed0a988ed2c3058f81db19bb40f5f074f939e31481fc0e610b0938210b3f52f80300ba00";
    let transaction = Transaction::<Testnet1>::from_str(transaction_string);
    assert!(transaction.is_ok());

    let candidate_transaction = transaction.unwrap().to_string();
    assert_eq!(transaction_string, candidate_transaction);
}

#[test]
fn test_build_transaction() {
    let mut rng = ChaChaRng::seed_from_u64(1231275789u64);

    // Load public parameters
    let parameters = PublicParameters::<<Testnet1 as Network>::Components>::load(false).unwrap();

    // Create dummy spender
    let dpc_spender = DPCPrivateKey::<<Testnet1 as Network>::Components>::new(
        &parameters.system_parameters.account_signature,
        &parameters.system_parameters.account_commitment,
        &mut rng,
    )
    .unwrap();

    let spender = PrivateKey::from_str(&dpc_spender.to_string()).unwrap();

    // Create dummy input record

    let sn_randomness: [u8; 32] = rng.gen();
    let old_sn_nonce = parameters
        .system_parameters
        .serial_number_nonce
        .hash(&sn_randomness)
        .unwrap();

    let dpc_address = DPCAddress::<<Testnet1 as Network>::Components>::from_private_key(
        parameters.account_signature_parameters(),
        parameters.account_commitment_parameters(),
        parameters.account_encryption_parameters(),
        &dpc_spender,
    )
    .unwrap();

    let noop_program_id = to_bytes![
        parameters
            .system_parameters
            .program_verification_key_crh
            .hash(&to_bytes![parameters.noop_program_snark_parameters.verification_key].unwrap())
            .unwrap()
    ]
    .unwrap();

    let dummy_record = DPC::<<Testnet1 as Network>::Components>::generate_record(
        &parameters.system_parameters,
        old_sn_nonce,
        dpc_address,
        true,
        0,
        Payload::default(),
        noop_program_id.clone(),
        noop_program_id.clone(),
        &mut rng,
    )
    .unwrap();
    let record = Record::<Testnet1> { record: dummy_record };

    // Create dummy recipient
    let new_recipient_private_key = PrivateKey::new(&mut rng).unwrap();
    let new_recipient = Address::from(&new_recipient_private_key).unwrap();

    // Create dummy amount
    let amount = 0;

    // Create payload: 0
    let payload = Payload::default();

    // Build transaction_kernel
    let transaction_kernel = TransactionKernel::new()
        .add_input(spender, record)
        .add_output(new_recipient, amount, payload, noop_program_id.clone(), noop_program_id)
        .build(&mut rng)
        .unwrap();

    // Delegate online phase of transaction generation
    let random_path: u16 = rng.gen();

    let mut path = std::env::current_dir().unwrap();
    path.push(format!("storage_db_{}", random_path));

    let local_data = transaction_kernel.into_local_data();

    // Enforce that the record programs are the noop program DUMMY ONLY.

    let noop_program_id = to_bytes![
        parameters
            .system_parameters
            .program_verification_key_crh
            .hash(&to_bytes![parameters.noop_program_snark_parameters.verification_key].unwrap())
            .unwrap()
    ]
    .unwrap();

    for old_record in &local_data.old_records {
        assert_eq!(old_record.death_program_id().to_vec(), noop_program_id);
    }

    for new_record in &local_data.new_records {
        assert_eq!(new_record.birth_program_id().to_vec(), noop_program_id);
    }

    // Generate the program proofs

    let noop_program =
        NoopProgram::<_, <<Testnet1 as Network>::Components as BaseDPCComponents>::NoopProgramSNARK>::new(
            noop_program_id,
        );

    let mut old_death_program_proofs = Vec::new();
    for i in 0..<<Testnet1 as Network>::Components as DPCComponents>::NUM_INPUT_RECORDS {
        let private_input = noop_program
            .execute(
                &parameters.noop_program_snark_parameters.proving_key,
                &parameters.noop_program_snark_parameters.verification_key,
                &local_data,
                i as u8,
                &mut rng,
            )
            .unwrap();

        old_death_program_proofs.push(private_input);
    }

    let mut new_birth_program_proofs = Vec::new();
    for j in 0..<<Testnet1 as Network>::Components as DPCComponents>::NUM_OUTPUT_RECORDS {
        let private_input = noop_program
            .execute(
                &parameters.noop_program_snark_parameters.proving_key,
                &parameters.noop_program_snark_parameters.verification_key,
                &local_data,
                (<<Testnet1 as Network>::Components as DPCComponents>::NUM_INPUT_RECORDS + j) as u8,
                &mut rng,
            )
            .unwrap();

        new_birth_program_proofs.push(private_input);
    }

    // Load ledger parameters from snarkvm-parameters
    let crh_parameters =
        <<<<Testnet1 as Network>::Components as BaseDPCComponents>::MerkleParameters as MerkleParameters>::H as CRH>::Parameters::read(&LedgerMerkleTreeParameters::load_bytes().unwrap()[..]).unwrap();
    let merkle_tree_hash_parameters =
        <<<Testnet1 as Network>::Components as BaseDPCComponents>::MerkleParameters as MerkleParameters>::H::from(
            crh_parameters,
        );
    let ledger_parameters = Arc::new(From::from(merkle_tree_hash_parameters));

    // Load genesis block
    let genesis_block = FromBytes::read(GenesisBlock::load_bytes().as_slice()).unwrap();

    // Use empty ledger to generate transaction kernel DUMMY ONLY.
    let ledger = L::new(Some(&path), ledger_parameters, genesis_block).unwrap();

    let transaction = Transaction::<Testnet1>::new()
        .transaction_kernel(transaction_kernel)
        .add_old_death_program_proofs(old_death_program_proofs)
        .add_new_birth_program_proofs(new_birth_program_proofs)
        .build(&ledger, &mut rng)
        .unwrap();

    // Verify transaction
    assert!(DPC::<<Testnet1 as Network>::Components>::verify(&parameters, &transaction.0, &ledger).unwrap());

    drop(ledger);
}
