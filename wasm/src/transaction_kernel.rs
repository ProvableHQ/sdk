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

use aleo_account::{Address, PrivateKey};
use aleo_network::Testnet1;
use aleo_record::Record;
use aleo_transaction::{
    TransactionKernel as TransactionKernelInner,
    TransactionKernelBuilder as TransactionKernelBuilderInner,
};

use snarkvm_dpc::testnet1::record::payload::Payload;
use snarkvm_utilities::FromBytes;

use rand::{rngs::StdRng, SeedableRng};
use std::str::FromStr;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct TransactionKernelBuilder(TransactionKernelBuilderInner<Testnet1>);

#[wasm_bindgen]
impl TransactionKernelBuilder {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self(TransactionKernelBuilderInner::new())
    }

    #[wasm_bindgen]
    pub fn add_input(self, private_key: &str, record: &str) -> Self {
        let private_key = PrivateKey::from_str(private_key).unwrap();
        let record = Record::from_str(record).unwrap();

        Self(self.0.add_input(private_key, record))
    }

    #[wasm_bindgen]
    pub fn add_output(
        self,
        address: &str,
        amount: u64,
        payload: &str,
        birth_program_id: &str,
        death_program_id: &str,
    ) -> Self {
        let recipient = Address::from_str(address).unwrap();
        let payload: Payload = Payload::read(&hex::decode(payload).unwrap()[..]).unwrap();
        let birth_program_id = hex::decode(birth_program_id).unwrap();
        let death_program_id = hex::decode(death_program_id).unwrap();

        Self(
            self.0
                .add_output(recipient, amount, payload, birth_program_id, death_program_id),
        )
    }

    #[wasm_bindgen]
    pub fn build(self) -> TransactionKernel {
        let rng = &mut StdRng::from_entropy();

        TransactionKernel(self.0.build(rng).unwrap())
    }
}

#[wasm_bindgen]
pub struct TransactionKernel(pub(crate) TransactionKernelInner<Testnet1>);

#[wasm_bindgen]
impl TransactionKernel {
    #[wasm_bindgen]
    pub fn from_string(offline_transaction: &str) -> Self {
        Self(TransactionKernelInner::from_str(offline_transaction).unwrap())
    }

    #[wasm_bindgen]
    pub fn to_string(&self) -> String {
        format!("TransactionKernel {{ transaction_kernel: {} }}", self.0)
    }
}

#[cfg(test)]
mod tests {
    use crate::{TransactionKernel, TransactionKernelBuilder};
    use wasm_bindgen_test::*;

    #[wasm_bindgen_test]
    pub fn offline_transaction_test() {
        let given_private_key = "APrivateKey1tvv5YV1dipNiku2My8jMkqpqCyYKvR5Jq4y2mtjw7s77Zpn";
        let given_record = "4f6d042c3bc73e412f4b4740ad27354a1b25bb9df93f29313350356aa88dca050080d1f008000000000000000000000000000000000000000000000000000000000000000000000000304e7ae3ef9577877ddcef8f8c5d9b5e3bf544c78c50c51213857f35c33c3502df12f0fb72a0d7c56ccd31a87dada92b00304e7ae3ef9577877ddcef8f8c5d9b5e3bf544c78c50c51213857f35c33c3502df12f0fb72a0d7c56ccd31a87dada92b003f07ea7279544031efc42c1c785f4f403146e6fdbfcae26bfaa61f2d2202fd0117df47122a693ceaf27c4ceabb3c4b619333f4663bb7e85a6e741252ba1c6e11af1e1c74edf8ae1963c3532ec6e05a07f96d6731334bc368f93b428491343004";
        let given_address = "aleo1faksgtpmculyzt6tgaq26fe4fgdjtwualyljjvfn2q6k42ydegzspfz9uh";
        let payload = "e456ab4252bd295128ee51efeb4835a9f6f29f818d13021802df91079599ab3a";
        let noop_program_id =
            "4e7ae3ef9577877ddcef8f8c5d9b5e3bf544c78c50c51213857f35c33c3502df12f0fb72a0d7c56ccd31a87dada92b00";

        let builder = TransactionKernelBuilder::new()
            .add_input(given_private_key, given_record)
            .add_output(given_address, 10000, payload, noop_program_id, noop_program_id);

        let transaction_kernel = builder.build();

        let transaction_kernel_string = transaction_kernel.to_string();

        // Offline transaction kernel can be recovered
        let _transaction_kernel = TransactionKernel::from_string(&transaction_kernel_string);
    }
}
