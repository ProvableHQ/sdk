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

use super::{RecordQuery, Resolver};
use snarkvm::{
    file::{AleoFile, Manifest},
    package::Package,
};
use snarkvm_console::{
    account::PrivateKey,
    network::Network,
    program::{Owner::Public, Plaintext, ProgramID, Record},
};
use snarkvm_synthesizer::Program;

use anyhow::{ensure, Result};
use snarkvm_console::program::Address;
use std::{
    fs,
    path::{Path, PathBuf},
};

/// Resolver for imports from the local file system
#[derive(Clone, Debug)]
pub struct FileSystemResolver<N: Network> {
    local_config: PathBuf,
    _phantom: core::marker::PhantomData<N>,
}

impl<N: Network> FileSystemResolver<N> {
    /// Create a new file system resolver
    pub fn new(local_config: &Path) -> Result<Self> {
        ensure!(local_config.exists(), "Path does not exist");
        ensure!(local_config.is_dir(), "Path is not a directory");
        Ok(Self { local_config: local_config.to_path_buf(), _phantom: core::marker::PhantomData })
    }

    pub fn import_directory(&self) -> PathBuf {
        self.local_config.join("/imports")
    }

    pub fn inputs_directory(&self) -> PathBuf {
        self.local_config.join("/inputs")
    }
}

impl<N: Network> Resolver<N> for FileSystemResolver<N> {
    const NAME: &'static str = "FileSystemResolver";

    fn load_program(&self, program_id: &ProgramID<N>) -> Result<Program<N>> {
        // Ensure the directory path exists.
        ensure!(self.local_config.exists(), "The program directory does not exist");

        ensure!(
            Manifest::<N>::exists_at(&self.local_config),
            "Please ensure that the manifest file exists in the Aleo program directory (missing '{}' at '{}')",
            Manifest::<N>::file_name(),
            &self.local_config.display()
        );

        // Open the manifest file.
        let manifest = Manifest::<N>::open(&self.local_config)?;
        ensure!(
            manifest.program_id() == program_id,
            "The program name in the manifest file does not match the specified program name"
        );

        // Load the package.
        let package = Package::open(&self.local_config)?;
        // Load the main program.
        Ok(package.program().clone())
    }

    fn resolve_program_imports(&self, program: &Program<N>) -> Result<Vec<(ProgramID<N>, Result<Program<N>>)>> {
        program
            .imports()
            .keys()
            .map(|program_id| {
                // Open the Aleo program file.
                let program = AleoFile::open(&self.import_directory(), program_id, false)
                    .map(|aleo_file| aleo_file.program().clone())
                    .map_err(|err| anyhow::anyhow!(err.to_string()));
                Ok((*program_id, program))
            })
            .collect::<Result<Vec<(ProgramID<N>, Result<Program<N>>)>>>()
    }

    fn find_owned_records(
        &self,
        private_key: &PrivateKey<N>,
        _record_query: &RecordQuery,
    ) -> Result<Vec<Record<N, Plaintext<N>>>> {
        let mut records = vec![];
        let address = Address::try_from(private_key)?;
        for entry in fs::read_dir(&self.inputs_directory())? {
            let entry = entry?;
            let path = entry.path();
            if path.is_file() {
                if let Some(extension) = path.extension() {
                    if extension == "json" {
                        fs::read_to_string(path)
                            .map_err(|err| anyhow::anyhow!(err.to_string()))
                            .and_then(|json| {
                                serde_json::from_str::<Record<N, Plaintext<N>>>(&json)
                                    .map_err(|err| anyhow::anyhow!(err.to_string()))
                            })
                            .map(|record| {
                                let record_owner = record.owner();
                                if let Public(record_owner) = record_owner {
                                    if &address == record_owner {
                                        records.push(record.clone());
                                    }
                                }
                            })?;
                    } else {
                        continue;
                    }
                }
            }
        }
        Ok(records)
    }
}
