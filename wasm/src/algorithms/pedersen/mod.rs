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

pub mod pedersen64;
pub use pedersen64::Pedersen64;

pub mod pedersen128;
pub use pedersen128::Pedersen128;

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        Field,
        Group,
        Scalar,
        types::native::{Pedersen64Native, Pedersen128Native},
    };
    use snarkvm_console::algorithms::{Commit, CommitUncompressed, Hash, ToBits};

    use crate::types::native::CurrentNetwork;
    use js_sys::Array;
    use snarkvm_console::types::U32;
    use wasm_bindgen::JsValue;
    use wasm_bindgen_test::*;

    const SCALAR_FIELD_ELEMENT: &str =
        "1774157567936692047646837016039369013254365378639847034769080448564598011047scalar";

    #[wasm_bindgen_test]
    fn test_wasm_pedersen_hashes_equal_native_hashes() {
        // Create a field element and a scalar element.
        let scalar = Scalar::from_string(SCALAR_FIELD_ELEMENT).unwrap();

        // Create all exported Pedersen hasher instances.
        let pedersen64 = Pedersen64::new();
        let pedersen128 = Pedersen128::new();

        // Create all native Pedersen hasher instances.
        let native_pedersen64 = Pedersen64Native::setup("AleoPedersen64");
        let native_pedersen128 = Pedersen128Native::setup("AleoPedersen128");

        for count in [1, 2] {
            // Create a vector of u32 elements.
            let mut numbers = Vec::with_capacity(count);
            (0..count).into_iter().for_each(|_| numbers.extend(U32::<CurrentNetwork>::new(1).to_bits_le()));

            // Create both a boolean vector and boolean array from a vector of u32 elements.
            let bit_vector = numbers.iter()
                .flat_map(|item| item.to_bits_le()) // Flatten all bit representations
                .collect::<Vec<bool>>();
            let bit_array = bit_vector.iter().map(|item| JsValue::from(*item)).collect::<Array>();

            // Hash and commit to the u32 elements using all Pedersen hasher instances.
            let hash_64 = pedersen64.hash(bit_array.clone()).unwrap();
            let hash_128 = pedersen128.hash(bit_array.clone()).unwrap();
            let commit_64 = pedersen64.commit(bit_array.clone(), scalar.clone()).unwrap();
            let commit_128 = pedersen128.commit(bit_array.clone(), scalar.clone()).unwrap();
            let commit_to_group_64 = pedersen64.commit_to_group(bit_array.clone(), scalar.clone()).unwrap();
            let commit_to_group_128 = pedersen128.commit_to_group(bit_array.clone(), scalar.clone()).unwrap();

            // Hash and commit to the u32 elements using all native Pedersen hasher instances.
            let native_hash_64 = native_pedersen64.hash(&bit_vector).unwrap();
            let native_hash_128 = native_pedersen128.hash(&bit_vector).unwrap();
            let native_commit_64 = native_pedersen64.commit(&bit_vector, &scalar).unwrap();
            let native_commit_128 = native_pedersen128.commit(&bit_vector, &scalar).unwrap();
            let native_commit_to_group_64 = native_pedersen64.commit_uncompressed(&bit_vector, &scalar).unwrap();
            let native_commit_to_group_128 = native_pedersen128.commit_uncompressed(&bit_vector, &scalar).unwrap();

            // Assert native and exported results are equal.
            assert_eq!(hash_64, Field::from(native_hash_64));
            assert_eq!(hash_128, Field::from(native_hash_128));
            assert_eq!(commit_64, Field::from(native_commit_64));
            assert_eq!(commit_128, Field::from(native_commit_128));
            assert_eq!(commit_to_group_64, Group::from(native_commit_to_group_64));
            assert_eq!(commit_to_group_128, Group::from(native_commit_to_group_128));
        }
    }
}
