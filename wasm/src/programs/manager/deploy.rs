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
        TRANSACTION_DEPTH,
    },
    utils::to_bits,
    PrivateKey,
    RecordPlaintext,
    Transaction,
};

use aleo_rust::{Network, ToBytes};
use snarkvm_wasm::program::ToBits;

use js_sys::{Object, Reflect};
use rand::{rngs::StdRng, SeedableRng};
use std::str::FromStr;

#[wasm_bindgen]
impl ProgramManager {
    /// Deploy an Aleo program
    #[wasm_bindgen]
    pub async fn deploy(
        &self,
        program: String,
        imports: Option<Object>,
        private_key: PrivateKey,
        fee_credits: f64,
        fee_record: RecordPlaintext,
        url: String,
    ) -> Result<Transaction, String> {
        log("Creating deployment transaction");
        // Ensure a fee is specified and the record has enough balance to pay for it
        if fee_credits <= 0f64 {
            return Err("Fee must be greater than zero in order to deploy a program".to_string());
        };
        // Convert fee to microcredits and check that the fee record has enough credits to pay it
        let fee_microcredits = (fee_credits * 1_000_000.0f64) as u64;
        if fee_record.microcredits() < fee_microcredits {
            return Err("Fee record does not have enough credits to pay the specified fee".to_string());
        }

        let mut process = ProcessNative::load_web().map_err(|err| err.to_string())?;

        // Check program has a valid name
        let program = ProgramNative::from_str(&program).map_err(|err| err.to_string())?;

        // If imports are provided, attempt to add them. For this to succeed, the imports must be
        // valid programs and they must already be deployed on chain if the imports are to succeed.
        // To ensure this function is as stateless as possible, this function does not check if
        // imports are deployed on chain, or if they are whether they match programs with the same
        // name which are already deployed on chain. This is left to the caller to ensure. However
        // this is trivial to check via an Aleo block explorer or the Aleo API.
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

        // Create a deployment
        let deployment =
            process.deploy::<CurrentAleo, _>(&program, &mut StdRng::from_entropy()).map_err(|err| err.to_string())?;

        // Ensure the deployment is not empty
        if deployment.program().functions().is_empty() {
            return Err("Attempted to create an empty transaction deployment".to_string());
        }

        // Check the fee is sufficient to pay for the deployment
        let deployment_fee = deployment.to_bytes_le().map_err(|err| err.to_string())?.len();
        if fee_microcredits < deployment_fee as u64 {
            return Err("Fee is not sufficient to pay for the deployment transaction".to_string());
        }

        // Verify the deployment
        process
            .verify_deployment::<CurrentAleo, _>(&deployment, &mut StdRng::from_entropy())
            .map_err(|err| err.to_string())?;

        // Execute the call to fee and create the inclusion proof for it
        let fee = fee_inclusion_proof!(process, private_key, fee_record, fee_microcredits, url);

        // Verify the fee
        process.verify_fee(&fee).map_err(|e| e.to_string())?;

        // Create the transaction
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
