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

use super::*;

use crate::{
    fee_inclusion_proof,
    log,
    types::{
        CurrentAleo,
        CurrentBlockMemory,
        CurrentNetwork,
        ProcessNative,
        ProgramIDNative,
        ProgramNative,
        ProgramOwnerNative,
        RecordPlaintextNative,
        TransactionLeafNative,
        TransactionNative,
    },
    utils::to_bits,
    PrivateKey,
    RecordPlaintext,
    Transaction,
};

use aleo_rust::{Network, ToBytes};
use snarkvm_console::program::{ToBits, TRANSACTION_DEPTH};

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
    /// @param fee_proving_key (optional) Provide a proving key to use for the fee execution
    /// @param fee_verifying_key (optional) Provide a verifying key to use for the fee execution
    #[wasm_bindgen]
    #[allow(clippy::too_many_arguments)]
    pub async fn deploy(
        &self,
        private_key: PrivateKey,
        program: String,
        imports: Option<Object>,
        fee_credits: f64,
        fee_record: RecordPlaintext,
        url: String,
        fee_proving_key: Option<ProvingKey>,
        fee_verifying_key: Option<VerifyingKey>,
    ) -> Result<Transaction, String> {
        log("Creating deployment transaction");
        // Convert fee to microcredits and check that the fee record has enough credits to pay it
        let fee_microcredits = Self::validate_amount(fee_credits, &fee_record, true)?;
        if fee_record.microcredits() < fee_microcredits {
            return Err("Fee record does not have enough credits to pay the specified fee".to_string());
        }

        let mut process = ProcessNative::load_web().map_err(|err| err.to_string())?;

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

        log("Create and validate deployment");
        let deployment =
            process.deploy::<CurrentAleo, _>(&program, &mut StdRng::from_entropy()).map_err(|err| err.to_string())?;
        if deployment.program().functions().is_empty() {
            return Err("Attempted to create an empty transaction deployment".to_string());
        }

        log("Ensure the fee is sufficient to pay for the deployment");
        let deployment_fee = deployment.to_bytes_le().map_err(|err| err.to_string())?.len();
        if fee_microcredits < deployment_fee as u64 {
            return Err("Fee is not sufficient to pay for the deployment transaction".to_string());
        }

        log("Verify the deployment and fees");
        process
            .verify_deployment::<CurrentAleo, _>(&deployment, &mut StdRng::from_entropy())
            .map_err(|err| err.to_string())?;
        let fee = fee_inclusion_proof!(
            process,
            private_key,
            fee_record,
            fee_microcredits,
            url,
            fee_proving_key,
            fee_verifying_key
        );
        process.verify_fee(&fee).map_err(|e| e.to_string())?;

        log("Create the deployment transaction");
        TransactionNative::check_deployment_size(&deployment).map_err(|err| err.to_string())?;
        let leaves = program
            .functions()
            .values()
            .enumerate()
            .map(|(index, function)| {
                // Construct the transaction leaf.
                let id = CurrentNetwork::hash_bhp1024(&to_bits(function.to_bytes_le()?))?;
                Ok(TransactionLeafNative::new_deployment(index as u16, id).to_bits_le())
            })
            .chain(
                // Add the transaction fee to the leaves.
                [Ok(TransactionLeafNative::new_fee(
                    program.functions().len() as u16, // The last index.
                    **fee.transition_id(),
                )
                .to_bits_le())]
                .into_iter(),
            );

        let id = CurrentNetwork::merkle_tree_bhp::<TRANSACTION_DEPTH>(
            &leaves.collect::<anyhow::Result<Vec<_>>>().map_err(|err| err.to_string())?,
        )
        .map_err(|err| err.to_string())?;
        let owner = ProgramOwnerNative::new(&private_key, (*id.root()).into(), &mut StdRng::from_entropy())
            .map_err(|err| err.to_string())?;

        log("Creating deployment transaction");
        Ok(Transaction::from(
            TransactionNative::from_deployment(owner, deployment, fee).map_err(|err| err.to_string())?,
        ))
    }
}
