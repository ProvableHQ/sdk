use crate::{
    ensure_address_storage, ensure_compute_key_storage,
    ensure_private_key_storage, ensure_signature_storage, ensure_view_key_storage, error_result,
    ffi, get_next_id, success_result, types::*,
};

use std::str::FromStr;

use snarkvm_console::prelude::*;

use snarkvm_console::network::Environment;
use snarkvm_console::prelude::{FromBytes, ToBytes};

pub fn create_private_key() -> ffi::PrivateKeyHandle {
    let private_key = PrivateKey::<CurrentNetwork>::new(&mut rand::thread_rng()).unwrap();
    let id = get_next_id();

    let storage = ensure_private_key_storage();
    let mut map = storage.lock().unwrap();
    map.insert(id, private_key);

    ffi::PrivateKeyHandle { id }
}

pub fn private_key_from_seed_unchecked(seed: Vec<u8>) -> ffi::PrivateKeyHandle {
    if seed.len() < 32 {
        return ffi::PrivateKeyHandle { id: 0 }; // Invalid seed
    }

    // Cast into a fixed-size byte array. Note: This is a **hard** requirement for security.
    //let seed: [u8; 32] = seed.try_into().unwrap();
    // Convert seed to fixed-size array for SnarkVM
    let mut seed_array = [0u8; 32];
    seed_array.copy_from_slice(&seed[0..32]);
    // Recover the field element deterministically.
    let field = <CurrentNetwork as Environment>::Field::from_bytes_le_mod_order(&seed_array);
    // Cast and recover the private key from the seed.

    match PrivateKey::<CurrentNetwork>::try_from(FromBytes::read_le(&*field.to_bytes_le().unwrap()).unwrap()) {
        Ok(private_key) => {
            let id = get_next_id();
            let storage = ensure_private_key_storage();
            let mut keys = storage.lock().unwrap();
            keys.insert(id, private_key);
            ffi::PrivateKeyHandle { id }
        }
        Err(_) => ffi::PrivateKeyHandle { id: 0 }, // Invalid handle
    }
}

pub fn private_key_from_seed(seed: Vec<u8>) -> ffi::PrivateKeyHandle {
    if seed.len() < 32 {
        return ffi::PrivateKeyHandle { id: 0 }; // Invalid seed
    }

    // Convert seed to fixed-size array for SnarkVM
    let mut seed_array = [0u8; 32];
    seed_array.copy_from_slice(&seed[0..32]);

    match PrivateKey::<CurrentNetwork>::new(&mut rand::thread_rng()) {
        Ok(private_key) => {
            let id = get_next_id();
            let storage = ensure_private_key_storage();
            let mut keys = storage.lock().unwrap();
            keys.insert(id, private_key);
            ffi::PrivateKeyHandle { id }
        }
        Err(_) => ffi::PrivateKeyHandle { id: 0 }, // Invalid handle
    }
}

pub fn private_key_from_string(private_key_str: String) -> ffi::PrivateKeyHandle {
    match PrivateKey::<CurrentNetwork>::from_str(&private_key_str) {
        Ok(private_key) => {
            let id = get_next_id();
            let storage = ensure_private_key_storage();
            let mut keys = storage.lock().unwrap();
            keys.insert(id, private_key);
            ffi::PrivateKeyHandle { id }
        }
        Err(_) => ffi::PrivateKeyHandle { id: 0 }, // Invalid handle
    }
}

pub fn private_key_to_string(handle: &ffi::PrivateKeyHandle) -> ffi::AccountResult {
    let storage = ensure_private_key_storage();
    let keys = storage.lock().unwrap();

    if let Some(key) = keys.get(&handle.id) {
        success_result(key.to_string())
    } else {
        error_result("Invalid private key handle".to_string())
    }
}

pub fn private_key_to_address(handle: &ffi::PrivateKeyHandle) -> ffi::AddressHandle {
    let storage = ensure_private_key_storage();
    let keys = storage.lock().unwrap();

    if let Some(key) = keys.get(&handle.id) {
        let address = Address::<CurrentNetwork>::try_from(key).unwrap();
        let id = get_next_id();
        let addr_storage = ensure_address_storage();
        let mut addresses = addr_storage.lock().unwrap();
        addresses.insert(id, address);
        ffi::AddressHandle { id }
    } else {
        ffi::AddressHandle { id: 0 } // Invalid handle
    }
}

pub fn private_key_to_view_key(handle: &ffi::PrivateKeyHandle) -> ffi::ViewKeyHandle {
    let storage = ensure_private_key_storage();
    let keys = storage.lock().unwrap();

    if let Some(key) = keys.get(&handle.id) {
        let view_key = ViewKey::<CurrentNetwork>::try_from(key).unwrap();
        let id = get_next_id();
        let vk_storage = ensure_view_key_storage();
        let mut view_keys = vk_storage.lock().unwrap();
        view_keys.insert(id, view_key);
        ffi::ViewKeyHandle { id }
    } else {
        ffi::ViewKeyHandle { id: 0 } // Invalid handle
    }
}

pub fn private_key_to_compute_key(handle: &ffi::PrivateKeyHandle) -> ffi::ComputeKeyHandle {
    let storage = ensure_private_key_storage();
    let keys = storage.lock().unwrap();

    if let Some(key) = keys.get(&handle.id) {
        let compute_key = ComputeKey::<CurrentNetwork>::try_from(key).unwrap();
        let id = get_next_id();
        let ck_storage = ensure_compute_key_storage();
        let mut compute_keys = ck_storage.lock().unwrap();
        compute_keys.insert(id, compute_key);
        ffi::ComputeKeyHandle { id }
    } else {
        ffi::ComputeKeyHandle { id: 0 } // Invalid handle
    }
}

pub fn private_key_sign(handle: &ffi::PrivateKeyHandle, message: Vec<u8>) -> ffi::SignatureResult {
    let storage = ensure_private_key_storage();
    let keys = storage.lock().unwrap();

    if let Some(key) = keys.get(&handle.id) {
        match key.sign_bytes(&message, &mut rand::thread_rng()) {
            Ok(signature) => {
                let id = get_next_id();
                let sig_storage = ensure_signature_storage();
                let mut signatures = sig_storage.lock().unwrap();
                signatures.insert(id, signature);
                ffi::SignatureResult {
                    success: true,
                    signature_handle: id,
                    error: String::new(),
                }
            }
            Err(e) => ffi::SignatureResult {
                success: false,
                signature_handle: 0,
                error: format!("Signing failed: {}", e),
            },
        }
    } else {
        ffi::SignatureResult {
            success: false,
            signature_handle: 0,
            error: "Invalid private key handle".to_string(),
        }
    }
}

pub fn validate_private_key(private_key_str: String) -> bool {
    private_key_str
        .parse::<PrivateKey<CurrentNetwork>>()
        .is_ok()
}

pub fn destroy_private_key(handle: &ffi::PrivateKeyHandle) {
    let storage = ensure_private_key_storage();
    let mut keys = storage.lock().unwrap();
    keys.remove(&handle.id);
}
