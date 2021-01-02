use aleo::transaction::create_dummy_transaction;
use snarkvm_utilities::{to_bytes, ToBytes};

use rand::thread_rng;

pub fn main() {
    let rng = &mut thread_rng();

    let network_id = 1;

    let (transaction, _records) = create_dummy_transaction(network_id, rng).unwrap();

    let encoded_transaction = hex::encode(to_bytes![transaction].unwrap());
    println!("{}", encoded_transaction);
}
