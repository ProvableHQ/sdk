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

use crate::{AleoNetworkResolver, FileSystemResolver, NetworkConfig, Resolver};
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
        let file_system_resolver = FileSystemResolver::new(local_config, None)?;
        let network_resolver = AleoNetworkResolver::new(network_config);
        Ok(Self { file_system_resolver, network_resolver })
    }
}

impl<N: Network> Resolver<N> for HybridResolver<N> {
    const NAME: &'static str = "FileSystemResolver";

    fn load_program(&self, program_id: &ProgramID<N>) -> Result<Program<N>> {
        println!("Loading program: {} with hybrid resolver", program_id);
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
        amounts: Option<&Vec<u64>>,
        private_key: Option<&PrivateKey<N>>,
    ) -> Result<Vec<Record<N, Plaintext<N>>>> {
        self.network_resolver.find_owned_records(amounts, private_key)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        test_utils::{
            random_program_id,
            setup_directory,
            teardown_directory,
            ALEO_PROGRAM,
            HELLO_PROGRAM,
            RECIPIENT_PRIVATE_KEY,
        },
        ProgramManager,
    };

    use snarkvm_console::network::Testnet3;
    use std::{ops::Add, panic::catch_unwind, str::FromStr};

    #[test]
    fn test_hybrid_resolver_loading_and_imports() {
        let credits_program_string = Program::<Testnet3>::credits().unwrap().to_string();
        let imports = vec![("credits.aleo", credits_program_string.as_str())];
        let test_path = setup_directory("aleo_test_hybrid_resolver", ALEO_PROGRAM, imports).unwrap();
        let network_config = NetworkConfig::testnet3();
        let private_key = PrivateKey::<Testnet3>::from_str(RECIPIENT_PRIVATE_KEY).unwrap();

        let result = catch_unwind(|| {
            // TEST 1: Test that the hybrid rsesolver can load a program on disk that can't be found online
            let program_manager =
                ProgramManager::<Testnet3, HybridResolver<Testnet3>>::program_manager_with_hybrid_resolution(
                    Some(private_key),
                    None,
                    &test_path.clone(),
                    network_config,
                )
                .unwrap();
            let resolver = program_manager.resolver();
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
            let random_program = random_program_id(16);
            let program_id = ProgramID::<Testnet3>::from_str(&random_program).unwrap();
            assert!(resolver.load_program(&program_id).is_err());

            // TEST 4: Test that the hybrid resolver does load a program that can't be found locally, but can be found online
            assert_eq!(resolver.load_program(credits_id).unwrap(), credits_program);

            // TEST 5: Test that the hybrid resolver throws an error when a program has a bad import, but can still resolve the other imports.
            // Create a bad program with a bad import
            let bad_import_code = String::from("import ").add(&random_program_id(16)).add(";").add(ALEO_PROGRAM);
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
