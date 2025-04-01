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
