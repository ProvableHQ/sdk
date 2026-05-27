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

use crate::types::native::{AuthorizationNative, ProvingRequestNative, RequestNative};
use snarkvm_wasm::utilities::{FromBytes, ToBytes};

use std::{
    io,
    io::{Read, Write},
};

impl ToBytes for ProvingRequestNative {
    /// Variant-aware byte serialization matching the DPS layout exactly.
    /// No discriminator byte is written — the reader must know the variant
    /// out-of-band (route context on the server; explicit method on clients).
    fn write_le<W: Write>(&self, mut writer: W) -> io::Result<()> {
        match self {
            Self::Authorization { authorization, fee_authorization, broadcast } => {
                authorization.write_le(&mut writer)?;
                match fee_authorization {
                    Some(auth) => {
                        true.write_le(&mut writer)?;
                        auth.write_le(&mut writer)?;
                    }
                    None => {
                        false.write_le(&mut writer)?;
                    }
                }
                broadcast.write_le(&mut writer)?;
            }
            Self::Request { request, fee_request, broadcast } => {
                request.write_le(&mut writer)?;
                match fee_request {
                    Some(req) => {
                        true.write_le(&mut writer)?;
                        req.write_le(&mut writer)?;
                    }
                    None => {
                        false.write_le(&mut writer)?;
                    }
                }
                broadcast.write_le(&mut writer)?;
            }
        }
        Ok(())
    }
}

impl FromBytes for ProvingRequestNative {
    /// Reads bytes as the Authorization variant for back-compat — historically
    /// the only variant that existed. To read the Request variant, callers
    /// must use [`ProvingRequestNative::read_request_le`] explicitly because
    /// the byte layout carries no discriminator.
    fn read_le<R: Read>(reader: R) -> io::Result<Self> {
        Self::read_authorization_le(reader)
    }
}

impl ProvingRequestNative {
    /// Reads bytes as the Authorization variant.
    /// Layout: `authorization | bool | maybe(fee_authorization) | bool(broadcast)`.
    pub fn read_authorization_le<R: Read>(mut reader: R) -> io::Result<Self> {
        let authorization = AuthorizationNative::read_le(&mut reader)?;
        let has_fee_auth = bool::read_le(&mut reader)?;
        let fee_authorization = match has_fee_auth {
            false => None,
            true => Some(AuthorizationNative::read_le(&mut reader)?),
        };
        let broadcast = bool::read_le(&mut reader)?;
        Ok(Self::Authorization { authorization, fee_authorization, broadcast })
    }

    /// Reads bytes as the Request variant.
    /// Layout: `request | bool | maybe(fee_request) | bool(broadcast)`.
    pub fn read_request_le<R: Read>(mut reader: R) -> io::Result<Self> {
        let request = RequestNative::read_le(&mut reader)?;
        let has_fee_request = bool::read_le(&mut reader)?;
        let fee_request = match has_fee_request {
            false => None,
            true => Some(RequestNative::read_le(&mut reader)?),
        };
        let broadcast = bool::read_le(&mut reader)?;
        Ok(Self::Request { request, fee_request, broadcast })
    }
}
