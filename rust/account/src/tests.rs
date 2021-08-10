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

use crate::{Account, PrivateKey};

use rand::SeedableRng;
use rand_chacha::ChaChaRng;
use std::str::FromStr;

const TEST_PRIVATE_KEY: &'static str = "APrivateKey1tyBgFoCXAq8RfZT3W2mzVV9XzJb2hVFL2LrHLToEC37tXrz";
const TEST_VIEW_KEY: &'static str = "AViewKey1gFRs4gG66wFW1FypYRfwy6pDqix6rtquQ8uJ15RgHCC8";
const TEST_ADDRESS: &'static str = "aleo1shhq355tyaptcej65tkrweej5wth7wqg5hcqg3hf8as5s9rtrypqs8vy3u";

#[test]
pub fn private_key_test() {
    let rng = &mut ChaChaRng::seed_from_u64(1231275789u64);
    let private_key = PrivateKey::new(rng);

    let expected_private_key = "APrivateKey1tyBgFoCXAq8RfZT3W2mzVV9XzJb2hVFL2LrHLToEC37tXrz";
    let candidate_private_key = private_key.to_string();

    println!("{} == {}", expected_private_key, candidate_private_key);
    assert_eq!(expected_private_key, candidate_private_key);
}

#[test]
pub fn account_test() {
    let account = Account::from_str(TEST_PRIVATE_KEY);

    assert!(account.is_ok());
    let account = account.unwrap();

    let expected_private_key = TEST_PRIVATE_KEY.to_string();
    let candidate_private_key = account.private_key().to_string();

    println!("{} == {}", expected_private_key, candidate_private_key);
    assert_eq!(expected_private_key, candidate_private_key);

    let expected_view_key = TEST_VIEW_KEY.to_string();
    let candidate_view_key = account.view_key().to_string();

    println!("{} == {}", expected_view_key, candidate_view_key);
    assert_eq!(expected_view_key, candidate_view_key);

    let expected_address = TEST_ADDRESS.to_string();
    let candidate_address = account.address().to_string();

    println!("{} == {}", expected_address, candidate_address);
    assert_eq!(expected_address, candidate_address);
}
