use crate::{
  account::{Address, PrivateKey},
  record::RecordPlaintext
};
use crate::{
    Aleo,
    Identifier,
    Process,
    Program,
    ProvingKey,
    TransactionNative
};

use std::str::FromStr;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct TransactionBuilder {}

#[wasm_bindgen]
impl TransactionBuilder {
    /// Creates an execute transaction from a full proof of execution
    pub fn build_transfer_full(
        private_key: PrivateKey,
        proving_key: ProvingKey,
        address: Address,
        amount: u64,
        record: RecordPlaintext,
    ) -> String {
        console_error_panic_hook::set_once();

        let process = Process::load_wasm().unwrap();
        let credits_program = Program::credits().unwrap();

        process.insert_proving_key(credits_program.id(), &Identifier::from_str("transfer").unwrap(), proving_key.into()).unwrap();

        let mut amount_str = amount.to_string();
        amount_str.push_str("u64");
        let inputs = [record.to_string(), address.to_string(), amount_str];
        let rng = &mut rand::thread_rng();

        let authorization =
            process.authorize::<Aleo, _>(&private_key, credits_program.id(), "transfer", inputs.iter(), rng).unwrap();
        let (_, execution, _, _) = process.execute::<Aleo, _>(authorization, rng).unwrap();

        // TODO: Figure out how to get proper inclusion proofs
        let tx = TransactionNative::from_execution(execution, None).unwrap();
        let tx_string = tx.to_string();
        tx_string
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const OWNER_PLAINTEXT: &str = r"{
  owner: aleo184vuwr5u7u0ha5f5k44067dd2uaqewxx6pe5ltha5pv99wvhfqxqv339h4.private,
  gates: 1159017656332810u64.private,
  _nonce: 1635890755607797813652478911794003479783620859881520791852904112255813473142group.public
}";

    const ALEO_PRIVATE_KEY: &str = "APrivateKey1zkp3dQx4WASWYQVWKkq14v3RoQDfY2kbLssUj7iifi1VUQ6";

    #[test]
    #[ignore]
    fn test_build_transaction() {
        let bytes = include_bytes!(concat!(env!("HOME"), "/.aleo/resources/transfer.prover.837ad21")).to_vec();
        let private_key = PrivateKey::from_string(ALEO_PRIVATE_KEY).unwrap();
        let proving_key =ProvingKey::from_bytes(bytes);
        let address = Address::from_private_key(&private_key);
        let amount = 100;
        let record = RecordPlaintext::from_string(OWNER_PLAINTEXT).unwrap();
        TransactionBuilder::build_transfer_full(private_key, proving_key, address, amount, record);
    }
}