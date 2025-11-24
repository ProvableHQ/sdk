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

use super::*;

use crate::{
    OfflineQuery,
    PrivateKey,
    RecordPlaintext,
    SnapshotQuery,
    Transaction,
    execute_fee,
    latest_block_height,
    latest_program_edition,
    latest_stateroot,
    log,
    types::native::{
        AddressNative,
        CertificateNative,
        CurrentAleo,
        CurrentNetwork,
        DeploymentNative,
        FeeNative,
        PrivateKeyNative,
        ProcessNative,
        ProgramNative,
        ProgramOwnerNative,
        RecordPlaintextNative,
        TransactionNative,
        VerifyingKeyNative,
        ViewKeyNative,
    },
};
use snarkvm_console::prelude::{ConsensusVersion, Network};

use js_sys::Object;
use rand::{SeedableRng, rngs::StdRng};
use std::str::FromStr;

const DEVNODE_VERIFIER_KEY: &str = "verifier1qygqqqqqqqqqqqyvxgqqqqqqqqq87vsqqqqqqqqqhe7sqqqqqqqqqma4qqqqqqqqqq65yqqqqqqqqqqvqqqqqqqqqqqgtlaj49fmrk2d8slmselaj9tpucgxv6awu6yu4pfcn5xa0yy0tpxpc8wemasjvvxr9248vt3509vpk3u60ejyfd9xtvjmudpp7ljq2csk4yqz70ug3x8xp3xn3ul0yrrw0mvd2g8ju7rts50u3smue03gp99j88f0ky8h6fjlpvh58rmxv53mldmgrxa3fq6spsh8gt5whvsyu2rk4a2wmeyrgvvdf29pwp02srktxnvht3k6ff094usjtllggva2ym75xc4lzuqu9xx8ylfkm3qc7lf7ktk9uu9du5raukh828dzgq26hrarq5ajjl7pz7zk924kekjrp92r6jh9dpp05mxtuffwlmvew84dvnqrkre7lw29mkdzgdxwe7q8z0vnkv2vwwdraekw2va3plu7rkxhtnkuxvce0qkgxcxn5mtg9q2c3vxdf2r7jjse2g68dgvyh85q4mzfnvn07lletrpty3vypus00gfu9m47rzay4mh5w9f03z9zgzgzhkv0mupdqsk8naljqm9tc2qqzhf6yp3mnv2ey89xk7sw9pslzzlkndfd2upzmew4e4vnrkr556kexs9qrykkuhsr260mnrgh7uv0sp2meky0keeukaxgjdsnmy77kl48g3swcvqdjm50ejzr7x04vy7hn7anhd0xeetclxunnl7pd6e52qxdlr3nmutz4zr8f2xqa57a2zkl59a28w842cj4783zpy9hxw03k6vz4a3uu7sm072uqknpxjk8fyq4vxtqd08kd93c2mt40lj9ag35nm4rwcfjayejk57m9qqu83qnkrj3sz90pw808srmf705n2yu6gvqazpvu2mwm8x6mgtlsntxfhr0qas43rqxnccft36z4ygty86390t7vrt08derz8368z8ekn3yywxgp4uq24gm6e58tpp0lcvtpsm3nkwpnmzztx4qvkaf6vk38wg787h8mfpqqqqqqqqqqt49m8x";
const DEVNODE_CERTIFICATE: &str =
    "certificate1qyqsqqqqqqqqqqxvwszp09v860w62s2l4g6eqf0kzppyax5we36957ywqm2dplzwvvlqg0kwlnmhzfatnax7uaqt7yqqqw0sc4u";

#[wasm_bindgen]
impl ProgramManager {
    /// Deploy an Aleo program
    ///
    /// @param private_key The private key of the sender
    /// @param program The source code of the program being deployed
    /// @param imports A javascript object holding the source code of any imported programs in the
    /// form \{"program_name1": "program_source_code", "program_name2": "program_source_code", ..\}.
    /// Note that all imported programs must be deployed on chain before the main program in order
    /// for the deployment to succeed
    /// @param priority_fee_credits The optional priority fee to be paid for the transaction
    /// @param fee_record The record to spend the fee from
    /// @param url The url of the Aleo network node to send the transaction to
    /// @param imports (optional) Provide a list of imports to use for the program deployment in the
    /// form of a javascript object where the keys are a string of the program name and the values
    /// are a string representing the program source code \{ "hello.aleo": "hello.aleo source code" \}
    /// @param fee_proving_key (optional) Provide a proving key to use for the fee execution
    /// @param fee_verifying_key (optional) Provide a verifying key to use for the fee execution
    /// @returns {Transaction}
    #[wasm_bindgen(js_name = buildDeploymentTransaction)]
    #[allow(clippy::too_many_arguments)]
    pub async fn deploy(
        private_key: &PrivateKey,
        program: &str,
        priority_fee_credits: f64,
        fee_record: Option<RecordPlaintext>,
        url: Option<String>,
        imports: Option<Object>,
        fee_proving_key: Option<ProvingKey>,
        fee_verifying_key: Option<VerifyingKey>,
        offline_query: Option<OfflineQuery>,
    ) -> Result<Transaction, String> {
        log("Creating deployment transaction");
        let mut process_native = ProcessNative::load_web().map_err(|err| err.to_string())?;
        let process = &mut process_native;

        log("Checking program has a valid name");
        let program = ProgramNative::from_str(program).map_err(|err| err.to_string())?;

        log("Checking program imports are valid and add them to the process");
        ProgramManager::resolve_imports(process, &program, imports)?;
        let rng = &mut StdRng::from_entropy();

        log("Creating deployment");
        let node_url = url.as_deref().unwrap_or(DEFAULT_URL);
        let mut deployment = process.deploy::<CurrentAleo, _>(&program, rng).map_err(|err| err.to_string())?;
        if deployment.program().functions().is_empty() {
            return Err("Attempted to create an empty transaction deployment".to_string());
        }

        log("Setting program checksum and owner");
        let latest_height = latest_block_height(node_url).await.map_err(|err| err.to_string())?;
        let consensus_version = CurrentNetwork::CONSENSUS_VERSION(latest_height).map_err(|err| err.to_string())?;
        let private_key_native = PrivateKeyNative::from(private_key);
        if consensus_version < ConsensusVersion::V9 {
            deployment.set_program_checksum_raw(None);
            deployment.set_program_owner_raw(None)
        } else {
            deployment.set_program_checksum_raw(Some(deployment.program().to_checksum()));
            deployment
                .set_program_owner_raw(Some(AddressNative::try_from(private_key_native).map_err(|e| e.to_string())?));
        }

        log("Ensuring the fee is sufficient to pay for the deployment");
        let block_height = latest_block_height(node_url).await.map_err(|err| err.to_string())?;
        let consensus_version =
            <CurrentNetwork as Network>::CONSENSUS_VERSION(block_height).map_err(|err| err.to_string())?;
        let (minimum_deployment_cost, (_, _, _, _)) =
            deployment_cost::<CurrentNetwork>(process, &deployment, consensus_version)
                .map_err(|err| err.to_string())?;

        // Check to see if the fee record has enough microcredits to pay for the deployment.
        let priority_fee_microcredits = (priority_fee_credits * 1_000_000.0) as u64;
        Self::validate_fee_record(&fee_record, minimum_deployment_cost, priority_fee_microcredits)?;

        let deployment_id = deployment.to_deployment_id().map_err(|e| e.to_string())?;

        let fee = execute_fee!(
            process,
            private_key,
            fee_record,
            priority_fee_microcredits,
            node_url,
            fee_proving_key,
            fee_verifying_key,
            deployment_id,
            rng,
            offline_query,
            minimum_deployment_cost
        );

        // Create the program owner
        let owner = ProgramOwnerNative::new(private_key, deployment_id, rng).map_err(|err| err.to_string())?;

        log("Creating deployment transaction");
        Ok(Transaction::from(
            TransactionNative::from_deployment(owner, deployment, fee).map_err(|err| err.to_string())?,
        ))
    }

    /// Estimate the fee for a program deployment
    ///
    /// Disclaimer: Fee estimation is experimental and may not represent a correct estimate on any current or future network
    ///
    /// @param program The source code of the program being deployed
    /// @param imports (optional) Provide a list of imports to use for the deployment fee estimation
    /// in the form of a javascript object where the keys are a string of the program name and the values
    /// are a string representing the program source code \{ "hello.aleo": "hello.aleo source code" \}
    /// @returns {u64}
    #[wasm_bindgen(js_name = estimateDeploymentFee)]
    pub async fn estimate_deployment_fee(program: &str, imports: Option<Object>) -> Result<u64, String> {
        log(
            "Disclaimer: Fee estimation is experimental and may not represent a correct estimate on any current or future network",
        );
        let mut process_native = ProcessNative::load_web().map_err(|err| err.to_string())?;
        let process = &mut process_native;

        log("Check program has a valid name");
        let program = ProgramNative::from_str(program).map_err(|err| err.to_string())?;

        log("Check program imports are valid and add them to the process");
        ProgramManager::resolve_imports(process, &program, imports)?;

        log("Create sample deployment");
        let deployment =
            process.deploy::<CurrentAleo, _>(&program, &mut StdRng::from_entropy()).map_err(|err| err.to_string())?;
        if deployment.program().functions().is_empty() {
            return Err("Attempted to create an empty transaction deployment".to_string());
        }

        log("Get the latest block height and determine the consensus version");
        let latest_height = latest_block_height(DEFAULT_URL).await.map_err(|err| err.to_string())?;
        let consensus_version =
            <CurrentNetwork as Network>::CONSENSUS_VERSION(latest_height).map_err(|err| err.to_string())?;

        log("Estimate the deployment fee");
        let (minimum_deployment_cost, (_, _, _, _)) =
            deployment_cost::<CurrentNetwork>(process, &deployment, consensus_version)
                .map_err(|err| err.to_string())?;

        Ok(minimum_deployment_cost)
    }

    /// Estimate the component of the deployment cost which comes from the fee for the program name.
    /// Note that this cost does not represent the entire cost of deployment. It is additional to
    /// the cost of the size (in bytes) of the deployment.
    ///
    /// Disclaimer: Fee estimation is experimental and may not represent a correct estimate on any current or future network
    ///
    /// @param name The name of the program to be deployed
    /// @returns {u64}
    #[wasm_bindgen(js_name = estimateProgramNameCost)]
    pub fn program_name_cost(name: &str) -> Result<u64, String> {
        log(
            "Disclaimer: Fee estimation is experimental and may not represent a correct estimate on any current or future network",
        );
        let num_characters = name.chars().count() as u32;
        let namespace_cost = 10u64
            .checked_pow(10u32.saturating_sub(num_characters))
            .ok_or("The namespace cost computation overflowed for a deployment")?
            .saturating_mul(1_000_000); // 1 microcredit = 1e-6 credits.
        Ok(namespace_cost)
    }

    /// Deploy an Aleo program without synthesizing keys and generating certificates.
    /// Intended for use with Leo Devnode.
    ///
    /// @param private_key The private key of the sender
    /// @param program The source code of the program being deployed
    /// @param imports A javascript object holding the source code of any imported programs in the
    /// form \{"program_name1": "program_source_code", "program_name2": "program_source_code", ..\}.
    /// Note that all imported programs must be deployed on chain before the main program in order
    /// for the deployment to succeed
    /// @param priority_fee_credits The optional priority fee to be paid for the transaction
    /// @param fee_record The record to spend the fee from
    /// @param url The url of the Aleo network node to send the transaction to
    /// @param imports (optional) Provide a list of imports to use for the program deployment in the
    /// form of a javascript object where the keys are a string of the program name and the values
    /// are a string representing the program source code \{ "hello.aleo": "hello.aleo source code" \}
    /// @param fee_proving_key (optional) Provide a proving key to use for the fee execution
    /// @param fee_verifying_key (optional) Provide a verifying key to use for the fee execution
    /// @returns {Transaction}
    #[wasm_bindgen(js_name = buildDevnodeDeploymentTransaction)]
    #[allow(clippy::too_many_arguments)]
    pub async fn devnode_deploy(
        private_key: &PrivateKey,
        program: &str,
        priority_fee_credits: f64,
        fee_record: Option<RecordPlaintext>,
        url: Option<String>,
        imports: Option<Object>,
        offline_query: Option<OfflineQuery>,
    ) -> Result<Transaction, String> {
        log("Creating deployment transaction");
        let mut process_native = ProcessNative::load_web().map_err(|err| err.to_string())?;
        let process = &mut process_native;

        log("Checking program has a valid name");
        let program = ProgramNative::from_str(program).map_err(|err| err.to_string())?;
        let program_id = program.id();

        log("Checking program imports are valid and add them to the process");
        ProgramManager::resolve_imports(process, &program, imports)?;
        let rng = &mut StdRng::from_entropy();

        log("Creating deployment");
        let node_url = url.as_deref().unwrap_or(DEFAULT_URL);

        // Create deployment without synthesizing keys and generating certificates.
        assert!(!program.functions().is_empty(), "Program must have at least one function");
        let mut verifying_keys = Vec::with_capacity(program.functions().len());
        for function_name in program.functions().keys() {
            let (verifying_key, certificate) = {
                // Sample a dummy verifying key for each function.
                let verifying_key =
                    VerifyingKeyNative::from_str(DEVNODE_VERIFIER_KEY).map_err(|err| err.to_string())?;

                // Sample a dummy certificate.
                let certificate = CertificateNative::from_str(DEVNODE_CERTIFICATE).map_err(|err| err.to_string())?;
                (verifying_key, certificate)
            };
            verifying_keys.push((*function_name, (verifying_key, certificate)));
        }

        let edition_response = latest_program_edition(node_url, &program_id.to_string()).await;
        let edition = match edition_response {
            Ok(edition) => edition + 1,
            Err(_) => 0,
        };

        let mut deployment = DeploymentNative::new(edition, program.clone(), verifying_keys, None, None)
            .map_err(|err| err.to_string())?;

        let latest_height = latest_block_height(node_url).await.map_err(|err| err.to_string())?;
        let consensus_version = CurrentNetwork::CONSENSUS_VERSION(latest_height).map_err(|err| err.to_string())?;

        let private_key_native = PrivateKeyNative::from(private_key);
        if consensus_version < ConsensusVersion::V9 {
            deployment.set_program_checksum_raw(None);
            deployment.set_program_owner_raw(None)
        } else {
            deployment.set_program_checksum_raw(Some(deployment.program().to_checksum()));
            deployment
                .set_program_owner_raw(Some(AddressNative::try_from(private_key_native).map_err(|e| e.to_string())?));
        }

        let deployment_id = deployment.to_deployment_id().map_err(|e| e.to_string())?;

        let owner = ProgramOwnerNative::new(private_key, deployment_id, rng).map_err(|err| err.to_string())?;

        // Construct the fee authorization for the deployment
        let (minimum_deployment_cost, _) = deployment_cost::<CurrentNetwork>(process, &deployment, consensus_version)
            .map_err(|err| err.to_string())?;

        // Check to see if the fee record has enough microcredits to pay for the deployment.
        let priority_fee_microcredits = (priority_fee_credits * 1_000_000.0) as u64;
        Self::validate_fee_record(&fee_record, minimum_deployment_cost, priority_fee_microcredits)
            .map_err(|e| e.to_string())?;

        let fee_authorization = match fee_record {
            Some(record) => process
                .authorize_fee_private::<CurrentAleo, _>(
                    &private_key,
                    record.into(),
                    minimum_deployment_cost,
                    priority_fee_microcredits,
                    deployment_id,
                    rng,
                )
                .map_err(|e| e.to_string())?,
            None => process
                .authorize_fee_public::<CurrentAleo, _>(
                    &private_key,
                    minimum_deployment_cost,
                    priority_fee_microcredits,
                    deployment_id,
                    rng,
                )
                .map_err(|e| e.to_string())?,
        };

        // Get the state root.
        let state_root = latest_stateroot(node_url).await.map_err(|e| e.to_string()).map_err(|e| e.to_string())?;

        let fee = FeeNative::from(fee_authorization.transitions().into_iter().next().unwrap().1, state_root, None)
            .map_err(|err| err.to_string())?;

        log("Creating deployment transaction");
        Ok(Transaction::from(
            TransactionNative::from_deployment(owner, deployment, fee)
                .map_err(|err| err.to_string())
                .map_err(|e| e.to_string())?,
        ))
    }
}
