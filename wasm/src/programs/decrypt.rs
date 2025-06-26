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
    CurrentNetwork,
    Field,
    Group,
    Scalar,
    Transition,
    RecordCiphertext,
    RecordPlaintext,
    ViewKey,
    types::RecordPlaintextNative,
};

use std::str::FromStr;
use wasm_bindgen::prelude::wasm_bindgen;
use snarkvm_ledger_block::{Input, Output};
use snarkvm_console::{program::compute_function_id, types::U16};

#[wasm_bindgen]
struct DecryptToolBox {}

#[wasm_bindgen]
impl DecryptToolBox {

    /// Returns the number of field elements to encode `self`.
    pub(crate) fn num_randomizers(record: &RecordCiphertext) -> Result<u16> {
        // Initialize an tracker for the number of randomizers.
        let mut num_randomizers: u16 = 0;

        // If the owner is private, increment the number of randomizers by 1.
        if record.owner.is_private() {
            num_randomizers += 1;
        }

        // Increment the number of randomizers by the number of data randomizers.
        for (_, entry) in record.data.iter() {
            num_randomizers = num_randomizers
                .checked_add(entry.num_randomizers()?)
                .ok_or_else(|| anyhow!("Number of randomizers exceeds maximum allowed size."))?;
        }

        // Ensure the number of randomizers does not exceed the maximum allowed size.
        match num_randomizers as u32 <= CurrentNetwork::MAX_DATA_SIZE_IN_FIELDS {
            true => Ok(num_randomizers),
            false => bail!("Number of randomizers exceeds the maximum allowed size."),
        }
    }

    pub(crate) fn decrypt_with_randomizers(record: &RecordCiphertext, randomizers: &[Field]) -> Result<RecordPlaintext, String> {
        // Initialize an index to keep track of the randomizer index.
        let mut index: usize = 0;

        // Decrypt the owner.
        let owner = match record.owner.is_public() {
            true => record.owner.decrypt_with_randomizer(&[])?,
            false => record.owner.decrypt_with_randomizer(&[randomizers[index]])?,
        };

        // Increment the index if the owner is private.
        if owner.is_private() {
            index += 1;
        }

        // Decrypt the program data.
        let mut decrypted_data = IndexMap::with_capacity(record.data.len());
        for (id, entry, num_randomizers) in record.data.iter().map(|(id, entry)| (id, entry, entry.num_randomizers())) {
            // Retrieve the result for `num_randomizers`.
            let num_randomizers = num_randomizers? as usize;
            // Retrieve the randomizers for this entry.
            let randomizers = &randomizers[index..index + num_randomizers];
            // Decrypt the entry.
            let entry = match entry {
                // Constant entries do not need to be decrypted.
                Entry::Constant(plaintext) => Entry::Constant(plaintext.clone()),
                // Public entries do not need to be decrypted.
                Entry::Public(plaintext) => Entry::Public(plaintext.clone()),
                // Private entries are decrypted with the given randomizers.
                Entry::Private(private) => Entry::Private(Plaintext::from_fields(
                    &private
                        .iter()
                        .zip_eq(randomizers)
                        .map(|(ciphertext, randomizer)| *ciphertext - randomizer)
                        .collect::<Vec<_>>(),
                )?),
            };
            // Insert the decrypted entry.
            if decrypted_data.insert(*id, entry).is_some() {
                bail!("Duplicate identifier in record: {}", id);
            }
            // Increment the index.
            index += num_randomizers;
        }

        // Return the decrypted record.
        RecordPlaintext(RecordPlaintextNative{0owner, decrypted_data, record.nonce})
    }

    #[wasm_bindgen(js_name = "generateTvk")]
    pub fn generate_tvk(
        view_key: &ViewKey,
        tpk: &Group,
    ) -> Field {
        tpk.scalar_multiply(&view_key.to_scalar()).to_x_coordinate()
    }

    #[wasm_bindgen(js_name = "generateRecordVk")]
    pub fn generate_record_vk(
        view_key: &str,
        record: &str,
    ) -> Group {
        let view_key = ViewKey::from_str(view_key)
            .map_err(|_| "Failed to parse view key".to_string())
            .unwrap();
        let record_ciphertext = RecordCiphertext::from_str(record)
            .map_err(|_| "Failed to parse record ciphertext".to_string())
            .unwrap();
        let record_nonce = record_ciphertext.0.nonce();
        record_nonce * **view_key
    }

    #[wasm_bindgen(js_name = "decryptRecordWithRVk")]
    pub fn decrypt_record_symmetric_unchecked(
        record_vk: &str,
        record: &str,
    ) -> Result<RecordPlaintext, String> {
        let record_vk = Field::from_str(record_vk)
            .map_err(|_| "Failed to parse record view key".to_string())?;
        let record_ciphertext = RecordCiphertext::from_str(record)
            .map_err(|_| "Failed to parse record ciphertext".to_string())?;
        let num_randomizers = DecryptToolBox::num_randomizers(record_ciphertext)
            .map_err(|_| "Failed to get the number of randomizers from the record ciphertext".to_string())?;
        let randomizers = CurrentNetwork::hash_many_psd8(&[CurrentNetwork::encryption_domain(), *record_vk], num_randomizers); // Not qwuite sure how to implement this on the SDK side.

        let record_plaintext = record_ciphertext.decrypt_with_randomizers(&randomizers);
    
        Ok(record_plaintext)
    }

    #[wasm_bindgen(js_name = "decryptTransitionWithVk")]
    pub fn decrypt_transition_with_vk(
        transition: &str,
        transition_vk: &str,
    ) -> Result<Transition, String> {
        let transition = Transition::from_string(transition)
            .map_err(|_| "Failed to parse transition".to_string())?;
        let transition_vk = Field::from_string(transition_vk)
            .map_err(|_| "Failed to parse transition view key".to_string())?;
        let function_id =
        compute_function_id(&U16::<CurrentNetwork>::new(CurrentNetwork::ID), transition.program_id(), transition.function_name())
            .map_err(|e| e.to_string())?;

        let mut decrypted_inputs: Vec<Input<CurrentNetwork>> = vec![];
        let mut decrypted_outputs: Vec<Output<CurrentNetwork>> = vec![];

        for (index, input) in transition.inputs().iter().enumerate() {
            if let Input::Private(id, ciphertext_option) = input {
                if let Some(ciphertext) = ciphertext_option {
                    let index_field = Field::from(u16::try_from(index).unwrap());
                    let input_view_key = CurrentNetwork::hash_psd4(&[function_id, transition_vk, index_field])
                        .map_err(|_| "Could not create input view key".to_string())?;
                    let plaintext = ciphertext.decrypt_symmetric(input_view_key).map_err(|e| e.to_string())?;
                    decrypted_inputs.push(Input::Public(transition.id(), Some(plaintext)));
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
                    let index_field = Field::from(u16::try_from(num_inputs + index).unwrap());
                    let output_view_key = CurrentNetwork::hash_psd4(&[function_id, transition_vk, index_field])
                        .map_err(|_| "Could not create output view key".to_string())?;
                    let plaintext = ciphertext.decrypt_symmetric(output_view_key).map_err(|e| e.to_string())?;
                    decrypted_outputs.push(Output::Public(transition.id(), Some(plaintext)));
                } else {
                    decrypted_outputs.push(output.clone());
                }
            } else {
                decrypted_outputs.push(output.clone());
            }
        }

        let decrypted_transition = Transition::new(
            transition.program_id(),
            transition.function_name(),
            decrypted_inputs,
            decrypted_outputs,
            transition.tpk(),
            transition.tcm(),
            transition.scm(),
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
        let record_plaintext_expected = RecordPlaintext::from_str(OWNER_PLAINTEXT).unwrap();

        // Generate the record view key
        let record_vk = DecryptToolBox::generate_record_vk(OWNER_VIEW_KEY, OWNER_PLAINTEXT).unwrap();

        // Decrypt with the owner's view key
        let record_plaintext_decrypted = DecryptToolBox::decrypt_record_symmetric_unchecked(record_vk, OWNER_CIPHERTEXT);
        assert_eq!(record_plaintext_decrypted.to_string(), OWNER_PLAINTEXT);
    }

    #[wasm_bindgen_test]
    fn test_decrypt_transition_with_vk() {
        // TODO: Implement this test
    }
}