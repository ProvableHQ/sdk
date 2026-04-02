mod proving_request;
pub use proving_request::program_manager_build_proving_request;

use crate::{
    authorization_error_result, authorization_success_result, bool_success_result,
    destroy_authorization, ensure_authorization_storage, ensure_private_key_storage,
    ensure_proving_key_storage, ffi, get_next_id, string_error_result, string_success_result,
    types::*,
};
use core::ops::Add;
use rand::{rngs::StdRng, SeedableRng};

use snarkvm_algorithms::snark::varuna::VarunaVersion;
use snarkvm_console::network::{ConsensusVersion, Network};
use snarkvm_console::prelude::FromStr;
use snarkvm_console::program::{Identifier, ProgramID, ProgramOwner, Value, ValueType};
use snarkvm_synthesizer::prelude::{
    deployment_cost, execution_cost_for_authorization, InclusionVersion,
};
use snarkvm_synthesizer::program::StackTrait; // required for stack.sample_value(...)
use std::collections::HashMap;

// Type alias matching web SDK pattern
type ProgramOwnerNative = ProgramOwner<CurrentNetwork>;

// Default node URL fallback for online queries (not used in offline-only flow).
const DEFAULT_URL: &str = "https://api.explorer.provable.com/v1";

fn parse_imports_from_pairs(
    program_imports: Vec<String>,
) -> Result<HashMap<String, Program<CurrentNetwork>>, String> {
    let mut import_programs = HashMap::new();
    for import in program_imports {
        if import.is_empty() {
            continue;
        }
        let parts: Vec<&str> = import.splitn(2, '=').collect();
        if parts.len() != 2 {
            return Err(format!(
                "Invalid import format (expected name=source), got '{}'",
                import
            ));
        }
        let import_name = parts[0].trim();
        let import_source = parts[1].trim();
        if import_name.is_empty() || import_source.is_empty() {
            return Err(format!("Invalid import entry '{}'", import));
        }
        let import_program = Program::<CurrentNetwork>::from_str(import_source)
            .map_err(|e| format!("Failed to parse import program {}: {}", import_name, e))?;
        import_programs.insert(import_name.to_string(), import_program);
    }
    Ok(import_programs)
}

fn resolve_imports_recursive(
    process: &mut Process<CurrentNetwork>,
    program: &Program<CurrentNetwork>,
    imports_map: &std::collections::HashMap<String, Program<CurrentNetwork>>,
) -> Result<(), String> {
    for program_id in program.imports().keys() {
        let program_id_str = program_id.to_string();
        if program_id_str == "credits.aleo" {
            // Skip adding credits.aleo as per web SDK behavior
            continue;
        }
        let import_program = imports_map.get(&program_id_str).ok_or_else(|| {
            format!(
                "Program '{}' not provided in imports. Pass imports[\"{}\"] = <program source>",
                program_id_str, program_id_str
            )
        })?;
        // Resolve imports recursively for this import
        resolve_imports_recursive(process, import_program, imports_map)?;
        // Add to process if not already present
        if !process.contains_program(import_program.id()) {
            // Mirror web: add imports with edition = 1
            process
                .add_program_with_edition(import_program, 1u16)
                .map_err(|e| {
                    format!(
                        "Failed to add import '{}' to process: {}",
                        program_id_str, e
                    )
                })?;
        }
    }
    Ok(())
}

/// Resolve and add program imports to the process, mirroring the web SDK behavior:
/// - Walks the program imports
/// - Loads each import from the provided `program_imports` (formatted as "name=source")
/// - Recursively resolves import-of-imports
/// - Skips adding 'credits.aleo'
/// - Adds each import to the process if not already present
pub fn program_manager_resolve_imports(
    process: &mut Process<CurrentNetwork>,
    program: &Program<CurrentNetwork>,
    program_imports: Vec<String>,
) -> Result<(), String> {
    let imports_map = parse_imports_from_pairs(program_imports)?;
    resolve_imports_recursive(process, program, &imports_map)
}

fn parse_inputs(inputs: Vec<String>) -> Result<Vec<Value<CurrentNetwork>>, String> {
    let mut parsed = Vec::with_capacity(inputs.len());
    for input in inputs {
        let value = Value::<CurrentNetwork>::from_str(&input)
            .map_err(|e| format!("Invalid input '{}': {}", input, e))?;
        parsed.push(value);
    }
    Ok(parsed)
}

fn validate_fee_record_string(
    fee_record: &str,
    _minimum_execution_cost_microcredits: u64,
    _priority_fee_microcredits: u64,
) -> Result<(), String> {
    if fee_record.is_empty() {
        // Using public fee; nothing to validate here.
        return Ok(());
    }
    // Basic validation: ensure record parses. Deeper balance checks can be added if needed.
    let _ = Record::<CurrentNetwork, Plaintext<CurrentNetwork>>::from_str(fee_record)
        .map_err(|e| format!("Failed to parse fee record: {}", e))?;
    Ok(())
}

/// Build an authorization for program execution
pub fn program_manager_build_authorization(
    program_name: String,
    function_name: String,
    inputs: Vec<String>,
    private_key_handle: &ffi::PrivateKeyHandle,
    program_source: String,
    program_imports: Vec<String>,
    _edition: f64,
) -> ffi::AuthorizationResult {
    let private_key_storage = ensure_private_key_storage();
    let private_keys = private_key_storage.lock().unwrap();

    let Some(private_key) = private_keys.get(&private_key_handle.id) else {
        return authorization_error_result("Invalid private key handle".to_string());
    };

    // Validate program name format
    if !program_name.ends_with(".aleo") {
        return authorization_error_result("Program name must end with .aleo".to_string());
    }

    // Validate function name is not empty
    if function_name.is_empty() {
        return authorization_error_result("Function name cannot be empty".to_string());
    }

    // Create a new process
    let mut process = match Process::<CurrentNetwork>::load() {
        Ok(process) => process,
        Err(e) => {
            return authorization_error_result(format!("Failed to load process: {}", e));
        }
    };

    // Parse the main program first (needed to resolve imports)
    let program_added = if !program_source.is_empty() {
        let program = match Program::<CurrentNetwork>::from_str(&program_source) {
            Ok(program) => program,
            Err(e) => {
                return authorization_error_result(format!("Failed to parse program: {}", e));
            }
        };

        // Resolve and add imports in topological order (dependencies first)
        if let Err(e) = program_manager_resolve_imports(&mut process, &program, program_imports) {
            return authorization_error_result(e);
        }

        // Add the main program to the process
        if let Err(e) = process.add_program(&program) {
            return authorization_error_result(format!("Failed to add program to process: {}", e));
        }
        true
    } else {
        false
    };

    // Parse program identifier
    let program_id = match ProgramID::<CurrentNetwork>::from_str(&program_name) {
        Ok(id) => id,
        Err(e) => {
            return authorization_error_result(format!("Invalid program name: {}", e));
        }
    };

    // Parse function identifier
    let function_name_id = match Identifier::<CurrentNetwork>::from_str(&function_name) {
        Ok(id) => id,
        Err(e) => {
            return authorization_error_result(format!("Invalid function name: {}", e));
        }
    };

    // Parse inputs
    let mut parsed_inputs = Vec::new();
    for input in inputs.iter() {
        match Value::<CurrentNetwork>::from_str(input) {
            Ok(value) => {
                parsed_inputs.push(value);
            }
            Err(e) => {
                return authorization_error_result(format!("Invalid input '{}': {}", input, e))
            }
        }
    }

    // Create RNG
    let mut rng = StdRng::from_entropy();

    // Build the execution authorization using the process
    let authorization = if program_added || process.contains_program(&program_id) {
        match process.authorize::<CurrentAleo, _>(
            private_key,
            program_id,
            function_name_id,
            parsed_inputs.iter(),
            &mut rng,
        ) {
            Ok(auth) => auth,
            Err(e) => {
                return authorization_error_result(format!("Failed to build authorization: {}", e))
            }
        }
    } else {
        return authorization_error_result(format!(
            "Program '{}' does not exist. Please provide program source or ensure program is loaded.",
            program_name
        ));
    };

    // Store the authorization
    let id = get_next_id();
    let storage = ensure_authorization_storage();
    let mut authorizations = storage.lock().unwrap();
    authorizations.insert(id, authorization);

    authorization_success_result(id)
}

/// Build a fee authorization for paying transaction fees
pub fn program_manager_build_fee_authorization(
    deployment_or_execution_id: String,
    base_fee_microcredits: u64,
    priority_fee_microcredits: u64,
    private_key_handle: &ffi::PrivateKeyHandle,
    fee_record: String,
) -> ffi::AuthorizationResult {
    let private_key_storage = ensure_private_key_storage();
    let private_keys = private_key_storage.lock().unwrap();

    let Some(private_key) = private_keys.get(&private_key_handle.id) else {
        return authorization_error_result("Invalid private key handle".to_string());
    };

    if deployment_or_execution_id.is_empty() {
        return authorization_error_result(
            "Deployment or execution ID cannot be empty".to_string(),
        );
    }

    // Create a new process
    let process = match Process::<CurrentNetwork>::load() {
        Ok(process) => process,
        Err(e) => return authorization_error_result(format!("Failed to load process: {}", e)),
    };

    // Parse the deployment or execution ID as a Field
    // The execution ID should be a valid field representation
    let id_field = match Field::<CurrentNetwork>::from_str(&deployment_or_execution_id) {
        Ok(field) => field,
        Err(e) => {
            return authorization_error_result(format!(
                "Invalid deployment/execution ID '{}': {}",
                deployment_or_execution_id, e
            ))
        }
    };

    let _total_fee = base_fee_microcredits + priority_fee_microcredits;

    // Create RNG
    let mut rng = StdRng::from_entropy();

    // Build fee authorization using the specialized Process methods
    let fee_authorization = if fee_record.is_empty() {
        // Use public fee authorization
        match process.authorize_fee_public::<CurrentAleo, _>(
            private_key,
            base_fee_microcredits,
            priority_fee_microcredits,
            id_field,
            &mut rng,
        ) {
            Ok(auth) => auth,
            Err(e) => {
                return authorization_error_result(format!(
                    "Failed to build public fee authorization: {}",
                    e
                ))
            }
        }
    } else {
        // Use private fee record
        let record =
            match Record::<CurrentNetwork, Plaintext<CurrentNetwork>>::from_str(&fee_record) {
                Ok(record) => record,
                Err(e) => {
                    return authorization_error_result(format!("Failed to parse fee record: {}", e))
                }
            };

        match process.authorize_fee_private::<CurrentAleo, _>(
            private_key,
            record,
            base_fee_microcredits,
            priority_fee_microcredits,
            id_field,
            &mut rng,
        ) {
            Ok(auth) => auth,
            Err(e) => {
                return authorization_error_result(format!(
                    "Failed to build private fee authorization: {}",
                    e
                ))
            }
        }
    };

    // Store the authorization
    let id = get_next_id();
    let storage = ensure_authorization_storage();
    let mut authorizations = storage.lock().unwrap();
    authorizations.insert(id, fee_authorization);

    authorization_success_result(id)
}

/// Execute Aleo function and create an Aleo execution transaction (1:1 logic with web SDK).
/// Note: This mobile FFI variant accepts URL/offline query and optional key handles by IDs to avoid breaking CXX Option.
///
/// Thread Safety: This function is designed to be called from background threads.
/// All shared state (private keys, authorizations, etc.) is protected by mutexes,
/// and each call creates its own Process instance, ensuring thread-safe execution.
/// The heavy computation (proving, execution) will run on the calling thread, which
/// should be a background thread to avoid blocking the main/JS thread.
pub fn program_manager_build_execution_transaction(
    private_key_handle: &ffi::PrivateKeyHandle,
    program_source: String,
    function_name: String,
    inputs: Vec<String>,
    priority_fee_microcredits: u64,
    fee_record: String,
    url: String, // empty => DEFAULT_URL
    imports: Vec<String>,
    fee_proving_key_handle_id: u64,
    fee_verifying_key_handle_id: u64,
    offline_query_handle_id: u64,
    edition: f64,
) -> ffi::StringResult {
    eprintln!("[LOCAL_PROVING] Starting execution transaction build");
    // Fetch private key
    eprintln!("[LOCAL_PROVING] Fetching private key");
    let private_key_storage = ensure_private_key_storage();
    let private_keys = private_key_storage.lock().unwrap();
    let Some(private_key_cloned) = private_keys.get(&private_key_handle.id).cloned() else {
        return string_error_result("Invalid private key handle".to_string());
    };
    drop(private_keys);

    // Create process
    eprintln!("[LOCAL_PROVING] Creating process");
    let mut process = match Process::<CurrentNetwork>::load() {
        Ok(p) => p,
        Err(e) => return string_error_result(format!("Failed to load process: {}", e)),
    };

    // Resolve imports and add program
    eprintln!("[LOCAL_PROVING] Resolving program and imports");
    let edition_u16 = if edition <= 0.0 { 1u16 } else { edition as u16 };
    // Resolve main program from ID or source (web-style)
    let trimmed = program_source.trim();
    let program_native = if trimmed.ends_with(".aleo") {
        if trimmed == "credits.aleo" {
            match Program::<CurrentNetwork>::credits() {
                Ok(p) => p,
                Err(e) => {
                    return string_error_result(format!(
                        "Failed to load credits.aleo program: {}",
                        e
                    ))
                }
            }
        } else {
            // Expect the main program source to be provided in imports under its program ID
            let imports_map = match parse_imports_from_pairs(imports.clone()) {
                Ok(m) => m,
                Err(e) => return string_error_result(e),
            };
            match imports_map.get(trimmed) {
                Some(p) => p.clone(),
                None => return string_error_result(format!(
                    "Program '{}' not provided in imports. Pass imports[\"{}\"] = <program source>",
                    trimmed, trimmed
                )),
            }
        }
    } else {
        match Program::<CurrentNetwork>::from_str(&program_source) {
            Ok(p) => p,
            Err(e) => return string_error_result(format!("Failed to parse program: {}", e)),
        }
    };
    // Resolve and add imports recursively, skip credits.aleo
    if let Err(e) = program_manager_resolve_imports(&mut process, &program_native, imports) {
        return string_error_result(e);
    }
    // Add main program if not credits and not present
    if program_native.id().to_string() != "credits.aleo"
        && !process.contains_program(program_native.id())
    {
        if let Err(e) = process.add_program_with_edition(&program_native, edition_u16) {
            return string_error_result(format!("Failed to add program to process: {}", e));
        }
    }
    let program_id = program_native.id().to_string();
    let function_id = match Identifier::<CurrentNetwork>::from_str(&function_name) {
        Ok(id) => id,
        Err(e) => return string_error_result(format!("Invalid function name: {}", e)),
    };

    // Parse inputs
    eprintln!("[LOCAL_PROVING] Parsing inputs");
    let parsed_inputs = match parse_inputs(inputs) {
        Ok(v) => v,
        Err(e) => return string_error_result(e),
    };

    // Authorize
    eprintln!("[LOCAL_PROVING] Authorizing execution");
    let mut rng = StdRng::from_entropy();
    let authorization = match process.authorize::<CurrentAleo, _>(
        &private_key_cloned,
        program_native.id(),
        function_id,
        parsed_inputs.iter(),
        &mut rng,
    ) {
        Ok(a) => a,
        Err(e) => return string_error_result(format!("Failed to authorize execution: {}", e)),
    };

    // Execute to get trace (native helper)
    eprintln!("[LOCAL_PROVING] Executing authorization");
    let mut trace =
        match crate::macros::execute_authorization_native(&process, authorization, &mut rng) {
            Ok(trace) => trace,
            Err(e) => return string_error_result(format!("Failed to execute: {}", e)),
        };

    // Prepare inclusion proofs - offline only
    eprintln!("[LOCAL_PROVING] Preparing inclusion proofs");
    let (latest_height, offline_query_opt): (u32, Option<crate::offline_query::OfflineQuery>) =
        if offline_query_handle_id != 0 {
            let storage = crate::ensure_offline_query_storage();
            let offline_query = {
                let map = storage.lock().unwrap();
                let Some(offline_query) = map.get(&offline_query_handle_id) else {
                    return string_error_result("Invalid offline query handle".to_string());
                };
                offline_query.clone()
            };
            if let Err(e) = trace.prepare(&offline_query) {
                return string_error_result(format!("Failed to prepare inclusion proofs: {}", e));
            }
            let height = match offline_query.current_block_height() {
                Ok(h) => h,
                Err(e) => {
                    return string_error_result(format!(
                        "Failed to get offline block height: {}",
                        e
                    ))
                }
            };
            (height, Some(offline_query))
        } else {
            // Online path not supported in this build
            return string_error_result(
                "Online inclusion query not supported on mobile; provide OfflineQuery".to_string(),
            );
        };
    let latest_height: u32 = latest_height;
    let _offline_query_for_fee = offline_query_opt.clone();

    // Prove execution
    eprintln!("[LOCAL_PROVING] Proving execution");
    let locator = program_native.id().to_string().add("/").add(&function_name);
    let execution = match trace.prove_execution::<CurrentAleo, _>(
        &locator,
        VarunaVersion::V2,
        &mut StdRng::from_entropy(),
    ) {
        Ok(exec) => exec,
        Err(e) => return string_error_result(format!("Failed to prove execution: {}", e)),
    };

    // Fee handling
    eprintln!("[LOCAL_PROVING] Processing fees");
    let fee_optional = match (program_id.as_str(), function_name.as_str()) {
        ("credits.aleo", "split")
        | ("credits.aleo", "upgrade")
        | ("credits.aleo", "fee_private")
        | ("credits.aleo", "fee_public") => None,
        _ => {
            eprintln!("[LOCAL_PROVING] Calculating fee");
            // Calculate minimum execution cost (offline-only)
            let consensus_for_fee =
                match <CurrentNetwork as Network>::CONSENSUS_VERSION(latest_height) {
                    Ok(v) => v,
                    Err(e) => {
                        return string_error_result(format!(
                            "Failed to get consensus version: {}",
                            e
                        ))
                    }
                };
            let (minimum_execution_cost, _) = match snarkvm_synthesizer::prelude::execution_cost(
                &process,
                &execution,
                consensus_for_fee,
            ) {
                Ok(tuple) => tuple,
                Err(e) => {
                    return string_error_result(format!("Failed to calculate minimum fee: {}", e))
                }
            };
            if let Err(e) = validate_fee_record_string(
                &fee_record,
                minimum_execution_cost,
                priority_fee_microcredits,
            ) {
                return string_error_result(e);
            }

            // Calculate execution id for fee linkage
            let execution_id = match execution.to_execution_id() {
                Ok(id) => id.to_string(),
                Err(e) => return string_error_result(format!("Failed to get execution ID: {}", e)),
            };

            // Build fee authorization via existing helper (public if no fee_record provided)
            let fee_auth = program_manager_build_fee_authorization(
                execution_id,
                minimum_execution_cost,
                priority_fee_microcredits,
                private_key_handle,
                fee_record.clone(),
            );
            if !fee_auth.success {
                return string_error_result(format!(
                    "Failed to build fee authorization: {}",
                    fee_auth.error
                ));
            }
            let storage = ensure_authorization_storage();
            let authorizations = storage.lock().unwrap();
            let Some(fee_auth_obj) = authorizations.get(&fee_auth.handle).cloned() else {
                return string_error_result("Failed to retrieve fee authorization".to_string());
            };
            drop(authorizations);
            destroy_authorization(fee_auth.handle);

            // Execute fee authorization and prove fee
            eprintln!("[LOCAL_PROVING] Executing fee authorization");
            // If external fee keys are provided, insert them under credits.aleo/{fee_private|fee_public}
            if fee_proving_key_handle_id != 0 {
                let credits_id = match ProgramID::<CurrentNetwork>::from_str("credits.aleo") {
                    Ok(id) => id,
                    Err(e) => {
                        return string_error_result(format!(
                            "credits.aleo ProgramID parse failed: {}",
                            e
                        ))
                    }
                };
                let fee_fn_name = if !fee_record.is_empty() {
                    "fee_private"
                } else {
                    "fee_public"
                };
                let fee_fn_id = match Identifier::<CurrentNetwork>::from_str(fee_fn_name) {
                    Ok(id) => id,
                    Err(e) => {
                        return string_error_result(format!(
                            "fee function Identifier parse failed: {}",
                            e
                        ))
                    }
                };
                // Insert proving key if found
                let pk_storage = crate::ensure_proving_key_storage();
                let pk_map = pk_storage.lock().unwrap();
                if let Some(proving_key_native) = pk_map.get(&fee_proving_key_handle_id) {
                    let _ = process.insert_proving_key(
                        &credits_id,
                        &fee_fn_id,
                        proving_key_native.clone(),
                    );
                }
                drop(pk_map);
                // Insert verifying key if provided
                if fee_verifying_key_handle_id != 0 {
                    let vk_storage = crate::ensure_verifying_key_storage();
                    let vk_map = vk_storage.lock().unwrap();
                    if let Some(verifying_key_native) = vk_map.get(&fee_verifying_key_handle_id) {
                        let _ = process.insert_verifying_key(
                            &credits_id,
                            &fee_fn_id,
                            verifying_key_native.clone(),
                        );
                    }
                }
            }

            eprintln!("[LOCAL_PROVING] Proving fee");
            let mut fee_trace = match crate::macros::execute_authorization_native(
                &process,
                fee_auth_obj.clone(),
                &mut rng,
            ) {
                Ok(trace) => trace,
                Err(e) => {
                    return string_error_result(format!(
                        "Failed to execute fee authorization: {}",
                        e
                    ))
                }
            };
            // Prepare fee inclusion proofs with the same offline query
            if offline_query_handle_id != 0 {
                let storage = crate::ensure_offline_query_storage();
                let offline_query = {
                    let map = storage.lock().unwrap();
                    let Some(offline_query) = map.get(&offline_query_handle_id) else {
                        return string_error_result("Invalid offline query handle".to_string());
                    };
                    offline_query.clone()
                };
                if let Err(e) = fee_trace.prepare(&offline_query) {
                    return string_error_result(format!(
                        "Failed to prepare fee inclusion proofs: {}",
                        e
                    ));
                }
            }
            let fee = match fee_trace.prove_fee::<CurrentAleo, _>(VarunaVersion::V2, &mut rng) {
                Ok(fee) => fee,
                Err(e) => return string_error_result(format!("Failed to prove fee: {}", e)),
            };
            Some(fee)
        }
    };

    // Verify the execution
    eprintln!("[LOCAL_PROVING] Verifying execution");
    let consensus_version = match <CurrentNetwork as Network>::CONSENSUS_VERSION(latest_height) {
        Ok(v) => v,
        Err(e) => return string_error_result(format!("Failed to get consensus version: {}", e)),
    };
    let inclusion_upgrade_height = match <CurrentNetwork as Network>::INCLUSION_UPGRADE_HEIGHT() {
        Ok(h) => h,
        Err(e) => {
            return string_error_result(format!("Failed to get inclusion upgrade height: {}", e))
        }
    };
    let inclusion_version = if (latest_height as u32) >= inclusion_upgrade_height {
        InclusionVersion::V1
    } else {
        InclusionVersion::V0
    };
    if let Err(e) = process.verify_execution(
        consensus_version,
        VarunaVersion::V2,
        inclusion_version,
        &execution,
    ) {
        return string_error_result(format!("Execution verification failed: {}", e));
    }

    // Build transaction
    eprintln!("[LOCAL_PROVING] Building transaction");
    let transaction = match TransactionNative::from_execution(execution, fee_optional) {
        Ok(tx) => tx,
        Err(e) => return string_error_result(format!("Failed to build transaction: {}", e)),
    };
    let serialized = transaction.to_string();
    eprintln!("[LOCAL_PROVING] Execution transaction build completed");
    string_success_result(serialized)
}

/// Estimate the minimum execution fee (in microcredits) for a program function.
/// Mirrors the logic in tmp/fee.rs using ConsensusVersion::latest(), generating
/// sample inputs for the target function.
pub fn program_manager_estimate_execution_fee(
    program_source: String,
    function_name: String,
    imports: Vec<String>,
    edition: f64,
    // Returns decimal string of u64 microcredits for consistent error handling via StringResult
) -> ffi::StringResult {
    // Load process
    let mut process = match Process::<CurrentNetwork>::load() {
        Ok(p) => p,
        Err(e) => return string_error_result(format!("Failed to load process: {}", e)),
    };

    // Add program and imports
    let edition_u16 = if edition <= 0.0 { 1u16 } else { edition as u16 };
    // Build imports map once for main program resolution
    let imports_map = match parse_imports_from_pairs(imports.clone()) {
        Ok(m) => m,
        Err(e) => return string_error_result(e),
    };
    // Resolve main program (ID vs source)
    let trimmed = program_source.trim();
    let program_native = if trimmed.ends_with(".aleo") {
        if trimmed == "credits.aleo" {
            match Program::<CurrentNetwork>::credits() {
                Ok(p) => p,
                Err(e) => {
                    return string_error_result(format!(
                        "Failed to load credits.aleo program: {}",
                        e
                    ))
                }
            }
        } else {
            match imports_map.get(trimmed) {
                Some(p) => p.clone(),
                None => {
                    return string_error_result(format!(
                        "Program '{}' not provided in imports. Pass imports[\"{}\"] = <program source>",
                        trimmed, trimmed
                    ));
                }
            }
        }
    } else {
        match Program::<CurrentNetwork>::from_str(&program_source) {
            Ok(p) => p,
            Err(e) => return string_error_result(format!("Failed to parse program: {}", e)),
        }
    };
    // Resolve and add imports recursively (web-style)
    if let Err(e) = program_manager_resolve_imports(&mut process, &program_native, imports) {
        return string_error_result(e);
    }
    // Add main program if not credits and not present
    if program_native.id().to_string() != "credits.aleo"
        && !process.contains_program(program_native.id())
    {
        if let Err(e) = process.add_program(&program_native) {
            return string_error_result(format!("Failed to add program to process: {}", e));
        }
    }

    // Get function
    let function_id = match Identifier::<CurrentNetwork>::from_str(&function_name) {
        Ok(id) => id,
        Err(e) => return string_error_result(format!("Invalid function name: {}", e)),
    };
    let function_native = match program_native.get_function(&function_id) {
        Ok(f) => f,
        Err(e) => {
            return string_error_result(format!(
                "Failed to get function '{}': {}",
                function_name, e
            ))
        }
    };

    // RNG and burner key/address
    let mut rng = StdRng::from_entropy();
    let burner_private_key = match PrivateKey::<CurrentNetwork>::new(&mut rng) {
        Ok(pk) => pk,
        Err(e) => {
            return string_error_result(format!("Failed to create burner private key: {}", e))
        }
    };
    let burner_address = match Address::<CurrentNetwork>::try_from(&burner_private_key) {
        Ok(addr) => addr,
        Err(e) => {
            return string_error_result(format!("Failed to derive address from private key: {}", e))
        }
    };

    // Build sample inputs
    let mut inputs: Vec<Value<CurrentNetwork>> = Vec::new();
    for input_type in function_native.input_types() {
        match input_type {
            ValueType::ExternalRecord(locator) => {
                let stack = match process.get_stack(locator.program_id()) {
                    Ok(s) => s,
                    Err(e) => {
                        return string_error_result(format!("Failed to get external stack: {}", e))
                    }
                };
                let sampled = match stack.sample_value(
                    &burner_address,
                    &ValueType::Record(*locator.resource()).into(),
                    &mut rng,
                ) {
                    Ok(v) => v,
                    Err(e) => {
                        return string_error_result(format!(
                            "Failed to sample external record input: {}",
                            e
                        ))
                    }
                };
                inputs.push(sampled);
            }
            _ => {
                let stack = match process.get_stack(program_native.id()) {
                    Ok(s) => s,
                    Err(e) => {
                        return string_error_result(format!("Failed to get program stack: {}", e))
                    }
                };
                let sampled =
                    match stack.sample_value(&burner_address, &input_type.into(), &mut rng) {
                        Ok(v) => v,
                        Err(e) => {
                            return string_error_result(format!("Failed to sample input: {}", e))
                        }
                    };
                inputs.push(sampled);
            }
        }
    }

    // Authorize
    let authorization = match process.authorize::<CurrentAleo, _>(
        &burner_private_key,
        program_native.id(),
        function_id,
        inputs.iter(),
        &mut rng,
    ) {
        Ok(a) => a,
        Err(e) => return string_error_result(format!("Failed to build authorization: {}", e)),
    };

    // Use latest consensus version
    let consensus_version = ConsensusVersion::latest();

    // Compute minimum execution cost
    let (minimum_cost, _) =
        match execution_cost_for_authorization(&process, &authorization, consensus_version) {
            Ok(tuple) => tuple,
            Err(e) => {
                return string_error_result(format!("Failed to estimate execution fee: {}", e))
            }
        };

    string_success_result(minimum_cost.to_string())
}

/// Estimate minimum execution fee (microcredits) for a program function.
/// Mirrors the logic in tmp/fee.rs using ConsensusVersion::latest(), generating
/// sample inputs for the target function.
pub fn program_manager_estimate_fee_for_authorization(
    program_source: String,
    authorization_handle: u64,
    imports: Vec<String>,
    edition: f64,
) -> ffi::StringResult {
    // Load process
    let mut process = match Process::<CurrentNetwork>::load() {
        Ok(p) => p,
        Err(e) => return string_error_result(format!("Failed to load process: {}", e)),
    };

    // Parse main program from source (web passes full source here)
    let program_native = match Program::<CurrentNetwork>::from_str(&program_source) {
        Ok(p) => p,
        Err(e) => return string_error_result(format!("Failed to parse program: {}", e)),
    };

    // Resolve and add imports (web-style). Imports vector is "name=source".
    if let Err(e) = program_manager_resolve_imports(&mut process, &program_native, imports) {
        return string_error_result(e);
    }

    // Add the main program to the process with edition (skip credits.aleo)
    let edition_u16 = if edition <= 0.0 { 1u16 } else { edition as u16 };
    let program_id = program_native.id();
    if program_id.to_string() != "credits.aleo" && !process.contains_program(program_id) {
        if let Err(e) = process.add_program_with_edition(&program_native, edition_u16) {
            return string_error_result(format!("Failed to add program to process: {}", e));
        }
    }

    // Get authorization by handle
    let storage = ensure_authorization_storage();
    let authorizations = storage.lock().unwrap();
    let Some(authorization) = authorizations.get(&authorization_handle) else {
        return string_error_result("Invalid authorization handle".to_string());
    };

    // Compute minimum execution cost
    let consensus_version = ConsensusVersion::latest();
    let (minimum_cost, _) =
        match execution_cost_for_authorization(&process, authorization, consensus_version) {
            Ok(tuple) => tuple,
            Err(e) => {
                return string_error_result(format!("Failed to estimate execution fee: {}", e))
            }
        };

    string_success_result(minimum_cost.to_string())
}

/// Estimate the minimum deployment fee (in microcredits) for a program.
/// Mirrors the logic in tmp/deploy.rs using ConsensusVersion::latest().
pub fn program_manager_estimate_deployment_fee(
    program_string: String,
    imports: Vec<String>,
) -> ffi::StringResult {
    // Load process
    let mut process = match Process::<CurrentNetwork>::load() {
        Ok(p) => p,
        Err(e) => return string_error_result(format!("Failed to load process: {}", e)),
    };

    // Parse program
    let program = match Program::<CurrentNetwork>::from_str(&program_string) {
        Ok(p) => p,
        Err(e) => return string_error_result(format!("Failed to parse program: {}", e)),
    };

    // Resolve and add imports recursively
    if let Err(e) = program_manager_resolve_imports(&mut process, &program, imports) {
        return string_error_result(e);
    }

    // Create sample deployment
    let mut rng = StdRng::from_entropy();
    let deployment = match process.deploy::<CurrentAleo, _>(&program, &mut rng) {
        Ok(d) => d,
        Err(e) => return string_error_result(format!("Failed to create deployment: {}", e)),
    };

    if deployment.program().functions().is_empty() {
        return string_error_result(
            "Attempted to create an empty transaction deployment".to_string(),
        );
    }

    // Use latest consensus version for estimation
    let consensus_version = ConsensusVersion::latest();

    // Estimate the deployment fee
    let (minimum_deployment_cost, _) =
        match deployment_cost::<CurrentNetwork>(&process, &deployment, consensus_version) {
            Ok(tuple) => tuple,
            Err(e) => {
                return string_error_result(format!("Failed to estimate deployment fee: {}", e))
            }
        };

    string_success_result(minimum_deployment_cost.to_string())
}

/// Build a deployment transaction for an Aleo program.
/// Mirrors the logic in tmp/deploy.rs but adapted for mobile SDK (offline-only, handle-based).
pub fn program_manager_build_deployment_transaction(
    private_key_handle: &ffi::PrivateKeyHandle,
    program: String,
    priority_fee_microcredits: u64,
    fee_record: String,
    url: String, // empty => DEFAULT_URL (not used in offline flow)
    imports: Vec<String>,
    fee_proving_key_handle_id: u64,
    fee_verifying_key_handle_id: u64,
    offline_query_handle_id: u64,
) -> ffi::StringResult {
    // Fetch private key
    let private_key_storage = ensure_private_key_storage();
    let private_keys = private_key_storage.lock().unwrap();
    let Some(private_key_cloned) = private_keys.get(&private_key_handle.id).cloned() else {
        return string_error_result("Invalid private key handle".to_string());
    };
    drop(private_keys);

    // Create process
    let mut process = match Process::<CurrentNetwork>::load() {
        Ok(p) => p,
        Err(e) => return string_error_result(format!("Failed to load process: {}", e)),
    };

    // Parse program
    let program_native = match Program::<CurrentNetwork>::from_str(&program) {
        Ok(p) => p,
        Err(e) => return string_error_result(format!("Failed to parse program: {}", e)),
    };

    // Resolve and add imports recursively
    if let Err(e) = program_manager_resolve_imports(&mut process, &program_native, imports) {
        return string_error_result(e);
    }

    // Create deployment
    let mut rng = StdRng::from_entropy();
    let mut deployment = match process.deploy::<CurrentAleo, _>(&program_native, &mut rng) {
        Ok(d) => d,
        Err(e) => return string_error_result(format!("Failed to create deployment: {}", e)),
    };
    if deployment.program().functions().is_empty() {
        return string_error_result(
            "Attempted to create an empty transaction deployment".to_string(),
        );
    }

    // Get offline query for block height and consensus version (supports both offline and online via TypeScript)
    let (latest_height, offline_query_opt) = if offline_query_handle_id != 0 {
        let storage = crate::ensure_offline_query_storage();
        let offline_query = {
            let map = storage.lock().unwrap();
            let Some(offline_query) = map.get(&offline_query_handle_id) else {
                return string_error_result("Invalid offline query handle".to_string());
            };
            offline_query.clone()
        };
        let height = match offline_query.current_block_height() {
            Ok(h) => h,
            Err(e) => {
                return string_error_result(format!("Failed to get offline block height: {}", e))
            }
        };
        (height, Some(offline_query))
    } else {
        // Online query: TypeScript should have fetched data and created OfflineQuery
        // If handle_id is 0, it means TypeScript didn't provide one, which is an error
        return string_error_result("Offline query required. The TypeScript layer should auto-fetch state root and block height to create OfflineQuery when not provided. This enables online inclusion queries.".to_string());
    };

    // Get consensus version
    let consensus_version = match <CurrentNetwork as Network>::CONSENSUS_VERSION(latest_height) {
        Ok(v) => v,
        Err(e) => return string_error_result(format!("Failed to get consensus version: {}", e)),
    };

    // Set program checksum and owner based on consensus version
    if consensus_version < ConsensusVersion::V9 {
        deployment.set_program_checksum_raw(None);
        deployment.set_program_owner_raw(None);
    } else {
        deployment.set_program_checksum_raw(Some(deployment.program().to_checksum()));
        let address = match Address::<CurrentNetwork>::try_from(&private_key_cloned) {
            Ok(addr) => addr,
            Err(e) => {
                return string_error_result(format!(
                    "Failed to derive address from private key: {}",
                    e
                ))
            }
        };
        deployment.set_program_owner_raw(Some(address));
    }

    // Calculate minimum deployment cost
    let (minimum_deployment_cost, _) =
        match deployment_cost::<CurrentNetwork>(&process, &deployment, consensus_version) {
            Ok(tuple) => tuple,
            Err(e) => {
                return string_error_result(format!(
                    "Failed to calculate minimum deployment cost: {}",
                    e
                ))
            }
        };

    // Validate fee record
    if let Err(e) = validate_fee_record_string(
        &fee_record,
        minimum_deployment_cost,
        priority_fee_microcredits,
    ) {
        return string_error_result(e);
    }

    // Get deployment ID for fee linkage
    let deployment_id = match deployment.to_deployment_id() {
        Ok(id) => id,
        Err(e) => return string_error_result(format!("Failed to get deployment ID: {}", e)),
    };
    let deployment_id_str = deployment_id.to_string();

    // Build fee authorization
    let fee_auth = program_manager_build_fee_authorization(
        deployment_id_str,
        minimum_deployment_cost,
        priority_fee_microcredits,
        private_key_handle,
        fee_record.clone(),
    );
    if !fee_auth.success {
        return string_error_result(format!(
            "Failed to build fee authorization: {}",
            fee_auth.error
        ));
    }

    // Get fee authorization from storage
    let auth_storage = ensure_authorization_storage();
    let authorizations = auth_storage.lock().unwrap();
    let Some(fee_auth_obj) = authorizations.get(&fee_auth.handle).cloned() else {
        return string_error_result("Failed to retrieve fee authorization".to_string());
    };
    drop(authorizations);
    destroy_authorization(fee_auth.handle);

    // Insert fee proving/verifying keys if provided
    if fee_proving_key_handle_id != 0 {
        let credits_id = match ProgramID::<CurrentNetwork>::from_str("credits.aleo") {
            Ok(id) => id,
            Err(e) => {
                return string_error_result(format!("credits.aleo ProgramID parse failed: {}", e))
            }
        };
        let fee_fn_name = if !fee_record.is_empty() {
            "fee_private"
        } else {
            "fee_public"
        };
        let fee_fn_id = match Identifier::<CurrentNetwork>::from_str(fee_fn_name) {
            Ok(id) => id,
            Err(e) => {
                return string_error_result(format!("fee function Identifier parse failed: {}", e))
            }
        };
        // Insert proving key if found
        let pk_storage = crate::ensure_proving_key_storage();
        let pk_map = pk_storage.lock().unwrap();
        if let Some(proving_key_native) = pk_map.get(&fee_proving_key_handle_id) {
            let _ = process.insert_proving_key(&credits_id, &fee_fn_id, proving_key_native.clone());
        }
        drop(pk_map);
        // Insert verifying key if provided
        if fee_verifying_key_handle_id != 0 {
            let vk_storage = crate::ensure_verifying_key_storage();
            let vk_map = vk_storage.lock().unwrap();
            if let Some(verifying_key_native) = vk_map.get(&fee_verifying_key_handle_id) {
                let _ = process.insert_verifying_key(
                    &credits_id,
                    &fee_fn_id,
                    verifying_key_native.clone(),
                );
            }
        }
    }

    // Execute fee authorization
    let mut fee_trace =
        match crate::macros::execute_authorization_native(&process, fee_auth_obj.clone(), &mut rng)
        {
            Ok(trace) => trace,
            Err(e) => {
                return string_error_result(format!("Failed to execute fee authorization: {}", e))
            }
        };

    // Prepare fee inclusion proofs (offline_query_opt is always Some)
    if let Some(ref offline_query) = offline_query_opt {
        if let Err(e) = fee_trace.prepare(offline_query) {
            return string_error_result(format!("Failed to prepare fee inclusion proofs: {}", e));
        }
    } else {
        return string_error_result(
            "Offline query not available for fee inclusion proofs".to_string(),
        );
    }

    // Prove fee
    let fee = match fee_trace.prove_fee::<CurrentAleo, _>(VarunaVersion::V2, &mut rng) {
        Ok(fee) => fee,
        Err(e) => return string_error_result(format!("Failed to prove fee: {}", e)),
    };

    // Create program owner
    let owner = match ProgramOwnerNative::new(&private_key_cloned, deployment_id, &mut rng) {
        Ok(o) => o,
        Err(e) => return string_error_result(format!("Failed to create program owner: {}", e)),
    };

    // Build transaction from deployment
    let transaction = match TransactionNative::from_deployment(owner, deployment, fee) {
        Ok(tx) => tx,
        Err(e) => return string_error_result(format!("Failed to build transaction: {}", e)),
    };
    let serialized = transaction.to_string();
    string_success_result(serialized)
}

/// Load the global inclusion proving key for the network from a proving key handle.
///
/// On mobile, all proving keys — including the inclusion prover — are bundled at compile
/// time via `snarkvm-parameters` (default features) and loaded automatically by
/// `snarkvm-synthesizer`. There is no runtime global-state setter equivalent to the WASM
/// `Network::inclusion_proving_key(Some(bytes))` API on native targets, so this function
/// validates that the provided handle exists rather than attempting an override.
pub fn program_manager_load_inclusion_prover(
    proving_key_handle: &ffi::ProvingKeyHandle,
) -> ffi::BoolResult {
    let storage = ensure_proving_key_storage();
    let map = storage.lock().unwrap();
    let ok = map.contains_key(&proving_key_handle.id);
    bool_success_result(ok)
}
