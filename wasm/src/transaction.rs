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

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Transaction {
    pub(crate) transaction: TransactionInner<Testnet1>,
}

#[wasm_bindgen]
impl Transaction {
    #[wasm_bindgen(constructor)]
    pub fn new_dummy() -> Self {
        let record = TransactionInner::<Testnet1>::new();

        // Self { transaction }
        unimplemented!()
    }
}
