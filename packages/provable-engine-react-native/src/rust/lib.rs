pub mod account;
pub use account::*;

pub mod encryption;
pub use encryption::*;

pub mod program_manager;
pub use program_manager::*;

pub mod plaintext;
pub use plaintext::*;

pub mod offline_query;
pub use offline_query::*;

pub mod program;
pub use program::*;

pub mod proving_key;
pub use proving_key::*;

pub mod verifying_key;
pub use verifying_key::*;

pub mod synthesizer;
pub use synthesizer::*;

pub mod types;
pub use types::CurrentNetwork;

pub mod transaction;
pub use transaction::*;

pub mod algorithms;
pub use algorithms::*;

pub mod mnemonic;
pub use mnemonic::*;

mod libsodium;

pub mod security;
pub use security::*;

pub mod macros;

mod utilities;
pub use utilities::{
    authorization_error_result, authorization_success_result, bool_error_result,
    bool_success_result, bytes_error_result, bytes_success_result, ensure_address_storage,
    ensure_authorization_storage, ensure_compute_key_storage,
    ensure_private_key_storage,
    ensure_proving_key_storage, ensure_verifying_key_storage, ensure_offline_query_storage,
    ensure_proving_request_storage, ensure_record_ciphertext_storage,
    ensure_record_plaintext_storage, ensure_signature_storage, ensure_view_key_storage,
    error_result, get_next_id, proving_request_error_result, proving_request_success_result,
    signature_error_result, signature_success_result, string_error_result, string_success_result,
    string_vec_error_result, string_vec_success_result, success_result,
};

#[cfg(all(feature = "mainnet", not(feature = "testnet")))]
#[cxx::bridge(namespace = "shield_mainnet")]
pub mod ffi {
    // Shared types between Rust and C++
    pub struct MetadataFFI {
        pub name: String,
        pub locator: String,
        pub prover: String,
        pub verifier: String,
        pub verifying_key: String,
    }
    pub struct PrivateKeyHandle {
        pub id: u64,
    }

    pub struct ProvingKeyHandle {
        pub id: u64,
    }

    pub struct VerifyingKeyHandle {
        pub id: u64,
    }

    pub struct OfflineQueryHandle {
        pub id: u64,
    }

    pub struct AddressHandle {
        pub id: u64,
    }

    pub struct ViewKeyHandle {
        pub id: u64,
    }

    pub struct ComputeKeyHandle {
        pub id: u64,
    }

    pub struct SignatureHandle {
        pub id: u64,
    }

    pub struct RecordCiphertextHandle {
        pub id: u64,
    }

    pub struct RecordPlaintextHandle {
        pub id: u64,
    }

    pub struct AccountResult {
        pub success: bool,
        pub result: String,
        pub error: String,
    }

    pub struct SignatureResult {
        pub success: bool,
        pub signature_handle: u64,
        pub error: String,
    }

    pub struct AuthorizationHandle {
        pub id: u64,
    }

    pub struct ProvingRequestHandle {
        pub id: u64,
    }

    pub struct AuthorizationResult {
        pub success: bool,
        pub handle: u64,
        pub error: String,
    }

    pub struct ProvingRequestResult {
        pub success: bool,
        pub handle: u64,
        pub error: String,
    }

    pub struct BytesResult {
        pub success: bool,
        pub bytes: Vec<u8>,
        pub error: String,
    }

    pub struct StringResult {
        pub success: bool,
        pub result: String,
        pub error: String,
    }

    pub struct StringVecResult {
        pub success: bool,
        pub results: Vec<String>,
        pub error: String,
    }

    pub struct BoolResult {
        pub success: bool,
        pub result: bool,
        pub error: String,
    }

    pub struct HandleResult {
        pub success: bool,
        pub handle: u64,
        pub error: String,
    }

    pub struct TransactionRecordEntry {
        pub commitment: Box<FieldHandle>,
        pub record_handle: u64,
    }

    pub struct TransactionVerifyingKey {
        pub program: String,
        pub function: String,
        pub verifying_key: String,
        pub certificate: String,
    }

    // Rust functions exposed to C++
    extern "Rust" {
        // Algorithm functions
        fn bhp256_hash(bits: Vec<u8>) -> StringResult;
        fn bhp256_hash_to_group(bits: Vec<u8>) -> StringResult;
        fn bhp256_commit(bits: Vec<u8>, scalar: String) -> StringResult;
        fn bhp256_commit_to_group(bits: Vec<u8>, scalar: String) -> StringResult;

        fn bhp512_hash(bits: Vec<u8>) -> StringResult;
        fn bhp512_hash_to_group(bits: Vec<u8>) -> StringResult;
        fn bhp512_commit(bits: Vec<u8>, scalar: String) -> StringResult;
        fn bhp512_commit_to_group(bits: Vec<u8>, scalar: String) -> StringResult;

        fn bhp768_hash(bits: Vec<u8>) -> StringResult;
        fn bhp768_hash_to_group(bits: Vec<u8>) -> StringResult;
        fn bhp768_commit(bits: Vec<u8>, scalar: String) -> StringResult;
        fn bhp768_commit_to_group(bits: Vec<u8>, scalar: String) -> StringResult;

        fn bhp1024_hash(bits: Vec<u8>) -> StringResult;
        fn bhp1024_hash_to_group(bits: Vec<u8>) -> StringResult;
        fn bhp1024_commit(bits: Vec<u8>, scalar: String) -> StringResult;
        fn bhp1024_commit_to_group(bits: Vec<u8>, scalar: String) -> StringResult;

        fn pedersen64_hash(bits: Vec<u8>) -> StringResult;
        fn pedersen64_commit(bits: Vec<u8>, scalar: String) -> StringResult;
        fn pedersen64_commit_to_group(bits: Vec<u8>, scalar: String) -> StringResult;

        fn pedersen128_hash(bits: Vec<u8>) -> StringResult;
        fn pedersen128_commit(bits: Vec<u8>, scalar: String) -> StringResult;
        fn pedersen128_commit_to_group(bits: Vec<u8>, scalar: String) -> StringResult;

        fn poseidon2_hash(fields: Vec<String>) -> StringResult;
        fn poseidon2_hash_to_scalar(fields: Vec<String>) -> StringResult;
        fn poseidon2_hash_to_group(fields: Vec<String>) -> StringResult;
        fn poseidon2_hash_many(fields: Vec<String>, rate: u32) -> StringVecResult;

        fn poseidon4_hash(fields: Vec<String>) -> StringResult;
        fn poseidon4_hash_to_scalar(fields: Vec<String>) -> StringResult;
        fn poseidon4_hash_to_group(fields: Vec<String>) -> StringResult;
        fn poseidon4_hash_many(fields: Vec<String>, rate: u32) -> StringVecResult;

        fn poseidon8_hash(fields: Vec<String>) -> StringResult;
        fn poseidon8_hash_to_scalar(fields: Vec<String>) -> StringResult;
        fn poseidon8_hash_to_group(fields: Vec<String>) -> StringResult;
        fn poseidon8_hash_many(fields: Vec<String>, rate: u32) -> StringVecResult;

        // Private key functions
        fn create_private_key() -> PrivateKeyHandle;
        fn private_key_from_seed(seed: Vec<u8>) -> PrivateKeyHandle;
        fn private_key_from_string(private_key_str: String) -> PrivateKeyHandle;
        fn private_key_to_string(handle: &PrivateKeyHandle) -> AccountResult;
        fn private_key_to_address(handle: &PrivateKeyHandle) -> AddressHandle;
        fn private_key_to_view_key(handle: &PrivateKeyHandle) -> ViewKeyHandle;
        fn private_key_to_compute_key(handle: &PrivateKeyHandle) -> ComputeKeyHandle;
        fn private_key_sign(handle: &PrivateKeyHandle, message: Vec<u8>) -> SignatureResult;
        fn validate_private_key(private_key_str: String) -> bool;
        fn destroy_private_key(handle: &PrivateKeyHandle);
        fn private_key_from_seed_unchecked(seed: Vec<u8>) -> PrivateKeyHandle;

        // Address functions
        fn address_from_string(address_str: String) -> AddressHandle;
        fn address_to_string(handle: &AddressHandle) -> AccountResult;
        fn address_verify(
            handle: &AddressHandle,
            message: Vec<u8>,
            signature_handle: &SignatureHandle,
        ) -> bool;
        fn validate_address(address_str: String) -> bool;
        fn destroy_address(handle: &AddressHandle);

        // View key functions
        fn view_key_from_string(view_key_str: String) -> ViewKeyHandle;
        fn view_key_to_string(handle: &ViewKeyHandle) -> AccountResult;
        fn view_key_to_address(handle: &ViewKeyHandle) -> AddressHandle;
        fn view_key_to_field(handle: &ViewKeyHandle) -> Result<Box<FieldHandle>>;
        fn view_key_to_bytes_le(handle: &ViewKeyHandle) -> Result<Vec<u8>>;
        fn view_key_from_bytes_le(bytes: Vec<u8>) -> ViewKeyHandle;
        fn view_key_decrypt(handle: &ViewKeyHandle, ciphertext: String) -> HandleResult;
        fn validate_view_key(view_key_str: String) -> bool;
        fn destroy_view_key(handle: &ViewKeyHandle);

        // Compute key functions
        fn compute_key_from_string(compute_key_str: String) -> ComputeKeyHandle;
        fn compute_key_to_string(handle: &ComputeKeyHandle) -> AccountResult;
        fn validate_compute_key(compute_key_str: String) -> bool;
        fn destroy_compute_key(handle: &ComputeKeyHandle);

        // Graph key functions
        fn graph_key_from_private_key(private_key_str: String) -> AccountResult;

        // Signature functions
        fn signature_from_string(signature_str: String) -> SignatureHandle;
        fn signature_to_string(handle: &SignatureHandle) -> AccountResult;
        fn validate_signature(signature_str: String) -> bool;
        fn destroy_signature(handle: &SignatureHandle);

        // Record ciphertext functions
        fn record_ciphertext_from_string(ciphertext_str: String) -> RecordCiphertextHandle;
        fn record_ciphertext_to_string(handle: &RecordCiphertextHandle) -> AccountResult;
        fn record_ciphertext_is_owner(
            handle: &RecordCiphertextHandle,
            view_key_handle: &ViewKeyHandle,
        ) -> bool;
        fn validate_record_ciphertext(ciphertext_str: String) -> bool;
        fn destroy_record_ciphertext(handle: &RecordCiphertextHandle);

        // Record plaintext functions
        fn record_plaintext_from_string(plaintext_str: String) -> RecordPlaintextHandle;
        fn record_plaintext_to_string(handle: &RecordPlaintextHandle) -> AccountResult;
        fn validate_record_plaintext(plaintext_str: String) -> bool;
        fn destroy_record_plaintext(handle: &RecordPlaintextHandle);
        fn record_plaintext_to_commitment(
            record_str: String,
            program_id: String,
            record_name: String,
            view_key_handle: &ViewKeyHandle,
        ) -> StringResult;
        fn record_plaintext_to_serial_number(
            record_str: String,
            private_key_handle: &PrivateKeyHandle,
            program_id: String,
            record_name: String,
            record_view_key: String,
        ) -> StringResult;

        // Plaintext functions
        type PlaintextHandle;
        fn plaintext_from_string(value: &str) -> Result<Box<PlaintextHandle>>;
        fn plaintext_from_bytes(bytes: Vec<u8>) -> Result<Box<PlaintextHandle>>;
        fn plaintext_from_bits(bits: Vec<u8>) -> Result<Box<PlaintextHandle>>;
        fn plaintext_from_fields(fields: Vec<String>) -> Result<Box<PlaintextHandle>>;
        fn plaintext_clone(self: &PlaintextHandle) -> Box<PlaintextHandle>;
        fn plaintext_to_string(self: &PlaintextHandle) -> String;
        fn plaintext_to_bytes(self: &PlaintextHandle) -> BytesResult;
        fn plaintext_to_bits(self: &PlaintextHandle) -> BytesResult;
        fn plaintext_to_fields(self: &PlaintextHandle) -> Result<Vec<String>>;
        fn plaintext_type(self: &PlaintextHandle) -> String;
        fn plaintext_find(self: &PlaintextHandle, name: &str) -> Result<Box<PlaintextHandle>>;
        fn plaintext_encrypt(
            self: &PlaintextHandle,
            address: &str,
            randomizer: &str,
        ) -> StringResult;
        fn plaintext_encrypt_symmetric(
            self: &PlaintextHandle,
            transition_view_key: &str,
        ) -> StringResult;
        fn plaintext_to_object(self: &PlaintextHandle) -> StringResult;

        // Program functions
        type ProgramHandle;
        fn program_from_string(program: &str) -> Result<Box<ProgramHandle>>;
        fn program_clone(self: &ProgramHandle) -> Box<ProgramHandle>;
        fn program_to_string(self: &ProgramHandle) -> String;
        fn program_has_function(self: &ProgramHandle, function_name: &str) -> bool;
        fn program_get_functions(self: &ProgramHandle) -> Vec<String>;
        fn program_get_function_inputs(self: &ProgramHandle, function_name: &str)
            -> Result<String>;
        fn program_get_mappings(self: &ProgramHandle) -> Result<String>;
        fn program_get_record_members(self: &ProgramHandle, record_name: &str) -> Result<String>;
        fn program_get_struct_members(self: &ProgramHandle, struct_name: &str) -> Result<String>;
        fn program_get_imports(self: &ProgramHandle) -> Vec<String>;
        fn program_id(self: &ProgramHandle) -> String;
        fn program_address(self: &ProgramHandle) -> Result<String>;
        fn program_is_equal(self: &ProgramHandle, other: &ProgramHandle) -> bool;
        fn program_get_credits_program() -> Result<Box<ProgramHandle>>;

        // Transaction functions
        type TransactionHandle;
        type FieldHandle;
        type GroupHandle;
        type ScalarHandle;
        fn transaction_from_string(transaction: &str) -> Result<Box<TransactionHandle>>;
        fn transaction_from_bytes_le(bytes: Vec<u8>) -> Result<Box<TransactionHandle>>;
        fn transaction_clone(self: &TransactionHandle) -> Box<TransactionHandle>;
        fn transaction_to_string(self: &TransactionHandle) -> String;
        fn transaction_to_bytes_le(self: &TransactionHandle) -> BytesResult;
        fn transaction_id(self: &TransactionHandle) -> String;
        fn transaction_type(self: &TransactionHandle) -> String;
        fn transaction_base_fee_amount(self: &TransactionHandle) -> u64;
        fn transaction_fee_amount(self: &TransactionHandle) -> u64;
        fn transaction_priority_fee_amount(self: &TransactionHandle) -> u64;
        fn transaction_is_deploy(self: &TransactionHandle) -> bool;
        fn transaction_is_execute(self: &TransactionHandle) -> bool;
        fn transaction_is_fee(self: &TransactionHandle) -> bool;
        fn transaction_contains_serial_number(
            self: &TransactionHandle,
            serial_number_handle: &FieldHandle,
        ) -> bool;
        fn transaction_contains_commitment(
            self: &TransactionHandle,
            commitment_handle: &FieldHandle,
        ) -> bool;
        fn transaction_find_record(
            self: &TransactionHandle,
            commitment_handle: &FieldHandle,
        ) -> HandleResult;
        fn transaction_owned_records(
            self: &TransactionHandle,
            view_key_handle: &ViewKeyHandle,
        ) -> Vec<u64>;
        fn transaction_records(self: &TransactionHandle) -> Vec<TransactionRecordEntry>;
        fn transaction_deployed_program(self: &TransactionHandle) -> Result<Box<ProgramHandle>>;
        fn transaction_verifying_keys(self: &TransactionHandle) -> Vec<TransactionVerifyingKey>;
        fn transaction_transitions(self: &TransactionHandle) -> Vec<String>;
        fn transaction_summary(self: &TransactionHandle) -> Result<String>;

        // Field functions
        fn field_from_string(field_str: String) -> Result<Box<FieldHandle>>;
        fn field_clone(self: &FieldHandle) -> Result<Box<FieldHandle>>;
        fn field_multiply_handles(
            self: &FieldHandle,
            rhs: &FieldHandle,
        ) -> Result<Box<FieldHandle>>;
        fn field_to_string(self: &FieldHandle) -> String;
        fn validate_field(field_str: String) -> bool;
        fn field_normalize(field_str: String) -> StringResult;
        fn field_multiply(lhs: String, rhs: String) -> StringResult;
        fn field_to_bits_le(field_str: String) -> BytesResult;
        fn field_to_bits_le_handle(self: &FieldHandle) -> BytesResult;
        fn field_one() -> Box<FieldHandle>;
        fn field_new_domain_separator(domain: String) -> Box<FieldHandle>;

        // Group functions
        fn group_from_string(group_str: String) -> Result<Box<GroupHandle>>;
        fn group_clone(self: &GroupHandle) -> Result<Box<GroupHandle>>;
        fn group_to_string(self: &GroupHandle) -> String;
        fn validate_group(group_str: String) -> bool;

        // Scalar functions
        fn scalar_from_string(scalar_str: String) -> Result<Box<ScalarHandle>>;
        fn scalar_clone(self: &ScalarHandle) -> Result<Box<ScalarHandle>>;
        fn scalar_to_string(self: &ScalarHandle) -> String;
        fn validate_scalar(scalar_str: String) -> bool;

        // Encryption utility functions
        fn generate_record_view_key(
            view_key_handle: &ViewKeyHandle,
            record_ciphertext_handle: &RecordCiphertextHandle,
        ) -> Result<Box<FieldHandle>>;
        fn generate_transition_view_key(
            view_key_handle: &ViewKeyHandle,
            transition_public_key_handle: &GroupHandle,
        ) -> Result<Box<FieldHandle>>;

        // Authorization functions
        fn authorization_from_string(authorization_str: String) -> AuthorizationResult;
        fn authorization_from_bytes_le(bytes: Vec<u8>) -> AuthorizationResult;
        fn authorization_from_requests_and_transitions(
            requests: Vec<String>,
            transitions: Vec<String>,
        ) -> AuthorizationResult;
        fn authorization_to_string(handle: u64) -> StringResult;
        fn authorization_to_bytes_le(handle: u64) -> BytesResult;
        fn authorization_to_json(handle: u64) -> StringResult;
        fn authorization_get_requests(handle: u64) -> StringResult;
        fn authorization_get_transitions(handle: u64) -> StringResult;
        fn authorization_insert_transition(
            handle: u64,
            transition_str: String,
        ) -> AuthorizationResult;
        fn authorization_replicate(handle: u64) -> AuthorizationResult;
        fn authorization_verify(handle: u64) -> bool;
        fn authorization_equals(handle1: u64, handle2: u64) -> bool;
        fn authorization_len(handle: u64) -> f64;
        fn authorization_is_empty(handle: u64) -> bool;
        fn authorization_is_fee_private(handle: u64) -> bool;
        fn authorization_is_fee_public(handle: u64) -> bool;
        fn authorization_is_split(handle: u64) -> bool;
        fn authorization_to_execution_id(handle: u64) -> StringResult;
        fn destroy_authorization(handle: u64);

        // ProvingRequest functions
        fn proving_request_from_string(proving_request_str: String) -> ProvingRequestResult;
        fn proving_request_from_bytes_le(bytes: Vec<u8>) -> ProvingRequestResult;
        fn proving_request_from_authorizations(
            auth_handle: u64,
            fee_auth_handle: u64,
            broadcast: bool,
        ) -> ProvingRequestResult;
        fn proving_request_to_string(handle: u64) -> StringResult;
        fn proving_request_to_bytes_le(handle: u64) -> BytesResult;
        fn proving_request_to_json(handle: u64) -> StringResult;
        fn proving_request_get_authorization(handle: u64) -> AuthorizationResult;
        fn proving_request_get_fee_authorization(handle: u64) -> AuthorizationResult;
        fn proving_request_get_broadcast(handle: u64) -> bool;
        fn proving_request_replicate(handle: u64) -> ProvingRequestResult;
        fn proving_request_verify(handle: u64) -> bool;
        fn proving_request_equals(handle1: u64, handle2: u64) -> bool;
        fn destroy_proving_request(handle: u64);

        // Program Manager functions
        fn program_manager_build_authorization(
            program_name: String,
            function_name: String,
            inputs: Vec<String>,
            private_key_handle: &PrivateKeyHandle,
            program_source: String,
            program_imports: Vec<String>,
            edition: f64,
        ) -> AuthorizationResult;
        fn program_manager_build_fee_authorization(
            deployment_or_execution_id: String,
            base_fee_credits: u64,
            priority_fee_credits: u64,
            private_key_handle: &PrivateKeyHandle,
            fee_record: String,
        ) -> AuthorizationResult;
        fn program_manager_build_execution_transaction(
            private_key_handle: &PrivateKeyHandle,
            program_source: String,
            function_name: String,
            inputs: Vec<String>,
            priority_fee_credits: u64,
            fee_record: String,
            url: String,
            imports: Vec<String>,
            fee_proving_key_handle_id: u64,
            fee_verifying_key_handle_id: u64,
            offline_query_handle_id: u64,
            edition: f64,
        ) -> StringResult;
        fn program_manager_build_proving_request(
            private_key_handle: &PrivateKeyHandle,
            program: String,
            function_name: String,
            inputs: Vec<String>,
            base_fee_credits: u64,
            priority_fee_credits: u64,
            fee_record: String,
            imports: Vec<String>,
            broadcast: bool,
            unchecked: bool,
            edition: f64,
            use_fee_master: bool,
        ) -> ProvingRequestResult;
        fn program_manager_load_inclusion_prover(proving_key_handle: &ProvingKeyHandle) -> BoolResult;
        fn program_manager_estimate_execution_fee(
            program: String,
            function_name: String,
            imports: Vec<String>,
            edition: f64,
        ) -> StringResult;
        fn program_manager_estimate_fee_for_authorization(
            program_source: String,
            authorization_handle: u64,
            imports: Vec<String>,
            edition: f64,
        ) -> StringResult;
        fn program_manager_estimate_deployment_fee(
            program_string: String,
            imports: Vec<String>,
        ) -> StringResult;
        fn program_manager_build_deployment_transaction(
            private_key_handle: &PrivateKeyHandle,
            program: String,
            priority_fee_credits: u64,
            fee_record: String,
            url: String,
            imports: Vec<String>,
            fee_proving_key_handle_id: u64,
            fee_verifying_key_handle_id: u64,
            offline_query_handle_id: u64,
        ) -> StringResult;


        // ProvingKey functions
        fn proving_key_from_bytes(bytes: Vec<u8>) -> HandleResult;
        fn proving_key_to_bytes(handle: &ProvingKeyHandle) -> BytesResult;
        fn proving_key_from_string(string: String) -> HandleResult;
        fn proving_key_checksum(handle: &ProvingKeyHandle) -> StringResult;
        fn proving_key_copy(handle: &ProvingKeyHandle) -> HandleResult;
        fn destroy_proving_key(handle: &ProvingKeyHandle);
        // ProvingKey type checks requiring metadata JSON
        fn proving_key_is_bond_public_prover_with_metadata(handle: &ProvingKeyHandle, metadata_json: String) -> bool;
        fn proving_key_is_bond_validator_prover_with_metadata(handle: &ProvingKeyHandle, metadata_json: String) -> bool;
        fn proving_key_is_claim_unbond_public_prover_with_metadata(handle: &ProvingKeyHandle, metadata_json: String) -> bool;
        fn proving_key_is_fee_private_prover_with_metadata(handle: &ProvingKeyHandle, metadata_json: String) -> bool;
        fn proving_key_is_fee_public_prover_with_metadata(handle: &ProvingKeyHandle, metadata_json: String) -> bool;
        fn proving_key_is_inclusion_prover_with_metadata(handle: &ProvingKeyHandle, metadata_json: String) -> bool;
        fn proving_key_is_join_prover_with_metadata(handle: &ProvingKeyHandle, metadata_json: String) -> bool;
        fn proving_key_is_set_validator_state_prover_with_metadata(handle: &ProvingKeyHandle, metadata_json: String) -> bool;
        fn proving_key_is_split_prover_with_metadata(handle: &ProvingKeyHandle, metadata_json: String) -> bool;
        fn proving_key_is_transfer_private_prover_with_metadata(handle: &ProvingKeyHandle, metadata_json: String) -> bool;
        fn proving_key_is_transfer_private_to_public_prover_with_metadata(handle: &ProvingKeyHandle, metadata_json: String) -> bool;
        fn proving_key_is_transfer_public_prover_with_metadata(handle: &ProvingKeyHandle, metadata_json: String) -> bool;
        fn proving_key_is_transfer_public_as_signer_prover_with_metadata(handle: &ProvingKeyHandle, metadata_json: String) -> bool;
        fn proving_key_is_transfer_public_to_private_prover_with_metadata(handle: &ProvingKeyHandle, metadata_json: String) -> bool;
        fn proving_key_is_unbond_public_prover_with_metadata(handle: &ProvingKeyHandle, metadata_json: String) -> bool;


        fn verifying_key_from_bytes(bytes: Vec<u8>) -> HandleResult;
        fn verifying_key_from_string(string: String) -> HandleResult;
        fn verifying_key_to_bytes(handle: &VerifyingKeyHandle) -> BytesResult;
        fn verifying_key_checksum(handle: &VerifyingKeyHandle) -> StringResult;
        fn verifying_key_num_constraints(handle: &VerifyingKeyHandle) -> f64;
        fn verifying_key_copy(handle: &VerifyingKeyHandle) -> HandleResult;
        fn destroy_verifying_key(handle: &VerifyingKeyHandle);
        fn verifying_key_bond_public_verifier() -> HandleResult;
        fn verifying_key_bond_validator_verifier() -> HandleResult;
        fn verifying_key_claim_unbond_public_verifier() -> HandleResult;
        fn verifying_key_fee_private_verifier() -> HandleResult;
        fn verifying_key_fee_public_verifier() -> HandleResult;
        fn verifying_key_inclusion_verifier() -> HandleResult;
        fn verifying_key_join_verifier() -> HandleResult;
        fn verifying_key_set_validator_state_verifier() -> HandleResult;
        fn verifying_key_split_verifier() -> HandleResult;
        fn verifying_key_transfer_private_verifier() -> HandleResult;
        fn verifying_key_transfer_private_to_public_verifier() -> HandleResult;
        fn verifying_key_transfer_public_verifier() -> HandleResult;
        fn verifying_key_transfer_public_as_signer_verifier() -> HandleResult;
        fn verifying_key_transfer_public_to_private_verifier() -> HandleResult;
        fn verifying_key_unbond_public_verifier() -> HandleResult;
        fn verifying_key_is_bond_public_verifier(handle: &VerifyingKeyHandle) -> bool;
        fn verifying_key_is_bond_validator_verifier(handle: &VerifyingKeyHandle) -> bool;
        fn verifying_key_is_claim_unbond_public_verifier(handle: &VerifyingKeyHandle) -> bool;
        fn verifying_key_is_fee_private_verifier(handle: &VerifyingKeyHandle) -> bool;
        fn verifying_key_is_fee_public_verifier(handle: &VerifyingKeyHandle) -> bool;
        fn verifying_key_is_inclusion_verifier(handle: &VerifyingKeyHandle) -> bool;
        fn verifying_key_is_join_verifier(handle: &VerifyingKeyHandle) -> bool;
        fn verifying_key_is_set_validator_state_verifier(handle: &VerifyingKeyHandle) -> bool;
        fn verifying_key_is_split_verifier(handle: &VerifyingKeyHandle) -> bool;
        fn verifying_key_is_transfer_private_verifier(handle: &VerifyingKeyHandle) -> bool;
        fn verifying_key_is_transfer_private_to_public_verifier(handle: &VerifyingKeyHandle) -> bool;
        fn verifying_key_is_transfer_public_verifier(handle: &VerifyingKeyHandle) -> bool;
        fn verifying_key_is_transfer_public_as_signer_verifier(handle: &VerifyingKeyHandle) -> bool;
        fn verifying_key_is_transfer_public_to_private_verifier(handle: &VerifyingKeyHandle) -> bool;
        fn verifying_key_is_unbond_public_verifier(handle: &VerifyingKeyHandle) -> bool;


        // OfflineQuery functions (JSON bytes)
        fn offline_query_from_bytes(bytes: Vec<u8>) -> HandleResult;
        fn offline_query_from_string(string: String) -> HandleResult;
        fn offline_query_to_bytes(handle: &OfflineQueryHandle) -> BytesResult;
        fn offline_query_add_block_height(handle: &OfflineQueryHandle, height: f64) -> BoolResult;
        fn offline_query_add_state_path(handle: &OfflineQueryHandle, commitment: String, state_path: String) -> BoolResult;
        fn destroy_offline_query(handle: &OfflineQueryHandle);
        
        // Metadata helpers - now accept network parameter for runtime selection
        fn metadata_bond_public(network: String) -> MetadataFFI;
        fn metadata_bond_validator(network: String) -> MetadataFFI;
        fn metadata_claim_unbond_public(network: String) -> MetadataFFI;
        fn metadata_fee_private(network: String) -> MetadataFFI;
        fn metadata_fee_public(network: String) -> MetadataFFI;
        fn metadata_inclusion(network: String) -> MetadataFFI;
        fn metadata_join(network: String) -> MetadataFFI;
        fn metadata_set_validator_state(network: String) -> MetadataFFI;
        fn metadata_split(network: String) -> MetadataFFI;
        fn metadata_transfer_private(network: String) -> MetadataFFI;
        fn metadata_transfer_private_to_public(network: String) -> MetadataFFI;
        fn metadata_transfer_public(network: String) -> MetadataFFI;
        fn metadata_transfer_public_as_signer(network: String) -> MetadataFFI;
        fn metadata_transfer_public_to_private(network: String) -> MetadataFFI;
        fn metadata_unbond_public(network: String) -> MetadataFFI;

        // Mnemonic functions
        fn generate_mnemonic() -> StringResult;
        fn verify_mnemonic(mnemonic: String) -> BoolResult;

        // Security utilities
        fn crypto_box_seal_base64(public_key_b64: String, message: Vec<u8>) -> StringResult;
        fn crypto_box_seal_open_base64(
            public_key_b64: String,
            private_key_b64: String,
            sealed_b64: String,
        ) -> BytesResult;
    }
}

// Unified metadata implementations that work with both networks at runtime
pub mod metadata_ffi_impl {
    use super::ffi::MetadataFFI;
    use crate::verifying_key::Metadata;

    fn handle_metadata_result(result: Result<Metadata, String>) -> MetadataFFI {
        match result {
            Ok(metadata) => {
                metadata.into_ffi()
            }
            Err(_e) => {
                // Return empty metadata on error - C++ layer should handle this
                // Alternatively, we could panic or return an error struct
                MetadataFFI {
                    name: String::new(),
                    locator: String::new(),
                    prover: String::new(),
                    verifier: String::new(),
                    verifying_key: String::new(),
                }
            }
        }
    }

    pub fn metadata_bond_public(network: String) -> MetadataFFI {
        handle_metadata_result(Metadata::bond_public(&network))
    }

    pub fn metadata_bond_validator(network: String) -> MetadataFFI {
        handle_metadata_result(Metadata::bond_validator(&network))
    }

    pub fn metadata_claim_unbond_public(network: String) -> MetadataFFI {
        handle_metadata_result(Metadata::claim_unbond_public(&network))
    }

    pub fn metadata_fee_private(network: String) -> MetadataFFI {
        handle_metadata_result(Metadata::fee_private(&network))
    }

    pub fn metadata_fee_public(network: String) -> MetadataFFI {
        handle_metadata_result(Metadata::fee_public(&network))
    }

    pub fn metadata_inclusion(network: String) -> MetadataFFI {
        handle_metadata_result(Metadata::inclusion(&network))
    }

    pub fn metadata_join(network: String) -> MetadataFFI {
        handle_metadata_result(Metadata::join(&network))
    }

    pub fn metadata_set_validator_state(network: String) -> MetadataFFI {
        handle_metadata_result(Metadata::set_validator_state(&network))
    }

    pub fn metadata_split(network: String) -> MetadataFFI {
        handle_metadata_result(Metadata::split(&network))
    }

    pub fn metadata_transfer_private(network: String) -> MetadataFFI {
        handle_metadata_result(Metadata::transfer_private(&network))
    }

    pub fn metadata_transfer_private_to_public(network: String) -> MetadataFFI {
        handle_metadata_result(Metadata::transfer_private_to_public(&network))
    }

    pub fn metadata_transfer_public(network: String) -> MetadataFFI {
        handle_metadata_result(Metadata::transfer_public(&network))
    }

    pub fn metadata_transfer_public_as_signer(network: String) -> MetadataFFI {
        handle_metadata_result(Metadata::transfer_public_as_signer(&network))
    }

    pub fn metadata_transfer_public_to_private(network: String) -> MetadataFFI {
        handle_metadata_result(Metadata::transfer_public_to_private(&network))
    }

    pub fn metadata_unbond_public(network: String) -> MetadataFFI {
        handle_metadata_result(Metadata::unbond_public(&network))
    }
}

// Re-export the metadata functions at crate root so extern "Rust" can find them
pub use metadata_ffi_impl::{
    metadata_bond_public,
    metadata_bond_validator,
    metadata_claim_unbond_public,
    metadata_fee_private,
    metadata_fee_public,
    metadata_inclusion,
    metadata_join,
    metadata_set_validator_state,
    metadata_split,
    metadata_transfer_private,
    metadata_transfer_private_to_public,
    metadata_transfer_public,
    metadata_transfer_public_as_signer,
    metadata_transfer_public_to_private,
    metadata_unbond_public,
};
#[cfg(all(feature = "testnet", not(feature = "mainnet")))]
#[cxx::bridge(namespace = "shield_testnet")]
pub mod ffi {
    // Shared types between Rust and C++
    pub struct MetadataFFI {
        pub name: String,
        pub locator: String,
        pub prover: String,
        pub verifier: String,
        pub verifying_key: String,
    }
    pub struct PrivateKeyHandle {
        pub id: u64,
    }

    pub struct ProvingKeyHandle {
        pub id: u64,
    }

    pub struct VerifyingKeyHandle {
        pub id: u64,
    }

    pub struct OfflineQueryHandle {
        pub id: u64,
    }

    pub struct AddressHandle {
        pub id: u64,
    }

    pub struct ViewKeyHandle {
        pub id: u64,
    }

    pub struct ComputeKeyHandle {
        pub id: u64,
    }

    pub struct SignatureHandle {
        pub id: u64,
    }

    pub struct RecordCiphertextHandle {
        pub id: u64,
    }

    pub struct RecordPlaintextHandle {
        pub id: u64,
    }

    pub struct AccountResult {
        pub success: bool,
        pub result: String,
        pub error: String,
    }

    pub struct SignatureResult {
        pub success: bool,
        pub signature_handle: u64,
        pub error: String,
    }

    pub struct AuthorizationHandle {
        pub id: u64,
    }

    pub struct ProvingRequestHandle {
        pub id: u64,
    }

    pub struct AuthorizationResult {
        pub success: bool,
        pub handle: u64,
        pub error: String,
    }

    pub struct ProvingRequestResult {
        pub success: bool,
        pub handle: u64,
        pub error: String,
    }

    pub struct BytesResult {
        pub success: bool,
        pub bytes: Vec<u8>,
        pub error: String,
    }

    pub struct StringResult {
        pub success: bool,
        pub result: String,
        pub error: String,
    }

    pub struct StringVecResult {
        pub success: bool,
        pub results: Vec<String>,
        pub error: String,
    }

    pub struct BoolResult {
        pub success: bool,
        pub result: bool,
        pub error: String,
    }

    pub struct HandleResult {
        pub success: bool,
        pub handle: u64,
        pub error: String,
    }

    pub struct TransactionRecordEntry {
        pub commitment: Box<FieldHandle>,
        pub record_handle: u64,
    }

    pub struct TransactionVerifyingKey {
        pub program: String,
        pub function: String,
        pub verifying_key: String,
        pub certificate: String,
    }

    // Rust functions exposed to C++
    extern "Rust" {
        // Algorithm functions
        fn bhp256_hash(bits: Vec<u8>) -> StringResult;
        fn bhp256_hash_to_group(bits: Vec<u8>) -> StringResult;
        fn bhp256_commit(bits: Vec<u8>, scalar: String) -> StringResult;
        fn bhp256_commit_to_group(bits: Vec<u8>, scalar: String) -> StringResult;

        fn bhp512_hash(bits: Vec<u8>) -> StringResult;
        fn bhp512_hash_to_group(bits: Vec<u8>) -> StringResult;
        fn bhp512_commit(bits: Vec<u8>, scalar: String) -> StringResult;
        fn bhp512_commit_to_group(bits: Vec<u8>, scalar: String) -> StringResult;

        fn bhp768_hash(bits: Vec<u8>) -> StringResult;
        fn bhp768_hash_to_group(bits: Vec<u8>) -> StringResult;
        fn bhp768_commit(bits: Vec<u8>, scalar: String) -> StringResult;
        fn bhp768_commit_to_group(bits: Vec<u8>, scalar: String) -> StringResult;

        fn bhp1024_hash(bits: Vec<u8>) -> StringResult;
        fn bhp1024_hash_to_group(bits: Vec<u8>) -> StringResult;
        fn bhp1024_commit(bits: Vec<u8>, scalar: String) -> StringResult;
        fn bhp1024_commit_to_group(bits: Vec<u8>, scalar: String) -> StringResult;

        fn pedersen64_hash(bits: Vec<u8>) -> StringResult;
        fn pedersen64_commit(bits: Vec<u8>, scalar: String) -> StringResult;
        fn pedersen64_commit_to_group(bits: Vec<u8>, scalar: String) -> StringResult;

        fn pedersen128_hash(bits: Vec<u8>) -> StringResult;
        fn pedersen128_commit(bits: Vec<u8>, scalar: String) -> StringResult;
        fn pedersen128_commit_to_group(bits: Vec<u8>, scalar: String) -> StringResult;

        fn poseidon2_hash(fields: Vec<String>) -> StringResult;
        fn poseidon2_hash_to_scalar(fields: Vec<String>) -> StringResult;
        fn poseidon2_hash_to_group(fields: Vec<String>) -> StringResult;
        fn poseidon2_hash_many(fields: Vec<String>, rate: u32) -> StringVecResult;

        fn poseidon4_hash(fields: Vec<String>) -> StringResult;
        fn poseidon4_hash_to_scalar(fields: Vec<String>) -> StringResult;
        fn poseidon4_hash_to_group(fields: Vec<String>) -> StringResult;
        fn poseidon4_hash_many(fields: Vec<String>, rate: u32) -> StringVecResult;

        fn poseidon8_hash(fields: Vec<String>) -> StringResult;
        fn poseidon8_hash_to_scalar(fields: Vec<String>) -> StringResult;
        fn poseidon8_hash_to_group(fields: Vec<String>) -> StringResult;
        fn poseidon8_hash_many(fields: Vec<String>, rate: u32) -> StringVecResult;

        // Private key functions
        fn create_private_key() -> PrivateKeyHandle;
        fn private_key_from_seed(seed: Vec<u8>) -> PrivateKeyHandle;
        fn private_key_from_string(private_key_str: String) -> PrivateKeyHandle;
        fn private_key_to_string(handle: &PrivateKeyHandle) -> AccountResult;
        fn private_key_to_address(handle: &PrivateKeyHandle) -> AddressHandle;
        fn private_key_to_view_key(handle: &PrivateKeyHandle) -> ViewKeyHandle;
        fn private_key_to_compute_key(handle: &PrivateKeyHandle) -> ComputeKeyHandle;
        fn private_key_sign(handle: &PrivateKeyHandle, message: Vec<u8>) -> SignatureResult;
        fn validate_private_key(private_key_str: String) -> bool;
        fn destroy_private_key(handle: &PrivateKeyHandle);
        fn private_key_from_seed_unchecked(seed: Vec<u8>) -> PrivateKeyHandle;

        // Address functions
        fn address_from_string(address_str: String) -> AddressHandle;
        fn address_to_string(handle: &AddressHandle) -> AccountResult;
        fn address_verify(
            handle: &AddressHandle,
            message: Vec<u8>,
            signature_handle: &SignatureHandle,
        ) -> bool;
        fn validate_address(address_str: String) -> bool;
        fn destroy_address(handle: &AddressHandle);

        // View key functions
        fn view_key_from_string(view_key_str: String) -> ViewKeyHandle;
        fn view_key_to_string(handle: &ViewKeyHandle) -> AccountResult;
        fn view_key_to_address(handle: &ViewKeyHandle) -> AddressHandle;
        fn view_key_to_field(handle: &ViewKeyHandle) -> Result<Box<FieldHandle>>;
        fn view_key_to_bytes_le(handle: &ViewKeyHandle) -> Result<Vec<u8>>;
        fn view_key_from_bytes_le(bytes: Vec<u8>) -> ViewKeyHandle;
        fn view_key_decrypt(handle: &ViewKeyHandle, ciphertext: String) -> HandleResult;
        fn validate_view_key(view_key_str: String) -> bool;
        fn destroy_view_key(handle: &ViewKeyHandle);

        // Compute key functions
        fn compute_key_from_string(compute_key_str: String) -> ComputeKeyHandle;
        fn compute_key_to_string(handle: &ComputeKeyHandle) -> AccountResult;
        fn validate_compute_key(compute_key_str: String) -> bool;
        fn destroy_compute_key(handle: &ComputeKeyHandle);

        // Graph key functions
        fn graph_key_from_private_key(private_key_str: String) -> AccountResult;

        // Signature functions
        fn signature_from_string(signature_str: String) -> SignatureHandle;
        fn signature_to_string(handle: &SignatureHandle) -> AccountResult;
        fn validate_signature(signature_str: String) -> bool;
        fn destroy_signature(handle: &SignatureHandle);

        // Record ciphertext functions
        fn record_ciphertext_from_string(ciphertext_str: String) -> RecordCiphertextHandle;
        fn record_ciphertext_to_string(handle: &RecordCiphertextHandle) -> AccountResult;
        fn record_ciphertext_is_owner(
            handle: &RecordCiphertextHandle,
            view_key_handle: &ViewKeyHandle,
        ) -> bool;
        fn validate_record_ciphertext(ciphertext_str: String) -> bool;
        fn destroy_record_ciphertext(handle: &RecordCiphertextHandle);

        // Record plaintext functions
        fn record_plaintext_from_string(plaintext_str: String) -> RecordPlaintextHandle;
        fn record_plaintext_to_string(handle: &RecordPlaintextHandle) -> AccountResult;
        fn validate_record_plaintext(plaintext_str: String) -> bool;
        fn destroy_record_plaintext(handle: &RecordPlaintextHandle);
        fn record_plaintext_to_commitment(
            record_str: String,
            program_id: String,
            record_name: String,
            view_key_handle: &ViewKeyHandle,
        ) -> StringResult;
        fn record_plaintext_to_serial_number(
            record_str: String,
            private_key_handle: &PrivateKeyHandle,
            program_id: String,
            record_name: String,
            record_view_key: String,
        ) -> StringResult;

        // Plaintext functions
        type PlaintextHandle;
        fn plaintext_from_string(value: &str) -> Result<Box<PlaintextHandle>>;
        fn plaintext_from_bytes(bytes: Vec<u8>) -> Result<Box<PlaintextHandle>>;
        fn plaintext_from_bits(bits: Vec<u8>) -> Result<Box<PlaintextHandle>>;
        fn plaintext_from_fields(fields: Vec<String>) -> Result<Box<PlaintextHandle>>;
        fn plaintext_clone(self: &PlaintextHandle) -> Box<PlaintextHandle>;
        fn plaintext_to_string(self: &PlaintextHandle) -> String;
        fn plaintext_to_bytes(self: &PlaintextHandle) -> BytesResult;
        fn plaintext_to_bits(self: &PlaintextHandle) -> BytesResult;
        fn plaintext_to_fields(self: &PlaintextHandle) -> Result<Vec<String>>;
        fn plaintext_type(self: &PlaintextHandle) -> String;
        fn plaintext_find(self: &PlaintextHandle, name: &str) -> Result<Box<PlaintextHandle>>;
        fn plaintext_encrypt(
            self: &PlaintextHandle,
            address: &str,
            randomizer: &str,
        ) -> StringResult;
        fn plaintext_encrypt_symmetric(
            self: &PlaintextHandle,
            transition_view_key: &str,
        ) -> StringResult;
        fn plaintext_to_object(self: &PlaintextHandle) -> StringResult;

        // Program functions
        type ProgramHandle;
        fn program_from_string(program: &str) -> Result<Box<ProgramHandle>>;
        fn program_clone(self: &ProgramHandle) -> Box<ProgramHandle>;
        fn program_to_string(self: &ProgramHandle) -> String;
        fn program_has_function(self: &ProgramHandle, function_name: &str) -> bool;
        fn program_get_functions(self: &ProgramHandle) -> Vec<String>;
        fn program_get_function_inputs(self: &ProgramHandle, function_name: &str)
            -> Result<String>;
        fn program_get_mappings(self: &ProgramHandle) -> Result<String>;
        fn program_get_record_members(self: &ProgramHandle, record_name: &str) -> Result<String>;
        fn program_get_struct_members(self: &ProgramHandle, struct_name: &str) -> Result<String>;
        fn program_get_imports(self: &ProgramHandle) -> Vec<String>;
        fn program_id(self: &ProgramHandle) -> String;
        fn program_address(self: &ProgramHandle) -> Result<String>;
        fn program_is_equal(self: &ProgramHandle, other: &ProgramHandle) -> bool;
        fn program_get_credits_program() -> Result<Box<ProgramHandle>>;

        // Transaction functions
        type TransactionHandle;
        type FieldHandle;
        type GroupHandle;
        type ScalarHandle;
        fn transaction_from_string(transaction: &str) -> Result<Box<TransactionHandle>>;
        fn transaction_from_bytes_le(bytes: Vec<u8>) -> Result<Box<TransactionHandle>>;
        fn transaction_clone(self: &TransactionHandle) -> Box<TransactionHandle>;
        fn transaction_to_string(self: &TransactionHandle) -> String;
        fn transaction_to_bytes_le(self: &TransactionHandle) -> BytesResult;
        fn transaction_id(self: &TransactionHandle) -> String;
        fn transaction_type(self: &TransactionHandle) -> String;
        fn transaction_base_fee_amount(self: &TransactionHandle) -> u64;
        fn transaction_fee_amount(self: &TransactionHandle) -> u64;
        fn transaction_priority_fee_amount(self: &TransactionHandle) -> u64;
        fn transaction_is_deploy(self: &TransactionHandle) -> bool;
        fn transaction_is_execute(self: &TransactionHandle) -> bool;
        fn transaction_is_fee(self: &TransactionHandle) -> bool;
        fn transaction_contains_serial_number(
            self: &TransactionHandle,
            serial_number_handle: &FieldHandle,
        ) -> bool;
        fn transaction_contains_commitment(
            self: &TransactionHandle,
            commitment_handle: &FieldHandle,
        ) -> bool;
        fn transaction_find_record(
            self: &TransactionHandle,
            commitment_handle: &FieldHandle,
        ) -> HandleResult;
        fn transaction_owned_records(
            self: &TransactionHandle,
            view_key_handle: &ViewKeyHandle,
        ) -> Vec<u64>;
        fn transaction_records(self: &TransactionHandle) -> Vec<TransactionRecordEntry>;
        fn transaction_deployed_program(self: &TransactionHandle) -> Result<Box<ProgramHandle>>;
        fn transaction_verifying_keys(self: &TransactionHandle) -> Vec<TransactionVerifyingKey>;
        fn transaction_transitions(self: &TransactionHandle) -> Vec<String>;
        fn transaction_summary(self: &TransactionHandle) -> Result<String>;

        // Field functions
        fn field_from_string(field_str: String) -> Result<Box<FieldHandle>>;
        fn field_clone(self: &FieldHandle) -> Result<Box<FieldHandle>>;
        fn field_multiply_handles(
            self: &FieldHandle,
            rhs: &FieldHandle,
        ) -> Result<Box<FieldHandle>>;
        fn field_to_string(self: &FieldHandle) -> String;
        fn validate_field(field_str: String) -> bool;
        fn field_normalize(field_str: String) -> StringResult;
        fn field_multiply(lhs: String, rhs: String) -> StringResult;
        fn field_to_bits_le(field_str: String) -> BytesResult;
        fn field_to_bits_le_handle(self: &FieldHandle) -> BytesResult;
        fn field_one() -> Box<FieldHandle>;
        fn field_new_domain_separator(domain: String) -> Box<FieldHandle>;

        // Group functions
        fn group_from_string(group_str: String) -> Result<Box<GroupHandle>>;
        fn group_clone(self: &GroupHandle) -> Result<Box<GroupHandle>>;
        fn group_to_string(self: &GroupHandle) -> String;
        fn validate_group(group_str: String) -> bool;

        // Scalar functions
        fn scalar_from_string(scalar_str: String) -> Result<Box<ScalarHandle>>;
        fn scalar_clone(self: &ScalarHandle) -> Result<Box<ScalarHandle>>;
        fn scalar_to_string(self: &ScalarHandle) -> String;
        fn validate_scalar(scalar_str: String) -> bool;

        // Encryption utility functions
        fn generate_record_view_key(
            view_key_handle: &ViewKeyHandle,
            record_ciphertext_handle: &RecordCiphertextHandle,
        ) -> Result<Box<FieldHandle>>;
        fn generate_transition_view_key(
            view_key_handle: &ViewKeyHandle,
            transition_public_key_handle: &GroupHandle,
        ) -> Result<Box<FieldHandle>>;

        // Authorization functions
        fn authorization_from_string(authorization_str: String) -> AuthorizationResult;
        fn authorization_from_bytes_le(bytes: Vec<u8>) -> AuthorizationResult;
        fn authorization_from_requests_and_transitions(
            requests: Vec<String>,
            transitions: Vec<String>,
        ) -> AuthorizationResult;
        fn authorization_to_string(handle: u64) -> StringResult;
        fn authorization_to_bytes_le(handle: u64) -> BytesResult;
        fn authorization_to_json(handle: u64) -> StringResult;
        fn authorization_get_requests(handle: u64) -> StringResult;
        fn authorization_get_transitions(handle: u64) -> StringResult;
        fn authorization_insert_transition(
            handle: u64,
            transition_str: String,
        ) -> AuthorizationResult;
        fn authorization_replicate(handle: u64) -> AuthorizationResult;
        fn authorization_verify(handle: u64) -> bool;
        fn authorization_equals(handle1: u64, handle2: u64) -> bool;
        fn authorization_len(handle: u64) -> f64;
        fn authorization_is_empty(handle: u64) -> bool;
        fn authorization_is_fee_private(handle: u64) -> bool;
        fn authorization_is_fee_public(handle: u64) -> bool;
        fn authorization_is_split(handle: u64) -> bool;
        fn authorization_to_execution_id(handle: u64) -> StringResult;
        fn destroy_authorization(handle: u64);

        // ProvingRequest functions
        fn proving_request_from_string(proving_request_str: String) -> ProvingRequestResult;
        fn proving_request_from_bytes_le(bytes: Vec<u8>) -> ProvingRequestResult;
        fn proving_request_from_authorizations(
            auth_handle: u64,
            fee_auth_handle: u64,
            broadcast: bool,
        ) -> ProvingRequestResult;
        fn proving_request_to_string(handle: u64) -> StringResult;
        fn proving_request_to_bytes_le(handle: u64) -> BytesResult;
        fn proving_request_to_json(handle: u64) -> StringResult;
        fn proving_request_get_authorization(handle: u64) -> AuthorizationResult;
        fn proving_request_get_fee_authorization(handle: u64) -> AuthorizationResult;
        fn proving_request_get_broadcast(handle: u64) -> bool;
        fn proving_request_replicate(handle: u64) -> ProvingRequestResult;
        fn proving_request_verify(handle: u64) -> bool;
        fn proving_request_equals(handle1: u64, handle2: u64) -> bool;
        fn destroy_proving_request(handle: u64);

        // Program Manager functions
        fn program_manager_build_authorization(
            program_name: String,
            function_name: String,
            inputs: Vec<String>,
            private_key_handle: &PrivateKeyHandle,
            program_source: String,
            program_imports: Vec<String>,
            edition: f64,
        ) -> AuthorizationResult;
        fn program_manager_build_fee_authorization(
            deployment_or_execution_id: String,
            base_fee_credits: u64,
            priority_fee_credits: u64,
            private_key_handle: &PrivateKeyHandle,
            fee_record: String,
        ) -> AuthorizationResult;

        fn program_manager_build_execution_transaction(
            private_key_handle: &PrivateKeyHandle,
            program_source: String,
            function_name: String,
            inputs: Vec<String>,
            priority_fee_credits: u64,
            fee_record: String,
            url: String,
            imports: Vec<String>,
            fee_proving_key_handle_id: u64,
            fee_verifying_key_handle_id: u64,
            offline_query_handle_id: u64,
            edition: f64,
        ) -> StringResult;
        fn program_manager_build_proving_request(
            private_key_handle: &PrivateKeyHandle,
            program: String,
            function_name: String,
            inputs: Vec<String>,
            base_fee_credits: u64,
            priority_fee_credits: u64,
            fee_record: String,
            imports: Vec<String>,
            broadcast: bool,
            unchecked: bool,
            edition: f64,
            use_fee_master: bool,
        ) -> ProvingRequestResult;
        fn program_manager_load_inclusion_prover(proving_key_handle: &ProvingKeyHandle) -> BoolResult;

        fn program_manager_estimate_execution_fee(
            program: String,
            function_name: String,
            imports: Vec<String>,
            edition: f64,
        ) -> StringResult;
        fn program_manager_estimate_fee_for_authorization(
            program_source: String,
            authorization_handle: u64,
            imports: Vec<String>,
            edition: f64,
        ) -> StringResult;
        fn program_manager_estimate_deployment_fee(
            program_string: String,
            imports: Vec<String>,
        ) -> StringResult;
        fn program_manager_build_deployment_transaction(
            private_key_handle: &PrivateKeyHandle,
            program: String,
            priority_fee_credits: u64,
            fee_record: String,
            url: String,
            imports: Vec<String>,
            fee_proving_key_handle_id: u64,
            fee_verifying_key_handle_id: u64,
            offline_query_handle_id: u64,
        ) -> StringResult;

        // ProvingKey functions
        fn proving_key_from_bytes(bytes: Vec<u8>) -> HandleResult;
        fn proving_key_to_bytes(handle: &ProvingKeyHandle) -> BytesResult;
        fn proving_key_from_string(string: String) -> HandleResult;
        fn proving_key_checksum(handle: &ProvingKeyHandle) -> StringResult;
        fn proving_key_copy(handle: &ProvingKeyHandle) -> HandleResult;
        fn destroy_proving_key(handle: &ProvingKeyHandle);
        fn proving_key_is_bond_public_prover_with_metadata(handle: &ProvingKeyHandle, metadata_json: String) -> bool;
        fn proving_key_is_bond_validator_prover_with_metadata(handle: &ProvingKeyHandle, metadata_json: String) -> bool;
        fn proving_key_is_claim_unbond_public_prover_with_metadata(handle: &ProvingKeyHandle, metadata_json: String) -> bool;
        fn proving_key_is_fee_private_prover_with_metadata(handle: &ProvingKeyHandle, metadata_json: String) -> bool;
        fn proving_key_is_fee_public_prover_with_metadata(handle: &ProvingKeyHandle, metadata_json: String) -> bool;
        fn proving_key_is_inclusion_prover_with_metadata(handle: &ProvingKeyHandle, metadata_json: String) -> bool;
        fn proving_key_is_join_prover_with_metadata(handle: &ProvingKeyHandle, metadata_json: String) -> bool;
        fn proving_key_is_set_validator_state_prover_with_metadata(handle: &ProvingKeyHandle, metadata_json: String) -> bool;
        fn proving_key_is_split_prover_with_metadata(handle: &ProvingKeyHandle, metadata_json: String) -> bool;
        fn proving_key_is_transfer_private_prover_with_metadata(handle: &ProvingKeyHandle, metadata_json: String) -> bool;
        fn proving_key_is_transfer_private_to_public_prover_with_metadata(handle: &ProvingKeyHandle, metadata_json: String) -> bool;
        fn proving_key_is_transfer_public_prover_with_metadata(handle: &ProvingKeyHandle, metadata_json: String) -> bool;
        fn proving_key_is_transfer_public_as_signer_prover_with_metadata(handle: &ProvingKeyHandle, metadata_json: String) -> bool;
        fn proving_key_is_transfer_public_to_private_prover_with_metadata(handle: &ProvingKeyHandle, metadata_json: String) -> bool;
        fn proving_key_is_unbond_public_prover_with_metadata(handle: &ProvingKeyHandle, metadata_json: String) -> bool;

        // VerifyingKey functions
        fn verifying_key_from_bytes(bytes: Vec<u8>) -> HandleResult;
        fn verifying_key_from_string(string: String) -> HandleResult;
        fn verifying_key_to_bytes(handle: &VerifyingKeyHandle) -> BytesResult;
        fn verifying_key_checksum(handle: &VerifyingKeyHandle) -> StringResult;
        fn verifying_key_num_constraints(handle: &VerifyingKeyHandle) -> f64;
        fn verifying_key_copy(handle: &VerifyingKeyHandle) -> HandleResult;
        fn destroy_verifying_key(handle: &VerifyingKeyHandle);
        // VerifyingKey init/check helpers for credits.aleo
        fn verifying_key_bond_public_verifier() -> HandleResult;
        fn verifying_key_bond_validator_verifier() -> HandleResult;
        fn verifying_key_claim_unbond_public_verifier() -> HandleResult;
        fn verifying_key_fee_private_verifier() -> HandleResult;
        fn verifying_key_fee_public_verifier() -> HandleResult;
        fn verifying_key_inclusion_verifier() -> HandleResult;
        fn verifying_key_join_verifier() -> HandleResult;
        fn verifying_key_set_validator_state_verifier() -> HandleResult;
        fn verifying_key_split_verifier() -> HandleResult;
        fn verifying_key_transfer_private_verifier() -> HandleResult;
        fn verifying_key_transfer_private_to_public_verifier() -> HandleResult;
        fn verifying_key_transfer_public_verifier() -> HandleResult;
        fn verifying_key_transfer_public_as_signer_verifier() -> HandleResult;
        fn verifying_key_transfer_public_to_private_verifier() -> HandleResult;
        fn verifying_key_unbond_public_verifier() -> HandleResult;
        fn verifying_key_is_bond_public_verifier(handle: &VerifyingKeyHandle) -> bool;
        fn verifying_key_is_bond_validator_verifier(handle: &VerifyingKeyHandle) -> bool;
        fn verifying_key_is_claim_unbond_public_verifier(handle: &VerifyingKeyHandle) -> bool;
        fn verifying_key_is_fee_private_verifier(handle: &VerifyingKeyHandle) -> bool;
        fn verifying_key_is_fee_public_verifier(handle: &VerifyingKeyHandle) -> bool;
        fn verifying_key_is_inclusion_verifier(handle: &VerifyingKeyHandle) -> bool;
        fn verifying_key_is_join_verifier(handle: &VerifyingKeyHandle) -> bool;
        fn verifying_key_is_set_validator_state_verifier(handle: &VerifyingKeyHandle) -> bool;
        fn verifying_key_is_split_verifier(handle: &VerifyingKeyHandle) -> bool;
        fn verifying_key_is_transfer_private_verifier(handle: &VerifyingKeyHandle) -> bool;
        fn verifying_key_is_transfer_private_to_public_verifier(handle: &VerifyingKeyHandle) -> bool;
        fn verifying_key_is_transfer_public_verifier(handle: &VerifyingKeyHandle) -> bool;
        fn verifying_key_is_transfer_public_as_signer_verifier(handle: &VerifyingKeyHandle) -> bool;
        fn verifying_key_is_transfer_public_to_private_verifier(handle: &VerifyingKeyHandle) -> bool;
        fn verifying_key_is_unbond_public_verifier(handle: &VerifyingKeyHandle) -> bool;

        // OfflineQuery functions (JSON bytes)
        fn offline_query_from_bytes(bytes: Vec<u8>) -> HandleResult;
        fn offline_query_from_string(string: String) -> HandleResult;
        fn offline_query_to_bytes(handle: &OfflineQueryHandle) -> BytesResult;
        fn offline_query_add_block_height(handle: &OfflineQueryHandle, height: f64) -> BoolResult;
        fn offline_query_add_state_path(handle: &OfflineQueryHandle, commitment: String, state_path: String) -> BoolResult;
        fn destroy_offline_query(handle: &OfflineQueryHandle);
        
        // Metadata helpers - now accept network parameter for runtime selection
        fn metadata_bond_public(network: String) -> MetadataFFI;
        fn metadata_bond_validator(network: String) -> MetadataFFI;
        fn metadata_claim_unbond_public(network: String) -> MetadataFFI;
        fn metadata_fee_private(network: String) -> MetadataFFI;
        fn metadata_fee_public(network: String) -> MetadataFFI;
        fn metadata_inclusion(network: String) -> MetadataFFI;
        fn metadata_join(network: String) -> MetadataFFI;
        fn metadata_set_validator_state(network: String) -> MetadataFFI;
        fn metadata_split(network: String) -> MetadataFFI;
        fn metadata_transfer_private(network: String) -> MetadataFFI;
        fn metadata_transfer_private_to_public(network: String) -> MetadataFFI;
        fn metadata_transfer_public(network: String) -> MetadataFFI;
        fn metadata_transfer_public_as_signer(network: String) -> MetadataFFI;
        fn metadata_transfer_public_to_private(network: String) -> MetadataFFI;
        fn metadata_unbond_public(network: String) -> MetadataFFI;

        // Mnemonic functions
        fn generate_mnemonic() -> StringResult;
        fn verify_mnemonic(mnemonic: String) -> BoolResult;

        // Security utilities
        fn crypto_box_seal_base64(public_key_b64: String, message: Vec<u8>) -> StringResult;
        fn crypto_box_seal_open_base64(
            public_key_b64: String,
            private_key_b64: String,
            sealed_b64: String,
        ) -> BytesResult;
    }
}
