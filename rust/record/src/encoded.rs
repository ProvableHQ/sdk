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
use crate::{
    helpers::{decode::Decode, encode::Encode},
    EncodedRecordError,
    Record,
};
use aleo_account::Address;
use aleo_network::Network;

use snarkvm_curves::edwards_bls12::EdwardsProjective as EdwardsBls;

pub struct EncodedRecord {
    elements: Vec<EdwardsBls>,
    final_sign_high: bool,
}

impl EncodedRecord {
    /// Encodes the record.
    pub fn from<N: Network>(record: &Record<N>) -> Result<EncodedRecord, EncodedRecordError> {
        let (elements, final_sign_high) = Encode::encode(record)?;
        Ok(EncodedRecord {
            elements,
            final_sign_high,
        })
    }

    /// Decodes the record.
    pub fn decode<N: Network>(self, owner: Address) -> Result<Record<N>, EncodedRecordError> {
        Ok(Decode::decode(owner, self.elements, self.final_sign_high)?)
    }
}
