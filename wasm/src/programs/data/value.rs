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
    DynamicRecord,
    Field,
    Plaintext,
    RecordPlaintext,
    js_array_from_fields,
    to_bits_array_le,
    types::native::{DynamicRecordNative, PlaintextNative, RecordPlaintextNative, ValueNative},
};
use snarkvm_console::prelude::{FromBytes, ToBits, ToBitsRaw, ToBytes, ToFields, ToFieldsRaw};

use js_sys::{Array, Uint8Array};
use std::{ops::Deref, str::FromStr};
use wasm_bindgen::prelude::wasm_bindgen;

/// Aleo Value type. Value is the fundamental type representing program function inputs and outputs
/// in Aleo. It wraps five variants: Plaintext, Record, Future, DynamicRecord, and DynamicFuture.
///
/// @example
/// // Parse a plaintext value from a string.
/// const value = Value.fromString("100u64");
/// console.log(value.valueType()); // "plaintext"
/// console.log(value.isPlaintext()); // true
///
/// // Extract the inner Plaintext.
/// const plaintext = value.toPlaintext();
/// console.log(plaintext.toString()); // "100u64"
#[wasm_bindgen]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Value(ValueNative);

#[wasm_bindgen]
impl Value {
    /// Creates a Value from its string representation.
    ///
    /// @param {string} value The string representation of the value.
    /// @returns {Value} The Value object.
    #[wasm_bindgen(js_name = "fromString")]
    pub fn from_string(value: &str) -> Result<Value, String> {
        Ok(Self(ValueNative::from_str(value).map_err(|e| e.to_string())?))
    }

    /// Returns the string representation of the value.
    ///
    /// @returns {string} The string representation of the value.
    #[wasm_bindgen(js_name = "toString")]
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Creates a Value from a little-endian byte array.
    ///
    /// @param {Uint8Array} bytes A little-endian byte array.
    /// @returns {Value} The Value object.
    #[wasm_bindgen(js_name = "fromBytesLe")]
    pub fn from_bytes_le(bytes: Uint8Array) -> Result<Value, String> {
        let rust_bytes = bytes.to_vec();
        let native = ValueNative::from_bytes_le(rust_bytes.as_slice()).map_err(|e| e.to_string())?;
        Ok(Self(native))
    }

    /// Returns the little-endian byte array representation of the value.
    ///
    /// @returns {Uint8Array} The little-endian byte array.
    #[wasm_bindgen(js_name = "toBytesLe")]
    pub fn to_bytes_le(&self) -> Result<Uint8Array, String> {
        let rust_bytes = self.0.to_bytes_le().map_err(|e| e.to_string())?;
        Ok(Uint8Array::from(rust_bytes.as_slice()))
    }

    /// Returns the little-endian boolean array representation of the bits.
    ///
    /// @returns {Array} Boolean array of bits in little-endian order.
    #[wasm_bindgen(js_name = "toBitsLe")]
    pub fn to_bits_le(&self) -> Array {
        to_bits_array_le!(self)
    }

    /// Returns the raw little-endian boolean array representation of the bits.
    ///
    /// @returns {Array} Raw boolean array of bits in little-endian order.
    #[wasm_bindgen(js_name = "toBitsRawLe")]
    pub fn to_bits_raw_le(&self) -> Array {
        self.0.to_bits_raw_le().iter().map(|x| wasm_bindgen::JsValue::from_bool(*x)).collect::<js_sys::Array>()
    }

    /// Returns the raw big-endian boolean array representation of the bits.
    ///
    /// @returns {Array} Raw boolean array of bits in big-endian order.
    #[wasm_bindgen(js_name = "toBitsRawBe")]
    pub fn to_bits_raw_be(&self) -> Array {
        self.0.to_bits_raw_be().iter().map(|x| wasm_bindgen::JsValue::from_bool(*x)).collect::<js_sys::Array>()
    }

    /// Returns the field array representation of the value.
    ///
    /// @returns {Array} Array of Field elements.
    #[wasm_bindgen(js_name = "toFields")]
    pub fn to_fields(&self) -> Result<Array, String> {
        let native_fields = self.0.to_fields().map_err(|e| e.to_string())?;
        Ok(js_array_from_fields!(&native_fields))
    }

    /// Returns the raw field array representation of the value.
    ///
    /// @returns {Array} Array of raw Field elements.
    #[wasm_bindgen(js_name = "toFieldsRaw")]
    pub fn to_fields_raw(&self) -> Result<Array, String> {
        let native_fields_raw = self.0.to_fields_raw().map_err(|e| e.to_string())?;
        Ok(js_array_from_fields!(&native_fields_raw))
    }

    /// Returns the type of the value variant as a string.
    ///
    /// Possible values: "plaintext", "record", "future", "dynamic_record", "dynamic_future".
    ///
    /// @returns {string} The variant type name.
    #[wasm_bindgen(js_name = "valueType")]
    pub fn value_type(&self) -> String {
        match &self.0 {
            ValueNative::Plaintext(..) => "plaintext".to_string(),
            ValueNative::Record(..) => "record".to_string(),
            ValueNative::Future(..) => "future".to_string(),
            ValueNative::DynamicRecord(..) => "dynamic_record".to_string(),
            ValueNative::DynamicFuture(..) => "dynamic_future".to_string(),
        }
    }

    /// Returns true if the value is a Plaintext variant.
    ///
    /// @returns {boolean}
    #[wasm_bindgen(js_name = "isPlaintext")]
    pub fn is_plaintext(&self) -> bool {
        matches!(&self.0, ValueNative::Plaintext(..))
    }

    /// Returns true if the value is a Record variant.
    ///
    /// @returns {boolean}
    #[wasm_bindgen(js_name = "isRecord")]
    pub fn is_record(&self) -> bool {
        matches!(&self.0, ValueNative::Record(..))
    }

    /// Returns true if the value is a Future variant.
    ///
    /// Note: There is no `toFuture()` method because the Future type does not have a WASM wrapper.
    /// Use `toString()` or `toBytesLe()` to serialize a Future value.
    ///
    /// @returns {boolean}
    #[wasm_bindgen(js_name = "isFuture")]
    pub fn is_future(&self) -> bool {
        matches!(&self.0, ValueNative::Future(..))
    }

    /// Returns true if the value is a DynamicRecord variant.
    ///
    /// @returns {boolean}
    #[wasm_bindgen(js_name = "isDynamicRecord")]
    pub fn is_dynamic_record(&self) -> bool {
        matches!(&self.0, ValueNative::DynamicRecord(..))
    }

    /// Returns true if the value is a DynamicFuture variant.
    ///
    /// Note: There is no `toDynamicFuture()` method because the DynamicFuture type does not have a WASM wrapper.
    /// Use `toString()` or `toBytesLe()` to serialize a DynamicFuture value.
    ///
    /// @returns {boolean}
    #[wasm_bindgen(js_name = "isDynamicFuture")]
    pub fn is_dynamic_future(&self) -> bool {
        matches!(&self.0, ValueNative::DynamicFuture(..))
    }

    /// Extracts the inner Plaintext from a Plaintext variant.
    ///
    /// @returns {Plaintext} The inner Plaintext value.
    /// @throws If the value is not a Plaintext variant.
    #[wasm_bindgen(js_name = "toPlaintext")]
    pub fn to_plaintext(&self) -> Result<Plaintext, String> {
        match &self.0 {
            ValueNative::Plaintext(plaintext) => Ok(Plaintext::from(plaintext.clone())),
            _ => Err(format!("Value is not a Plaintext variant, it is a {} variant", self.value_type())),
        }
    }

    /// Extracts the inner Record from a Record variant as a RecordPlaintext.
    ///
    /// @returns {RecordPlaintext} The inner record.
    /// @throws If the value is not a Record variant.
    #[wasm_bindgen(js_name = "toRecordPlaintext")]
    pub fn to_record_plaintext(&self) -> Result<RecordPlaintext, String> {
        match &self.0 {
            ValueNative::Record(record) => Ok(RecordPlaintext::from(record.clone())),
            _ => Err(format!("Value is not a Record variant, it is a {} variant", self.value_type())),
        }
    }

    /// Creates a Value from a Plaintext object.
    ///
    /// @param {Plaintext} plaintext The Plaintext to wrap.
    /// @returns {Value} A Value wrapping the Plaintext.
    #[wasm_bindgen(js_name = "fromPlaintext")]
    pub fn from_plaintext(plaintext: &Plaintext) -> Value {
        let native: PlaintextNative = plaintext.into();
        Value(ValueNative::Plaintext(native))
    }

    /// Creates a Value from a RecordPlaintext object.
    ///
    /// @param {RecordPlaintext} record The RecordPlaintext to wrap.
    /// @returns {Value} A Value wrapping the Record.
    #[wasm_bindgen(js_name = "fromRecordPlaintext")]
    pub fn from_record_plaintext(record: &RecordPlaintext) -> Value {
        let native: RecordPlaintextNative = record.into();
        Value(ValueNative::Record(native))
    }

    /// Extracts the inner DynamicRecord from a DynamicRecord variant.
    ///
    /// @returns {DynamicRecord} The inner DynamicRecord value.
    /// @throws If the value is not a DynamicRecord variant.
    #[wasm_bindgen(js_name = "toDynamicRecord")]
    pub fn to_dynamic_record(&self) -> Result<DynamicRecord, String> {
        match &self.0 {
            ValueNative::DynamicRecord(dynamic_record) => Ok(DynamicRecord::from(dynamic_record.clone())),
            _ => Err(format!("Value is not a DynamicRecord variant, it is a {} variant", self.value_type())),
        }
    }

    /// Creates a Value from a DynamicRecord object.
    ///
    /// @param {DynamicRecord} dynamic_record The DynamicRecord to wrap.
    /// @returns {Value} A Value wrapping the DynamicRecord.
    #[wasm_bindgen(js_name = "fromDynamicRecord")]
    pub fn from_dynamic_record(dynamic_record: &DynamicRecord) -> Value {
        let native: DynamicRecordNative = dynamic_record.into();
        Value(ValueNative::DynamicRecord(native))
    }
}

impl Deref for Value {
    type Target = ValueNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<ValueNative> for Value {
    fn from(native: ValueNative) -> Self {
        Self(native)
    }
}

impl From<Value> for ValueNative {
    fn from(value: Value) -> Self {
        value.0
    }
}

impl From<&ValueNative> for Value {
    fn from(value: &ValueNative) -> Self {
        Value::from(value.clone())
    }
}

impl From<&Value> for ValueNative {
    fn from(value: &Value) -> Self {
        value.0.clone()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use wasm_bindgen_test::wasm_bindgen_test;

    const PLAINTEXT_LITERAL: &str = "100u64";
    const PLAINTEXT_STRUCT: &str = "{\n  microcredits: 100000000u64,\n  height: 1653124u32\n}";
    const RECORD_VALUE: &str = "{ owner: aleo1d5hg2z3ma00382pngntdp68e74zv54jdxy249qhaujhks9c72yrs33ddah.private, token_amount: 100u64.private, _nonce: 0group.public }";
    const FUTURE_VALUE: &str = "{\n  program_id: credits.aleo,\n  function_name: transfer,\n  arguments: [\n    aleo1d5hg2z3ma00382pngntdp68e74zv54jdxy249qhaujhks9c72yrs33ddah,\n    100000000u64\n  ]\n}";
    const CREDITS_RECORD: &str = "{ owner: aleo12a4wll9ax6w5355jph0dr5wt2vla5sss2t4cnch0tc3vzh643v8qcfvc7a.private, microcredits: 1000000u64.private, _nonce: 3634848344765318974603121890869676775499130077229666060613233255327643175219group.public, _version: 1u8.public }";
    const DYNAMIC_FUTURE_VALUE: &str = "{ _program_id: credits.aleo, _function_name: transfer, _checksum: 0field }";

    #[wasm_bindgen_test]
    fn test_plaintext_literal_string_roundtrip() {
        let value = Value::from_string(PLAINTEXT_LITERAL).unwrap();
        assert_eq!(value.to_string(), PLAINTEXT_LITERAL);
        assert!(value.is_plaintext());
        assert!(!value.is_record());
        assert!(!value.is_future());
        assert!(!value.is_dynamic_record());
        assert!(!value.is_dynamic_future());
        assert_eq!(value.value_type(), "plaintext");
    }

    #[wasm_bindgen_test]
    fn test_plaintext_struct_string_roundtrip() {
        let value = Value::from_string(PLAINTEXT_STRUCT).unwrap();
        assert_eq!(value.to_string(), PLAINTEXT_STRUCT);
        assert!(value.is_plaintext());
        assert_eq!(value.value_type(), "plaintext");
    }

    #[wasm_bindgen_test]
    fn test_record_value_string_roundtrip() {
        let value = Value::from_string(RECORD_VALUE).unwrap();
        assert!(value.is_record());
        assert!(!value.is_plaintext());
        assert_eq!(value.value_type(), "record");
    }

    #[wasm_bindgen_test]
    fn test_future_value_string_roundtrip() {
        let value = Value::from_string(FUTURE_VALUE).unwrap();
        assert!(value.is_future());
        assert!(!value.is_plaintext());
        assert!(!value.is_record());
        assert!(!value.is_dynamic_record());
        assert!(!value.is_dynamic_future());
        assert_eq!(value.value_type(), "future");
    }

    #[wasm_bindgen_test]
    fn test_dynamic_record_value() {
        // Construct a DynamicRecord from an existing record.
        let record = RecordPlaintext::from_string(CREDITS_RECORD).unwrap();
        let dynamic_record = DynamicRecord::from_record(&record).unwrap();
        let value = Value::from_string(&dynamic_record.to_string()).unwrap();
        assert!(value.is_dynamic_record());
        assert!(!value.is_plaintext());
        assert!(!value.is_record());
        assert!(!value.is_future());
        assert!(!value.is_dynamic_future());
        assert_eq!(value.value_type(), "dynamic_record");
    }

    #[wasm_bindgen_test]
    fn test_dynamic_future_value() {
        let value = Value::from_string(DYNAMIC_FUTURE_VALUE).unwrap();
        assert!(value.is_dynamic_future());
        assert!(!value.is_plaintext());
        assert!(!value.is_record());
        assert!(!value.is_future());
        assert!(!value.is_dynamic_record());
        assert_eq!(value.value_type(), "dynamic_future");
    }

    #[wasm_bindgen_test]
    fn test_all_variants_bytes_roundtrip() {
        // Build a dynamic record string from a record.
        let record = RecordPlaintext::from_string(CREDITS_RECORD).unwrap();
        let dynamic_record_str = DynamicRecord::from_record(&record).unwrap().to_string();

        for input in
            [PLAINTEXT_LITERAL, PLAINTEXT_STRUCT, RECORD_VALUE, FUTURE_VALUE, &dynamic_record_str, DYNAMIC_FUTURE_VALUE]
        {
            let value = Value::from_string(input).unwrap();
            let bytes = value.to_bytes_le().unwrap();
            let recovered = Value::from_bytes_le(bytes).unwrap();
            assert_eq!(value.to_string(), recovered.to_string());
        }
    }

    #[wasm_bindgen_test]
    fn test_to_plaintext_extraction() {
        let value = Value::from_string(PLAINTEXT_LITERAL).unwrap();
        let plaintext = value.to_plaintext().unwrap();
        assert_eq!(plaintext.to_string(), PLAINTEXT_LITERAL);
    }

    #[wasm_bindgen_test]
    fn test_to_record_plaintext_extraction() {
        let value = Value::from_string(RECORD_VALUE).unwrap();
        let record = value.to_record_plaintext().unwrap();
        assert_eq!(record.to_string(), value.to_string());
    }

    #[wasm_bindgen_test]
    fn test_from_plaintext_construction() {
        let plaintext = Plaintext::from_string(PLAINTEXT_LITERAL).unwrap();
        let value = Value::from_plaintext(&plaintext);
        assert!(value.is_plaintext());
        assert_eq!(value.to_string(), PLAINTEXT_LITERAL);
    }

    #[wasm_bindgen_test]
    fn test_from_record_plaintext_construction() {
        let record = RecordPlaintext::from_string(RECORD_VALUE).unwrap();
        let value = Value::from_record_plaintext(&record);
        assert!(value.is_record());
    }

    #[wasm_bindgen_test]
    fn test_to_dynamic_record_extraction() {
        let record = RecordPlaintext::from_string(CREDITS_RECORD).unwrap();
        let dynamic_record = DynamicRecord::from_record(&record).unwrap();
        let value = Value::from_string(&dynamic_record.to_string()).unwrap();
        let extracted = value.to_dynamic_record().unwrap();
        assert_eq!(extracted.to_string(), dynamic_record.to_string());
    }

    #[wasm_bindgen_test]
    fn test_from_dynamic_record_construction() {
        let record = RecordPlaintext::from_string(CREDITS_RECORD).unwrap();
        let dynamic_record = DynamicRecord::from_record(&record).unwrap();
        let value = Value::from_dynamic_record(&dynamic_record);
        assert!(value.is_dynamic_record());
        assert_eq!(value.to_dynamic_record().unwrap().to_string(), dynamic_record.to_string());
    }

    #[wasm_bindgen_test]
    fn test_wrong_variant_extraction_errors() {
        let value = Value::from_string(RECORD_VALUE).unwrap();
        assert!(value.to_plaintext().is_err());
        assert!(value.to_dynamic_record().is_err());

        let value = Value::from_string(PLAINTEXT_LITERAL).unwrap();
        assert!(value.to_record_plaintext().is_err());
        assert!(value.to_dynamic_record().is_err());

        let value = Value::from_string(FUTURE_VALUE).unwrap();
        assert!(value.to_plaintext().is_err());
        assert!(value.to_record_plaintext().is_err());
        assert!(value.to_dynamic_record().is_err());

        let value = Value::from_string(DYNAMIC_FUTURE_VALUE).unwrap();
        assert!(value.to_plaintext().is_err());
        assert!(value.to_record_plaintext().is_err());
        assert!(value.to_dynamic_record().is_err());
    }

    #[wasm_bindgen_test]
    fn test_invalid_string_errors() {
        assert!(Value::from_string("not_a_valid_value").is_err());
    }

    #[wasm_bindgen_test]
    fn test_to_bits_le() {
        let value = Value::from_string(PLAINTEXT_LITERAL).unwrap();
        let bits = value.to_bits_le();
        assert!(bits.length() > 0);
    }

    #[wasm_bindgen_test]
    fn test_to_fields() {
        let value = Value::from_string(PLAINTEXT_LITERAL).unwrap();
        let fields = value.to_fields().unwrap();
        assert!(fields.length() > 0);
    }

    #[wasm_bindgen_test]
    fn test_to_fields_raw() {
        let value = Value::from_string(PLAINTEXT_LITERAL).unwrap();
        let fields_raw = value.to_fields_raw().unwrap();
        assert!(fields_raw.length() > 0);
    }
}
