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

pub mod deploy;

pub use deploy::*;
use rand::{rngs::StdRng, SeedableRng};
use std::str::FromStr;

pub mod execute;
pub use execute::*;

pub mod join;
pub use join::*;

pub mod split;
pub use split::*;

pub mod transfer;
pub use transfer::*;

pub mod utils;

use crate::{
    types::{
        CurrentAleo,
        IdentifierNative,
        ProcessNative,
        ProgramIDNative,
        ProgramNative,
        ProvingKeyNative,
        VerifyingKeyNative,
    },
    KeyPair,
    ProvingKey,
    RecordPlaintext,
    VerifyingKey,
};

use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen]
#[derive(Clone)]
pub struct ProgramManager {
    process: ProcessNative,
}

#[wasm_bindgen]
impl ProgramManager {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self { process: ProcessNative::load_web().unwrap() }
    }

    /// Validate that an amount being paid from a record is greater than zero and that the record
    /// has enough credits to pay the amount
    pub(crate) fn validate_amount(credits: f64, amount: &RecordPlaintext, fee: bool) -> Result<u64, String> {
        let name = if fee { "Fee" } else { "Amount" };

        if credits <= 0.0 {
            return Err(format!("{name} must be greater than zero to deploy or execute a program"));
        }
        let microcredits = (credits * 1_000_000.0f64) as u64;
        if amount.microcredits() < microcredits {
            return Err(format!("{name} record does not have enough credits to pay the specified fee"));
        }

        Ok(microcredits)
    }

    /// Cache the proving and verifying keys for a program function in WASM memory. This method
    /// will take a verifying and proving key and store them in the program manager's internal
    /// in-memory cache. This memory is allocated in WebAssembly, so it is important to be mindful
    /// of the amount of memory being used. This method will return an error if the keys are already
    /// cached in memory.
    ///
    /// @param program_id The name of the program containing the desired function
    /// @param function The name of the function to store the keys for
    /// @param proving_key The proving key of the function
    /// @param verifying_key The verifying key of the function
    #[wasm_bindgen(js_name = "cacheKeypairInWasmMemory")]
    pub fn cache_keypair_in_wasm_memory(
        &mut self,
        program: &str,
        function: &str,
        proving_key: ProvingKey,
        verifying_key: VerifyingKey,
    ) -> Result<(), String> {
        let program = ProgramNative::from_str(program).map_err(|e| e.to_string())?;
        let program_id = program.id();
        let function = IdentifierNative::from_str(function).map_err(|e| e.to_string())?;

        if &program_id.to_string() != "credits.aleo" {
            if self.process.contains_program(program_id) {
                if Self::contains_key(&self.process, program_id, &function) {
                    return Err(format!(
                        "Proving and verifying keys for function {} in program {} are already cached in WASM memory, please clear the cache before adding new keys",
                        function, program_id
                    ));
                }
            } else {
                self.process.add_program(&program).map_err(|e| e.to_string())?;
            }
        }

        self.process
            .insert_proving_key(program_id, &function, ProvingKeyNative::from(proving_key))
            .map_err(|e| e.to_string())?;

        self.process
            .insert_verifying_key(program_id, &function, VerifyingKeyNative::from(verifying_key))
            .map_err(|e| e.to_string())?;

        Ok(())
    }

    /// Get the proving & verifying keys cached in WASM memory for a specific function
    ///
    /// @param program_id The name of the program containing the desired function
    /// @param function_id The name of the function to retrieve the keys for
    #[wasm_bindgen(js_name = "getCachedKeypair")]
    pub fn get_cached_keypair(&self, program_id: &str, function: &str) -> Result<KeyPair, String> {
        let program_id = ProgramIDNative::from_str(program_id).map_err(|e| e.to_string())?;
        let function_id = IdentifierNative::from_str(function).map_err(|e| e.to_string())?;
        self.get_keypair(&self.process, &program_id, &function_id)
    }

    /// Get a keypair from a process
    pub(crate) fn get_keypair(
        &self,
        process: &ProcessNative,
        program_id: &ProgramIDNative,
        function_id: &IdentifierNative,
    ) -> Result<KeyPair, String> {
        let proving_key =
            ProvingKey::from(process.get_proving_key(program_id, function_id).map_err(|e| e.to_string())?);
        let verifying_key =
            VerifyingKey::from(process.get_verifying_key(program_id, function_id).map_err(|e| e.to_string())?);
        Ok(KeyPair::new(proving_key, verifying_key))
    }

    /// Synthesize a proving and verifying key for a program function. This method should be used
    /// when there is a need to pre-synthesize keys (i.e. for caching purposes, etc.)
    ///
    /// @param program The source code of the program containing the desired function
    /// @param function The name of the function to synthesize the key for
    #[wasm_bindgen(js_name = "synthesizeKeypair")]
    pub fn synthesize_keypair(&mut self, program: &str, function: &str) -> Result<KeyPair, String> {
        let mut process = ProcessNative::load_web().map_err(|e| e.to_string())?;
        let program = ProgramNative::from_str(program).map_err(|e| e.to_string())?;
        let function_id = IdentifierNative::from_str(function).map_err(|e| e.to_string())?;
        let program_id = program.id();
        if &program_id.to_string() != "credits.aleo" {
            process.add_program(&program).map_err(|e| e.to_string())?;
        }

        process
            .synthesize_key::<CurrentAleo, _>(program_id, &function_id, &mut StdRng::from_entropy())
            .map_err(|e| e.to_string())?;
        self.get_keypair(&process, program_id, &function_id)
    }

    /// Clear key cache in wasm memory.
    ///
    /// This method will clear the key cache in wasm memory. It is important to note that this will
    /// not DE-allocate the memory assigned to wasm as wasm memory cannot be shrunk. The total
    /// memory allocated to wasm will remain constant but will be available for other usage after
    /// calling this method.
    #[wasm_bindgen(js_name = "clearKeyCache")]
    pub fn clear_key_cache(&mut self) {
        self.process = ProcessNative::load_web().unwrap();
    }

    /// Check if the cache contains a keypair for a specific function
    ///
    /// @param program_id The name of the program containing the desired function
    /// @param function_id The name of the function to retrieve the keys for
    #[wasm_bindgen(js_name = "keyExists")]
    pub fn key_exists(&self, program_id: &str, function_id: &str) -> Result<bool, String> {
        let program_id = ProgramIDNative::from_str(program_id).map_err(|e| e.to_string())?;
        let function_id = IdentifierNative::from_str(function_id).map_err(|e| e.to_string())?;
        Ok(Self::contains_key(&self.process, &program_id, &function_id))
    }

    /// Check if a process contains a keypair for a specific function
    pub(crate) fn contains_key(
        process: &ProcessNative,
        program_id: &ProgramIDNative,
        function_id: &IdentifierNative,
    ) -> bool {
        process.get_stack(program_id).map_or_else(
            |_| false,
            |stack| stack.contains_proving_key(function_id) && stack.contains_verifying_key(function_id),
        )
    }
}

impl Default for ProgramManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use js_sys::Array;

    use crate::PrivateKey;

    use wasm_bindgen::JsValue;
    use wasm_bindgen_test::*;

    const FEE_PROVER_URL: &str = "https://testnet3.parameters.aleo.org/fee.prover.0bfc24f";
    const FEE_VERIFIER_URL: &str = "https://testnet3.parameters.aleo.org/fee.verifier.44783e8";

    #[wasm_bindgen_test]
    async fn test_cache_functionality() {
        // Get the fee proving and verifying keys from the official Aleo parameters server
        let fee_proving_key_bytes = reqwest::get(FEE_PROVER_URL).await.unwrap().bytes().await.unwrap().to_vec();
        let fee_verifying_key_bytes = reqwest::get(FEE_VERIFIER_URL).await.unwrap().bytes().await.unwrap().to_vec();
        let fee_proving_key = ProvingKey::from_bytes(&fee_proving_key_bytes).unwrap();
        let fee_proving_key_clone = fee_proving_key.clone();
        let fee_verifying_key = VerifyingKey::from_bytes(&fee_verifying_key_bytes).unwrap();
        let fee_verifying_key_clone = fee_verifying_key.clone();
        let mut program_manager = ProgramManager::new();

        // Ensure the keypair is not in wasm memory if it has not been cached
        assert!(program_manager.get_cached_keypair("credits.aleo", "fee").is_err());
        assert!(!program_manager.key_exists("credits.aleo", "fee").unwrap());

        // Cache the keypair in wasm memory
        program_manager
            .cache_keypair_in_wasm_memory(
                &ProgramNative::credits().unwrap().to_string(),
                "fee",
                fee_proving_key,
                fee_verifying_key,
            )
            .unwrap();

        // Ensure the keypair is in wasm memory and can be retrieved
        let mut key_pair = program_manager.get_cached_keypair("credits.aleo", "fee").unwrap();
        let retrieved_proving_key = key_pair.proving_key().unwrap();
        let retreived_verifying_key = key_pair.verifying_key().unwrap();
        assert_eq!(fee_proving_key_clone, retrieved_proving_key);
        assert_eq!(fee_verifying_key_clone, retreived_verifying_key);

        let inputs = Array::new();
        inputs.set(0u32, JsValue::from_str("{  owner: aleo184vuwr5u7u0ha5f5k44067dd2uaqewxx6pe5ltha5pv99wvhfqxqv339h4.private,  microcredits: 2000000u64.private,  _nonce: 4106205762862305308495708971985748592380064201230396559307556388725936304984group.public}"));
        inputs.set(1u32, JsValue::from_str("1000000u64"));

        // Ensure program can be executed using the cache after caching an externally provided keypair
        let result = program_manager
            .execute_local(
                PrivateKey::from_string("APrivateKey1zkp3dQx4WASWYQVWKkq14v3RoQDfY2kbLssUj7iifi1VUQ6").unwrap(),
                ProgramNative::credits().unwrap().to_string(),
                "fee".to_string(),
                inputs,
                true,
                None,
                None,
            )
            .unwrap();

        let record = RecordPlaintext::from_string(&result.get_outputs().get(0u32).as_string().unwrap()).unwrap();
        assert_eq!(record.microcredits(), 1000000u64);

        // Ensure the 'key_exists' function can find the keys
        assert!(program_manager.key_exists("credits.aleo", "fee").unwrap());

        // Ensure the keypair can't be overwritten
        assert!(
            program_manager
                .cache_keypair_in_wasm_memory("credits.aleo", "fee", fee_proving_key_clone, fee_verifying_key_clone)
                .is_err()
        );

        // Ensure the cache clears correctly
        program_manager.clear_key_cache();
        assert!(program_manager.get_cached_keypair("credits.aleo", "fee").is_err());
        assert!(!program_manager.key_exists("credits.aleo", "fee").unwrap());
    }

    #[wasm_bindgen_test]
    async fn test_key_synthesis() {
        // Synthesize a keypair for the fee program
        let mut program_manager = ProgramManager::new();
        let credits = ProgramNative::credits().unwrap();
        let mut key_pair = program_manager.synthesize_keypair(&credits.to_string(), "fee").unwrap();
        let retrieved_proving_key = key_pair.proving_key().unwrap();
        let retreived_verifying_key = key_pair.verifying_key().unwrap();

        // Cache the keypair for the fee program in wasm memory
        program_manager
            .cache_keypair_in_wasm_memory(
                &ProgramNative::credits().unwrap().to_string(),
                "fee",
                retrieved_proving_key,
                retreived_verifying_key,
            )
            .unwrap();

        // Ensure program can be executed with the synthesized keypair stored in wasm memory
        let inputs = Array::new();
        inputs.set(0u32, JsValue::from_str("{  owner: aleo184vuwr5u7u0ha5f5k44067dd2uaqewxx6pe5ltha5pv99wvhfqxqv339h4.private,  microcredits: 2000000u64.private,  _nonce: 4106205762862305308495708971985748592380064201230396559307556388725936304984group.public}"));
        inputs.set(1u32, JsValue::from_str("1000000u64"));

        let result = program_manager
            .execute_local(
                PrivateKey::from_string("APrivateKey1zkp3dQx4WASWYQVWKkq14v3RoQDfY2kbLssUj7iifi1VUQ6").unwrap(),
                ProgramNative::credits().unwrap().to_string(),
                "fee".to_string(),
                inputs,
                true,
                None,
                None,
            )
            .unwrap();

        // Ensure the output is correct
        let record = RecordPlaintext::from_string(&result.get_outputs().get(0u32).as_string().unwrap()).unwrap();
        assert_eq!(record.microcredits(), 1000000u64);
    }
}
