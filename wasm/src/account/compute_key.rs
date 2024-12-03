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

use super::PrivateKey;
use crate::{
    types::{native::ComputeKeyNative, Group, Scalar},
    Address,
};

use core::{convert::TryFrom, ops::Deref};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ComputeKey(ComputeKeyNative);

#[wasm_bindgen]
impl ComputeKey {
    /// Create a new compute key from a private key.
    ///
    /// @param {PrivateKey} private_key Private key
    ///
    /// @returns {ComputeKey} Compute key
    pub fn from_private_key(private_key: &PrivateKey) -> Self {
        Self(ComputeKeyNative::try_from(**private_key).unwrap())
    }

    /// Get the address from the compute key.
    ///
    /// @returns {Address}
    pub fn address(&self) -> Address {
        Address::from(self.0.to_address())
    }

    /// Get the sk_prf of the compute key.
    ///
    /// @returns {Scalar} sk_prf
    pub fn sk_prf(&self) -> Scalar {
        Scalar::from(self.0.sk_prf())
    }

    /// Get the pr_tag of the compute key.
    ///
    /// @returns {Group} pr_tag
    pub fn pk_sig(&self) -> Group {
        Group::from(self.0.pk_sig())
    }

    /// Get the pr_sig of the compute key.
    ///
    /// @returns {Group} pr_sig
    pub fn pr_sig(&self) -> Group {
        Group::from(self.0.pr_sig())
    }
}

impl Deref for ComputeKey {
    type Target = ComputeKeyNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<ComputeKeyNative> for ComputeKey {
    fn from(compute_key: ComputeKeyNative) -> Self {
        Self(compute_key)
    }
}

impl From<ComputeKey> for ComputeKeyNative {
    fn from(compute_key: ComputeKey) -> Self {
        compute_key.0
    }
}

impl From<&ComputeKey> for ComputeKeyNative {
    fn from(compute_key: &ComputeKey) -> Self {
        compute_key.0.clone()
    }
}

impl From<&ComputeKeyNative> for ComputeKey {
    fn from(compute_key: &ComputeKeyNative) -> Self {
        Self(compute_key.clone())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        types::native::{AddressNative, CurrentNetwork},
        PrivateKey,
    };

    use snarkvm_console::network::Network;

    #[test]
    fn test_compute_key_conversions() {
        // Create a new private key.
        let private_key = PrivateKey::new();
        let address = Address::from_private_key(&private_key);

        // Get the compute key from the private key.
        let compute_key = ComputeKey::from_private_key(&private_key);

        // Assert the address derivation can be computed from the compute key components.
        // Compute pk_prf := G^sk_prf.
        let pk_prf = Group::from(CurrentNetwork::g_scalar_multiply(&*compute_key.sk_prf()));
        // Compute the address := pk_sig + pr_sig + pk_prf.
        let group = compute_key.pk_sig().add(&compute_key.pr_sig()).add(&pk_prf);
        let address_native = AddressNative::new(*group);
        let derived_address = Address::from(address_native);

        // Assert an address can be derived from the compute key via it's official function.
        let compute_key_address = Address::from_compute_key(&compute_key);

        // Check the address matches all possible derivations from the compute key.
        assert_eq!(address, compute_key.address());
        assert_eq!(address, derived_address);
        assert_eq!(address, compute_key_address);
    }
}
