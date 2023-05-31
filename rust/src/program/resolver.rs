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

use super::*;

impl<N: Network> ProgramManager<N> {
    /// Find a program by first looking on disk, and if not found, on the aleo network
    pub fn find_program(&self, program_id: &ProgramID<N>) -> Result<Program<N>> {
        self.find_program_on_disk(program_id).or_else(|_| self.find_program_on_chain(program_id))
    }

    /// Load a program from a local program directory
    pub fn find_program_on_disk(&self, program_id: &ProgramID<N>) -> Result<Program<N>> {
        let local_program_directory =
            self.local_program_directory.as_ref().ok_or_else(|| anyhow!("Local program directory not set"))?;
        let imports_directory = local_program_directory.join("imports");
        // Ensure the directory path exists.
        ensure!(local_program_directory.exists(), "The program directory does not exist");

        ensure!(!Program::is_reserved_keyword(program_id.name()), "Program name is invalid (reserved): {program_id}");

        ensure!(
            Manifest::<N>::exists_at(local_program_directory),
            "Please ensure that the manifest file exists in the Aleo program directory (missing '{}' at '{}')",
            Manifest::<N>::file_name(),
            local_program_directory.display()
        );

        // Open the manifest file.
        let manifest = Manifest::<N>::open(local_program_directory)?;

        // Ensure the program ID matches the manifest program ID, or that the program is a local import
        if manifest.program_id() == program_id {
            // Load the package.
            let package = Package::open(local_program_directory)?;
            // Load the main program.
            Ok(package.program().clone())
        } else {
            let import_file = imports_directory.join(program_id.to_string());
            ensure!(
                import_file.exists(),
                "No program named {program_id:?} found at {:?}",
                local_program_directory.display()
            );
            println!("Attempting to load program {program_id:?} at {:?}", import_file.display());
            let mut program_file = File::open(import_file)?;
            let mut program_string = String::new();
            program_file.read_to_string(&mut program_string).map_err(|err| anyhow::anyhow!(err.to_string()))?;
            let program = Program::from_str(&program_string)?;
            println!("Loaded program {program_id:?} successfully!");
            Ok(program)
        }
    }

    /// Load a program from the network
    pub fn find_program_on_chain(&self, program_id: &ProgramID<N>) -> Result<Program<N>> {
        self.api_client()?.get_program(program_id)
    }

    /// Find a program's imports by first searching on disk, and if not found, on the aleo network
    pub fn find_program_imports(&self, program: &Program<N>) -> Result<Vec<Program<N>>> {
        let mut imports = vec![];
        for program_id in program.imports().keys() {
            if let Ok(program) = self.find_program(program_id) {
                imports.push(program);
            } else {
                bail!("Could not find program import: {:?}", program_id);
            }
        }
        Ok(imports)
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
            HELLO_PROGRAM,
            IMPORT_PROGRAM,
            RECIPIENT_PRIVATE_KEY,
        },
        AleoAPIClient,
    };
    use snarkvm_console::{account::PrivateKey, network::Testnet3};

    use std::{ops::Add, panic::catch_unwind, str::FromStr};

    #[test]
    fn test_file_loading_and_imports() {
        let private_key = PrivateKey::<Testnet3>::new(&mut rand::thread_rng()).unwrap();
        let credits = Program::<Testnet3>::credits().unwrap().to_string();
        let imports = vec![("credits.aleo", credits.as_str()), ("hello.aleo", HELLO_PROGRAM)];
        let test_path = setup_directory("aleo_test_file_resolution", IMPORT_PROGRAM, imports).unwrap();

        let result = catch_unwind(|| {
            // Create a program manager with file system access only
            let program_manager =
                ProgramManager::<Testnet3>::new(Some(private_key), None, None, Some(test_path.clone())).unwrap();

            // TEST 1: Test that the program manager can load a program from a file.
            let program_id = ProgramID::<Testnet3>::from_str("aleo_test.aleo").unwrap();
            let expected_program = Program::<Testnet3>::from_str(IMPORT_PROGRAM).unwrap();
            let found_program = program_manager.find_program_on_disk(&program_id).unwrap();
            assert_eq!(expected_program, found_program);

            // TEST 2: Test that the program manager can find local imports
            let test_program = Program::<Testnet3>::from_str(IMPORT_PROGRAM).unwrap();
            let credits_program = Program::<Testnet3>::credits().unwrap();
            let imports = program_manager.find_program_imports(&test_program).unwrap();
            assert_eq!(imports.len(), 1);

            let local_credits_program = &imports[0];
            assert_eq!(&credits_program, local_credits_program);

            // TEST 3: Test that the program manager doesn't load a non-existent program.
            let random_program = random_program_id(16);
            let program_id = ProgramID::<Testnet3>::from_str(&random_program).unwrap();
            assert!(program_manager.find_program_on_disk(&program_id).is_err());

            // TEST 4: Test that the program_manager throws an error when a program has a bad import,
            let bad_import_code = String::from("import ").add(&random_program_id(16)).add(";").add(IMPORT_PROGRAM);
            let bad_import_program = Program::<Testnet3>::from_str(&bad_import_code).unwrap();
            let imports = program_manager.find_program_imports(&bad_import_program);
            assert!(imports.is_err());

            // TEST 5: Ensure the program manager doesn't resolve imports for a program that doesn't have any.
            let credits = Program::<Testnet3>::credits().unwrap();
            let imports = program_manager.find_program_imports(&credits).unwrap();
            assert_eq!(imports.len(), 0);
        });
        teardown_directory(&test_path);
        // Ensure the test directory was deleted
        assert!(!test_path.exists());
        result.unwrap();
    }

    #[test]
    fn test_hybrid_program_and_import_loading() {
        let credits_program_string = Program::<Testnet3>::credits().unwrap().to_string();
        let imports = vec![("credits.aleo", credits_program_string.as_str())];
        let test_path = setup_directory("aleo_test_hybrid_resolution", IMPORT_PROGRAM, imports).unwrap();
        let private_key = PrivateKey::<Testnet3>::from_str(RECIPIENT_PRIVATE_KEY).unwrap();

        let result = catch_unwind(|| {
            // Create a program manager with file system and network access
            let api_client = AleoAPIClient::<Testnet3>::testnet3();
            let program_manager =
                ProgramManager::<Testnet3>::new(Some(private_key), None, Some(api_client), Some(test_path.clone()))
                    .unwrap();

            // TEST 1: Test that the program manager can load a program on disk that can't be found online
            let program_id = ProgramID::<Testnet3>::from_str("aleo_test.aleo").unwrap();
            let expected_program = Program::<Testnet3>::from_str(IMPORT_PROGRAM).unwrap();
            let found_program = program_manager.find_program(&program_id).unwrap();
            assert_eq!(expected_program, found_program);

            // TEST 2: Test that the program manager can resolve imports when a program is missing from disk
            let test_program = Program::<Testnet3>::from_str(IMPORT_PROGRAM).unwrap();
            let credits_program = Program::<Testnet3>::credits().unwrap();
            let credits_id = credits_program.id();
            let imports = program_manager.find_program_imports(&test_program).unwrap();
            assert_eq!(imports.len(), 1);

            let local_credits_program = &imports[0];
            assert_eq!(&credits_program, local_credits_program);

            // TEST 3: Test that the program manager doesn't load a non-existent program.
            let random_program = random_program_id(16);
            let program_id = ProgramID::<Testnet3>::from_str(&random_program).unwrap();
            assert!(program_manager.find_program(&program_id).is_err());

            // TEST 4: Test that the program manager does load a program that can't be found locally, but can be found online
            assert_eq!(program_manager.find_program(credits_id).unwrap(), credits_program);

            // TEST 5: Test that the program manager throws an error when a program has an import
            // that can't be found online or on disk
            let bad_import_code = String::from("import ").add(&random_program_id(16)).add(";").add(IMPORT_PROGRAM);
            let bad_import_program = Program::<Testnet3>::from_str(&bad_import_code).unwrap();
            let imports = program_manager.find_program_imports(&bad_import_program);
            assert!(imports.is_err());

            // TEST 6: Ensure a network enabled program manager doesn't resolve imports for a
            // program that doesn't have any
            let credits = Program::<Testnet3>::credits().unwrap();
            let imports = program_manager.find_program_imports(&credits).unwrap();
            assert_eq!(imports.len(), 0);
        });
        teardown_directory(&test_path);
        // Ensure the test directory was deleted
        assert!(!test_path.exists());
        result.unwrap();
    }

    #[test]
    fn test_network_program_resolution() {
        // Create a program manager with network access only
        let private_key = PrivateKey::<Testnet3>::from_str(RECIPIENT_PRIVATE_KEY).unwrap();
        let api_client = AleoAPIClient::<Testnet3>::testnet3();
        let program_manager = ProgramManager::<Testnet3>::new(Some(private_key), None, Some(api_client), None).unwrap();
        let program_id = ProgramID::<Testnet3>::from_str("credits.aleo").unwrap();
        let credits_off_the_chain = Program::<Testnet3>::credits().unwrap();
        let credits_on_the_chain = program_manager.find_program_on_chain(&program_id).unwrap();
        assert_eq!(credits_off_the_chain, credits_on_the_chain);
    }

    #[test]
    fn test_network_program_imports_are_resolved_correctly() {
        let credits = Program::<Testnet3>::credits().unwrap();
        // Create a program manager with network access only
        let private_key = PrivateKey::<Testnet3>::from_str(RECIPIENT_PRIVATE_KEY).unwrap();
        let api_client = AleoAPIClient::<Testnet3>::testnet3();
        let program_manager = ProgramManager::<Testnet3>::new(Some(private_key), None, Some(api_client), None).unwrap();

        // Ensure we can find program imports when the program is on chain
        let test_program = Program::<Testnet3>::from_str(IMPORT_PROGRAM).unwrap();
        // let credits_program = Program::<Testnet3>::credits().unwrap();
        let imports = program_manager.find_program_imports(&test_program).unwrap();
        assert_eq!(imports.len(), 1);

        let credits_program_on_chain = &imports[0];
        // let online_credits_on_chain = &imports[1];
        assert_eq!(&credits, credits_program_on_chain);
        // assert_eq!(&credits_program, online_credits_on_chain);
    }

    #[test]
    fn test_network_resolution_doesnt_find_programs_not_on_chain() {
        // Create a program with a random string as the program id
        let private_key = PrivateKey::<Testnet3>::from_str(RECIPIENT_PRIVATE_KEY).unwrap();
        let random_program = random_program_id(16);
        let api_client = AleoAPIClient::<Testnet3>::testnet3();

        // Create a program manager with network access only
        let program_manager = ProgramManager::<Testnet3>::new(Some(private_key), None, Some(api_client), None).unwrap();

        // Ensure the program is not on chain
        let program_id = ProgramID::<Testnet3>::from_str(&random_program).unwrap();
        assert!(program_manager.find_program_on_chain(&program_id).is_err())
    }

    #[test]
    fn test_network_resolution_produces_resolution_errors_for_bad_imports() {
        // Create program manager with only network access
        let private_key = PrivateKey::<Testnet3>::from_str(RECIPIENT_PRIVATE_KEY).unwrap();
        let api_client = AleoAPIClient::<Testnet3>::testnet3();
        let program_manager = ProgramManager::<Testnet3>::new(Some(private_key), None, Some(api_client), None).unwrap();

        // Create a bad program with a non-existent import
        let bad_import_code = String::from("import ").add(&random_program_id(16)).add(";").add(IMPORT_PROGRAM);
        let bad_import_program = Program::<Testnet3>::from_str(&bad_import_code).unwrap();

        // Ensure that the imports failed
        let imports = program_manager.find_program_imports(&bad_import_program);
        assert!(imports.is_err());
    }
}
