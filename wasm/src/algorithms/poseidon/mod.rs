// Copyright (C) 2019-2025 Provable Inc.
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

pub mod poseidon2;
pub use poseidon2::Poseidon2;

pub mod poseidon4;
pub use poseidon4::Poseidon4;

pub mod poseidon8;
pub use poseidon8::Poseidon8;

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        Field,
        Group,
        Scalar,
        types::native::{Poseidon2Native, Poseidon4Native, Poseidon8Native},
        utilities::test::{create_native_field_vector, js_array_from_fields},
    };
    use snarkvm_console::algorithms::{Hash, HashToGroup, HashToScalar};

    use wasm_bindgen_test::*;

    #[wasm_bindgen_test]
    fn test_wasm_psd_hashes_equal_native_hashes() {
        // Create all instances of exported hasher structs.
        let poseidon2 = Poseidon2::new();
        let poseidon4 = Poseidon4::new();
        let poseidon8 = Poseidon8::new();

        // Create native instances of hasher structs.
        let native_poseidon2 = Poseidon2Native::setup("AleoPoseidon2").unwrap();
        let native_poseidon4 = Poseidon4Native::setup("AleoPoseidon4").unwrap();
        let native_poseidon8 = Poseidon8Native::setup("AleoPoseidon8").unwrap();

        // Ensure the native hash results are equal to the results from the exported hasher structs.
        for num_fields in [1, 2, 4, 8, 16].iter() {
            // Create a vector of field elements.
            let native_field_array = create_native_field_vector(Some(*num_fields));

            // Hash the field array using all Poseidon hasher instances.
            let hash_2 = poseidon2.hash(js_array_from_fields(&native_field_array)).unwrap();
            let hash_4 = poseidon4.hash(js_array_from_fields(&native_field_array)).unwrap();
            let hash_8 = poseidon8.hash(js_array_from_fields(&native_field_array)).unwrap();
            let hash_2_scalar = poseidon2.hash_to_scalar(js_array_from_fields(&native_field_array)).unwrap();
            let hash_4_scalar = poseidon4.hash_to_scalar(js_array_from_fields(&native_field_array)).unwrap();
            let hash_8_scalar = poseidon8.hash_to_scalar(js_array_from_fields(&native_field_array)).unwrap();
            let hash_2_group = poseidon2.hash_to_group(js_array_from_fields(&native_field_array)).unwrap();
            let hash_4_group = poseidon4.hash_to_group(js_array_from_fields(&native_field_array)).unwrap();
            let hash_8_group = poseidon8.hash_to_group(js_array_from_fields(&native_field_array)).unwrap();

            // Hash the field array using all native Poseidon hasher instances.
            let native_hash_2 = native_poseidon2.hash(&native_field_array).unwrap();
            let native_hash_4 = native_poseidon4.hash(&native_field_array).unwrap();
            let native_hash_8 = native_poseidon8.hash(&native_field_array).unwrap();
            let native_hash_2_scalar = native_poseidon2.hash_to_scalar(&native_field_array).unwrap();
            let native_hash_4_scalar = native_poseidon4.hash_to_scalar(&native_field_array).unwrap();
            let native_hash_8_scalar = native_poseidon8.hash_to_scalar(&native_field_array).unwrap();
            let native_hash_2_group = native_poseidon2.hash_to_group(&native_field_array).unwrap();
            let native_hash_4_group = native_poseidon4.hash_to_group(&native_field_array).unwrap();
            let native_hash_8_group = native_poseidon8.hash_to_group(&native_field_array).unwrap();

            // Assert native and exported results are equal.
            assert_eq!(hash_2, Field::from(native_hash_2));
            assert_eq!(hash_4, Field::from(native_hash_4));
            assert_eq!(hash_8, Field::from(native_hash_8));
            assert_eq!(hash_2_scalar, Scalar::from(native_hash_2_scalar));
            assert_eq!(hash_4_scalar, Scalar::from(native_hash_4_scalar));
            assert_eq!(hash_8_scalar, Scalar::from(native_hash_8_scalar));
            assert_eq!(hash_2_group, Group::from(native_hash_2_group));
            assert_eq!(hash_4_group, Group::from(native_hash_4_group));
            assert_eq!(hash_8_group, Group::from(native_hash_8_group));
        }
    }
}
