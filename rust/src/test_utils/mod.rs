// Copyright (C) 2019-2023 Aleo Systems Inc.
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

use anyhow::Result;
use snarkvm::file::Manifest;
use snarkvm_console::{network::Testnet3, program::ProgramID};

use crate::{AleoAPIClient, AleoNetworkResolver, NetworkConfig, ProgramManager};
use snarkvm_console::{
    account::{Address, PrivateKey, ViewKey},
    program::{Plaintext, Record},
};
use std::{fs, fs::File, io::Write, ops::Add, panic::catch_unwind, path::PathBuf, str::FromStr, thread::sleep};

pub const RECIPIENT_PRIVATE_KEY: &str = "APrivateKey1zkp3dQx4WASWYQVWKkq14v3RoQDfY2kbLssUj7iifi1VUQ6";
pub const BEACON_PRIVATE_KEY: &str = "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH";

pub const ALEO_PROGRAM: &str = "import hello.aleo;
import credits.aleo;
program aleo_test.aleo;

function test:
    input r0 as u32.public;
    input r1 as u32.private;
    add r0 r1 into r2;
    output r2 as u32.private;
";

pub const HELLO_PROGRAM: &str = "program hello.aleo;

function main:
    input r0 as u32.public;
    input r1 as u32.private;
    add r0 r1 into r2;
    output r2 as u32.private;
";

pub fn random_string(len: usize) -> String {
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

// Create temp directory with test data
pub fn setup_directory(name: &str, main_program: &str, imports: Vec<(&str, &str)>) -> Result<PathBuf> {
    // Crate a temporary directory for the test.
    let directory = std::env::temp_dir().join(name);
    println!("Directory: {}", directory.display());

    catch_unwind(|| {
        let _ = &directory.exists().then(|| fs::remove_dir_all(&directory).unwrap());
        fs::create_dir(&directory).unwrap();

        let imports_directory = directory.join("imports");
        fs::create_dir(directory.join("imports")).unwrap();
        let program_id = ProgramID::<Testnet3>::from_str(&format!("{}.aleo", "aleo_test")).unwrap();

        // Create the manifest file.
        Manifest::create(&directory, &program_id).unwrap();

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
/// This function assumes that a local snarkos beacon node is running on port 3030
pub fn transfer_to_test_account(
    amount: u64,
    num_transactions: usize,
    recipient_private_key: PrivateKey<Testnet3>,
    port: &str,
) -> Result<Vec<Record<Testnet3, Plaintext<Testnet3>>>> {
    let network_config = NetworkConfig::local_testnet3(port);
    let beacon_private_key = PrivateKey::<Testnet3>::from_str(BEACON_PRIVATE_KEY)?;

    let recipient_view_key = ViewKey::<Testnet3>::try_from(&recipient_private_key)?;
    let recipient_address = recipient_view_key.to_address();

    let mut program_manager =
        ProgramManager::<Testnet3, AleoNetworkResolver<Testnet3>>::program_manager_with_network_resolution(
            Some(beacon_private_key),
            None,
            network_config,
        )?;

    let mut transfer_successes = 0;
    let mut retries = 0;
    loop {
        let result = program_manager.transfer(amount, 100000, recipient_address, None);
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
        if retries > 10 {
            println!("exceeded 10 retries, exiting with found records");
            break;
        }
        sleep(std::time::Duration::from_secs(2));
    }

    let client = program_manager.api_client()?;
    let latest_height = client.latest_height()?;
    let records = client.get_unspent_records(&recipient_private_key, 0..latest_height, None, None, None)?;
    Ok(records.iter().map(|(cm, record)| record.decrypt(&recipient_view_key).unwrap()).collect())
}
