// Copyright (C) 2019-2023 Aleo Systems Inc.
// This file is part of the Aleo SDK library.

// The Aleo SDK library is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// The Aleo SDK library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with the Aleo SDK library. If not, see <https://www.gnu.org/licenses/>.

use crate::{AleoAPIClient, ProgramManager, RecordFinder, TransferType};
use snarkvm::file::Manifest;
use snarkvm_console::{
    account::{PrivateKey, ViewKey},
    network::Testnet3,
    program::{Plaintext, Record},
};

use anyhow::Result;
use snarkvm::synthesizer::Program;
use std::{fs, fs::File, io::Write, ops::Add, panic::catch_unwind, path::PathBuf, str::FromStr, thread::sleep};

pub const RECIPIENT_PRIVATE_KEY: &str = "APrivateKey1zkp3dQx4WASWYQVWKkq14v3RoQDfY2kbLssUj7iifi1VUQ6";
pub const RECIPIENT_ADDRESS: &str = "aleo184vuwr5u7u0ha5f5k44067dd2uaqewxx6pe5ltha5pv99wvhfqxqv339h4";
pub const BEACON_PRIVATE_KEY: &str = "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH";

pub const IMPORT_PROGRAM: &str = "
import credits.aleo;
program aleo_test.aleo;

function test:
    input r0 as u32.public;
    input r1 as u32.private;
    add r0 r1 into r2;
    output r2 as u32.private;
";

pub const FINALIZE_TEST_PROGRAM: &str = "program finalize_test.aleo;

mapping monotonic_counter:
    // Counter key
    key id as u32.public;
    // Counter value
    value counter as u32.public;

function increase_counter:
    // Counter index
    input r0 as u32.public;
    // Value to increment by
    input r1 as u32.public;
    finalize r0 r1;

finalize increase_counter:
    // Counter index
    input r0 as u32.public;
    // Value to increment by
    input r1 as u32.public;
    // Get or initialize counter key
    get.or_use monotonic_counter[r0] 0u32 into r2;
    // Add r1 to into the existing counter value
    add r1 r2 into r3;
    // Set r3 into account[r0];
    set r3 into monotonic_counter[r0];
";

pub const CREDITS_IMPORT_TEST_PROGRAM: &str = "import credits.aleo;
program credits_import_test.aleo;

function test:
    input r0 as u32.public;
    input r1 as u32.private;
    add r0 r1 into r2;
    output r2 as u32.private;
";

pub const HELLO_PROGRAM: &str = "program hello.aleo;

function hello:
    input r0 as u32.public;
    input r1 as u32.private;
    add r0 r1 into r2;
    output r2 as u32.private;
";

pub const HELLO_PROGRAM_2: &str = "program hello.aleo;

function hello:
    input r0 as u32.public;
    input r1 as u32.private;
    mul r0 r1 into r2;
    output r2 as u32.private;
";

pub const GENERIC_PROGRAM_BODY: &str = "

function fabulous:
    input r0 as u32.public;
    input r1 as u32.private;
    add r0 r1 into r2;
    output r2 as u32.private;
";

pub const RECORD_2000000001_MICROCREDITS: &str = r"{
  owner: aleo1j7qxyunfldj2lp8hsvy7mw5k8zaqgjfyr72x2gh3x4ewgae8v5gscf5jh3.private,
  microcredits: 2000000001u64.private,
  _nonce: 440655410641037118713377218645355605135385337348439127168929531052605977026group.public
}";

pub const RECORD_5_MICROCREDITS: &str = r"{
  owner: aleo1j7qxyunfldj2lp8hsvy7mw5k8zaqgjfyr72x2gh3x4ewgae8v5gscf5jh3.private,
  microcredits: 5u64.private,
  _nonce: 3700202890700295811197086261814785945731964545546334348117582517467189701159group.public
}";

/// Get a random program id
pub fn random_program_id(len: usize) -> String {
    use rand::Rng;
    const CHARSET: &[u8] = b"abcdefghijklmnopqrstuvwxyz";
    let mut rng = rand::thread_rng();

    let program: String = (0..len)
        .map(|_| {
            let idx = rng.gen_range(0..CHARSET.len());
            CHARSET[idx] as char
        })
        .collect();
    program.add(".aleo")
}

/// Get a random program
pub fn random_program() -> Program<Testnet3> {
    let random_program = String::from("program ").add(&random_program_id(15)).add(";").add(GENERIC_PROGRAM_BODY);
    Program::<Testnet3>::from_str(&random_program).unwrap()
}

/// Create temp directory with test data
pub fn setup_directory(directory_name: &str, main_program: &str, imports: Vec<(&str, &str)>) -> Result<PathBuf> {
    // Crate a temporary directory for the test.
    let directory = std::env::temp_dir().join(directory_name);

    catch_unwind(|| {
        let _ = &directory.exists().then(|| fs::remove_dir_all(&directory).unwrap());
        fs::create_dir(&directory).unwrap();

        let imports_directory = directory.join("imports");
        fs::create_dir(directory.join("imports")).unwrap();
        let program = Program::<Testnet3>::from_str(main_program).unwrap();
        let program_id = program.id();

        // Create the manifest file.
        Manifest::create(&directory, program_id).unwrap();

        let mut main = File::create(directory.join("main.aleo")).unwrap();
        main.write_all(main_program.as_bytes()).unwrap();

        imports.into_iter().for_each(|(name, program)| {
            let mut file = File::create(imports_directory.join(name)).unwrap();
            file.write_all(program.as_bytes()).unwrap();
        });
    })
    .map_err(|_| anyhow::anyhow!("Failed to create test directory"))?;
    Ok(directory)
}

/// Teardown temp directory
pub fn teardown_directory(directory: &PathBuf) {
    if directory.exists() {
        fs::remove_dir_all(directory).unwrap();
    }
}

/// Make transfers to the test account and return the records
///
/// This function assumes that a local snarkos beacon node is running on the specified port
pub fn transfer_to_test_account(
    amount: u64,
    num_transactions: usize,
    recipient_private_key: PrivateKey<Testnet3>,
    port: &str,
) -> Result<Vec<Record<Testnet3, Plaintext<Testnet3>>>> {
    let api_client = AleoAPIClient::<Testnet3>::local_testnet3(port);
    let beacon_private_key = PrivateKey::<Testnet3>::from_str(BEACON_PRIVATE_KEY)?;

    let recipient_view_key = ViewKey::<Testnet3>::try_from(&recipient_private_key)?;
    let recipient_address = recipient_view_key.to_address();

    let record_finder = RecordFinder::<Testnet3>::new(api_client.clone());

    let program_manager =
        ProgramManager::<Testnet3>::new(Some(beacon_private_key), None, Some(api_client), None).unwrap();

    let fee = 500_000;
    let mut transfer_successes = 0;
    let mut retries = 0;
    loop {
        let input_record = record_finder.find_amount_and_fee_records(amount, fee, &beacon_private_key);
        if input_record.is_err() {
            println!("No records found, retrying");
            retries += 1;
            sleep(std::time::Duration::from_secs(3));
            continue;
        }
        let (input_record, fee_record) = input_record.unwrap();
        let result = program_manager.transfer(
            amount,
            500_000,
            recipient_address,
            TransferType::Private,
            None,
            Some(input_record),
            fee_record,
        );
        if result.is_ok() {
            println!("Transfer succeeded");
            transfer_successes += 1;
        } else {
            println!("Transfer failed with error {:?}, retrying", result);
            retries += 1;
        }
        if transfer_successes > num_transactions {
            println!("{} transfers succeeded exiting", transfer_successes);
            break;
        }
        if retries > 15 {
            println!("exceeded 15 retries, exiting with found records");
            break;
        }
        sleep(std::time::Duration::from_secs(3));
    }

    let client = program_manager.api_client()?;
    let latest_height = client.latest_height()?;
    let records = client.get_unspent_records(&recipient_private_key, 0..latest_height, None, None)?;
    Ok(records.into_iter().map(|(_cm, record)| record).collect())
}
