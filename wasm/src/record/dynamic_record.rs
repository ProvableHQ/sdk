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

use crate::{
    Address,
    RecordPlaintext,
    js_array_from_fields,
    to_bits_array_le,
    types::{Field, Group, native::DynamicRecordNative},
};
use snarkvm_console::prelude::{FromBytes, ToBits, ToBytes, ToFields};

use js_sys::{Array, Uint8Array};
use std::{ops::Deref, str::FromStr};
use wasm_bindgen::prelude::*;

/// A fixed-size representation of an Aleo record. Like static records, a dynamic record
/// contains an owner, nonce, and a version, but instead of storing the full data it only
/// stores the Merkle root of the data, ensuring all dynamic records have a constant size.
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct DynamicRecord(DynamicRecordNative);

#[wasm_bindgen]
impl DynamicRecord {
    /// Creates a DynamicRecord from its string representation.
    #[wasm_bindgen(js_name = "fromString")]
    #[allow(clippy::should_implement_trait)]
    pub fn from_string(s: &str) -> Result<DynamicRecord, String> {
        Ok(Self(DynamicRecordNative::from_str(s).map_err(|e| e.to_string())?))
    }

    /// Returns the string representation of the dynamic record.
    #[wasm_bindgen(js_name = "toString")]
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Returns the owner address of the dynamic record.
    pub fn owner(&self) -> Address {
        Address::from(self.0.owner())
    }

    /// Returns the Merkle root of the record data as a Field.
    pub fn root(&self) -> Field {
        Field::from(self.0.root())
    }

    /// Returns the nonce of the record as a Group.
    pub fn nonce(&self) -> Group {
        Group::from(self.0.nonce())
    }

    /// Returns `true` if the dynamic record is a hiding variant (version != 0).
    #[wasm_bindgen(js_name = "isHiding")]
    pub fn is_hiding(&self) -> bool {
        self.0.is_hiding()
    }

    /// Creates a DynamicRecord from a RecordPlaintext.
    #[wasm_bindgen(js_name = "fromRecord")]
    pub fn from_record(record: &RecordPlaintext) -> Result<DynamicRecord, String> {
        Ok(Self(DynamicRecordNative::from_record(record.deref()).map_err(|e| e.to_string())?))
    }

    /// Converts this DynamicRecord back to a RecordPlaintext.
    /// `owner_is_private` controls whether the owner field uses private or public visibility.
    #[wasm_bindgen(js_name = "toRecord")]
    pub fn to_record(&self, owner_is_private: bool) -> Result<RecordPlaintext, String> {
        Ok(RecordPlaintext::from(self.0.to_record(owner_is_private).map_err(|e| e.to_string())?))
    }

    /// Deserializes a DynamicRecord from a little-endian byte array (Uint8Array).
    #[wasm_bindgen(js_name = "fromBytesLe")]
    pub fn from_bytes_le(bytes: &Uint8Array) -> Result<DynamicRecord, String> {
        let bytes = bytes.to_vec();
        Ok(Self(DynamicRecordNative::from_bytes_le(&bytes).map_err(|e| e.to_string())?))
    }

    /// Serializes the dynamic record to a little-endian byte array (Uint8Array).
    #[wasm_bindgen(js_name = "toBytesLe")]
    pub fn to_bytes_le(&self) -> Result<Uint8Array, String> {
        let bytes = self.0.to_bytes_le().map_err(|e| e.to_string())?;
        Ok(Uint8Array::from(bytes.as_slice()))
    }

    /// Returns the dynamic record as an array of field elements.
    #[wasm_bindgen(js_name = "toFields")]
    pub fn to_fields(&self) -> Result<Array, String> {
        let fields = self.0.to_fields().map_err(|e| e.to_string())?;
        Ok(js_array_from_fields!(&fields))
    }

    /// Returns the dynamic record as a little-endian bit array (JS Array of booleans).
    #[wasm_bindgen(js_name = "toBitsLe")]
    pub fn to_bits_le(&self) -> Array {
        to_bits_array_le!(self)
    }
}

impl std::ops::Deref for DynamicRecord {
    type Target = DynamicRecordNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<DynamicRecordNative> for DynamicRecord {
    fn from(native: DynamicRecordNative) -> Self {
        Self(native)
    }
}

impl From<DynamicRecord> for DynamicRecordNative {
    fn from(val: DynamicRecord) -> Self {
        val.0
    }
}

impl From<&DynamicRecordNative> for DynamicRecord {
    fn from(native: &DynamicRecordNative) -> Self {
        Self(native.clone())
    }
}

impl From<&DynamicRecord> for DynamicRecordNative {
    fn from(val: &DynamicRecord) -> Self {
        val.0.clone()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use wasm_bindgen_test::*;

    // Credits record for testing.
    const CREDITS_RECORD_V1: &str = "{ owner: aleo12a4wll9ax6w5355jph0dr5wt2vla5sss2t4cnch0tc3vzh643v8qcfvc7a.private, microcredits: 1000000u64.private, _nonce: 3634848344765318974603121890869676775499130077229666060613233255327643175219group.public, _version: 1u8.public }";

    #[wasm_bindgen_test]
    fn test_to_and_from_string() {
        let dynamic_record_str =
            DynamicRecord::from_record(&RecordPlaintext::from_string(CREDITS_RECORD_V1).unwrap()).unwrap().to_string();
        let record = DynamicRecord::from_string(&dynamic_record_str).unwrap();
        assert_eq!(record.to_string(), dynamic_record_str);
    }

    #[wasm_bindgen_test]
    fn test_clone() {
        let dynamic_record_str =
            DynamicRecord::from_record(&RecordPlaintext::from_string(CREDITS_RECORD_V1).unwrap()).unwrap().to_string();
        let record = DynamicRecord::from_string(&dynamic_record_str).unwrap();
        let cloned = record.clone();
        assert_eq!(record.to_string(), cloned.to_string());
    }

    #[wasm_bindgen_test]
    fn test_owner() {
        let dynamic_record_str =
            DynamicRecord::from_record(&RecordPlaintext::from_string(CREDITS_RECORD_V1).unwrap()).unwrap().to_string();
        let record = DynamicRecord::from_string(&dynamic_record_str).unwrap();
        assert_eq!(record.owner().to_string(), "aleo12a4wll9ax6w5355jph0dr5wt2vla5sss2t4cnch0tc3vzh643v8qcfvc7a");
    }

    #[wasm_bindgen_test]
    fn test_root() {
        let dynamic_record_str =
            DynamicRecord::from_record(&RecordPlaintext::from_string(CREDITS_RECORD_V1).unwrap()).unwrap().to_string();
        let record = DynamicRecord::from_string(&dynamic_record_str).unwrap();
        assert_eq!(
            record.root().to_string(),
            "3632128850012040781624982531669233558118256132998845003264257146683715587370field"
        );
    }

    #[wasm_bindgen_test]
    fn test_nonce() {
        let dynamic_record_str =
            DynamicRecord::from_record(&RecordPlaintext::from_string(CREDITS_RECORD_V1).unwrap()).unwrap().to_string();
        let record = DynamicRecord::from_string(&dynamic_record_str).unwrap();
        assert_eq!(
            record.nonce().to_string(),
            "3634848344765318974603121890869676775499130077229666060613233255327643175219group"
        );
    }

    #[wasm_bindgen_test]
    fn test_is_hiding_true() {
        let dynamic_record_str =
            DynamicRecord::from_record(&RecordPlaintext::from_string(CREDITS_RECORD_V1).unwrap()).unwrap().to_string();
        let record = DynamicRecord::from_string(&dynamic_record_str).unwrap();
        assert!(record.is_hiding());
    }

    #[wasm_bindgen_test]
    fn test_bytes_round_trip() {
        let dynamic_record_str =
            DynamicRecord::from_record(&RecordPlaintext::from_string(CREDITS_RECORD_V1).unwrap()).unwrap().to_string();
        let record = DynamicRecord::from_string(&dynamic_record_str).unwrap();
        let bytes = record.to_bytes_le().unwrap();
        let recovered = DynamicRecord::from_bytes_le(&bytes).unwrap();
        assert_eq!(record.owner().to_string(), recovered.owner().to_string());
        assert_eq!(record.root().to_string(), recovered.root().to_string());
        assert_eq!(record.nonce().to_string(), recovered.nonce().to_string());
    }

    #[wasm_bindgen_test]
    fn test_to_fields() {
        let dynamic_record_str =
            DynamicRecord::from_record(&RecordPlaintext::from_string(CREDITS_RECORD_V1).unwrap()).unwrap().to_string();
        let record = DynamicRecord::from_string(&dynamic_record_str).unwrap();
        let fields = record.to_fields().unwrap();
        assert!(fields.length() > 0);
    }

    #[wasm_bindgen_test]
    fn test_to_bits_le() {
        let dynamic_record_str =
            DynamicRecord::from_record(&RecordPlaintext::from_string(CREDITS_RECORD_V1).unwrap()).unwrap().to_string();
        let record = DynamicRecord::from_string(&dynamic_record_str).unwrap();
        let bits = record.to_bits_le();
        assert!(bits.length() > 0);
    }

    #[wasm_bindgen_test]
    fn test_from_string_invalid() {
        assert!(DynamicRecord::from_string("not a record").is_err());
    }
}
