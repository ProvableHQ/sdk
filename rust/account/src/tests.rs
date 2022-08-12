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

use rand::{rngs::StdRng, SeedableRng};
use std::convert::TryFrom;

const ITERATIONS: u64 = 1_000;

#[test]
pub fn test_address_from_private_key() {
    for _ in 0..ITERATIONS {
        // Sample a new private key.
        let private_key = PrivateKey::new(&mut StdRng::from_entropy()).unwrap();
        let expected = Address::try_from(&private_key).unwrap();

        // Check the private_key derived from the view key.
        let view_key = ViewKey::try_from(&private_key).unwrap();
        assert_eq!(expected, Address::try_from(&view_key).unwrap());
    }
}
