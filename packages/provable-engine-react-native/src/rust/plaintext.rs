use crate::{
    ffi::{BytesResult, StringResult},
    types::PlaintextWrapper,
};
use std::sync::{Mutex, MutexGuard};

type Result<T> = std::result::Result<T, String>;

pub struct PlaintextHandle {
    inner: Mutex<PlaintextWrapper>,
}

impl PlaintextHandle {
    fn new(wrapper: PlaintextWrapper) -> Self {
        Self {
            inner: Mutex::new(wrapper),
        }
    }

    fn lock(&self) -> MutexGuard<'_, PlaintextWrapper> {
        self.inner.lock().expect("Plaintext mutex poisoned")
    }

    pub fn plaintext_clone(&self) -> Box<PlaintextHandle> {
        let guard = self.lock();
        let cloned = guard.clone();
        drop(guard);
        Box::new(PlaintextHandle::new(cloned))
    }

    pub fn plaintext_to_string(&self) -> String {
        self.lock().to_string()
    }

    pub fn plaintext_to_bytes(&self) -> BytesResult {
        match self.lock().to_bytes_le() {
            Ok(bytes) => crate::bytes_success_result(bytes),
            Err(e) => crate::bytes_error_result(e.to_string()),
        }
    }

    pub fn plaintext_to_bits(&self) -> BytesResult {
        let bits: Vec<u8> = self
            .lock()
            .to_bits_le()
            .into_iter()
            .map(|bit| if bit { 1u8 } else { 0u8 })
            .collect();
        crate::bytes_success_result(bits)
    }

    pub fn plaintext_type(&self) -> String {
        self.lock().plaintext_type()
    }

    pub fn plaintext_find(&self, name: &str) -> Result<Box<PlaintextHandle>> {
        self.lock()
            .find(name)
            .map(|wrapper| Box::new(PlaintextHandle::new(wrapper)))
    }

    pub fn plaintext_encrypt(&self, address: &str, randomizer: &str) -> StringResult {
        match self.lock().encrypt(address, randomizer) {
            Ok(ciphertext) => crate::string_success_result(ciphertext),
            Err(e) => crate::string_error_result(e),
        }
    }

    pub fn plaintext_encrypt_symmetric(&self, transition_view_key: &str) -> StringResult {
        match self.lock().encrypt_symmetric(transition_view_key) {
            Ok(ciphertext) => crate::string_success_result(ciphertext),
            Err(e) => crate::string_error_result(e),
        }
    }

    pub fn plaintext_to_fields(&self) -> Result<Vec<String>> {
        self.lock().to_fields_str()
    }

    pub fn plaintext_to_object(&self) -> StringResult {
        let value = self.lock().to_object_string();
        crate::string_success_result(value)
    }
}

pub fn plaintext_from_string(value: &str) -> Result<Box<PlaintextHandle>> {
    PlaintextWrapper::from_string(value).map(|wrapper| Box::new(PlaintextHandle::new(wrapper)))
}

pub fn plaintext_from_bytes(bytes: Vec<u8>) -> Result<Box<PlaintextHandle>> {
    PlaintextWrapper::from_bytes_le(&bytes).map(|wrapper| Box::new(PlaintextHandle::new(wrapper)))
}

pub fn plaintext_from_bits(bits: Vec<u8>) -> Result<Box<PlaintextHandle>> {
    let bool_bits: Vec<bool> = bits.into_iter().map(|b| b != 0).collect();
    PlaintextWrapper::from_bits_le(&bool_bits)
        .map(|wrapper| Box::new(PlaintextHandle::new(wrapper)))
}

pub fn plaintext_from_fields(fields: Vec<String>) -> Result<Box<PlaintextHandle>> {
    PlaintextWrapper::from_fields_str(&fields)
        .map(|wrapper| Box::new(PlaintextHandle::new(wrapper)))
}
