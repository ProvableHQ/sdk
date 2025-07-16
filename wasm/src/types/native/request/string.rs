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

use crate::types::native::ProvingRequestNative;

use std::{
    fmt,
    fmt::{Debug, Display, Formatter},
    str::FromStr,
};

impl FromStr for ProvingRequestNative {
    type Err = String;

    /// Initializes the request from a JSON-string.
    fn from_str(request: &str) -> Result<Self, String> {
        serde_json::from_str(request).map_err(|e| e.to_string())
    }
}

impl Debug for ProvingRequestNative {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        Display::fmt(self, f)
    }
}

impl Display for ProvingRequestNative {
    fn fmt(&self, f: &mut Formatter) -> fmt::Result {
        write!(f, "{}", serde_json::to_string(self).unwrap())
    }
}
