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

use crate::{
    execute_fee,
    get_process,
    log,
    types::{
        CurrentAleo,
        CurrentNetwork,
        ProcessNative,
        ProgramIDNative,
        ProgramNative,
        ProgramOwnerNative,
        RecordPlaintextNative,
        TransactionNative,
    },
    PrivateKey,
    RecordPlaintext,
    Transaction,
};

use js_sys::{Object, Reflect};
use rand::{rngs::StdRng, SeedableRng};
use std::str::FromStr;

#[wasm_bindgen]
impl ProgramManager {
    /// Deploy an Aleo program
    ///
    /// @param private_key The private key of the sender
    /// @param program The source code of the program being deployed
    /// @param imports A javascript object holding the source code of any imported programs in the
    /// form {"program_name1": "program_source_code", "program_name2": "program_source_code", ..}.
    /// Note that all imported programs must be deployed on chain before the main program in order
    /// for the deployment to succeed
    /// @param fee_credits The amount of credits to pay as a fee
    /// @param fee_record The record to spend the fee from
    /// @param url The url of the Aleo network node to send the transaction to
    /// @param cache Cache the synthesized keys for future use
    /// @param fee_proving_key (optional) Provide a proving key to use for the fee execution
    /// @param fee_verifying_key (optional) Provide a verifying key to use for the fee execution
    #[wasm_bindgen]
    #[allow(clippy::too_many_arguments)]
    pub async fn deploy(
        &mut self,
        private_key: PrivateKey,
        program: String,
        imports: Option<Object>,
        fee_credits: f64,
        fee_record: RecordPlaintext,
        url: String,
        cache: bool,
        fee_proving_key: Option<ProvingKey>,
        fee_verifying_key: Option<VerifyingKey>,
    ) -> Result<Transaction, String> {
        log("Creating deployment transaction");
        // Convert fee to microcredits and check that the fee record has enough credits to pay it
        let fee_microcredits = Self::validate_amount(fee_credits, &fee_record, true)?;
        if fee_record.microcredits() < fee_microcredits {
            return Err("Fee record does not have enough credits to pay the specified fee".to_string());
        }

        let mut new_process;
        let process = get_process!(self, cache, new_process);

        log("Check program has a valid name");
        let program = ProgramNative::from_str(&program).map_err(|err| err.to_string())?;

        log("Check program imports are valid");
        if let Some(imports) = imports {
            program
                .imports()
                .keys()
                .try_for_each(|program_id| {
                    let program_id =
                        program_id.to_string().parse::<ProgramIDNative>().map_err(|err| err.to_string())?.to_string();
                    if let Some(import_string) = Reflect::get(&imports, &program_id.into())
                        .map_err(|_| "Import not found".to_string())?
                        .as_string()
                    {
                        let import = ProgramNative::from_str(&import_string).map_err(|err| err.to_string())?;
                        process.add_program(&import).map_err(|err| err.to_string())?;
                    }
                    Ok::<(), String>(())
                })
                .map_err(|_| "Import resolution failed".to_string())?;
        }

        log("Create deployment");
        let deployment =
            process.deploy::<CurrentAleo, _>(&program, &mut StdRng::from_entropy()).map_err(|err| err.to_string())?;
        if deployment.program().functions().is_empty() {
            return Err("Attempted to create an empty transaction deployment".to_string());
        }

        log("Ensure the fee is sufficient to pay for the deployment");
        let (minimum_deployment_cost, (_, _)) =
            deployment_cost::<CurrentNetwork>(&deployment).map_err(|err| err.to_string())?;
        if fee_microcredits < minimum_deployment_cost {
            return Err(format!(
                "Fee is too low to pay for the deployment. The minimum fee is {} credits",
                minimum_deployment_cost as f64 / 1_000_000.0
            ));
        }

        let deployment_id = deployment.to_deployment_id().map_err(|e| e.to_string())?;

        let fee = execute_fee!(
            process,
            private_key,
            fee_record,
            fee_microcredits,
            url,
            fee_proving_key,
            fee_verifying_key,
            deployment_id
        );

        log("Create the program owner");
        let owner = ProgramOwnerNative::new(&private_key, deployment_id, &mut StdRng::from_entropy())
            .map_err(|err| err.to_string())?;

        log("Verify the deployment and fees");
        process
            .verify_deployment::<CurrentAleo, _>(&deployment, &mut StdRng::from_entropy())
            .map_err(|err| err.to_string())?;

        log("Creating deployment transaction");
        Ok(Transaction::from(
            TransactionNative::from_deployment(owner, deployment, fee).map_err(|err| err.to_string())?,
        ))
    }

    /// Estimate the fee for a program deployment
    ///
    /// @param program The source code of the program being deployed
    /// @param cache Cache the synthesized keys for future use
    #[wasm_bindgen(js_name = estimateDeploymentFee)]
    pub async fn estimate_deployment_fee(&mut self, program: String, cache: bool) -> Result<u64, String> {
        let mut new_process;
        let process = get_process!(self, cache, new_process);

        log("Check program has a valid name");
        let program = ProgramNative::from_str(&program).map_err(|err| err.to_string())?;

        log("Create sample deployment");
        let deployment =
            process.deploy::<CurrentAleo, _>(&program, &mut StdRng::from_entropy()).map_err(|err| err.to_string())?;
        if deployment.program().functions().is_empty() {
            return Err("Attempted to create an empty transaction deployment".to_string());
        }

        log("Estimate the deployment fee");
        let (minimum_deployment_cost, (_, _)) =
            deployment_cost::<CurrentNetwork>(&deployment).map_err(|err| err.to_string())?;

        Ok(minimum_deployment_cost)
    }

    /// Estimate the component of the deployment cost which comes from the fee surrounding the
    /// program name. Note that this cost does not represent the entire cost of deployment. It is
    /// additional to the cost of the size (in bytes) of the deployment.
    ///
    /// @param name The name of the program to be deployed
    #[wasm_bindgen(js_name = estimateProgramNameCost)]
    pub fn program_name_cost(&self, name: &str) -> Result<u64, String> {
        let num_characters = name.chars().count() as u32;
        let namespace_cost = 10u64
            .checked_pow(10u32.saturating_sub(num_characters))
            .ok_or("The namespace cost computation overflowed for a deployment")?
            .saturating_mul(1_000_000); // 1 microcredit = 1e-6 credits.
        Ok(namespace_cost)
    }
}
