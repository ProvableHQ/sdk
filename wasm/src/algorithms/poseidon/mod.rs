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
        Address,
        Field,
        Group,
        Plaintext,
        Scalar,
        Signature,
        js_array_from_fields,
        native::{GroupNative, LiteralNative, PlaintextNative, ScalarNative, SignatureNative},
        test::TEST_STRUCT,
        types::native::{FieldNative, Poseidon2Native, Poseidon4Native, Poseidon8Native},
        utilities::test::create_native_field_vector,
    };
    use snarkvm_console::{
        algorithms::{Hash, HashMany, HashToGroup, HashToScalar},
        prelude::ToFields,
    };

    use once_cell::sync::OnceCell;
    use std::str::FromStr;
    use wasm_bindgen::convert::TryFromJsValue;
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
        for count in [1, 2, 4, 8, 16].iter() {
            // Create a vector of field elements.
            let native_field_array = create_native_field_vector(Some(*count));

            // Hash the field array using all Poseidon hasher instances.
            let hash_2 = poseidon2.hash(js_array_from_fields!(&native_field_array)).unwrap();
            let hash_4 = poseidon4.hash(js_array_from_fields!(&native_field_array)).unwrap();
            let hash_8 = poseidon8.hash(js_array_from_fields!(&native_field_array)).unwrap();
            let hash_2_scalar = poseidon2.hash_to_scalar(js_array_from_fields!(&native_field_array)).unwrap();
            let hash_4_scalar = poseidon4.hash_to_scalar(js_array_from_fields!(&native_field_array)).unwrap();
            let hash_8_scalar = poseidon8.hash_to_scalar(js_array_from_fields!(&native_field_array)).unwrap();
            let hash_2_group = poseidon2.hash_to_group(js_array_from_fields!(&native_field_array)).unwrap();
            let hash_4_group = poseidon4.hash_to_group(js_array_from_fields!(&native_field_array)).unwrap();
            let hash_8_group = poseidon8.hash_to_group(js_array_from_fields!(&native_field_array)).unwrap();
            let hash_2_many = poseidon2
                .hash_many(js_array_from_fields!(&native_field_array), 2)
                .unwrap()
                .to_vec()
                .into_iter()
                .map(|item| *Field::try_from_js_value(item).unwrap())
                .collect::<Vec<FieldNative>>();
            let hash_4_many = poseidon4
                .hash_many(js_array_from_fields!(&native_field_array), 2)
                .unwrap()
                .to_vec()
                .into_iter()
                .map(|item| *Field::try_from_js_value(item).unwrap())
                .collect::<Vec<FieldNative>>();
            let hash_8_many = poseidon8
                .hash_many(js_array_from_fields!(&native_field_array), 2)
                .unwrap()
                .to_vec()
                .into_iter()
                .map(|item| *Field::try_from_js_value(item).unwrap())
                .collect::<Vec<FieldNative>>();

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
            let native_hash_2_many = native_poseidon2.hash_many(&native_field_array, 2);
            let native_hash_4_many = native_poseidon4.hash_many(&native_field_array, 2);
            let native_hash_8_many = native_poseidon8.hash_many(&native_field_array, 2);

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
            assert_eq!(hash_2_many, native_hash_2_many);
            assert_eq!(hash_4_many, native_hash_4_many);
            assert_eq!(hash_8_many, native_hash_8_many);
        }
    }

    #[wasm_bindgen_test]
    fn test_wasm_literal_psd_hashes_equal_native_hashes() {
        // Create all instances of exported hasher structs.
        let poseidon2 = Poseidon2::new();
        let poseidon4 = Poseidon4::new();
        let poseidon8 = Poseidon8::new();

        // Create native instances of hasher structs.
        let native_poseidon2 = Poseidon2Native::setup("AleoPoseidon2").unwrap();
        let native_poseidon4 = Poseidon4Native::setup("AleoPoseidon4").unwrap();
        let native_poseidon8 = Poseidon8Native::setup("AleoPoseidon8").unwrap();

        let address = Address::from_string("aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc");

        let literals = vec![
            address.to_plaintext(),
            Field::from_string("2field").unwrap().to_plaintext(),
            Group::from_string("7243206743250892049702172909169115544952822465955921992746259936160368017976group")
                .unwrap()
                .to_plaintext(),
            Scalar::from_string("836504693989570607341914239820012911582004515616146791081874852343183183566scalar")
                .unwrap()
                .to_plaintext(),
            Signature::from_string("sign1lcpxtgqkp238x45fk79lkx5xz7sx37f56wl0hyemhv78dgzxyspykg6u26lx2a02tvat6zaflx530qtnme34gh702wclwr20rdxrsqcl7shvwsyhygt2yvkgzeq7zz2rdat4rrsr0cd9kwm6jddjcs9lps8s80v35rwvtkgg2gxprf4dge0tcet3pe7nfxupkvfuvh3sw2gpyv0km46").to_plaintext(),
        ];

        let native_literals = vec![
            LiteralNative::Address(address.into()),
            LiteralNative::Field(FieldNative::from_u8(2)),
            LiteralNative::Group(
                GroupNative::from_str(
                    "7243206743250892049702172909169115544952822465955921992746259936160368017976group",
                )
                .unwrap(),
            ),
            LiteralNative::Scalar(
                ScalarNative::from_str(
                    "836504693989570607341914239820012911582004515616146791081874852343183183566scalar",
                )
                .unwrap(),
            ),
            LiteralNative::Signature(Box::new(SignatureNative::from_str("sign1lcpxtgqkp238x45fk79lkx5xz7sx37f56wl0hyemhv78dgzxyspykg6u26lx2a02tvat6zaflx530qtnme34gh702wclwr20rdxrsqcl7shvwsyhygt2yvkgzeq7zz2rdat4rrsr0cd9kwm6jddjcs9lps8s80v35rwvtkgg2gxprf4dge0tcet3pe7nfxupkvfuvh3sw2gpyv0km46").unwrap()))
        ];

        for i in 0..literals.len() {
            let literal_plaintext = literals[i].clone();
            let hash2 = poseidon2.hash(literal_plaintext.clone().to_fields().unwrap()).unwrap();
            let hash4 = poseidon4.hash(literal_plaintext.clone().to_fields().unwrap()).unwrap();
            let hash8 = poseidon8.hash(literal_plaintext.clone().to_fields().unwrap()).unwrap();

            let native_fields =
                PlaintextNative::Literal(native_literals[i].clone(), OnceCell::new()).to_fields().unwrap();
            let native_hash2 = native_poseidon2.hash(&native_fields).unwrap();
            let native_hash4 = native_poseidon4.hash(&native_fields).unwrap();
            let native_hash8 = native_poseidon8.hash(&native_fields).unwrap();

            assert_eq!(hash2, Field::from(native_hash2));
            assert_eq!(hash4, Field::from(native_hash4));
            assert_eq!(hash8, Field::from(native_hash8));
        }

        let struct_pt = Plaintext::from_string(TEST_STRUCT).unwrap();

        let hash2 = poseidon2.hash(struct_pt.clone().to_fields().unwrap()).unwrap();
        let hash4 = poseidon4.hash(struct_pt.clone().to_fields().unwrap()).unwrap();
        let hash8 = poseidon8.hash(struct_pt.clone().to_fields().unwrap()).unwrap();

        let native_struct_pt = PlaintextNative::from_str(TEST_STRUCT).unwrap();
        let native_struct_fields = native_struct_pt.to_fields().unwrap();

        let native_hash2 = native_poseidon2.hash(&native_struct_fields).unwrap();
        let native_hash4 = native_poseidon4.hash(&native_struct_fields).unwrap();
        let native_hash8 = native_poseidon8.hash(&native_struct_fields).unwrap();

        assert_eq!(hash2, Field::from(native_hash2));
        assert_eq!(hash4, Field::from(native_hash4));
        assert_eq!(hash8, Field::from(native_hash8));
    }
}
