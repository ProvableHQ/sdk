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

use crate::*;

use rand::SeedableRng;
use rand_chacha::ChaChaRng;
use std::str::FromStr;

const ALEO_PRIVATE_KEY: &str = "APrivateKey1zkp8cC4jgHEBnbtu3xxs1Ndja2EMizcvTRDq5Nikdkukg1p";
const ALEO_VIEW_KEY: &str = "AViewKey1iAf6a7fv6ELA4ECwAth1hDNUJJNNoWNThmREjpybqder";
const ALEO_ADDRESS: &str = "aleo1d5hg2z3ma00382pngntdp68e74zv54jdxy249qhaujhks9c72yrsydapc4";

mod testnet1 {
    use super::*;

    #[test]
    pub fn account_new() {
        let rng = &mut ChaChaRng::seed_from_u64(1231275789u64);
        let account = AleoAccount::<Testnet1>::new(rng);

        let expected_private_key = ALEO_PRIVATE_KEY.to_string();
        let candidate_private_key = account.private_key().to_string();

        println!("{} == {}", expected_private_key, candidate_private_key);
        assert_eq!(expected_private_key, candidate_private_key);

        let expected_view_key = ALEO_VIEW_KEY.to_string();
        let candidate_view_key = account.view_key().to_string();

        println!("{} == {}", expected_view_key, candidate_view_key);
        assert_eq!(expected_view_key, candidate_view_key);

        let expected_address = ALEO_ADDRESS.to_string();
        let candidate_address = account.address().to_string();

        println!("{} == {}", expected_address, candidate_address);
        assert_eq!(expected_address, candidate_address);
    }

    #[test]
    pub fn account_from_str() {
        let account = AleoAccount::<Testnet1>::from(PrivateKey::from_str(ALEO_PRIVATE_KEY).unwrap());

        let expected_private_key = ALEO_PRIVATE_KEY.to_string();
        let candidate_private_key = account.private_key().to_string();

        println!("{} == {}", expected_private_key, candidate_private_key);
        assert_eq!(expected_private_key, candidate_private_key);

        let expected_view_key = ALEO_VIEW_KEY.to_string();
        let candidate_view_key = account.view_key().to_string();

        println!("{} == {}", expected_view_key, candidate_view_key);
        assert_eq!(expected_view_key, candidate_view_key);

        let expected_address = ALEO_ADDRESS.to_string();
        let candidate_address = account.address().to_string();

        println!("{} == {}", expected_address, candidate_address);
        assert_eq!(expected_address, candidate_address);
    }
}

// The account scheme for testnet1 and testnet2 should be the same - we can reuse the test account values.
mod testnet2 {
    use super::*;

    #[test]
    pub fn account_new() {
        let rng = &mut ChaChaRng::seed_from_u64(1231275789u64);
        let account = AleoAccount::<Testnet2>::new(rng);

        let expected_private_key = ALEO_PRIVATE_KEY.to_string();
        let candidate_private_key = account.private_key().to_string();

        println!("{} == {}", expected_private_key, candidate_private_key);
        assert_eq!(expected_private_key, candidate_private_key);

        let expected_view_key = ALEO_VIEW_KEY.to_string();
        let candidate_view_key = account.view_key().to_string();

        println!("{} == {}", expected_view_key, candidate_view_key);
        assert_eq!(expected_view_key, candidate_view_key);

        let expected_address = ALEO_ADDRESS.to_string();
        let candidate_address = account.address().to_string();

        println!("{} == {}", expected_address, candidate_address);
        assert_eq!(expected_address, candidate_address);
    }

    #[test]
    pub fn account_from_str() {
        let account = AleoAccount::<Testnet2>::from(PrivateKey::from_str(ALEO_PRIVATE_KEY).unwrap());

        let expected_private_key = ALEO_PRIVATE_KEY.to_string();
        let candidate_private_key = account.private_key().to_string();

        println!("{} == {}", expected_private_key, candidate_private_key);
        assert_eq!(expected_private_key, candidate_private_key);

        let expected_view_key = ALEO_VIEW_KEY.to_string();
        let candidate_view_key = account.view_key().to_string();

        println!("{} == {}", expected_view_key, candidate_view_key);
        assert_eq!(expected_view_key, candidate_view_key);

        let expected_address = ALEO_ADDRESS.to_string();
        let candidate_address = account.address().to_string();

        println!("{} == {}", expected_address, candidate_address);
        assert_eq!(expected_address, candidate_address);
    }
}
