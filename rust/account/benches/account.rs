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

use aleo_account::*;

#[macro_use]
extern crate bencher;

use bencher::Bencher;
use rand::SeedableRng;
use rand_chacha::ChaChaRng;

pub const SEED: u64 = 1231275789u64;

fn testnet2_account_new(bench: &mut Bencher) {
    let rng = &mut ChaChaRng::seed_from_u64(SEED);

    bench.iter(|| {
        let _account = Account::new(rng);
    })
}

fn testnet2_account_from_private_key(bench: &mut Bencher) {
    let rng = &mut ChaChaRng::seed_from_u64(SEED);
    let private_key = PrivateKey::new(rng);

    bench.iter(|| {
        let _account = Account::from(private_key.clone());
    })
}

benchmark_group!(testnet2, testnet2_account_new, testnet2_account_from_private_key);
benchmark_main!(testnet2);
