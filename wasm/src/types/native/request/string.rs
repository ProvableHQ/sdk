// Copyright (C) 2019-2026 Provable Inc.
// This file is part of the Provable SDK library.

// Licensed under the MIT License. See the LICENSE.md file in the project root
// or <https://opensource.org/licenses/MIT> for the full license text.

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
