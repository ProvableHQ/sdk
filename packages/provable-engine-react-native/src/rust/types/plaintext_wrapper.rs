use crate::types::{CurrentNetwork, PlaintextNative};
use snarkvm_console::{
    account::Address,
    prelude::{FromBits, FromBytes, FromFields, ToBits, ToBytes, ToFields},
    program::Literal,
    types::Field,
};
use std::{ops::Deref, str::FromStr, sync::OnceLock};

type FieldNative = Field<CurrentNetwork>;

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PlaintextWrapper(pub PlaintextNative);

impl PlaintextWrapper {
    pub fn from_native(native: PlaintextNative) -> Self {
        Self(native)
    }

    pub fn into_native(self) -> PlaintextNative {
        self.0
    }

    pub fn as_native(&self) -> &PlaintextNative {
        &self.0
    }

    pub fn from_string(value: &str) -> Result<Self, String> {
        PlaintextNative::from_str(value)
            .map(Self)
            .map_err(|e| e.to_string())
    }

    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    pub fn from_bytes_le(bytes: &[u8]) -> Result<Self, String> {
        PlaintextNative::from_bytes_le(bytes)
            .map(Self)
            .map_err(|e| e.to_string())
    }

    pub fn to_bytes_le(&self) -> Result<Vec<u8>, String> {
        self.0.to_bytes_le().map_err(|e| e.to_string())
    }

    pub fn from_bits_le(bits: &[bool]) -> Result<Self, String> {
        PlaintextNative::from_bits_le(bits)
            .map(Self)
            .map_err(|e| e.to_string())
    }

    pub fn to_bits_le(&self) -> Vec<bool> {
        self.0.to_bits_le()
    }

    pub fn plaintext_type(&self) -> String {
        match &self.0 {
            PlaintextNative::Literal(literal, _) => literal.to_type().type_name().to_string(),
            PlaintextNative::Struct(..) => "struct".to_string(),
            PlaintextNative::Array(..) => "array".to_string(),
        }
    }

    pub fn find(&self, name: &str) -> Result<Self, String> {
        let identifier = snarkvm_console::program::Identifier::<CurrentNetwork>::from_str(name)
            .map_err(|e| e.to_string())?;
        self.0
            .find(&[identifier])
            .map(Self)
            .map_err(|e| e.to_string())
    }

    pub fn encrypt(&self, address: &str, randomizer: &str) -> Result<String, String> {
        let address = Address::from_str(address).map_err(|e| e.to_string())?;
        let randomizer =
            snarkvm_console::types::Scalar::<crate::types::CurrentNetwork>::from_str(randomizer)
                .map_err(|e| e.to_string())?;
        self.0
            .encrypt(&address, randomizer)
            .map(|ciphertext| ciphertext.to_string())
            .map_err(|e| e.to_string())
    }

    pub fn encrypt_symmetric(&self, transition_view_key: &str) -> Result<String, String> {
        let tvk = FieldNative::from_str(transition_view_key).map_err(|e| e.to_string())?;
        self.0
            .encrypt_symmetric(tvk)
            .map(|ciphertext| ciphertext.to_string())
            .map_err(|e| e.to_string())
    }

    pub fn from_fields_str(fields: &[String]) -> Result<Self, String> {
        let native_fields: Result<Vec<FieldNative>, String> = fields
            .iter()
            .map(|field| FieldNative::from_str(field).map_err(|e| e.to_string()))
            .collect();
        PlaintextNative::from_fields(&native_fields?)
            .map(Self)
            .map_err(|e| e.to_string())
    }

    pub fn to_fields_str(&self) -> Result<Vec<String>, String> {
        let native = self.0.clone();
        native
            .to_fields()
            .map(|fields| fields.into_iter().map(|field| field.to_string()).collect())
            .map_err(|e| e.to_string())
    }

    pub fn to_object_string(&self) -> String {
        self.0.to_string()
    }
}

impl Deref for PlaintextWrapper {
    type Target = PlaintextNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<PlaintextNative> for PlaintextWrapper {
    fn from(native: PlaintextNative) -> Self {
        Self(native)
    }
}

impl From<PlaintextWrapper> for PlaintextNative {
    fn from(plaintext: PlaintextWrapper) -> Self {
        plaintext.0
    }
}

impl From<&PlaintextNative> for PlaintextWrapper {
    fn from(plaintext: &PlaintextNative) -> Self {
        Self::from(plaintext.clone())
    }
}

impl From<&PlaintextWrapper> for PlaintextNative {
    fn from(plaintext: &PlaintextWrapper) -> Self {
        plaintext.0.clone()
    }
}

impl From<Literal<crate::types::CurrentNetwork>> for PlaintextWrapper {
    fn from(value: Literal<crate::types::CurrentNetwork>) -> Self {
        PlaintextWrapper(PlaintextNative::Literal(value, OnceLock::new()))
    }
}

impl From<&Literal<crate::types::CurrentNetwork>> for PlaintextWrapper {
    fn from(value: &Literal<crate::types::CurrentNetwork>) -> Self {
        Self::from(value.clone())
    }
}
