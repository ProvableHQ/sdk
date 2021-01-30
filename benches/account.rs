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

use aleo::account::{Address, PrivateKey, ViewKey};

#[macro_use]
extern crate bencher;

use bencher::Bencher;
use rand::SeedableRng;
use rand_chacha::ChaChaRng;

pub const SEED: u64 = 1231275789u64;

fn account_private_key(bench: &mut Bencher) {
    let rng = &mut ChaChaRng::seed_from_u64(SEED);

    bench.iter(|| {
        let _private_key = PrivateKey::new(rng).unwrap();
    });
}

fn account_view_key(bench: &mut Bencher) {
    let rng = &mut ChaChaRng::seed_from_u64(SEED);

    let private_key = PrivateKey::new(rng).unwrap();

    bench.iter(|| {
        let _view_key = ViewKey::from(&private_key).unwrap();
    });
}

fn account_address(bench: &mut Bencher) {
    let rng = &mut ChaChaRng::seed_from_u64(SEED);

    let private_key = PrivateKey::new(rng).unwrap();

    bench.iter(|| {
        let _address = Address::from(&private_key).unwrap();
    });
}

benchmark_group!(account, account_private_key, account_address);
benchmark_main!(account);
