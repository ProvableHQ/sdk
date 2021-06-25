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
use aleo_network::Testnet1;
use aleo_transaction::Transaction as TransactionInner;

use snarkvm_dpc::TransactionScheme;
use snarkvm_utilities::{to_bytes, ToBytes};

use std::str::FromStr;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Transaction {
    pub(crate) transaction: TransactionInner<Testnet1>,
}

#[wasm_bindgen]
impl Transaction {
    #[wasm_bindgen(constructor)]
    pub fn new_dummy() -> Self {
        // let transaction = TransactionInner::<Testnet1>::new();

        // Self { transaction }
        unimplemented!()
    }

    #[wasm_bindgen]
    pub fn from_string(transaction: &str) -> Self {
        let transaction = TransactionInner::<Testnet1>::from_str(transaction).unwrap();

        Self { transaction }
    }

    #[wasm_bindgen]
    pub fn to_string(&self) -> String {
        self.transaction.to_string()
    }

    #[wasm_bindgen]
    pub fn transaction_id(&self) -> String {
        hex::encode(to_bytes![self.transaction.transaction_id().unwrap()].unwrap())
    }

    #[wasm_bindgen]
    pub fn network_id(&self) -> u8 {
        self.transaction.network_id()
    }

    #[wasm_bindgen]
    pub fn ledger_digest(&self) -> String {
        self.transaction.ledger_digest().to_string()
    }

    #[wasm_bindgen]
    pub fn inner_circuit_id(&self) -> String {
        self.transaction.inner_circuit_id().to_string()
    }

    // todo: look into js_sys for arrays
    // #[wasm_bindgen]
    // pub fn old_serial_numbers(&self) -> js_sys<String> {
    //     self.transaction
    //         .old_serial_numbers()
    //         .iter()
    //         .map(|sn| hex::encode(to_bytes![sn].unwrap()))
    //         .collect::<Vec<String>>()
    // }

    // new commitments

    #[wasm_bindgen]
    pub fn program_commitment(&self) -> String {
        hex::encode(to_bytes![self.transaction.program_commitment()].unwrap())
    }

    #[wasm_bindgen]
    pub fn local_data_root(&self) -> String {
        hex::encode(to_bytes![self.transaction.local_data_root()].unwrap())
    }

    #[wasm_bindgen]
    pub fn value_balance(&self) -> String {
        hex::encode(to_bytes![self.transaction.value_balance()].unwrap())
    }

    // encrypted_records

    #[wasm_bindgen]
    pub fn memorandum(&self) -> String {
        hex::encode(to_bytes![self.transaction.memorandum()].unwrap())
    }

    #[wasm_bindgen]
    pub fn size(&self) -> usize {
        self.transaction.size()
    }
}
