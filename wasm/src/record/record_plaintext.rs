// Copyright (C) 2019-2023 Aleo Systems Inc.
// This file is part of the Aleo SDK library.

// The Aleo SDK library is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// The Aleo SDK library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with the Aleo SDK library. If not, see <https://www.gnu.org/licenses/>.

use crate::{
    Address,
    Credits,
    GraphKey,
    Plaintext,
    PrivateKey,
    record_to_js_object,
    types::{
        Field,
        native::{
            CurrentNetwork,
            EntryNative,
            IdentifierNative,
            PlaintextNative,
            ProgramIDNative,
            RecordPlaintextNative,
        },
    },
};
use snarkvm_console::program::Owner;

use anyhow::Context;
use js_sys::Object;
use std::{ops::Deref, str::FromStr};
use wasm_bindgen::prelude::*;

/// Plaintext representation of an Aleo record
#[wasm_bindgen]
#[derive(Clone)]
pub struct RecordPlaintext(RecordPlaintextNative);

#[wasm_bindgen]
impl RecordPlaintext {
    pub fn commitment(&self, program_id: &str, record_name: &str) -> Result<Field, String> {
        Ok(Field::from(
            self.to_commitment(
                &ProgramIDNative::from_str(program_id)
                    .map_err(|_| format!("{program_id} is an invalid program name"))?,
                &IdentifierNative::from_str(record_name)
                    .map_err(|_| format!("{record_name} is an invalid identifier"))?,
            )
            .map_err(|e| e.to_string())?,
        ))
    }

    /// Return a record plaintext from a string.
    ///
    /// @param {string} record String representation of a plaintext representation of an Aleo record
    /// @returns {RecordPlaintext} Record plaintext
    #[wasm_bindgen(js_name = fromString)]
    pub fn from_string(record: &str) -> Result<RecordPlaintext, String> {
        Self::from_str(record).map_err(|_| "The record plaintext string provided was invalid".into())
    }

    #[wasm_bindgen(js_name = getMember)]
    pub fn get_member(&self, input: String) -> Result<Plaintext, String> {
        let entry = self
            .0
            .data()
            .get(&IdentifierNative::from_str(&input).map_err(|_| "".to_string())?)
            .context("Record member not found")
            .map_err(|e| e.to_string())?;
        let entry = match entry {
            EntryNative::Public(entry) => entry,
            EntryNative::Constant(entry) => entry,
            EntryNative::Private(entry) => entry,
        };
        Ok(Plaintext::from(entry.clone()))
    }

    /// Get the owner of the record.
    pub fn owner(&self) -> Result<Address, String> {
        match self.0.owner() {
            Owner::<CurrentNetwork, PlaintextNative>::Public(owner) => Ok(Address::from(*owner)),
            _ => Err("Record is not public".to_string()),
        }
    }

    /// Get a representation of a record as a javascript object for usage in client side
    /// computations. Note that this is not a reversible operation and exists for the convenience
    /// of discovering and using properties of the record.
    ///
    /// The conversion guide is as follows:
    /// - u8, u16, u32, i8, i16 i32 --> Number
    /// - u64, u128, i64, i128 --> BigInt
    /// - Address, Field, Group, Scalar --> String.
    ///
    /// Address, Field, Group, and Scalar will all be converted to their bech32 string
    /// representation. These string representations can be converted back to their respective wasm
    /// types using the fromString method on the Address, Field, Group, and Scalar objects in this
    /// library.
    ///
    /// @example
    /// # Create a wasm record from a record string.
    /// let record_plaintext_wasm = RecordPlainext.from_string("{
    ///   owner: aleo1kh5t7m30djl0ecdn4f5vuzp7dx0tcwh7ncquqjkm4matj2p2zqpqm6at48.private,
    ///   metadata: {
    ///     player1: aleo1kh5t7m30djl0ecdn4f5vuzp7dx0tcwh7ncquqjkm4matj2p2zqpqm6at48.private,
    ///     player2: aleo1dreuxnmg9cny8ee9v2u0wr4v4affnwm09u2pytfwz0f2en2shgqsdsfjn6.private,
    ///     nonce: 660310649780728486489183263981322848354071976582883879926426319832534836534field.private
    ///   },
    ///   id: 1953278585719525811355617404139099418855053112960441725284031425961000152405field.private,
    ///   positions: 50794271u64.private,
    ///   attempts: 0u64.private,
    ///   hits: 0u64.private,
    ///   _nonce: 5668100912391182624073500093436664635767788874314097667746354181784048204413group.public
    /// }");
    ///
    /// let expected_object = {
    ///   owner: "aleo1kh5t7m30djl0ecdn4f5vuzp7dx0tcwh7ncquqjkm4matj2p2zqpqm6at48",
    ///   metadata: {
    ///     player1: "aleo1kh5t7m30djl0ecdn4f5vuzp7dx0tcwh7ncquqjkm4matj2p2zqpqm6at48",
    ///     player2: "aleo1dreuxnmg9cny8ee9v2u0wr4v4affnwm09u2pytfwz0f2en2shgqsdsfjn6",
    ///     nonce: "660310649780728486489183263981322848354071976582883879926426319832534836534field"
    ///   },
    ///   id: "1953278585719525811355617404139099418855053112960441725284031425961000152405field",
    ///   positions: 50794271,
    ///   attempts: 0,
    ///   hits: 0,
    ///   _nonce: "5668100912391182624073500093436664635767788874314097667746354181784048204413group"
    /// };
    ///
    /// # Create the expected object
    /// let record_plaintext_object = record_plaintext_wasm.to_js_object();
    /// assert(JSON.stringify(record_plaintext_object) == JSON.stringify(expected_object));
    ///
    /// @returns {Object} Javascript object representation of the record
    #[wasm_bindgen(js_name = "toJsObject")]
    pub fn to_js_object(&self) -> Result<Object, String> {
        record_to_js_object(&self.0)
    }

    /// Returns the record plaintext string
    ///
    /// @returns {string} String representation of the record plaintext
    #[allow(clippy::inherent_to_string)]
    #[wasm_bindgen(js_name = toString)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Returns the amount of microcredits in the record
    ///
    /// @returns {u64} Amount of microcredits in the record
    pub fn microcredits(&self) -> u64 {
        self.0.microcredits().unwrap_or(0)
    }

    /// Returns the nonce of the record. This can be used to uniquely identify a record.
    ///
    /// @returns {string} Nonce of the record
    #[wasm_bindgen(js_name = nonce)]
    pub fn nonce(&self) -> String {
        self.0.nonce().to_string()
    }

    /// Attempt to get the serial number of a record to determine whether or not is has been spent
    ///
    /// @param {PrivateKey} private_key Private key of the account that owns the record
    /// @param {string} program_id Program ID of the program that the record is associated with
    /// @param {string} record_name Name of the record
    ///
    /// @returns {string} Serial number of the record
    #[wasm_bindgen(js_name = serialNumberString)]
    pub fn serial_number_string(
        &self,
        private_key: &PrivateKey,
        program_id: &str,
        record_name: &str,
    ) -> Result<String, String> {
        let commitment = self.commitment(program_id, record_name)?;

        let serial_number = RecordPlaintextNative::serial_number(private_key.into(), commitment.into())
            .map_err(|_| "Serial number derivation failed".to_string())?;
        Ok(serial_number.to_string())
    }

    /// Get the tag of the record using the graph key.
    pub fn tag(&self, graph_key: &GraphKey, commitment: Field) -> Result<Field, String> {
        RecordPlaintextNative::tag(*graph_key.sk_tag(), *commitment).map_err(|e| e.to_string()).map(Field::from)
    }
}

impl Deref for RecordPlaintext {
    type Target = RecordPlaintextNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<RecordPlaintextNative> for RecordPlaintext {
    fn from(record: RecordPlaintextNative) -> Self {
        Self(record)
    }
}

impl From<RecordPlaintext> for RecordPlaintextNative {
    fn from(record: RecordPlaintext) -> Self {
        record.0
    }
}

impl From<&RecordPlaintextNative> for RecordPlaintext {
    fn from(record: &RecordPlaintextNative) -> Self {
        Self(record.clone())
    }
}

impl From<&RecordPlaintext> for RecordPlaintextNative {
    fn from(record: &RecordPlaintext) -> Self {
        record.0.clone()
    }
}

impl FromStr for RecordPlaintext {
    type Err = anyhow::Error;

    fn from_str(plaintext: &str) -> Result<Self, Self::Err> {
        Ok(Self(RecordPlaintextNative::from_str(plaintext)?))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use wasm_bindgen_test::*;

    const CREDITS_RECORD: &str = r"{
  owner: aleo1j7qxyunfldj2lp8hsvy7mw5k8zaqgjfyr72x2gh3x4ewgae8v5gscf5jh3.private,
  microcredits: 1500000000000000u64.private,
  _nonce: 3077450429259593211617823051143573281856129402760267155982965992208217472983group.public
}";

    const BATTLESHIP_RECORD: &str = r"{
  owner: aleo1kh5t7m30djl0ecdn4f5vuzp7dx0tcwh7ncquqjkm4matj2p2zqpqm6at48.private,
  metadata: {
    player1: aleo1kh5t7m30djl0ecdn4f5vuzp7dx0tcwh7ncquqjkm4matj2p2zqpqm6at48.private,
    player2: aleo1dreuxnmg9cny8ee9v2u0wr4v4affnwm09u2pytfwz0f2en2shgqsdsfjn6.private,
    nonce: 660310649780728486489183263981322848354071976582883879926426319832534836534field.private
  },
  id: 1953278585719525811355617404139099418855053112960441725284031425961000152405field.private,
  positions: 50794271u64.private,
  attempts: 0u64.private,
  hits: 0u64.private,
  _nonce: 5668100912391182624073500093436664635767788874314097667746354181784048204413group.public
}";

    #[wasm_bindgen_test]
    fn test_to_and_from_string() {
        let record = RecordPlaintext::from_string(CREDITS_RECORD).unwrap();
        assert_eq!(record.to_string(), CREDITS_RECORD);
    }

    #[wasm_bindgen_test]
    fn test_get_record_member() {
        // Get the record members.
        let record = RecordPlaintext::from_string(BATTLESHIP_RECORD).unwrap();
        let positions = record.get_member("positions".to_string()).unwrap();
        let hits = record.get_member("hits".to_string()).unwrap();
        let metadata = record.get_member("metadata".to_string()).unwrap();

        // Get the struct members.
        let player_1 = metadata.find("player1".to_string()).unwrap();
        let player_2 = metadata.find("player2".to_string()).unwrap();
        let nonce = metadata.find("nonce".to_string()).unwrap();

        // Assert the correct information was extracted.
        assert_eq!(positions.to_string(), "50794271u64");
        assert_eq!(hits.to_string(), "0u64");
        assert_eq!(player_1.to_string(), "aleo1kh5t7m30djl0ecdn4f5vuzp7dx0tcwh7ncquqjkm4matj2p2zqpqm6at48");
        assert_eq!(player_2.to_string(), "aleo1dreuxnmg9cny8ee9v2u0wr4v4affnwm09u2pytfwz0f2en2shgqsdsfjn6");
        assert_eq!(
            nonce.to_string(),
            "660310649780728486489183263981322848354071976582883879926426319832534836534field"
        );
    }

    #[wasm_bindgen_test]
    fn test_microcredits_from_string() {
        let record = RecordPlaintext::from_string(CREDITS_RECORD).unwrap();
        assert_eq!(record.microcredits(), 1500000000000000);
    }

    #[wasm_bindgen_test]
    fn test_serial_number() {
        let pk = PrivateKey::from_string("APrivateKey1zkpDeRpuKmEtLNPdv57aFruPepeH1aGvTkEjBo8bqTzNUhE").unwrap();
        let record = RecordPlaintext::from_string(CREDITS_RECORD).unwrap();
        let program_id = "credits.aleo";
        let record_name = "credits";
        let expected_sn = "8170619507075647151199239049653235187042661744691458644751012032123701508940field";
        let result = record.serial_number_string(&pk, program_id, record_name);
        assert_eq!(expected_sn, result.unwrap());
    }

    #[wasm_bindgen_test]
    fn test_serial_number_can_run_twice_with_same_private_key() {
        let pk = PrivateKey::from_string("APrivateKey1zkpDeRpuKmEtLNPdv57aFruPepeH1aGvTkEjBo8bqTzNUhE").unwrap();
        let record = RecordPlaintext::from_string(CREDITS_RECORD).unwrap();
        let program_id = "credits.aleo";
        let record_name = "credits";
        let expected_sn = "8170619507075647151199239049653235187042661744691458644751012032123701508940field";
        assert_eq!(expected_sn, record.serial_number_string(&pk, program_id, record_name).unwrap());
        assert_eq!(expected_sn, record.serial_number_string(&pk, program_id, record_name).unwrap());
    }

    #[wasm_bindgen_test]
    fn test_serial_number_invalid_program_id_returns_err_string() {
        let pk = PrivateKey::from_string("APrivateKey1zkpDeRpuKmEtLNPdv57aFruPepeH1aGvTkEjBo8bqTzNUhE").unwrap();
        let record = RecordPlaintext::from_string(CREDITS_RECORD).unwrap();
        let program_id = "not a real program id";
        let record_name = "token";
        assert!(record.serial_number_string(&pk, program_id, record_name).is_err());
    }

    #[wasm_bindgen_test]
    fn test_serial_number_invalid_record_name_returns_err_string() {
        let pk = PrivateKey::from_string("APrivateKey1zkpDeRpuKmEtLNPdv57aFruPepeH1aGvTkEjBo8bqTzNUhE").unwrap();
        let record = RecordPlaintext::from_string(CREDITS_RECORD).unwrap();
        let program_id = "token.aleo";
        let record_name = "not a real record name";
        assert!(record.serial_number_string(&pk, program_id, record_name).is_err());
    }

    #[wasm_bindgen_test]
    fn test_bad_inputs_to_from_string() {
        let invalid_bech32 = "{ owner: aleo2d5hg2z3ma00382pngntdp68e74zv54jdxy249qhaujhks9c72yrs33ddah.private, microcredits: 99u64.public, _nonce: 0group.public }";
        assert_eq!(
            RecordPlaintext::from_string("string").err(),
            Some("The record plaintext string provided was invalid".into())
        );
        assert!(RecordPlaintext::from_string(invalid_bech32).is_err());
    }
}
