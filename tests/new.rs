// Copyright (C) 2019-2020 Aleo Systems Inc.
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

use aleo::{cli::Command, commands::parse};

#[test]
fn test_new() {
    for _ in 0..3 {
        assert!(parse(Command::New { seed: None }).is_ok());
    }
}

#[test]
fn test_new_seeded() {
    let seed = Some(1231275789u64);
    let expected = r"
  Private Key  APrivateKey1tvv5YV1dipNiku2My8jMkqpqCyYKvR5Jq4y2mtjw7s77Zpn
     View Key  AViewKey1m8gvywHKHKfUzZiLiLoHedcdHEjKwo5TWo6efz8gK7wF
      Address  aleo1faksgtpmculyzt6tgaq26fe4fgdjtwualyljjvfn2q6k42ydegzspfz9uh
";

    let actual = parse(Command::New { seed }).unwrap();
    assert_eq!(expected, actual);
}
