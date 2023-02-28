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

use super::{AleoNetworkResolver, FileSystemResolver, RecordQuery, Resolver};
use crate::NetworkConfig;
use snarkvm_console::{
    account::PrivateKey,
    network::Network,
    program::{Plaintext, ProgramID, Record},
};
use snarkvm_synthesizer::Program;

use anyhow::{ensure, Result};
use std::path::Path;

/// Hybrid resolver that uses a combination of local file system and network imports
///
/// The default behavior is to first attempt to load a program from the local file system,
/// and if that fails, to attempt to load it from programs stored on the aleo network.
#[derive(Clone, Debug)]
pub struct HybridResolver<N: Network> {
    file_system_resolver: FileSystemResolver<N>,
    network_resolver: AleoNetworkResolver<N>,
}

impl<N: Network> HybridResolver<N> {
    /// Create a new hybrid resolver
    pub fn new(network_config: &NetworkConfig, local_config: &Path) -> Result<Self> {
        ensure!(local_config.exists(), "Path does not exist");
        ensure!(local_config.is_dir(), "Path is not a directory");
        let file_system_resolver = FileSystemResolver::new(local_config)?;
        let network_resolver = AleoNetworkResolver::new(network_config);
        Ok(Self { file_system_resolver, network_resolver })
    }
}

impl<N: Network> Resolver<N> for HybridResolver<N> {
    const NAME: &'static str = "FileSystemResolver";

    fn load_program(&self, program_id: &ProgramID<N>) -> Result<Program<N>> {
        self.file_system_resolver.load_program(program_id).or_else(|_| self.network_resolver.load_program(program_id))
    }

    fn resolve_program_imports(&self, program: &Program<N>) -> Result<Vec<(ProgramID<N>, Result<Program<N>>)>> {
        let results = self.file_system_resolver.resolve_program_imports(program)?;
        Ok(results
            .into_iter()
            .map(|(program_id, result)| {
                if result.is_err() {
                    (program_id, self.network_resolver.load_program(&program_id))
                } else {
                    (program_id, result)
                }
            })
            .collect::<Vec<_>>())
    }

    fn find_owned_records(
        &self,
        private_key: &PrivateKey<N>,
        record_query: &RecordQuery,
    ) -> Result<Vec<Record<N, Plaintext<N>>>> {
        self.network_resolver.find_owned_records(private_key, record_query)
    }
}

mod tests {
    use super::*;
    use snarkvm::file::Manifest;
    use snarkvm_console::network::Testnet3;
    use std::{fs, fs::File, io::Write, ops::Add, panic::catch_unwind, path::PathBuf, str::FromStr};

    const ALEO_PROGRAM: &str = "import hello.aleo;
import credits.aleo;
program aleo_test.aleo;

function test:
    input r0 as u32.public;
    input r1 as u32.private;
    add r0 r1 into r2;
    output r2 as u32.private;
";

    const HELLO_PROGRAM: &str = "program hello.aleo;

function main:
    input r0 as u32.public;
    input r1 as u32.private;
    add r0 r1 into r2;
    output r2 as u32.private;
";

    fn random_string(len: usize) -> String {
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
    fn setup_directory() -> Result<PathBuf> {
        // Crate a temporary directory for the test.
        let directory = std::env::temp_dir().join("aleo_test_hybrid_resolver");
        println!("Directory: {}", directory.display());

        catch_unwind(|| {
            let _ = &directory.exists().then(|| fs::remove_dir_all(&directory).unwrap());
            fs::create_dir(&directory).unwrap();

            let imports_directory = directory.join("imports");
            fs::create_dir(&directory.join("imports")).unwrap();
            let program_id = ProgramID::<Testnet3>::from_str(&format!("{}.aleo", "aleo_test")).unwrap();

            // Create the manifest file.
            Manifest::create(&directory, &program_id).unwrap();

            let mut main = File::create(&directory.join("main.aleo")).unwrap();
            main.write_all(ALEO_PROGRAM.as_bytes()).unwrap();

            let mut credits = File::create(imports_directory.join("credits.aleo")).unwrap();
            credits.write_all(&Program::<Testnet3>::credits().unwrap().to_string().as_bytes()).unwrap();
        })
        .map_err(|_| anyhow::anyhow!("Failed to create test directory"))?;
        Ok(directory)
    }

    // Teardown temp directory
    fn teardown_directory(directory: &PathBuf) {
        if directory.exists() {
            fs::remove_dir_all(directory).unwrap();
        }
    }

    #[test]
    fn test_hybrid_resolver_loading_and_imports() {
        let test_path = setup_directory().unwrap();
        let network_config = NetworkConfig::testnet3();

        let result = catch_unwind(|| {
            // TEST 1: Test that the hybrid resolver can load a program on disk that can't be found online
            println!("Test path: {}", test_path.display());
            let resolver = HybridResolver::<Testnet3>::new(&network_config, &test_path).unwrap();
            let program_id = ProgramID::<Testnet3>::from_str("aleo_test.aleo").unwrap();
            let expected_program = Program::<Testnet3>::from_str(ALEO_PROGRAM).unwrap();
            let found_program = resolver.load_program(&program_id).unwrap();
            assert_eq!(expected_program, found_program);

            // TEST 2: Test that the hybrid resolver can resolve imports when a program is missing from disk
            let test_program = Program::<Testnet3>::from_str(ALEO_PROGRAM).unwrap();
            let hello_program = Program::<Testnet3>::from_str(HELLO_PROGRAM).unwrap();
            let credits_program = Program::<Testnet3>::credits().unwrap();
            let imports = resolver.resolve_program_imports(&test_program).unwrap();
            assert_eq!(imports.len(), 2);

            let (hello_id, local_hello_program) = &imports[0];
            let (credits_id, local_credits_program) = &imports[1];
            let (local_hello_program, local_credits_program) =
                (local_hello_program.as_ref().unwrap(), local_credits_program.as_ref().unwrap());
            assert_eq!(hello_id.to_string(), "hello.aleo");
            assert_eq!(credits_id.to_string(), "credits.aleo");
            assert_eq!(&hello_program, local_hello_program);
            assert_eq!(&credits_program, local_credits_program);

            // TEST 3: Test that the hybrid resolver doesn't load a non-existent program.
            let random_program = random_string(16);
            let program_id = ProgramID::<Testnet3>::from_str(&random_program).unwrap();
            assert!(resolver.load_program(&program_id).is_err());

            // TEST 4: Test that the hybrid resolver does load a program that can't be found locally, but can be found online
            assert_eq!(resolver.load_program(credits_id).unwrap(), credits_program);

            // TEST 5: Test that the hybrid resolver throws an error when a program has a bad import, but can still resolve the other imports.
            // Create a bad program with a bad import
            let bad_import_code = String::from("import ").add(&random_string(16)).add(";").add(ALEO_PROGRAM);
            let bad_import_program = Program::<Testnet3>::from_str(&bad_import_code).unwrap();
            let imports = resolver.resolve_program_imports(&bad_import_program).unwrap();

            // Ensure that the bad import is the only one that failed
            let (_, local_bad_import_program) = &imports[0];
            let (hello_id, local_hello_program) = &imports[1];
            let (credits_id, local_credits_program) = &imports[2];
            assert!(local_bad_import_program.is_err());
            assert_eq!(hello_id.to_string(), "hello.aleo");
            assert_eq!(credits_id.to_string(), "credits.aleo");

            // Make sure the other imports are still resolved correctly
            let hello_program = Program::<Testnet3>::from_str(HELLO_PROGRAM).unwrap();
            let credits_program = Program::<Testnet3>::credits().unwrap();
            let (local_hello_program, local_credits_program) =
                (local_hello_program.as_ref().unwrap(), local_credits_program.as_ref().unwrap());

            assert_eq!(&hello_program, local_hello_program);
            assert_eq!(&credits_program, local_credits_program);

            // TEST 6: Ensure the hybrid resolver doesn't resolve imports for a program that doesn't have any.
            let credits = Program::<Testnet3>::credits().unwrap();
            let imports = resolver.resolve_program_imports(&credits).unwrap();
            assert_eq!(imports.len(), 0);
        });
        teardown_directory(&test_path);
        // Ensure the test directory was deleted
        assert!(!test_path.exists());
        result.unwrap();
    }
}
