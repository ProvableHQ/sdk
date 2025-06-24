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
    Field,
    Group,
    Scalar,
    Transition,
    RecordCiphertext,
    RecordPlaintext,
    ViewKey,

    log,
    native::ProgramIDNative,
    types::native::{
        CurrentNetwork,
        ExecutionNative,
        IdentifierNative,
        ProcessNative,
        ProgramID,
        ProgramNative,
        VerifyingKeyNative,
    },
};

use js_sys::{Array, Object, Reflect};
use std::{ops::Deref, str::FromStr};
use wasm_bindgen::{JsValue, prelude::wasm_bindgen};

#[wasm_bindgen(js_name = "generateTvk")]
pub fn generate_tvk(
    view_key: &ViewKey,
    tpk: &Group,
) -> Field {
    tpk.scalar_multiply(&view_key.to_scalar()).to_x_coordinate()
}

#[wasm_bindgen(js_name = "generateRecordVk")]
pub(crate) fn generate_record_vk(
    view_key: &ViewKey,
    record: &Record,
) -> Group {
    let record_nonce = record.nonce();
    record_nonce * **view_key
}

#[wasm_bindgen(js_name = "decryptRecordSymmetricUnchecked")]
pub fn decrypt_record_symmetric_unchecked(
    record_vk: Group,
    record_ciphertext: RecordCiphertext,
) -> Result<RecordPlaintext, String> {
    let num_randomizers = record_ciphertext.num_randomizers()
        .map_err(|_| "Failed to get the number of randomizers from the record ciphertext".to_string())?;
    let randomizers = N::hash_many_psd8(&[N::encryption_domain(), *record_view_key], num_randomizers); // Not qwuite sure how to implement this on the SDK side.
    
    let record_plaintext = record_ciphertext.decrypt_with_randomizers(&randomizers);
    
    Ok(record_plaintext)
}