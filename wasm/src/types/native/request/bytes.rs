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

use crate::types::native::{AuthorizationNative, ProvingRequestNative};
use snarkvm_wasm::utilities::{FromBytes, ToBytes, error};

use std::{
    io,
    io::{Read, Write},
};

impl ToBytes for ProvingRequestNative {
    fn write_le<W: Write>(&self, mut writer: W) -> io::Result<()> {
        // Write required authorization.
        self.authorization.write_le(&mut writer)?;

        // Write the optional fee_authorization.
        match &self.fee_authorization {
            Some(auth) => {
                true.write_le(&mut writer)?; // flag for Some
                auth.write_le(&mut writer)?;
            }
            None => {
                false.write_le(&mut writer)?; // flag for None
            }
        }

        // Write broadcast flag.
        self.broadcast.write_le(&mut writer)?;

        Ok(())
    }
}

impl FromBytes for ProvingRequestNative {
    fn read_le<R: Read>(mut reader: R) -> io::Result<Self> {
        // Read required authorization.
        let authorization = AuthorizationNative::read_le(&mut reader)?;

        // Read the option flag and then the fee_authorization if present.
        let has_fee_auth = bool::read_le(&mut reader)?;
        let fee_authorization = match has_fee_auth {
            false => None,
            true => Some(AuthorizationNative::read_le(&mut reader)?),
            _ => return Err(error("Invalid Option flag for fee_authorization")),
        };

        // Read broadcast flag.
        let broadcast = bool::read_le(&mut reader)?;

        Ok(Self { authorization, fee_authorization, broadcast })
    }
}
