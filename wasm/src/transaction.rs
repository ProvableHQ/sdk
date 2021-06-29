// Copyright (C) 2019-2021 Aleo Systems Inc.
// This file is part of the Aleo library.

// The Aleo library is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// The Aleo library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with the Aleo library. If not, see <https://www.gnu.org/licenses/>.

use crate::TransactionKernel;
use aleo_network::Testnet1;
use aleo_transaction::{Transaction as TransactionInner, TransactionBuilder as TransactionBuilderInner};

use snarkvm_dpc::{testnet1::PrivateProgramInput, TransactionScheme};
use snarkvm_utilities::{to_bytes, ToBytes};

use std::str::FromStr;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct TransactionBuilder(TransactionBuilderInner<Testnet1>);

#[wasm_bindgen]
impl TransactionBuilder {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self(TransactionBuilderInner::new())
    }

    #[wasm_bindgen]
    pub fn transaction_kernel(self, kernel: &str) -> Self {
        Self(self.0.transaction_kernel(TransactionKernel::from_string(kernel).0))
    }

    #[wasm_bindgen]
    pub fn add_old_death_program_proof(self, verification_key: &str, proof: &str) -> Self {
        let old_death_program_proof = PrivateProgramInput {
            verification_key: hex::decode(verification_key).unwrap(),
            proof: hex::decode(proof).unwrap(),
        };

        Self(self.0.add_old_death_program_proof(old_death_program_proof))
    }

    #[wasm_bindgen]
    pub fn add_new_birth_program_proof(self, verification_key: &str, proof: &str) -> Self {
        let new_birth_program_proof = PrivateProgramInput {
            verification_key: hex::decode(verification_key).unwrap(),
            proof: hex::decode(proof).unwrap(),
        };

        Self(self.0.add_new_birth_program_proof(new_birth_program_proof))
    }

    #[wasm_bindgen]
    pub fn build(&self, _ledger: &str) -> Transaction {
        unimplemented!()
        // let rng = &mut StdRng::from_entropy();
        //
        // Transaction {
        //     transaction: self.0.build(ledger, rng).unwrap(),
        // }
    }
}

#[wasm_bindgen]
pub struct Transaction(TransactionInner<Testnet1>);

#[wasm_bindgen]
impl Transaction {
    #[wasm_bindgen]
    pub fn from_string(transaction: &str) -> Self {
        Self(TransactionInner::<Testnet1>::from_str(transaction).unwrap())
    }

    #[wasm_bindgen]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    #[wasm_bindgen]
    pub fn transaction_id(&self) -> String {
        hex::encode(to_bytes![self.0.transaction_id().unwrap()].unwrap())
    }

    #[wasm_bindgen]
    pub fn network_id(&self) -> u8 {
        self.0.network_id()
    }

    #[wasm_bindgen]
    pub fn ledger_digest(&self) -> String {
        self.0.ledger_digest().to_string()
    }

    #[wasm_bindgen]
    pub fn inner_circuit_id(&self) -> String {
        self.0.inner_circuit_id().to_string()
    }

    #[wasm_bindgen]
    pub fn old_serial_numbers(&self) -> JsValue {
        JsValue::from(
            &self
                .0
                .old_serial_numbers()
                .iter()
                .map(|value| JsValue::from(hex::encode(to_bytes![value].unwrap())))
                .collect::<js_sys::Array>(),
        )
    }

    #[wasm_bindgen]
    pub fn new_commitments(&self) -> JsValue {
        JsValue::from(
            &self
                .0
                .new_commitments()
                .iter()
                .map(|value| JsValue::from(hex::encode(to_bytes![value].unwrap())))
                .collect::<js_sys::Array>(),
        )
    }

    #[wasm_bindgen]
    pub fn program_commitment(&self) -> String {
        hex::encode(to_bytes![self.0.program_commitment()].unwrap())
    }

    #[wasm_bindgen]
    pub fn local_data_root(&self) -> String {
        hex::encode(to_bytes![self.0.local_data_root()].unwrap())
    }

    #[wasm_bindgen]
    pub fn value_balance(&self) -> String {
        hex::encode(to_bytes![self.0.value_balance()].unwrap())
    }

    #[wasm_bindgen]
    pub fn encrypted_records(&self) -> JsValue {
        JsValue::from(
            &self
                .0
                .encrypted_records()
                .iter()
                .map(|value| JsValue::from(hex::encode(to_bytes![value].unwrap())))
                .collect::<js_sys::Array>(),
        )
    }

    #[wasm_bindgen]
    pub fn memorandum(&self) -> String {
        hex::encode(to_bytes![self.0.memorandum()].unwrap())
    }

    #[wasm_bindgen]
    pub fn size(&self) -> usize {
        self.0.size()
    }
}
