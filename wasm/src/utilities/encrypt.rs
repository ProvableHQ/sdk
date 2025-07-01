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
    Field,
    Group,
    RecordCiphertext,
    RecordPlaintext,
    Transition,
    ViewKey,
    types::native::{
        CiphertextEntryNative,
        CurrentNetwork,
        FieldNative,
        PlaintextEntryNative,
        PlaintextNative,
        RecordPlaintextNative,
    },
};
use snarkvm_console::prelude::{FromFields, Itertools, Network, Visibility};

use indexmap::IndexMap;
use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen]
#[derive(Clone)]
pub struct EncryptionToolkit;

#[wasm_bindgen]
impl EncryptionToolkit {
    /// Returns the number of field elements required to decrypt an Entry
    pub(crate) fn num_entry_randomizers(entry: &CiphertextEntryNative) -> Result<u16, String> {
        match entry {
            // Constant and public entries do not need to be encrypted.
            CiphertextEntryNative::Constant(..) | CiphertextEntryNative::Public(..) => Ok(0u16),
            // Private entries need one randomizer per field element.
            CiphertextEntryNative::Private(private) => {
                private.size_in_fields().map_err(|_| "Private entry has invalid size".to_string())
            }
        }
    }

    /// Returns the number of field elements required to decrypt a record.
    pub(crate) fn num_record_randomizers(record: &RecordCiphertext) -> Result<u16, String> {
        // Initialize an tracker for the number of randomizers.
        let mut num_randomizers: u16 = 0;

        let record_native = &**record;

        // If the owner is private, increment the number of randomizers by 1.
        if record_native.owner().is_private() {
            num_randomizers += 1;
        }

        // Increment the number of randomizers by the number of data randomizers.
        for (_, entry) in record_native.data().iter() {
            num_randomizers = num_randomizers
                .checked_add(Self::num_entry_randomizers(&entry)?)
                .ok_or_else(|| "Number of randomizers exceeds maximum allowed size.".to_string())?;
        }

        // Ensure the number of randomizers does not exceed the maximum allowed size.
        match num_randomizers as u32 <= CurrentNetwork::MAX_DATA_SIZE_IN_FIELDS {
            true => Ok(num_randomizers),
            false => Err("Number of randomizers exceeds the maximum allowed size.".to_string()),
        }
    }

    /// Decrypts a record ciphertext using the provided randomizers.
    pub(crate) fn decrypt_with_randomizers(
        record: &RecordCiphertext,
        randomizers: &[FieldNative],
    ) -> Result<RecordPlaintext, String> {
        // Initialize an index to keep track of the randomizer index.
        let mut index: usize = 0;

        let record_native = &**record;

        // Decrypt the owner.
        let owner = match record_native.owner().is_public() {
            true => record_native.owner().decrypt_with_randomizer(&[]).map_err(|e| e.to_string())?,
            false => record_native.owner().decrypt_with_randomizer(&[randomizers[index]]).map_err(|e| e.to_string())?,
        };

        // Increment the index if the owner is private.
        if record_native.owner().is_private() {
            index += 1;
        }

        // Decrypt the program data.
        let mut decrypted_data = IndexMap::with_capacity(record_native.data().len());
        for (id, entry, num_randomizers) in
            record_native.data().iter().map(|(id, entry)| (id, entry, Self::num_entry_randomizers(&entry)))
        {
            // Retrieve the result for `num_randomizers`.
            let num_randomizers = num_randomizers? as usize;
            // Retrieve the randomizers for this entry.
            let randomizers = &randomizers[index..index + num_randomizers];
            // Decrypt the entry.
            let entry = match entry {
                // Constant entries do not need to be decrypted.
                CiphertextEntryNative::Constant(plaintext) => PlaintextEntryNative::Constant(plaintext.clone()),
                // Public entries do not need to be decrypted.
                CiphertextEntryNative::Public(plaintext) => PlaintextEntryNative::Public(plaintext.clone()),
                // Private entries are decrypted with the given randomizers.
                CiphertextEntryNative::Private(private) => PlaintextEntryNative::Private(
                    PlaintextNative::from_fields(
                        &private
                            .iter()
                            .zip_eq(randomizers)
                            .map(|(ciphertext, randomizer)| *ciphertext - randomizer)
                            .collect::<Vec<_>>(),
                    )
                    .map_err(|e| e.to_string())?,
                ),
            };
            // Insert the decrypted entry.
            if decrypted_data.insert(*id, entry).is_some() {
                return Err(format!("Duplicate identifier in record: {}", id));
            }
            // Increment the index.
            index += num_randomizers;
        }

        // Return the decrypted record.
        let decrypted_record = RecordPlaintextNative::from_plaintext(owner, decrypted_data, *record_native.nonce())
            .map_err(|e| e.to_string())?;

        Ok(RecordPlaintext::from(decrypted_record))
    }

    #[wasm_bindgen(js_name = "generateTvk")]
    pub fn generate_tvk(view_key: &ViewKey, tpk: &Group) -> Field {
        tpk.scalar_multiply(&view_key.to_scalar()).to_x_coordinate()
    }

    /// Creates a record view key from the view key.  This method is intended to be used
    /// by the record owner to enable decryption of a select record by a third party.
    #[wasm_bindgen(js_name = "generateRecordVk")]
    pub fn generate_record_vk(view_key: &ViewKey, record_ciphertext: &RecordCiphertext) -> Result<Field, String> {
        let record_nonce = record_ciphertext.nonce();
        Ok(record_nonce.scalar_multiply(&view_key.to_scalar()).to_x_coordinate())
    }

    /// Decrypts a record ciphertext using the record view key.  Decryption only succeeds
    /// if the record view key was generated from the view key of the record owner.
    #[wasm_bindgen(js_name = "decryptRecordWithRVk")]
    pub fn decrypt_record_symmetric_unchecked(
        record_vk: &Field,
        record_ciphertext: &RecordCiphertext,
    ) -> Result<RecordPlaintext, String> {
        let num_randomizers = EncryptionToolkit::num_record_randomizers(record_ciphertext)
            .map_err(|_| "Failed to get the number of randomizers from the record ciphertext".to_string())?;
        let randomizers =
            CurrentNetwork::hash_many_psd8(&[CurrentNetwork::encryption_domain(), **record_vk], num_randomizers);

        let record_plaintext = EncryptionToolkit::decrypt_with_randomizers(record_ciphertext, &randomizers)?;

        Ok(record_plaintext)
    }

    /// Decrypts a transition using the transition view key.  The ciphertext inputs and outputs
    /// can only be decrypted if the transition view key was generated by the transaction signer.
    #[wasm_bindgen(js_name = "decryptTransitionWithVk")]
    pub fn decrypt_transition_with_vk(transition: &Transition, transition_vk: &Field) -> Result<Transition, String> {
        transition.decrypt_transition(transition_vk)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use std::str::FromStr;
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
        let owner_ciphertext = RecordCiphertext::from_str(OWNER_CIPHERTEXT).unwrap();
        let owner_view_key = ViewKey::from_str(OWNER_VIEW_KEY).unwrap();

        // Generate the record view key
        let record_vk = EncryptionToolkit::generate_record_vk(&owner_view_key, &owner_ciphertext).unwrap();

        // Decrypt with the owner's view key
        let record_plaintext_decrypted =
            EncryptionToolkit::decrypt_record_symmetric_unchecked(&record_vk, &owner_ciphertext).unwrap();
        assert_eq!(record_plaintext_decrypted.to_string(), OWNER_PLAINTEXT);
    }

    #[wasm_bindgen_test]
    fn test_decrypt_record_with_wrong_rvk() {
        let owner_ciphertext = RecordCiphertext::from_str(OWNER_CIPHERTEXT).unwrap();
        let non_owner_view_key = ViewKey::from_str(NON_OWNER_VIEW_KEY).unwrap();

        // Generate the record view key with a non-owner view key
        let record_vk = EncryptionToolkit::generate_record_vk(&non_owner_view_key, &owner_ciphertext).unwrap();

        // Attempt to decrypt with the non-owner's view key
        let result = EncryptionToolkit::decrypt_record_symmetric_unchecked(&record_vk, &owner_ciphertext);
        assert!(result.is_err(), "Decryption should fail with a non-owner's view key");
    }
}
