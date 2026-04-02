use crate::{
    ensure_private_key_storage, ensure_proving_request_storage, ffi, get_next_id,
    proving_request_error_result, proving_request_success_result, types::*,
};
use rand::{rngs::StdRng, SeedableRng};
use snarkvm_console::network::ConsensusVersion;
use snarkvm_console::prelude::FromStr;
use snarkvm_console::program::Identifier;
use snarkvm_synthesizer::prelude::execution_cost_for_authorization;

use super::{parse_imports_from_pairs, parse_inputs, program_manager_resolve_imports};

pub fn program_manager_build_proving_request(
    private_key_handle: &ffi::PrivateKeyHandle,
    program: String,
    function_name: String,
    inputs: Vec<String>,
    base_fee_microcredits: u64,
    priority_fee_microcredits: u64,
    fee_record: String,
    imports: Vec<String>,
    broadcast: bool,
    _unchecked: bool,
    edition: f64,
    use_fee_master: bool,
) -> ffi::ProvingRequestResult {
    let private_key_storage = ensure_private_key_storage();
    let private_keys = private_key_storage.lock().unwrap();
    let Some(private_key_cloned) = private_keys.get(&private_key_handle.id).cloned() else {
        return proving_request_error_result("Invalid private key handle".to_string());
    };
    drop(private_keys);

    if function_name.is_empty() {
        return proving_request_error_result("Function name cannot be empty".to_string());
    }

    let mut process = match Process::<CurrentNetwork>::load() {
        Ok(process) => process,
        Err(e) => return proving_request_error_result(format!("Failed to load process: {}", e)),
    };

    let edition_u16 = if edition <= 0.0 { 1u16 } else { edition as u16 };
    let trimmed = program.trim();
    let imports_map = match parse_imports_from_pairs(imports.clone()) {
        Ok(map) => map,
        Err(e) => return proving_request_error_result(e),
    };

    let program_native = if trimmed.ends_with(".aleo") {
        if trimmed == "credits.aleo" {
            match Program::<CurrentNetwork>::credits() {
                Ok(program) => program,
                Err(e) => {
                    return proving_request_error_result(format!(
                        "Failed to load credits.aleo program: {}",
                        e
                    ))
                }
            }
        } else {
            match imports_map.get(trimmed) {
                Some(program) => program.clone(),
                None => {
                    return proving_request_error_result(format!(
                        "Program '{}' not provided in imports. Pass imports[\"{}\"] = <program source>",
                        trimmed, trimmed
                    ))
                }
            }
        }
    } else {
        match Program::<CurrentNetwork>::from_str(&program) {
            Ok(program) => program,
            Err(e) => return proving_request_error_result(format!("Failed to parse program: {}", e)),
        }
    };

    if let Err(e) = program_manager_resolve_imports(&mut process, &program_native, imports) {
        return proving_request_error_result(e);
    }

    if program_native.id().to_string() != "credits.aleo" && !process.contains_program(program_native.id()) {
        if let Err(e) = process.add_program_with_edition(&program_native, edition_u16) {
            return proving_request_error_result(format!("Failed to add program to process: {}", e));
        }
    }

    let function_id = match Identifier::<CurrentNetwork>::from_str(&function_name) {
        Ok(id) => id,
        Err(e) => return proving_request_error_result(format!("Invalid function name: {}", e)),
    };

    let parsed_inputs = match parse_inputs(inputs) {
        Ok(values) => values,
        Err(e) => return proving_request_error_result(e),
    };

    let mut rng = StdRng::from_entropy();
    let authorization = match process.authorize::<CurrentAleo, _>(
        &private_key_cloned,
        program_native.id(),
        function_id,
        parsed_inputs.iter(),
        &mut rng,
    ) {
        Ok(authorization) => authorization,
        Err(e) => return proving_request_error_result(format!("Failed to build authorization: {}", e)),
    };

    let estimated_base_fee_microcredits = match execution_cost_for_authorization(
        &process,
        &authorization,
        ConsensusVersion::latest(),
    ) {
        Ok((minimum_cost, _)) => minimum_cost,
        Err(e) => {
            return proving_request_error_result(format!(
                "Failed to estimate base fee for authorization: {}",
                e
            ))
        }
    };
    let base_fee_microcredits = if base_fee_microcredits > 0 {
        base_fee_microcredits
    } else {
        estimated_base_fee_microcredits
    };
    let execution_id = match authorization.to_execution_id() {
        Ok(id) => id,
        Err(e) => {
            return proving_request_error_result(format!(
                "Failed to compute execution id for fee authorization: {}",
                e
            ))
        }
    };

    let program_id_str = program_native.id().to_string();
    let skip_fee_authorization = use_fee_master
        || (program_id_str == "credits.aleo"
            && (function_name == "split"
                || function_name == "upgrade"
                || function_name == "fee_public"
                || function_name == "fee_private"));

    let fee_authorization = if skip_fee_authorization {
        None
    } else if fee_record.is_empty() {
        match process.authorize_fee_public::<CurrentAleo, _>(
            &private_key_cloned,
            base_fee_microcredits,
            priority_fee_microcredits,
            execution_id,
            &mut rng,
        ) {
            Ok(auth) => Some(auth),
            Err(e) => {
                return proving_request_error_result(format!(
                    "Failed to build public fee authorization: {}",
                    e
                ))
            }
        }
    } else {
        let record = match Record::<CurrentNetwork, Plaintext<CurrentNetwork>>::from_str(&fee_record) {
            Ok(record) => record,
            Err(e) => return proving_request_error_result(format!("Failed to parse fee record: {}", e)),
        };
        match process.authorize_fee_private::<CurrentAleo, _>(
            &private_key_cloned,
            record,
            base_fee_microcredits,
            priority_fee_microcredits,
            execution_id,
            &mut rng,
        ) {
            Ok(auth) => Some(auth),
            Err(e) => {
                return proving_request_error_result(format!(
                    "Failed to build private fee authorization: {}",
                    e
                ))
            }
        }
    };

    let proving_request = crate::synthesizer::proving_request::ProvingRequest::<CurrentNetwork>::new(
        authorization,
        fee_authorization,
        broadcast,
    );

    let id = get_next_id();
    let storage = ensure_proving_request_storage();
    let mut proving_requests = storage.lock().unwrap();
    proving_requests.insert(id, proving_request);
    proving_request_success_result(id)
}
