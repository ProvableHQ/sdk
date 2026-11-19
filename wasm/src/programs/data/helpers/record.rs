// Copyright (C) 2019-2026 Provable Inc.
// This file is part of the Provable SDK library.

// Licensed under the MIT License. See the LICENSE.md file in the project root
// or <https://opensource.org/licenses/MIT> for the full license text.

use crate::{
    insert_plaintext,
    object,
    types::native::{PlaintextEntryNative, RecordPlaintextNative},
};
use js_sys::Object;

/// Convert a record to a javascript object.
pub fn record_to_js_object(record: &RecordPlaintextNative) -> Result<Object, String> {
    let nonce = record.nonce().to_string();
    let owner = record.owner().to_string();

    // Insert the owner and nonce.
    let js_record = object! {
        "owner": &owner,
        "_nonce": &nonce,
    };

    // Get the metadata from the record and insert it into the javascript object.
    record.data().iter().for_each(|(key, value)| {
        match value {
            PlaintextEntryNative::Public(plaintext) => {
                insert_plaintext(&js_record, key, plaintext);
            }
            PlaintextEntryNative::Constant(plaintext) => {
                insert_plaintext(&js_record, key, plaintext);
            }
            PlaintextEntryNative::Private(plaintext) => {
                insert_plaintext(&js_record, key, plaintext);
            }
        };
    });

    // Return the javascript object representation.
    Ok(js_record)
}
