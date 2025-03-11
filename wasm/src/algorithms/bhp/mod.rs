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

pub mod bhp256;
pub use bhp256::BHP256;

pub mod bhp512;
pub use bhp512::BHP512;

pub mod bhp768;
pub use bhp768::BHP768;

pub mod bhp1024;
pub use bhp1024::BHP1024;

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        Field,
        Scalar,
        test::create_native_field_vector,
        types::native::{BHP256Native, BHP512Native, BHP768Native, BHP1024Native},
    };
    use snarkvm_console::algorithms::{Commit, Hash, ToBits};

    use js_sys::Array;
    use wasm_bindgen::JsValue;
    use wasm_bindgen_test::*;

    const SCALAR_FIELD_ELEMENT: &str =
        "1774157567936692047646837016039369013254365378639847034769080448564598011047scalar";

    #[wasm_bindgen_test]
    fn test_wasm_bhp_hashes_equal_native_hashes() {
        // Create a field element and a scalar element.
        let scalar = Scalar::from_string(SCALAR_FIELD_ELEMENT).unwrap();

        // Create all exported BHP hasher instances.
        let bhp256 = BHP256::new();
        let bhp512 = BHP512::new();
        let bhp768 = BHP768::new();
        let bhp1024 = BHP1024::new();

        // Create all native BHP hasher instances.
        let native_bhp256 = BHP256Native::setup("AleoBHP256").unwrap();
        let native_bhp512 = BHP512Native::setup("AleoBHP512").unwrap();
        let native_bhp768 = BHP768Native::setup("AleoBHP768").unwrap();
        let native_bhp1024 = BHP1024Native::setup("AleoBHP1024").unwrap();

        for count in [1, 2, 4, 8, 16] {
            // Create a field vector.
            let fields = create_native_field_vector(Some(count));

            // Create both a boolean vector and boolean array.
            let bit_vector = fields.iter()
                .flat_map(|item| item.to_bits_le()) // Flatten all bit representations
                .collect::<Vec<bool>>();
            let bit_array = bit_vector.iter().map(|item| JsValue::from(*item)).collect::<Array>();

            // Hash and commit to the field element using all BHP hasher instances.
            let hash_256 = bhp256.hash(bit_array.clone()).unwrap();
            let hash_512 = bhp512.hash(bit_array.clone()).unwrap();
            let hash_768 = bhp768.hash(bit_array.clone()).unwrap();
            let hash_1024 = bhp1024.hash(bit_array.clone()).unwrap();
            let commit_256 = bhp256.commit(bit_array.clone(), scalar.clone()).unwrap();
            let commit_512 = bhp512.commit(bit_array.clone(), scalar.clone()).unwrap();
            let commit_768 = bhp768.commit(bit_array.clone(), scalar.clone()).unwrap();
            let commit_1024 = bhp1024.commit(bit_array.clone(), scalar.clone()).unwrap();

            // Hash and commit to the field element using all native BHP hasher instances.
            let native_hash_256 = native_bhp256.hash(&bit_vector).unwrap();
            let native_hash_512 = native_bhp512.hash(&bit_vector).unwrap();
            let native_hash_768 = native_bhp768.hash(&bit_vector).unwrap();
            let native_hash_1024 = native_bhp1024.hash(&bit_vector).unwrap();
            let native_commit_256 = native_bhp256.commit(&bit_vector, &scalar).unwrap();
            let native_commit_512 = native_bhp512.commit(&bit_vector, &scalar).unwrap();
            let native_commit_768 = native_bhp768.commit(&bit_vector, &scalar).unwrap();
            let native_commit_1024 = native_bhp1024.commit(&bit_vector, &scalar).unwrap();

            // Assert native and exported results are equal.
            assert_eq!(hash_256, Field::from(native_hash_256));
            assert_eq!(hash_512, Field::from(native_hash_512));
            assert_eq!(hash_768, Field::from(native_hash_768));
            assert_eq!(hash_1024, Field::from(native_hash_1024));
            assert_eq!(commit_256, Field::from(native_commit_256));
            assert_eq!(commit_512, Field::from(native_commit_512));
            assert_eq!(commit_768, Field::from(native_commit_768));
            assert_eq!(commit_1024, Field::from(native_commit_1024));
        }
    }
}
