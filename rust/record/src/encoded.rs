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
use crate::{Encode, EncodedRecordError, Record};
use aleo_network::Network;

use snarkvm_curves::edwards_bls12::EdwardsProjective as EdwardsBls;

// todo: does this struct need to exist?
pub struct EncodedRecord {
    elements: Vec<EdwardsBls>,
    final_sign_high: bool,
}

impl EncodedRecord {
    /// Encodes the record.
    pub fn from<E: Network>(record: &Record<E>) -> Result<(Vec<EdwardsBls>, bool), EncodedRecordError> {
        Ok(Encode::encode(record)?)
    }
}
