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
        Address,
        Field,
        Group,
        Plaintext,
        Scalar,
        Signature,
        native::{FieldNative, GroupNative, LiteralNative, PlaintextNative, ScalarNative, SignatureNative},
        utilities::test::{TEST_STRUCT, create_native_field_vector},
        types::native::{BHP256Native, BHP512Native, BHP768Native, BHP1024Native},
    };
    use snarkvm_console::algorithms::{Commit, CommitUncompressed, Hash, HashUncompressed, ToBits};

    use js_sys::Array;
    use once_cell::sync::OnceCell;
    use std::str::FromStr;
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
            let bit_vector = fields.iter().flat_map(|item| item.to_bits_le()).collect::<Vec<bool>>();
            let bit_array = bit_vector.iter().map(|item| JsValue::from(*item)).collect::<Array>();

            // Hash and commit to the field element using all BHP hasher instances.
            let hash_256 = bhp256.hash(bit_array.clone()).unwrap();
            let hash_512 = bhp512.hash(bit_array.clone()).unwrap();
            let hash_768 = bhp768.hash(bit_array.clone()).unwrap();
            let hash_1024 = bhp1024.hash(bit_array.clone()).unwrap();
            let hash_to_group_256 = bhp256.hash_to_group(bit_array.clone()).unwrap();
            let hash_to_group_512 = bhp512.hash_to_group(bit_array.clone()).unwrap();
            let hash_to_group_768 = bhp768.hash_to_group(bit_array.clone()).unwrap();
            let hash_to_group_1024 = bhp1024.hash_to_group(bit_array.clone()).unwrap();
            let commit_256 = bhp256.commit(bit_array.clone(), scalar.clone()).unwrap();
            let commit_512 = bhp512.commit(bit_array.clone(), scalar.clone()).unwrap();
            let commit_768 = bhp768.commit(bit_array.clone(), scalar.clone()).unwrap();
            let commit_1024 = bhp1024.commit(bit_array.clone(), scalar.clone()).unwrap();
            let commit_to_group_256 = bhp256.commit_to_group(bit_array.clone(), scalar.clone()).unwrap();
            let commit_to_group_512 = bhp512.commit_to_group(bit_array.clone(), scalar.clone()).unwrap();
            let commit_to_group_768 = bhp768.commit_to_group(bit_array.clone(), scalar.clone()).unwrap();
            let commit_to_group_1024 = bhp1024.commit_to_group(bit_array.clone(), scalar.clone()).unwrap();

            // Hash and commit to the field element using all native BHP hasher instances.
            let native_hash_256 = native_bhp256.hash(&bit_vector).unwrap();
            let native_hash_512 = native_bhp512.hash(&bit_vector).unwrap();
            let native_hash_768 = native_bhp768.hash(&bit_vector).unwrap();
            let native_hash_1024 = native_bhp1024.hash(&bit_vector).unwrap();
            let native_hash_to_group_256 = native_bhp256.hash_uncompressed(&bit_vector).unwrap();
            let native_hash_to_group_512 = native_bhp512.hash_uncompressed(&bit_vector).unwrap();
            let native_hash_to_group_768 = native_bhp768.hash_uncompressed(&bit_vector).unwrap();
            let native_hash_to_group_1024 = native_bhp1024.hash_uncompressed(&bit_vector).unwrap();
            let native_commit_256 = native_bhp256.commit(&bit_vector, &scalar).unwrap();
            let native_commit_512 = native_bhp512.commit(&bit_vector, &scalar).unwrap();
            let native_commit_768 = native_bhp768.commit(&bit_vector, &scalar).unwrap();
            let native_commit_1024 = native_bhp1024.commit(&bit_vector, &scalar).unwrap();
            let native_commit_to_group_256 = native_bhp256.commit_uncompressed(&bit_vector, &scalar).unwrap();
            let native_commit_to_group_512 = native_bhp512.commit_uncompressed(&bit_vector, &scalar).unwrap();
            let native_commit_to_group_768 = native_bhp768.commit_uncompressed(&bit_vector, &scalar).unwrap();
            let native_commit_to_group_1024 = native_bhp1024.commit_uncompressed(&bit_vector, &scalar).unwrap();

            // Assert native and exported results are equal.
            assert_eq!(hash_256, Field::from(native_hash_256));
            assert_eq!(hash_512, Field::from(native_hash_512));
            assert_eq!(hash_768, Field::from(native_hash_768));
            assert_eq!(hash_1024, Field::from(native_hash_1024));
            assert_eq!(hash_to_group_256, Group::from(native_hash_to_group_256));
            assert_eq!(hash_to_group_512, Group::from(native_hash_to_group_512));
            assert_eq!(hash_to_group_768, Group::from(native_hash_to_group_768));
            assert_eq!(hash_to_group_1024, Group::from(native_hash_to_group_1024));
            assert_eq!(commit_256, Field::from(native_commit_256));
            assert_eq!(commit_512, Field::from(native_commit_512));
            assert_eq!(commit_768, Field::from(native_commit_768));
            assert_eq!(commit_1024, Field::from(native_commit_1024));
            assert_eq!(commit_to_group_256, Group::from(native_commit_to_group_256));
            assert_eq!(commit_to_group_512, Group::from(native_commit_to_group_512));
            assert_eq!(commit_to_group_768, Group::from(native_commit_to_group_768));
            assert_eq!(commit_to_group_1024, Group::from(native_commit_to_group_1024));
        }
    }

    #[wasm_bindgen_test]
    fn test_wasm_literal_bhp_hashes_equal_native_hashes() {
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
            let literal_bits = literals[i].to_bits_le();

            let hash_256 = bhp256.hash(literal_bits.clone()).unwrap();
            let hash_512 = bhp512.hash(literal_bits.clone()).unwrap();
            let hash_768 = bhp768.hash(literal_bits.clone()).unwrap();
            let hash_1024 = bhp1024.hash(literal_bits.clone()).unwrap();
            let hash_to_group_256 = bhp256.hash_to_group(literal_bits.clone()).unwrap();
            let hash_to_group_512 = bhp512.hash_to_group(literal_bits.clone()).unwrap();
            let hash_to_group_768 = bhp768.hash_to_group(literal_bits.clone()).unwrap();
            let hash_to_group_1024 = bhp1024.hash_to_group(literal_bits.clone()).unwrap();
            let commit_256 = bhp256.commit(literal_bits.clone(), scalar.clone()).unwrap();
            let commit_512 = bhp512.commit(literal_bits.clone(), scalar.clone()).unwrap();
            let commit_768 = bhp768.commit(literal_bits.clone(), scalar.clone()).unwrap();
            let commit_1024 = bhp1024.commit(literal_bits.clone(), scalar.clone()).unwrap();
            let commit_to_group_256 = bhp256.commit_to_group(literal_bits.clone(), scalar.clone()).unwrap();
            let commit_to_group_512 = bhp512.commit_to_group(literal_bits.clone(), scalar.clone()).unwrap();
            let commit_to_group_768 = bhp768.commit_to_group(literal_bits.clone(), scalar.clone()).unwrap();
            let commit_to_group_1024 = bhp1024.commit_to_group(literal_bits.clone(), scalar.clone()).unwrap();

            let native_bits = PlaintextNative::Literal(native_literals[i].clone(), OnceCell::new()).to_bits_le();

            let native_hash_256 = native_bhp256.hash(&native_bits).unwrap();
            let native_hash_512 = native_bhp512.hash(&native_bits).unwrap();
            let native_hash_768 = native_bhp768.hash(&native_bits).unwrap();
            let native_hash_1024 = native_bhp1024.hash(&native_bits).unwrap();
            let native_hash_to_group_256 = native_bhp256.hash_uncompressed(&native_bits).unwrap();
            let native_hash_to_group_512 = native_bhp512.hash_uncompressed(&native_bits).unwrap();
            let native_hash_to_group_768 = native_bhp768.hash_uncompressed(&native_bits).unwrap();
            let native_hash_to_group_1024 = native_bhp1024.hash_uncompressed(&native_bits).unwrap();
            let native_commit_256 = native_bhp256.commit(&native_bits, &scalar).unwrap();
            let native_commit_512 = native_bhp512.commit(&native_bits, &scalar).unwrap();
            let native_commit_768 = native_bhp768.commit(&native_bits, &scalar).unwrap();
            let native_commit_1024 = native_bhp1024.commit(&native_bits, &scalar).unwrap();
            let native_commit_to_group_256 = native_bhp256.commit_uncompressed(&native_bits, &scalar).unwrap();
            let native_commit_to_group_512 = native_bhp512.commit_uncompressed(&native_bits, &scalar).unwrap();
            let native_commit_to_group_768 = native_bhp768.commit_uncompressed(&native_bits, &scalar).unwrap();
            let native_commit_to_group_1024 = native_bhp1024.commit_uncompressed(&native_bits, &scalar).unwrap();

            assert_eq!(hash_256, Field::from(native_hash_256));
            assert_eq!(hash_512, Field::from(native_hash_512));
            assert_eq!(hash_768, Field::from(native_hash_768));
            assert_eq!(hash_1024, Field::from(native_hash_1024));
            assert_eq!(hash_to_group_256, Group::from(native_hash_to_group_256));
            assert_eq!(hash_to_group_512, Group::from(native_hash_to_group_512));
            assert_eq!(hash_to_group_768, Group::from(native_hash_to_group_768));
            assert_eq!(hash_to_group_1024, Group::from(native_hash_to_group_1024));
            assert_eq!(commit_256, Field::from(native_commit_256));
            assert_eq!(commit_512, Field::from(native_commit_512));
            assert_eq!(commit_768, Field::from(native_commit_768));
            assert_eq!(commit_1024, Field::from(native_commit_1024));
            assert_eq!(commit_to_group_256, Group::from(native_commit_to_group_256));
            assert_eq!(commit_to_group_512, Group::from(native_commit_to_group_512));
            assert_eq!(commit_to_group_768, Group::from(native_commit_to_group_768));
            assert_eq!(commit_to_group_1024, Group::from(native_commit_to_group_1024));
        }

        let struct_pt: Plaintext = Plaintext::from_string(TEST_STRUCT).unwrap();
        let struct_bits = struct_pt.to_bits_le();

        let hash_256 = bhp256.hash(struct_bits.clone()).unwrap();
        let hash_512 = bhp512.hash(struct_bits.clone()).unwrap();
        let hash_768 = bhp768.hash(struct_bits.clone()).unwrap();
        let hash_1024 = bhp1024.hash(struct_bits.clone()).unwrap();
        let hash_to_group_256 = bhp256.hash_to_group(struct_bits.clone()).unwrap();
        let hash_to_group_512 = bhp512.hash_to_group(struct_bits.clone()).unwrap();
        let hash_to_group_768 = bhp768.hash_to_group(struct_bits.clone()).unwrap();
        let hash_to_group_1024 = bhp1024.hash_to_group(struct_bits.clone()).unwrap();
        let commit_256 = bhp256.commit(struct_bits.clone(), scalar.clone()).unwrap();
        let commit_512 = bhp512.commit(struct_bits.clone(), scalar.clone()).unwrap();
        let commit_768 = bhp768.commit(struct_bits.clone(), scalar.clone()).unwrap();
        let commit_1024 = bhp1024.commit(struct_bits.clone(), scalar.clone()).unwrap();
        let commit_to_group_256 = bhp256.commit_to_group(struct_bits.clone(), scalar.clone()).unwrap();
        let commit_to_group_512 = bhp512.commit_to_group(struct_bits.clone(), scalar.clone()).unwrap();
        let commit_to_group_768 = bhp768.commit_to_group(struct_bits.clone(), scalar.clone()).unwrap();
        let commit_to_group_1024 = bhp1024.commit_to_group(struct_bits.clone(), scalar.clone()).unwrap();

        let native_struct_pt = PlaintextNative::from_str(TEST_STRUCT).unwrap();
        let native_struct_bits = native_struct_pt.to_bits_le();

        let native_hash_256 = native_bhp256.hash(&native_struct_bits).unwrap();
        let native_hash_512 = native_bhp512.hash(&native_struct_bits).unwrap();
        let native_hash_768 = native_bhp768.hash(&native_struct_bits).unwrap();
        let native_hash_1024 = native_bhp1024.hash(&native_struct_bits).unwrap();
        let native_hash_to_group_256 = native_bhp256.hash_uncompressed(&native_struct_bits).unwrap();
        let native_hash_to_group_512 = native_bhp512.hash_uncompressed(&native_struct_bits).unwrap();
        let native_hash_to_group_768 = native_bhp768.hash_uncompressed(&native_struct_bits).unwrap();
        let native_hash_to_group_1024 = native_bhp1024.hash_uncompressed(&native_struct_bits).unwrap();
        let native_commit_256 = native_bhp256.commit(&native_struct_bits, &scalar).unwrap();
        let native_commit_512 = native_bhp512.commit(&native_struct_bits, &scalar).unwrap();
        let native_commit_768 = native_bhp768.commit(&native_struct_bits, &scalar).unwrap();
        let native_commit_1024 = native_bhp1024.commit(&native_struct_bits, &scalar).unwrap();
        let native_commit_to_group_256 = native_bhp256.commit_uncompressed(&native_struct_bits, &scalar).unwrap();
        let native_commit_to_group_512 = native_bhp512.commit_uncompressed(&native_struct_bits, &scalar).unwrap();
        let native_commit_to_group_768 = native_bhp768.commit_uncompressed(&native_struct_bits, &scalar).unwrap();
        let native_commit_to_group_1024 = native_bhp1024.commit_uncompressed(&native_struct_bits, &scalar).unwrap();

        assert_eq!(hash_256, Field::from(native_hash_256));
        assert_eq!(hash_512, Field::from(native_hash_512));
        assert_eq!(hash_768, Field::from(native_hash_768));
        assert_eq!(hash_1024, Field::from(native_hash_1024));
        assert_eq!(hash_to_group_256, Group::from(native_hash_to_group_256));
        assert_eq!(hash_to_group_512, Group::from(native_hash_to_group_512));
        assert_eq!(hash_to_group_768, Group::from(native_hash_to_group_768));
        assert_eq!(hash_to_group_1024, Group::from(native_hash_to_group_1024));
        assert_eq!(commit_256, Field::from(native_commit_256));
        assert_eq!(commit_512, Field::from(native_commit_512));
        assert_eq!(commit_768, Field::from(native_commit_768));
        assert_eq!(commit_1024, Field::from(native_commit_1024));
        assert_eq!(commit_to_group_256, Group::from(native_commit_to_group_256));
        assert_eq!(commit_to_group_512, Group::from(native_commit_to_group_512));
        assert_eq!(commit_to_group_768, Group::from(native_commit_to_group_768));
        assert_eq!(commit_to_group_1024, Group::from(native_commit_to_group_1024));
    }
}
