use crate::{types::*, ProvingRequest, verifying_key::VerifyingKey, proving_key::ProvingKey, offline_query::OfflineQuery};
use std::collections::HashMap;
use std::sync::{Mutex, OnceLock};

// Storage for cryptographic objects using handles
static PRIVATE_KEYS: OnceLock<Mutex<HashMap<u64, PrivateKey<CurrentNetwork>>>> = OnceLock::new();
static ADDRESSES: OnceLock<Mutex<HashMap<u64, Address<CurrentNetwork>>>> = OnceLock::new();
static VIEW_KEYS: OnceLock<Mutex<HashMap<u64, ViewKey<CurrentNetwork>>>> = OnceLock::new();
static COMPUTE_KEYS: OnceLock<Mutex<HashMap<u64, ComputeKey<CurrentNetwork>>>> = OnceLock::new();
static SIGNATURES: OnceLock<Mutex<HashMap<u64, Signature<CurrentNetwork>>>> = OnceLock::new();
static RECORD_CIPHERTEXTS: OnceLock<Mutex<HashMap<u64, RecordCiphertext<CurrentNetwork>>>> =
    OnceLock::new();
static RECORD_PLAINTEXTS: OnceLock<Mutex<HashMap<u64, RecordPlaintext<CurrentNetwork>>>> =
    OnceLock::new();
static AUTHORIZATIONS: OnceLock<Mutex<HashMap<u64, Authorization<CurrentNetwork>>>> =
    OnceLock::new();
static PROVING_REQUESTS: OnceLock<Mutex<HashMap<u64, ProvingRequest<CurrentNetwork>>>> =
    OnceLock::new();
static PROVING_KEYS: OnceLock<Mutex<HashMap<u64, snarkvm_synthesizer::prelude::ProvingKey<CurrentNetwork>>>> = OnceLock::new();
static VERIFYING_KEYS: OnceLock<Mutex<HashMap<u64, snarkvm_synthesizer::prelude::VerifyingKey<CurrentNetwork>>>> = OnceLock::new();
static OFFLINE_QUERIES: OnceLock<Mutex<HashMap<u64, OfflineQuery>>> = OnceLock::new();
static NEXT_ID: Mutex<u64> = Mutex::new(1);

// Storage initialization functions
pub fn ensure_private_key_storage() -> &'static Mutex<HashMap<u64, PrivateKey<CurrentNetwork>>> {
    PRIVATE_KEYS.get_or_init(|| Mutex::new(HashMap::new()))
}

pub fn ensure_address_storage() -> &'static Mutex<HashMap<u64, Address<CurrentNetwork>>> {
    ADDRESSES.get_or_init(|| Mutex::new(HashMap::new()))
}

pub fn ensure_view_key_storage() -> &'static Mutex<HashMap<u64, ViewKey<CurrentNetwork>>> {
    VIEW_KEYS.get_or_init(|| Mutex::new(HashMap::new()))
}

pub fn ensure_compute_key_storage() -> &'static Mutex<HashMap<u64, ComputeKey<CurrentNetwork>>> {
    COMPUTE_KEYS.get_or_init(|| Mutex::new(HashMap::new()))
}

pub fn ensure_signature_storage() -> &'static Mutex<HashMap<u64, Signature<CurrentNetwork>>> {
    SIGNATURES.get_or_init(|| Mutex::new(HashMap::new()))
}

pub fn ensure_record_ciphertext_storage(
) -> &'static Mutex<HashMap<u64, RecordCiphertext<CurrentNetwork>>> {
    RECORD_CIPHERTEXTS.get_or_init(|| Mutex::new(HashMap::new()))
}

pub fn ensure_record_plaintext_storage(
) -> &'static Mutex<HashMap<u64, RecordPlaintext<CurrentNetwork>>> {
    RECORD_PLAINTEXTS.get_or_init(|| Mutex::new(HashMap::new()))
}

pub fn ensure_authorization_storage() -> &'static Mutex<HashMap<u64, Authorization<CurrentNetwork>>>
{
    AUTHORIZATIONS.get_or_init(|| Mutex::new(HashMap::new()))
}

pub fn ensure_proving_request_storage(
) -> &'static Mutex<HashMap<u64, ProvingRequest<CurrentNetwork>>> {
    PROVING_REQUESTS.get_or_init(|| Mutex::new(HashMap::new()))
}

pub fn ensure_proving_key_storage(
) -> &'static Mutex<HashMap<u64, snarkvm_synthesizer::prelude::ProvingKey<CurrentNetwork>>> {
    PROVING_KEYS.get_or_init(|| Mutex::new(HashMap::new()))
}

pub fn ensure_verifying_key_storage(
) -> &'static Mutex<HashMap<u64, snarkvm_synthesizer::prelude::VerifyingKey<CurrentNetwork>>> {
    VERIFYING_KEYS.get_or_init(|| Mutex::new(HashMap::new()))
}

pub fn ensure_offline_query_storage() -> &'static Mutex<HashMap<u64, OfflineQuery>> {
    OFFLINE_QUERIES.get_or_init(|| Mutex::new(HashMap::new()))
}

// Get the next unique ID
pub fn get_next_id() -> u64 {
    let mut id = NEXT_ID.lock().unwrap();
    let current = *id;
    *id += 1;
    current
}
