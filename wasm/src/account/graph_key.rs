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

use super::ViewKey;
use crate::types::{Field, native::GraphKeyNative};

use core::{convert::TryFrom, fmt, ops::Deref, str::FromStr};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct GraphKey(GraphKeyNative);

#[wasm_bindgen]
impl GraphKey {
    /// Create a new graph key from a view key.
    ///
    /// @param {ViewKey} view_key View key
    /// @returns {GraphKey} Graph key
    pub fn from_view_key(view_key: &ViewKey) -> Self {
        Self::from(GraphKeyNative::try_from(**view_key).unwrap())
    }

    /// Create a new graph key from a string representation of a graph key
    ///
    /// @param {string} graph_key String representation of a graph key
    /// @returns {GraphKey} Graph key
    pub fn from_string(graph_key: &str) -> Self {
        Self::from_str(graph_key).unwrap()
    }

    /// Get a string representation of a graph key
    ///
    /// @returns {string} String representation of a graph key
    #[allow(clippy::inherent_to_string_shadow_display)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Get the sk_tag of the graph key. Used to determine ownership of records.
    pub fn sk_tag(&self) -> Field {
        Field::from(self.0.sk_tag())
    }
}

impl FromStr for GraphKey {
    type Err = anyhow::Error;

    fn from_str(graph_key: &str) -> Result<Self, Self::Err> {
        Ok(Self(GraphKeyNative::from_str(graph_key)?))
    }
}

impl Deref for GraphKey {
    type Target = GraphKeyNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl fmt::Display for GraphKey {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl From<GraphKeyNative> for GraphKey {
    fn from(value: GraphKeyNative) -> Self {
        Self(value)
    }
}

impl From<GraphKey> for GraphKeyNative {
    fn from(value: GraphKey) -> Self {
        value.0
    }
}

impl From<&GraphKey> for GraphKeyNative {
    fn from(value: &GraphKey) -> Self {
        value.0.clone()
    }
}

impl From<&GraphKeyNative> for GraphKey {
    fn from(value: &GraphKeyNative) -> Self {
        Self(value.clone())
    }
}
