// Copyright (C) 2019-2023 Aleo Systems Inc.
// This file is part of the Aleo SDK library.

// The Aleo SDK library is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// The Aleo SDK library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with the Aleo SDK library. If not, see <https://www.gnu.org/licenses/>.

#[macro_use]
extern crate bencher;
use snarkvm_console::{
    account::{Address, PrivateKey},
    network::Testnet3,
};

use bencher::Bencher;
use rand::SeedableRng;
use rand_chacha::ChaChaRng;
use std::convert::TryFrom;

pub const SEED: u64 = 1231275789u64;

// Bench private key generation
fn testnet3_private_key_new(bench: &mut Bencher) {
    let rng = &mut ChaChaRng::seed_from_u64(SEED);

    bench.iter(|| {
        let _private_key = PrivateKey::<Testnet3>::new(rng).unwrap();
    })
}

// Bench address generation
fn testnet3_address_from_private_key(bench: &mut Bencher) {
    let rng = &mut ChaChaRng::seed_from_u64(SEED);
    let private_key = PrivateKey::<Testnet3>::new(rng).unwrap();

    bench.iter(|| {
        let _address = Address::<Testnet3>::try_from(private_key).unwrap();
    })
}

benchmark_group!(testnet3, testnet3_private_key_new, testnet3_address_from_private_key);
benchmark_main!(testnet3);
