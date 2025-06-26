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
    types::network::CurrentNetwork,
    types::native::{
        ExecutionNative,
        IdentifierNative,
        ProcessNative,
        ProgramID,
        ProgramNative,
        RecordCipherTextNative,
        RecordPlaintextNative,
        VerifyingKeyNative,
    },
};

use js_sys::{Array, Object, Reflect};
use std::{ops::Deref, str::FromStr};
use wasm_bindgen::{JsValue, prelude::wasm_bindgen};

#[wasm_bindgen]
struct DecryptToolBox {};

impl DecryptToolBox {
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
        record: &RecordCiphertextNative,
    ) -> Group {
        let record_nonce = record.0.nonce();
        record_nonce * **view_key
    }

    #[wasm_bindgen(js_name = "decryptRecordSymmetricUnchecked")]
    pub fn decrypt_record_symmetric_unchecked(
        record_vk: Group,
        record_ciphertext: RecordCiphertextNative,
    ) -> Result<RecordPlaintext, String> {
        let num_randomizers = record_ciphertext.num_randomizers()
            .map_err(|_| "Failed to get the number of randomizers from the record ciphertext".to_string())?;
        let randomizers = CurrentNetwork::hash_many_psd8(&[CurrentNetwork::encryption_domain(), *record_view_key], num_randomizers); // Not qwuite sure how to implement this on the SDK side.

        let record_plaintext = record_ciphertext.decrypt_with_randomizers(&randomizers);
    
        Ok(record_plaintext)
    }

    #[wasm_bindgen(js_name = "decryptTransitionWithVk")]
    pub fn decrypt_transition_with_vk(
        transition: &Transition,
        transition_vk: &Field,
    ) - > Result<Transition, String> {
        let function_id =
        compute_function_id(&U16::<CurrentNetwork>::new(CurrentNetwork::ID), transition.program_id, &function_name)
            .map_err(|e| e.to_string())?;

        let mut decrypted_inputs: Vec<Input<N>> = vec![];
        let mut decrypted_outputs: Vec<Output<N>> = vec![];

        for (index, input) in self.inputs().iter().enumerate() {
            if let Input::Private(id, ciphertext_option) = input {
                if let Some(ciphertext) = ciphertext_option {
                    let index_field = Field::from_u16(u16::try_from(index).unwrap());
                    let input_view_key = CurrentNetwork::hash_psd4(&[function_id, tvk, index_field])
                        .map_err(|_| "Could not create input view key".to_string())?;
                    let plaintext = ciphertext.decrypt_symmetric(input_view_key).map_err(|e| e.to_string())?;
                    decrypted_inputs.push(Input::Public(self.id, Some(plaintext)));
                } else {
                    decrypted_inputs.push(input.clone());
                }
            } else {
                decrypted_inputs.push(input.clone());
            }
        }

        let num_inputs = transition.inputs().len();
        for (index, output) in transition.outputs().iter().enumerate() {
            if let Output::Private(id, ciphertext_option) = output {
                if let Some(ciphertext) = ciphertext_option {
                    let index_field = Field::from_u16(u16::try_from(num_inputs + index).unwrap());
                    let output_view_key = CurrentNetwork::hash_psd4(&[function_id, tvk, index_field])
                        .map_err(|_| "Could not create output view key".to_string())?;
                    let plaintext = ciphertext.decrypt_symmetric(output_view_key).map_err(|e| e.to_string())?;
                    decrypted_outputs.push(Output::Public(self.id, Some(plaintext)));
                } else {
                    decrypted_outputs.push(output.clone());
                }
            } else {
                decrypted_outputs.push(output.clone());
            }
        }

        let decrypted_transition = Transition::new(
            self.program_id(),
            self.function_name(),
            decrypted_inputs,
            decrypted_outputs,
            self.tpk(),
            self.tcm(),
            self.scm(),
        )
        .unwrap();

        decrypted_transition
    }
}


#[cfg(test)]
mod tests {
    use super::*;

    use wasm_bindgen_test::wasm_bindgen_test;

    const OWNER_PLAINTEXT: &str = r"{
  owner: aleo1j7qxyunfldj2lp8hsvy7mw5k8zaqgjfyr72x2gh3x4ewgae8v5gscf5jh3.private,
  microcredits: 1500000000000000u64.private,
  _nonce: 3077450429259593211617823051143573281856129402760267155982965992208217472983group.public
}";
    const OWNER_CIPHERTEXT: &str = "record1qyqsqpe2szk2wwwq56akkwx586hkndl3r8vzdwve32lm7elvphh37rsyqyxx66trwfhkxun9v35hguerqqpqzqrtjzeu6vah9x2me2exkgege824sd8x2379scspmrmtvczs0d93qttl7y92ga0k0rsexu409hu3vlehe3yxjhmey3frh2z5pxm5cmxsv4un97q";
    const OWNER_VIEW_KEY: &str = "AViewKey1ccEt8A2Ryva5rxnKcAbn7wgTaTsb79tzkKHFpeKsm9NX";
    const NON_OWNER_VIEW_KEY: &str = "AViewKey1e2WyreaH5H4RBcioLL2GnxvHk5Ud46EtwycnhTdXLmXp";
    const RECORD_TAG: &str = "1796466189545157638691489609907096471289658804813960182690905095269699169603field";



    #[wasm_bindgen_test]
    fn test_decrypt_record_symmetric() {
        let owner_view_key = ViewKey::from_str(OWNER_VIEW_KEY).unwrap();
        let non_owner_view_key = ViewKey::from_str(NON_OWNER_VIEW_KEY).unwrap();
        let record_ciphertext = RecordCiphertext::from_str(OWNER_CIPHERTEXT).unwrap();
        let record_plaintext_expected = RecordPlaintext::from_str(OWNER_PLAINTEXT).unwrap();

        // Generate the record view key
        let record_vk = DecryptToolBox::generate_record_vk(&owner_view_key, &record_plaintext_expected);

        // Decrypt with the owner's view key
        let record_plaintext_decrypted = DecryptToolBox::decrypt_record_symmetric_unchecked(record_vk, record_ciphertext.clone()).unwrap();
        assert_eq!(record_plaintext_decrypted.to_string(), OWNER_PLAINTEXT);
    }

    #[wasm_bindgen_test]
    fn test_decrypt_transition_with_vk() {
        // TODO: Implement this test
    }
}