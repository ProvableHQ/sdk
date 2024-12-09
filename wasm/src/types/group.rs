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

use crate::{
    types::{
        native::{GroupNative, LiteralNative, PlaintextNative, Uniform},
        Scalar,
    },
    Field,
    Plaintext,
};
use snarkvm_console::prelude::{Double, Zero};

use once_cell::sync::OnceCell;
use std::{ops::Deref, str::FromStr};
use wasm_bindgen::prelude::wasm_bindgen;

/// Elliptic curve element.
#[wasm_bindgen]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Group(GroupNative);

#[wasm_bindgen]
impl Group {
    /// Creates a group object from a string representation of a group.
    #[wasm_bindgen(js_name = "fromString")]
    pub fn from_string(group: &str) -> Result<Group, String> {
        Ok(Self(GroupNative::from_str(group).map_err(|e| e.to_string())?))
    }

    /// Returns the string representation of the group.
    #[wasm_bindgen(js_name = "toString")]
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Get the x-coordinate of the group element.
    #[wasm_bindgen(js_name = "toXCoordinate")]
    pub fn to_x_coordinate(&self) -> Field {
        Field::from(self.0.to_x_coordinate())
    }

    /// Create a plaintext element from a group element.
    #[wasm_bindgen(js_name = "toPlaintext")]
    pub fn to_plaintext(&self) -> Plaintext {
        Plaintext::from(PlaintextNative::Literal(LiteralNative::Group(self.0), OnceCell::new()))
    }

    /// Generate a random group element.
    pub fn random() -> Group {
        let rng = &mut rand::thread_rng();
        Group(GroupNative::rand(rng))
    }

    /// Add two group elements.
    pub fn add(&self, other: &Group) -> Group {
        Group(self.0 + other.0)
    }

    /// Subtract two group elements (equivalently: add the inverse of an element).
    pub fn subtract(&self, other: &Group) -> Group {
        Group(self.0 - other.0)
    }

    /// Multiply a group element by a scalar element.
    #[wasm_bindgen(js_name = scalarMultiply)]
    pub fn scalar_multiply(&self, scalar: &Scalar) -> Group {
        Group(self.0 * **scalar)
    }

    /// Double the group element.
    pub fn double(&self) -> Group {
        Group(self.0.double())
    }

    /// Get the inverse of the group element. This is the reflection of the point about the axis
    /// of symmetry i.e. (x,y) -> (x, -y).
    pub fn inverse(&self) -> Group {
        Group(-self.0)
    }

    /// Check if one group element equals another.
    pub fn equals(&self, other: &Group) -> bool {
        self.0 == GroupNative::from(other)
    }

    /// Get the group identity element under the group operation (i.e. the point at infinity.)
    pub fn zero() -> Group {
        Group::from(GroupNative::zero())
    }

    /// Get the generator of the group.
    pub fn generator() -> Group {
        Group::from(GroupNative::generator())
    }
}

impl Deref for Group {
    type Target = GroupNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<GroupNative> for Group {
    fn from(native: GroupNative) -> Self {
        Self(native)
    }
}

impl From<Group> for GroupNative {
    fn from(group: Group) -> Self {
        group.0
    }
}

impl From<&GroupNative> for Group {
    fn from(native: &GroupNative) -> Self {
        Self(*native)
    }
}

impl From<&Group> for GroupNative {
    fn from(group: &Group) -> Self {
        group.0
    }
}
