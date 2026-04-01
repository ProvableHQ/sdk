// Copyright (C) 2019-2025 Provable Inc.
// This file is part of the Provable SDK library.

// The Provable SDK library is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// The Provable SDK library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with the Provable SDK library. If not, see <https://www.gnu.org/licenses/>.

#[macro_export]
macro_rules! process_inputs {
    ($inputs:expr) => {{
        let mut inputs_native = Vec::<String>::new();
        log("parsing inputs");
        for input in $inputs.to_vec().iter() {
            if let Some(input) = input.as_string() {
                inputs_native.push(input);
            } else {
                return Err("Invalid input - all inputs must be a string specifying the type".to_string());
            }
        }
        inputs_native
    }};
}

#[macro_export]
macro_rules! authorize {
    (
        $process:expr,
        $inputs:expr,
        $program_string:expr,
        $function_id_string:expr,
        $private_key:expr,
        $rng:expr,
        $unchecked:expr,
        $edition:expr
    ) => {{
        log("Loading program");
        let program =
            ProgramNative::from_str($program_string).map_err(|_| "The program ID provided was invalid".to_string())?;
        log("Loading function");
        let function_name = IdentifierNative::from_str($function_id_string)
            .map_err(|_| "The function name provided was invalid".to_string())?;

        let program_id = program.id().to_string();

        if program_id != "credits.aleo" {
            if !$process.contains_program(program.id()) {
                log("Adding program to the process");
                $process.add_program_with_edition(&program, $edition).map_err(|e| e.to_string())?;
            }
        }

        log(&format!("Creating authorization for {program_id}:{function_name}"));
        if $unchecked {
            $process
                .authorize_unchecked::<CurrentAleo, _>($private_key, program.id(), function_name, $inputs.iter(), $rng)
                .map_err(|err| err.to_string())?
        } else {
            $process
                .authorize::<CurrentAleo, _>($private_key, program.id(), function_name, $inputs.iter(), $rng)
                .map_err(|err| err.to_string())?
        }
    }};
}

#[macro_export]
macro_rules! authorize_fee {
    (
        $process:expr,
        $private_key:expr,
        $deployment_or_execution_id:expr,
        $base_fee:expr,
        $priority_fee:expr,
        $fee_record:expr,
        $rng:expr
    ) => {{
        match $fee_record {
            Some(fee_record) => {
                log("Authorizing credits.aleo/fee_private");
                let fee_record_native = RecordPlaintextNative::from_str(&fee_record.to_string())
                    .map_err(|e| format!("Invalid fee record: {}", e))?;
                $process
                    .authorize_fee_private::<CurrentAleo, _>(
                        $private_key,
                        fee_record_native,
                        $base_fee,
                        $priority_fee,
                        $deployment_or_execution_id,
                        $rng,
                    )
                    .map_err(|e| e.to_string())?
            }
            None => {
                log("Authorizing credits.aleo/fee_public");
                $process
                    .authorize_fee_public::<CurrentAleo, _>(
                        $private_key,
                        $base_fee,
                        $priority_fee,
                        $deployment_or_execution_id,
                        $rng,
                    )
                    .map_err(|e| e.to_string())?
            }
        }
    }};
}

#[macro_export]
macro_rules! execute_program {
    ($process:expr, $inputs:expr, $program_string:expr, $function_id_string:expr, $private_key:expr, $proving_key:expr, $verifying_key:expr, $rng:expr, $edition:expr) => {{
        if (($proving_key.is_some() && $verifying_key.is_none())
            || ($proving_key.is_none() && $verifying_key.is_some()))
        {
            return Err(
                "If specifying a key for a program execution, both the proving and verifying key must be specified"
                    .to_string(),
            );
        }

        log("Loading program");
        let program =
            ProgramNative::from_str($program_string).map_err(|_| "The program ID provided was invalid".to_string())?;
        log("Loading function");
        let function_name = IdentifierNative::from_str($function_id_string)
            .map_err(|_| "The function name provided was invalid".to_string())?;

        let program_id = program.id().to_string();

        if program_id != "credits.aleo" {
            if !$process.contains_program(program.id()) {
                log("Adding program to the process");
                $process.add_program_with_edition(&program, $edition).map_err(|e| e.to_string())?;
            }
        }

        if let Some(proving_key) = $proving_key {
            if Self::contains_key($process, program.id(), &function_name) {
                log(&format!("Proving & verifying keys were specified for {program_id} - {function_name:?} but a key already exists in the cache. Using cached keys"));
            } else {
                log(&format!("Inserting externally provided proving and verifying keys for {program_id} - {function_name:?}"));
                $process
                    .insert_proving_key(program.id(), &function_name, ProvingKeyNative::from(proving_key))
                    .map_err(|e| e.to_string())?;
                if let Some(verifying_key) = $verifying_key {
                    $process.insert_verifying_key(program.id(), &function_name, VerifyingKeyNative::from(verifying_key)).map_err(|e| e.to_string())?;
                }
            }
        };

        log("Creating authorization");
        let authorization = $process
            .authorize::<CurrentAleo, _>(
                $private_key,
                program.id(),
                function_name,
                $inputs.iter(),
                $rng,
            )
            .map_err(|err| err.to_string())?;

        log("Executing program");
        let result = $process
            .execute::<CurrentAleo, _>(authorization, $rng)
            .map_err(|err| err.to_string())?;

        result
    }};
}

#[macro_export]
macro_rules! execute_fee {
    ($process:expr, $private_key:expr, $fee_record:expr, $priority_fee_microcredits:expr, $node_url:expr, $fee_proving_key:expr, $fee_verifying_key:expr, $deployment_or_execution_id:expr, $rng:expr, $offline_query:expr, $minimum_execution_cost:expr) => {{
        use ::snarkvm_ledger_query::QueryTrait;
        if (($fee_proving_key.is_some() && $fee_verifying_key.is_none())
            || ($fee_proving_key.is_none() && $fee_verifying_key.is_some()))
        {
            return Err(
                 "Missing key - both the proving and verifying key must be specified for a program execution"
                    .to_string(),
            );
        }

        let function_name = if $fee_record.is_some() {
            IdentifierNative::from_str("fee_private").unwrap()
        } else {
            IdentifierNative::from_str("fee_public").unwrap()
        };

        if let Some(fee_proving_key) = $fee_proving_key {
            let credits = ProgramIDNative::from_str("credits.aleo").unwrap();

            if Self::contains_key($process, &credits, &function_name) {
                log("Fee proving & verifying keys were specified but a key already exists in the cache. Using cached keys");
            } else {
                log("Inserting externally provided fee proving and verifying keys");
                $process
                    .insert_proving_key(&credits, &function_name, ProvingKeyNative::from(fee_proving_key)).map_err(|e| e.to_string())?;
                if let Some(fee_verifying_key) = $fee_verifying_key {
                    $process
                        .insert_verifying_key(&credits, &function_name, VerifyingKeyNative::from(fee_verifying_key))
                        .map_err(|e| e.to_string())?;
                }
            }
        };

        log("Authorizing Fee");
        let fee_authorization = match $fee_record.clone() {
            Some(fee_record) => {
                let fee_record_native = RecordPlaintextNative::from_str(&fee_record.to_string()).unwrap();
                $process.authorize_fee_private::<CurrentAleo, _>(
                    $private_key,
                    fee_record_native,
                    $minimum_execution_cost,
                    $priority_fee_microcredits,
                    $deployment_or_execution_id,
                    $rng,
                ).map_err(|e| e.to_string())?
            }
            None => {
                $process.authorize_fee_public::<CurrentAleo, _>(
                    $private_key,
                    $minimum_execution_cost,
                    $priority_fee_microcredits,
                    $deployment_or_execution_id,
                    $rng,
                ).map_err(|e| e.to_string())?
            }
        };

        log("Executing Fee");
        let (_, mut trace) = $process
            .execute::<CurrentAleo, _>(fee_authorization, $rng)
            .map_err(|e| e.to_string())?;

        log("Preparing inclusion proofs for fee execution");
        let latest_height = if let Some(offline_query) = $offline_query.as_ref() {
            trace.prepare_async(offline_query).await.map_err(|err| err.to_string())?;
            offline_query.current_block_height().map_err(|e| e.to_string())?
        } else {
            let credits = ProgramNative::credits().unwrap();
            let function_name = IdentifierNative::from_str("split").unwrap();
            let view_key = ViewKeyNative::try_from(PrivateKeyNative::from($private_key)).map_err(|err| err.to_string())?;
            let inputs = if let Some(fee_record) = $fee_record {
                vec![
                    ::wasm_bindgen::JsValue::from_str(&fee_record.to_string()),
                    ::wasm_bindgen::JsValue::from_str(&format!("{}u64", $minimum_execution_cost)),
                    ::wasm_bindgen::JsValue::from_str(&format!("{}u64", $minimum_execution_cost)),
                    ::wasm_bindgen::JsValue::from_str(&format!("{}", $deployment_or_execution_id))
                ]
            } else {
                vec![
                    ::wasm_bindgen::JsValue::from_str(&format!("{}u64", $minimum_execution_cost)),
                    ::wasm_bindgen::JsValue::from_str(&format!("{}u64", $minimum_execution_cost)),
                    ::wasm_bindgen::JsValue::from_str(&format!("{}", $deployment_or_execution_id))
                ]
            };
            let query = SnapshotQuery::try_from_inputs(
                $node_url,
                &credits,
                &function_name,
                &view_key,
                &inputs,
            )
                .await
                .map_err(|err| err.to_string())?;
            trace.prepare_async(&query).await.map_err(|err| err.to_string())?;
            query.current_block_height().map_err(|e| e.to_string())?
        };
        let consensus_version = <CurrentNetwork as Network>::CONSENSUS_VERSION(latest_height).map_err(|err| err.to_string())?;
        let inclusion_upgrade_height = <CurrentNetwork as Network>::INCLUSION_UPGRADE_HEIGHT().map_err(|err| err.to_string())?;
        let inclusion_version = if latest_height >= inclusion_upgrade_height {
            ::snarkvm_synthesizer::prelude::InclusionVersion::V1
        } else {
            ::snarkvm_synthesizer::prelude::InclusionVersion::V0
        };

        log("Proving fee execution");
        let fee = trace.prove_fee::<CurrentAleo, _>(::snarkvm_algorithms::snark::varuna::VarunaVersion::V2, &mut StdRng::from_entropy()).map_err(|e|e.to_string())?;

        log("Verifying fee execution");
        $process.verify_fee(consensus_version, ::snarkvm_algorithms::snark::varuna::VarunaVersion::V2, inclusion_version, &fee, $deployment_or_execution_id).map_err(|e| e.to_string())?;

        fee
    }}
}

#[macro_export]
macro_rules! calculate_minimum_fee {
    ($offline_query:expr, $node_url: expr, $process:expr, $execution_ref:expr) => {{
        // Get the block height.
        let block_height = if let Some(ref offline_query) = $offline_query {
            let block_height = offline_query.current_block_height().map_err(|e| e.to_string())?;
            block_height
        } else {
            let block_height = latest_block_height($node_url).await.map_err(|e| e.to_string())?;
            block_height
        };

        // Calculate the execution cost based on the consensus version.
        let consensus_version =
            <CurrentNetwork as Network>::CONSENSUS_VERSION(block_height).map_err(|e| e.to_string())?;
        let (minimum_execution_cost, (_, _)) =
            execution_cost($process, $execution_ref, consensus_version).map_err(|err| err.to_string())?;
        minimum_execution_cost
    }};
}
