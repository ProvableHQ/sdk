// Copyright (C) 2019-2025 Provable Inc.
// This file is part of the Provable SDK library.

// The Provable SDK library is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// The Provable SDK library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with the Provable SDK library. If not, see <https://www.gnu.org/licenses/>.

use crate::types::native::FieldNative;

use std::str::FromStr;

/// Create a field element to act as a generator.
pub const FIELD_ELEMENT: &str = "6901184695964460143517399399785179769303979738604374595034454667750561389951field";

/// Create a test struct containing all currently supported literal types for hash testing.
pub const TEST_STRUCT: &str = "{
    user: aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc,
    is_active: false,
    some_field: 2field,
    some_group: 7243206743250892049702172909169115544952822465955921992746259936160368017976group,
    some_scalar: 836504693989570607341914239820012911582004515616146791081874852343183183566scalar,
    some_signature: sign1lcpxtgqkp238x45fk79lkx5xz7sx37f56wl0hyemhv78dgzxyspykg6u26lx2a02tvat6zaflx530qtnme34gh702wclwr20rdxrsqcl7shvwsyhygt2yvkgzeq7zz2rdat4rrsr0cd9kwm6jddjcs9lps8s80v35rwvtkgg2gxprf4dge0tcet3pe7nfxupkvfuvh3sw2gpyv0km46
}";

pub const NESTED_STRUCT: &str = "{ player: aleo13nnjqa7h2u4mpl95guz97nhzkhlde750zsjnw59tkgdwc85lyurs295lxc, health: 100u8, inventory: { coins: 5u32, snacks: { candies: 5u64, vegetals: 6u64 } }, secret: 2group, cipher: 2scalar, is_alive: true }";
pub const INVALID_NESTED_STRUCT: &str = "{ player: aleo13nnjqa7h2u4mpl95guz97nhzkhlde750zsjnw59tkgdwc85lyurs295lxc, health: 100u8, inventory: { coins: 5u32, snacks: { candies: 5u64, vegetals: 6u64 } }, secret: 2group, cipher: 2scalar, is_alive: false }";


/// Create a field element and a scalar element.
pub fn create_native_field_vector(num_fields: Option<u16>) -> Vec<FieldNative> {
    // Create a field element generator.
    let num_fields = num_fields.unwrap_or(1);
    let generator = FieldNative::from_str(FIELD_ELEMENT).unwrap();

    // Iterate through field elements and create an array of field elements.
    let mut last_element = generator.clone();
    let mut native_fields = vec![last_element];
    if num_fields > 1 {
        (1..num_fields).into_iter().for_each(|_| {
            last_element = last_element * generator;
            native_fields.push(last_element);
        });
    }
    native_fields
}
