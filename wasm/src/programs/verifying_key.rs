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

use crate::types::{FromBytes, ToBytes, VerifyingKeyNative};

use wasm_bindgen::prelude::wasm_bindgen;

use std::{ops::Deref, str::FromStr};

/// Verifying key for a function within an Aleo program
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct VerifyingKey(VerifyingKeyNative);

#[wasm_bindgen]
impl VerifyingKey {
    /// Construct a new verifying key from a byte array
    ///
    /// @param {Uint8Array} bytes Byte representation of a verifying key
    /// @returns {VerifyingKey | Error}
    #[wasm_bindgen(js_name = "fromBytes")]
    pub fn from_bytes(bytes: &[u8]) -> Result<VerifyingKey, String> {
        Ok(Self(VerifyingKeyNative::from_bytes_le(bytes).map_err(|e| e.to_string())?))
    }

    /// Create a byte array from a verifying key
    ///
    /// @returns {Uint8Array | Error} Byte representation of a verifying key
    #[wasm_bindgen(js_name = "toBytes")]
    pub fn to_bytes(&self) -> Result<Vec<u8>, String> {
        self.0.to_bytes_le().map_err(|_| "Failed to serialize verifying key".to_string())
    }

    /// Create a verifying key from string
    ///
    /// @param {String} string String representation of a verifying key
    /// @returns {VerifyingKey | Error}
    #[wasm_bindgen(js_name = "fromString")]
    pub fn from_string(string: &str) -> Result<VerifyingKey, String> {
        Ok(Self(VerifyingKeyNative::from_str(string).map_err(|e| e.to_string())?))
    }

    /// Get a string representation of the verifying key
    ///
    /// @returns {String} String representation of the verifying key
    #[wasm_bindgen(js_name = "toString")]
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Create a copy of the verifying key
    ///
    /// @returns {VerifyingKey} A copy of the verifying key
    #[wasm_bindgen]
    pub fn copy(&self) -> VerifyingKey {
        self.0.clone().into()
    }
}

impl Deref for VerifyingKey {
    type Target = VerifyingKeyNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<VerifyingKey> for VerifyingKeyNative {
    fn from(verifying_key: VerifyingKey) -> VerifyingKeyNative {
        verifying_key.0
    }
}

impl From<&VerifyingKey> for VerifyingKeyNative {
    fn from(verifying_key: &VerifyingKey) -> VerifyingKeyNative {
        verifying_key.0.clone()
    }
}

impl From<VerifyingKeyNative> for VerifyingKey {
    fn from(verifying_key: VerifyingKeyNative) -> VerifyingKey {
        VerifyingKey(verifying_key)
    }
}

impl PartialEq for VerifyingKey {
    fn eq(&self, other: &Self) -> bool {
        *self.0 == *other.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use wasm_bindgen_test::*;

    const JOIN_VERIFYING_KEY_STRING: &str = "verifier1qygqqqqqqqqqqqqqeuqqqqqqqqqz3ncqqqqqqqqqgvkqzqqqqqqqq590qyqqqqqqqzwn5qgqqqqqqqqvqqqqqqqqqqqpkgztrguz0x8mpfjhsnmqqsnwl764jw73ll0nxcg7pzt59lpd7zsjlmrprw3w6r7npmx4ck4kz3qq7mslfg4rhc9anmgza3dvms2qjhz0hatprzdgmsk3usxkttpep7wej007nzrhzzdmcca2603z4f4cp80q7drqtqw3quvqu5z4nnzspqca272csmxknz9mlwu4u6f9u2zha5rwjgv2hp0l8dlc7aa32dggq9afa5hkqmwnptqmhavy050nf48ndcl6vmjlm95c582wqyws2z5fckxsw6stcxdxxhj7v26padsumqpk58n2f6fejx3k80j2shqa642hulj3sx08ywtxg506n8dnm6nu2ltp4z5apf6wtam9kzaadackjjq6vnahqmqlkuncyslzeml246ajhy5yldyc20p9pf84gn6zdwlq79azygr4fwtvra632w333kh2e3sq4hwtk967gz8zxtsgph0nlncfhqz6wmt5cccd64qwpezp2yuglkrp7jmk4ggkefa5aw09lvhe646gpt0lkjn984uqg6r46a8q3u9vcezmtnq090xkgq0euqtkjrgjks6cxqz9hqw339k8jzepd9nxlhu7sqtv0n0uvz8p3e8wxc784jsvpf4dp92kndr2e6n9p85q8ty4z93l0fn4k7wv6neqkj9y6drya0284qv98y4lthmredwtdlm7p2489etmf473zehyhgpgmu094h97dcyzj22uzwvvayxfjlrv4qlnag2zgcqlma4j7cte6uhsfc98kf54jneuqktsmsacz7gftk9s0cunkevaamkcrt0e086j9lf9vd8eqvkn6esqfsfpjxk4lq94a5mqxgg0eazejt2wtda86l7hj2zxn9k5cy65jp6e97yp8ahakzf6vm0z53te7x9srqeupscxgx8vxla4rqse8srw9ypv3h4q902szlneeuuh4rm46rjnltvt9k";

    #[wasm_bindgen_test]
    async fn test_verifying_key_roundtrip() {
        let join_verifier_bytes = snarkvm_parameters::testnet3::JoinVerifier::load_bytes().unwrap();
        let join_verifier = VerifyingKey::from_bytes(&join_verifier_bytes).unwrap();
        let join_key_string = join_verifier.to_string();
        assert_eq!(join_key_string, JOIN_VERIFYING_KEY_STRING);
    }
}
