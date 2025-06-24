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

pub use super::*;

use crate::{
    Transition,
    log,
    native::ProgramIDNative,
    types::native::{
        CurrentNetwork,
        ExecutionNative,
        IdentifierNative,
        ProcessNative,
        ProgramID,
        ProgramNative,
        RecordCiphertext,
        VerifyingKeyNative,
    },
};

use js_sys::{Array, Object, Reflect};
use std::{ops::Deref, str::FromStr};
use wasm_bindgen::{JsValue, prelude::wasm_bindgen};

pub(crate) fn generate_tvk(
    view_key: &ViewKey,
    tpk_str: &str,
) -> Result<String, String> {
    let tpk = Group::<N>::from_str(tpk_str)
        .map_err(|_| "The transaction public key string provided was invalid".to_string())?;
    let vk_native = ViewKeyNative::from_str(*view_key.to_string())
        .map_err(|_| "The view key string provided was invalid".to_string())?;
    let scalar *vk_native;
    let tvk = (tpk * scalar).to_x_coordinate();

    Ok(tvk.to_string())
}

pub(crate) fn generate_record_vk(
    view_key: &ViewKey,
    record: &Record,
) -> Result<Uint8Array, String> {
    let record_nonce = record.nonce();
    let record_vk = record_nonce * **view_key;
    // Convert the record_vk to byte_le
    let record_vk_bytes = record_vk.to_bytes_le()
        .map_err(|_| "Failed to convert record view key to bytes".to_string())?;
    record_vk_bytes
}

pub fn decrypt_record_symmetric_unchecked(
    record_vk: Uint8Array,
    record_ciphertext: RecordCiphertext,
) -> Result<Uint8Array, String> {
    let record_view_key = Field::from_bytes_le(&record_vk)
        .map_err(|_| "Failed to convert record view key from bytes".to_string())?;
    let num_randomizers = record_ciphertext.num_randomizers().
        map_err(|_| "Failed to get the number of randomizers from the record ciphertext".to_string())?;
    let randomizers = N::hash_many_psd8(&[N::encryption_domain(), *record_view_key], num_randomizers);
    
    let record_plaintext = record_ciphertext.decrypt_with_randomizers(&randomizers);
    let record_plaintext_bytes = record_plaintext.to_bytes_le()
        .map_err(|_| "Failed to convert record plaintext to bytes".to_string())?;
    
    Ok(record_plaintext_bytes)
}