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

use crate::types::{
    helpers::insert_plaintext,
    native::{EntryNative, RecordPlaintextNative},
};
use js_sys::{Object, Reflect};

/// Convert a record to a javascript object.
pub fn record_to_js_object(record: &RecordPlaintextNative) -> Result<Object, String> {
    // Create a new javascript object to house the record data.
    let js_record = Object::new();

    // Insert the owner into the javascript object.
    let owner = record.owner().to_string();
    Reflect::set(&js_record, &"owner".into(), &owner.into()).unwrap();

    // Get the metadata from the record and insert it into the javascript object.
    record.data().iter().for_each(|(key, value)| {
        match value {
            EntryNative::Public(plaintext) => {
                insert_plaintext(&js_record, key, plaintext);
            }
            EntryNative::Constant(plaintext) => {
                insert_plaintext(&js_record, key, plaintext);
            }
            EntryNative::Private(plaintext) => {
                insert_plaintext(&js_record, key, plaintext);
            }
        };
    });

    // Insert the nonce into the javascript object.
    let nonce = record.nonce().to_string();
    Reflect::set(&js_record, &"_nonce".into(), &nonce.into()).unwrap();

    // Return the javascript object representation.
    Ok(js_record)
}
