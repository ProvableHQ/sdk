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

use crate::Record;
use aleo_network::Network;

use snarkvm_curves::edwards_bls12::{EdwardsParameters, EdwardsProjective as EdwardsBls};
use snarkvm_dpc::{
    testnet1::{
        instantiated::Components,
        record::{record_encoding::RecordEncoding, Record as RecordInner},
    },
    DPCError,
    RecordEncodingScheme,
};
use snarkvm_utilities::{to_bytes, FromBytes, ToBytes};

pub(crate) struct Encode;

impl Encode {
    pub(crate) fn encode<N: Network>(record: &Record<N>) -> Result<(Vec<EdwardsBls>, bool), DPCError> {
        let record_bytes = to_bytes![record]?;
        let given_record: RecordInner<Components> = FromBytes::read(&record_bytes[..])?;
        RecordEncoding::<Components, EdwardsParameters, EdwardsBls>::encode(&given_record)
    }
}
