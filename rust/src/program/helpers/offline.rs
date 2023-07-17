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

/// Offline Execution of a program
#[derive(Clone)]
pub struct OfflineExecution<N: Network> {
    execution: Execution<N>,
    response: Option<Response<N>>,
    trace: Trace<N>,
    public_outputs: Option<Vec<Value<N>>>,
}

impl<N: Network> OfflineExecution<N> {
    /// Create a new offline execution
    pub(crate) fn new(
        execution: Execution<N>,
        response: Option<Response<N>>,
        trace: Trace<N>,
        public_outputs: Option<Vec<Value<N>>>,
    ) -> Self {
        Self { execution, response, trace, public_outputs }
    }

    /// Get the execution
    pub fn execution(&self) -> &Execution<N> {
        &self.execution
    }

    /// Get the execution id
    pub fn execution_id(&self) -> Result<Field<N>> {
        self.execution.to_execution_id()
    }

    /// Get the execution proof
    pub fn execution_proof(&self) -> Option<&Proof<N>> {
        self.execution.proof()
    }

    /// Get the outputs of the execution
    pub fn outputs(&self) -> Option<Vec<Value<N>>> {
        self.response.as_ref().map(|r| r.outputs().to_vec())
    }

    /// Get public outputs
    pub fn public_outputs(&self) -> Option<Vec<Value<N>>> {
        self.public_outputs.clone()
    }

    /// Get the trace of the execution
    pub fn trace(&self) -> &Trace<N> {
        &self.trace
    }

    /// Verify the execution proof against the given verifier inputs and program verifying key
    #[allow(clippy::type_complexity)]
    pub fn verify_execution_proof(
        &self,
        locator: &str,
        verifier_inputs: Vec<(VerifyingKey<N>, Vec<Vec<N::Field>>)>,
        execution: &Execution<N>,
    ) -> Result<(), String> {
        Trace::verify_execution_proof(locator, verifier_inputs, execution).map_err(|e| e.to_string())
    }
}
