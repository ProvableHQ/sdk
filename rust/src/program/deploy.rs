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

use crate::program::Resolver;
use anyhow::{anyhow, Result};
use snarkvm_console::{
    account::PrivateKey,
    program::{Network, Plaintext, ProgramID, Record},
};
use snarkvm_synthesizer::{ConsensusMemory, ConsensusStore, Program, Query, Transaction, VM};

use super::ProgramManager;

impl<N: Network, R: Resolver<N>> ProgramManager<N, R> {
    pub fn deploy_program(&mut self, program_id: impl TryInto<ProgramID<N>>) -> Result<()> {
        let program_id = program_id.try_into().map_err(|_| anyhow!("Invalid program ID"))?;
        let _program = if let Ok(program) = self.vm.process().read().get_program(&program_id) {
            program.clone()
        } else {
            self.resolver.load_program(&program_id)?
        };
        Ok(())
    }

    /// Create a deploy transaction for a program without instantiating the VM
    pub fn create_deploy_transaction(
        _vm: Option<&VM<N, ConsensusMemory<N>>>,
        private_key: &PrivateKey<N>,
        fee: u64,
        record: Record<N, Plaintext<N>>,
        program: &Program<N>,
        query: String,
    ) -> Result<Transaction<N>> {
        // Initialize an RNG.
        let rng = &mut rand::thread_rng();
        let query = Query::from(query);

        let store = ConsensusStore::<N, ConsensusMemory<N>>::open(None)?;
        let vm = VM::<N, ConsensusMemory<N>>::from(store)?;

        // Create the transaction
        Transaction::<N>::deploy(&vm, private_key, program, (record, fee), Some(query), rng)
    }
}
