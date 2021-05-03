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

use crate::dummy::create_dummy_record;

use rand::{Rng, SeedableRng};
use rand_chacha::ChaChaRng;

#[test]
fn test_create_dummy_record() {
    let mut rng = ChaChaRng::seed_from_u64(1231275789u64);

    let record = create_dummy_record(&mut rng).unwrap();

    println!("done");
}
