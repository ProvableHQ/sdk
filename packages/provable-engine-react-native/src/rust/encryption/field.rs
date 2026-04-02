use crate::{
    bytes_error_result, bytes_success_result,
    ffi::{BytesResult, StringResult},
    string_error_result, string_success_result,
    types::*,
};
use snarkvm_console::prelude::ToBits;
use std::str::FromStr;
use std::sync::{Mutex, MutexGuard};

type Result<T> = std::result::Result<T, String>;

#[derive(Debug)]
pub struct FieldHandle {
    inner: Mutex<Field<CurrentNetwork>>,
}

impl FieldHandle {
    pub fn new(field: Field<CurrentNetwork>) -> Self {
        Self {
            inner: Mutex::new(field),
        }
    }

    fn lock(&self) -> MutexGuard<'_, Field<CurrentNetwork>> {
        self.inner.lock().expect("Field mutex poisoned")
    }

    fn with<R>(&self, f: impl FnOnce(&Field<CurrentNetwork>) -> R) -> R {
        let guard = self.lock();
        f(&*guard)
    }

    pub fn clone_value(&self) -> Field<CurrentNetwork> {
        self.with(|field| field.clone())
    }

    pub fn field_clone(&self) -> Result<Box<FieldHandle>> {
        Ok(Box::new(FieldHandle::new(self.clone_value())))
    }

    pub fn field_multiply_handles(&self, rhs: &FieldHandle) -> Result<Box<FieldHandle>> {
        let lhs_value = self.clone_value();
        let rhs_value = rhs.clone_value();
        Ok(Box::new(FieldHandle::new(lhs_value * rhs_value)))
    }

    pub fn field_to_string(&self) -> String {
        self.with(|field| field.to_string())
    }

    pub fn field_to_bits_le_handle(&self) -> BytesResult {
        let bytes = self.with(|field| {
            field
                .to_bits_le()
                .into_iter()
                .map(|bit| if bit { 1 } else { 0 })
                .collect::<Vec<u8>>()
        });
        bytes_success_result(bytes)
    }
}

pub fn field_from_value(field: Field<CurrentNetwork>) -> Box<FieldHandle> {
    Box::new(FieldHandle::new(field))
}

pub fn field_from_string(field_str: String) -> Result<Box<FieldHandle>> {
    Field::<CurrentNetwork>::from_str(&field_str)
        .map(FieldHandle::new)
        .map(Box::new)
        .map_err(|err| err.to_string())
}

pub fn field_clone(handle: &FieldHandle) -> Result<Box<FieldHandle>> {
    handle.field_clone()
}

pub fn field_multiply_handles(lhs: &FieldHandle, rhs: &FieldHandle) -> Result<Box<FieldHandle>> {
    lhs.field_multiply_handles(rhs)
}

pub fn field_to_string(handle: &FieldHandle) -> String {
    handle.field_to_string()
}

pub fn validate_field(field_str: String) -> bool {
    Field::<CurrentNetwork>::from_str(&field_str).is_ok()
}

pub fn field_to_bits_le_handle(handle: &FieldHandle) -> BytesResult {
    handle.field_to_bits_le_handle()
}

pub fn field_normalize(field_str: String) -> StringResult {
    match Field::<CurrentNetwork>::from_str(&field_str) {
        Ok(field) => string_success_result(field.to_string()),
        Err(err) => string_error_result(format!("Invalid field element: {err}")),
    }
}

pub fn field_multiply(lhs: String, rhs: String) -> StringResult {
    let left = Field::<CurrentNetwork>::from_str(&lhs)
        .map_err(|err| format!("Invalid lhs field element: {err}"));
    let right = Field::<CurrentNetwork>::from_str(&rhs)
        .map_err(|err| format!("Invalid rhs field element: {err}"));

    match (left, right) {
        (Ok(l), Ok(r)) => string_success_result((l * r).to_string()),
        (Err(err), _) => string_error_result(err),
        (_, Err(err)) => string_error_result(err),
    }
}

pub fn field_to_bits_le(field_str: String) -> BytesResult {
    match Field::<CurrentNetwork>::from_str(&field_str) {
        Ok(field) => {
            let bits = field.to_bits_le();
            let bytes: Vec<u8> = bits
                .into_iter()
                .map(|bit| if bit { 1 } else { 0 })
                .collect();
            bytes_success_result(bytes)
        }
        Err(err) => bytes_error_result(format!("Invalid field element: {err}")),
    }
}

pub fn field_one() -> Box<FieldHandle> {
    field_from_value(Field::<CurrentNetwork>::from_u8(1))
}

pub fn field_new_domain_separator(domain: String) -> Box<FieldHandle> {
    field_from_value(Field::<CurrentNetwork>::new_domain_separator(&domain))
}
