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
