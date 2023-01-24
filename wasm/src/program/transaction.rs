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

use std::convert::TryInto;
use crate::{
    account::{Address, PrivateKey},
    record::RecordPlaintext,
};

use aleo_account::{Aleo, CurrentNetwork, Process, Program, Request, Transaction};

pub struct TransactionBuilder {}

impl TransactionBuilder {
    /// Creates an execute transaction from a full proof of execution
    pub fn build_transfer_full(
        private_key: PrivateKey,
        address: Address,
        amount: u64,
        record: RecordPlaintext,
    ) -> Transaction {
        let process = Process::load().unwrap();
        let credits_program = Program::credits().unwrap();
        let mut amount_str = amount.to_string();
        amount_str.push_str("u64");
        let inputs = [record.to_string(), address.to_string(), amount_str];
        println!("inputs: {:?}", inputs);
        let rng = &mut rand::thread_rng();
        let authorization =
            process.authorize::<Aleo, _>(&private_key, credits_program.id(), "transfer", inputs.iter(), rng).unwrap();
        let (_, execution, _, _) = process.execute::<Aleo, _>(authorization, rng).unwrap();
        // TODO: Figure out how to get proper inclusion proofs
        Transaction::from_execution(execution, None).unwrap()
    }

    pub fn build_authorization(
        private_key: PrivateKey,
        address: Address,
        amount: u64,
        record: RecordPlaintext,
    ) -> Request {
        // Get credits function
        let program = Program::credits().unwrap();
        // Get function id
        let function = program.get_function(&"transfer".try_into().unwrap()).unwrap();
        // Retrieve the input types.
        let input_types = function.input_types();
        // Ensure the number of inputs matches the number of input types.
        if function.inputs().len() != input_types.len() {
            panic!("The number of inputs does not match the number of input types");
        }
        let mut amount_str = amount.to_string();
        amount_str.push_str("u64");
        let inputs = [record.to_string(), address.to_string(), amount_str];
        println!("inputs: {:?}", inputs);
        let rng = &mut rand::thread_rng();
        // Compute the request.
        Request::sign(&private_key, *program.id(), *function.name(), inputs.iter(), &input_types, rng).unwrap()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use wasm_bindgen_test::*;

    const OWNER_PLAINTEXT: &str = r"{
  owner: aleo184vuwr5u7u0ha5f5k44067dd2uaqewxx6pe5ltha5pv99wvhfqxqv339h4.private,
  gates: 1159017656332810u64.private,
  _nonce: 1635890755607797813652478911794003479783620859881520791852904112255813473142group.public
}";

    const ALEO_PRIVATE_KEY: &str = "APrivateKey1zkp3dQx4WASWYQVWKkq14v3RoQDfY2kbLssUj7iifi1VUQ6";
    const ALEO_VIEW_KEY: &str = "AViewKey1cxguxtKkjYnT9XDza9yTvVMxt6Ckb1Pv4ck1hppMzmCB";
    const ALEO_ADDRESS: &str = "aleo184vuwr5u7u0ha5f5k44067dd2uaqewxx6pe5ltha5pv99wvhfqxqv339h4";

    #[test]
    fn test_build_transaction() {
        let private_key = PrivateKey::from_string(ALEO_PRIVATE_KEY);
        let address = Address::from_private_key(&private_key);
        let amount = 100;
        let record = RecordPlaintext::from_string(OWNER_PLAINTEXT).unwrap();
        TransactionBuilder::build_transfer_full(private_key, address, amount, record);
    }

    #[test]
    fn test_build_authorization() {
        let private_key = PrivateKey::from_string(ALEO_PRIVATE_KEY);
        let address = Address::from_private_key(&private_key);
        let amount = 100;
        let record = RecordPlaintext::from_string(OWNER_PLAINTEXT).unwrap();
        TransactionBuilder::build_authorization(private_key, address, amount, record);
    }
}
