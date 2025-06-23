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

pub use super::*;

use crate::{
    Transition,
    log,
    native::ProgramIDNative,
    types::native::{
        CurrentNetwork,
        ExecutionNative,
        IdentifierNative,
        ProcessNative,
        ProgramID,
        ProgramNative,
        VerifyingKeyNative,
    },
};
use snarkvm_algorithms::snark::varuna::VarunaVersion;

use js_sys::{Array, Object, Reflect};
use std::{ops::Deref, str::FromStr};
use wasm_bindgen::{JsValue, prelude::wasm_bindgen};

pub(crate) fn generate_tvk(
    view_key: &ViewKey,
    tpk_str: &str,
) -> Result<String, String> {
    let tpk = Group::<N>::from_str(tpk_str)
        .map_err(|_| "The transaction public key string provided was invalid".to_string())?;
    let vk_native = ViewKeyNative::from_str(*view_key.to_string())
        .map_err(|_| "The view key string provided was invalid".to_string())?;
    let scalar *vk_native;
    let tvk = (tpk * scalar).to_x_coordinate();

    Ok(tvk.to_string())
}