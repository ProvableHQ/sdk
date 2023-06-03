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

use aleo_rust::Encryptor;
use snarkvm_console::{account::PrivateKey, network::Testnet3};

use bencher::Bencher;
use rand::SeedableRng;
use rand_chacha::ChaChaRng;

pub const SEED: u64 = 1231275789u64;

// Bench private key encryption
fn testnet3_private_key_encryption(bench: &mut Bencher) {
    let rng = &mut ChaChaRng::seed_from_u64(SEED);
    let private_key = PrivateKey::<Testnet3>::new(rng).unwrap();
    bench.iter(|| {
        Encryptor::<Testnet3>::encrypt_private_key_with_secret(&private_key, "password").unwrap();
    })
}

// Bench private key decryption
fn testnet3_private_key_decryption(bench: &mut Bencher) {
    let rng = &mut ChaChaRng::seed_from_u64(SEED);
    let private_key = PrivateKey::<Testnet3>::new(rng).unwrap();
    let private_key_ciphertext =
        Encryptor::<Testnet3>::encrypt_private_key_with_secret(&private_key, "password").unwrap();
    bench.iter(|| {
        Encryptor::decrypt_private_key_with_secret(&private_key_ciphertext, "password").unwrap();
    })
}

// Bench private key encryption and decryption roundtrip
fn testnet3_private_key_encryption_decryption_roundtrip(bench: &mut Bencher) {
    let rng = &mut ChaChaRng::seed_from_u64(SEED);
    let private_key = PrivateKey::<Testnet3>::new(rng).unwrap();
    bench.iter(|| {
        let private_key_ciphertext =
            Encryptor::<Testnet3>::encrypt_private_key_with_secret(&private_key, "password").unwrap();
        Encryptor::decrypt_private_key_with_secret(&private_key_ciphertext, "password").unwrap();
    })
}

benchmark_group!(
    testnet3,
    testnet3_private_key_encryption,
    testnet3_private_key_decryption,
    testnet3_private_key_encryption_decryption_roundtrip
);
benchmark_main!(testnet3);
