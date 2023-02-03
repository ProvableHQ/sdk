// Copyright (C) 2019-2023 Aleo Systems Inc.
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

use super::{Address, PrivateKey};
use crate::{record::RecordCiphertext, types::ViewKeyNative};

use core::{convert::TryFrom, fmt, ops::Deref, str::FromStr};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ViewKey(ViewKeyNative);

#[wasm_bindgen]
impl ViewKey {
    pub fn from_private_key(private_key: &PrivateKey) -> Self {
        Self(ViewKeyNative::try_from(**private_key).unwrap())
    }

    pub fn from_string(view_key: &str) -> Self {
        Self::from_str(view_key).unwrap()
    }

    #[allow(clippy::inherent_to_string_shadow_display)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    pub fn to_address(&self) -> Address {
        Address::from_view_key(self)
    }

    pub fn decrypt(&self, ciphertext: &str) -> Result<String, String> {
        let ciphertext = RecordCiphertext::from_str(ciphertext).map_err(|error| error.to_string())?;
        match ciphertext.decrypt(self) {
            Ok(plaintext) => Ok(plaintext.to_string()),
            Err(error) => Err(error),
        }
    }
}

impl FromStr for ViewKey {
    type Err = anyhow::Error;

    fn from_str(view_key: &str) -> Result<Self, Self::Err> {
        Ok(Self(ViewKeyNative::from_str(view_key)?))
    }
}

impl fmt::Display for ViewKey {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl Deref for ViewKey {
    type Target = ViewKeyNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use wasm_bindgen_test::*;

    const OWNER_PLAINTEXT: &str = r"{
  owner: aleo1y50whk20gjtltkte2qcqz9dd6uaet8thhlj3t8utewp0j3hhmg8qae7s5a.public,
  gates: 1159017656332810u64.public,
  a: 6875465154712544327395236939215127424077297244802949502285127742492653680374field.private,
  b: 603076889203566020456049671526074557206943911693533670547825725507132399266scalar.private,
  _nonce: 1635890755607797813652478911794003479783620859881520791852904112255813473142group.public
}";
    const OWNER_CIPHERTEXT: &str = "record1qqj3a67efazf0awe09grqqg44htnh9vaw7l729vl309c972x7ldquqq2k2cax8s7qsqqyqtpgvqqyqsq4seyrzvfa98fkggzccqr68af8e9m0q8rzeqh8a8aqql3a854v58sgrygdv4jn9s8ckwfd48vujrmv0rtfasqh8ygn88ch34ftck8szspvfpsqqszqzvxx9t8s9g66teeepgxmvnw5ymgapcwt2lpy9d5eus580k08wpq544jcl437wjv206u5pxst6few9ll4yhufwldgpx80rlwq8nhssqywmfsd85skg564vqhm3gxsp8q6r30udmqxrxmxx2v8xycdg8pn5ps3dhfvv";
    const OWNER_VIEW_KEY: &str = "AViewKey1ghtvuJQQzQ31xSiVh6X1PK8biEVhQBygRGV4KdYmq4JT";
    const NON_OWNER_VIEW_KEY: &str = "AViewKey1e2WyreaH5H4RBcioLL2GnxvHk5Ud46EtwycnhTdXLmXp";

    #[wasm_bindgen_test]
    pub fn test_from_private_key() {
        let given_private_key = "APrivateKey1zkp4RyQ8Utj7aRcJgPQGEok8RMzWwUZzBhhgX6rhmBT8dcP";
        let given_view_key = "AViewKey1i3fn5SECcVBtQMCVtTPSvdApoMYmg3ToJfNDfgHJAuoD";
        let private_key = PrivateKey::from_string(given_private_key).unwrap();
        let view_key = ViewKey::from_private_key(&private_key);
        assert_eq!(given_view_key, view_key.to_string());
    }

    #[wasm_bindgen_test]
    pub fn test_decrypt_success() {
        let view_key = ViewKey::from_string(OWNER_VIEW_KEY);
        let plaintext = view_key.decrypt(OWNER_CIPHERTEXT);
        assert!(plaintext.is_ok());
        assert_eq!(OWNER_PLAINTEXT, plaintext.unwrap())
    }

    #[wasm_bindgen_test]
    pub fn test_decrypt_fails() {
        let ciphertext = RecordCiphertext::from_str(OWNER_CIPHERTEXT).map_err(|error| error.to_string()).unwrap();
        let incorrect_view_key = ViewKey::from_string(NON_OWNER_VIEW_KEY);
        let plaintext = ciphertext.decrypt(&incorrect_view_key);
        assert!(plaintext.is_err());
    }
}
