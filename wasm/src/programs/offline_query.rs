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

use crate::types::native::{CurrentNetwork, FieldNative, StatePathNative, U64Native};
use snarkvm_console::{
    network::{
        Network,
        prelude::{ToBits, Uniform, Zero},
    },
    program::{
        BLOCKS_DEPTH,
        BlockPath,
        HeaderLeaf,
        HeaderTree,
        TransactionLeaf,
        TransactionTree,
        TransactionsTree,
        TransitionLeaf,
        TransitionTree,
    },
};
use snarkvm_ledger_query::QueryTrait;

use anyhow::{Result, anyhow, ensure};
use async_trait::async_trait;
use indexmap::IndexMap;
use js_sys::Array;
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::wasm_bindgen;

use std::str::FromStr;

/// An offline query object used to insert the global state root and state paths needed to create
/// a valid inclusion proof offline.
#[wasm_bindgen]
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct OfflineQuery {
    block_height: u32,
    state_paths: IndexMap<FieldNative, StatePathNative>,
    state_root: <CurrentNetwork as Network>::StateRoot,
}

#[wasm_bindgen]
impl OfflineQuery {
    /// Creates a new offline query object. The state root is required to be passed in as a string
    ///
    /// @param {u32} block_height The block height.
    /// @param {string} state_root The state root of the current network.
    ///
    /// @returns {OfflineQuery} The newly created offline query object.
    #[wasm_bindgen(constructor)]
    pub fn new(block_height: u32, state_root: &str) -> Result<OfflineQuery, String> {
        let state_root = <CurrentNetwork as Network>::StateRoot::from_str(state_root).map_err(|e| e.to_string())?;
        Ok(Self { block_height, state_paths: IndexMap::new(), state_root })
    }

    /// Add a new block height to the offline query object.
    ///
    /// @param {u32} block_height The block height to add.
    #[wasm_bindgen(js_name = "addBlockHeight")]
    pub fn add_block_height(&mut self, block_height: u32) {
        self.block_height = block_height;
    }

    /// Add a new state path to the offline query object.
    ///
    /// @param {string} commitment: The commitment corresponding to a record input.
    /// @param {string} state_path: The state path corresponding to the commitment.
    #[wasm_bindgen(js_name = "addStatePath")]
    pub fn add_state_path(&mut self, commitment: &str, state_path: &str) -> Result<(), String> {
        let commitment = FieldNative::from_str(commitment).map_err(|e| e.to_string())?;
        let state_path = StatePathNative::from_str(state_path).map_err(|e| e.to_string())?;
        self.state_paths.insert(commitment, state_path);
        Ok(())
    }

    /// Build an `OfflineQuery` whose state paths place all the given record `commitments` under a
    /// single, self-consistent global state root.
    ///
    /// This fabricates a minimal block / transaction / transition Merkle structure that contains the
    /// commitments and returns a query pre-populated with the resulting (shared) global state root
    /// and one state path per commitment. It is intended only for OFFLINE testing of inclusion
    /// proofs: the returned root does not correspond to any real ledger state, but it is internally
    /// consistent, so a proof produced against it will also verify against it.
    ///
    /// @param {number} block_height The block height to report.
    /// @param {string[]} commitments The record commitments (as strings) to include.
    /// @returns {OfflineQuery} A query containing a state path for every commitment.
    #[wasm_bindgen(js_name = "sampleStatePaths")]
    pub fn sample_state_paths(block_height: u32, commitments: Array) -> Result<OfflineQuery, String> {
        let commitments = commitments
            .iter()
            .map(|commitment| {
                let commitment = commitment.as_string().ok_or_else(|| "Commitments must be strings".to_string())?;
                FieldNative::from_str(&commitment).map_err(|e| e.to_string())
            })
            .collect::<Result<Vec<FieldNative>, String>>()?;

        let (state_root, paths) = sample_global_state_paths(&commitments).map_err(|e| e.to_string())?;

        let mut state_paths = IndexMap::new();
        for (commitment, path) in commitments.into_iter().zip(paths) {
            state_paths.insert(commitment, path);
        }
        Ok(Self { block_height, state_paths, state_root })
    }

    /// Get a json string representation of the offline query object.
    ///
    /// @returns {string} JSON string representation of the offline query object.
    #[wasm_bindgen(js_name = "toString")]
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        serde_json::to_string(&self).unwrap()
    }

    /// Create an offline query object from a json string representation.
    ///
    /// @param {string} JSON string representation of the offline query object.
    #[wasm_bindgen(js_name = "fromString")]
    pub fn from_string(s: &str) -> Result<OfflineQuery, String> {
        serde_json::from_str(s).map_err(|e| e.to_string())
    }
}

#[async_trait(?Send)]
impl QueryTrait<CurrentNetwork> for OfflineQuery {
    fn current_state_root(&self) -> Result<<CurrentNetwork as Network>::StateRoot> {
        Ok(self.state_root)
    }

    async fn current_state_root_async(&self) -> Result<<CurrentNetwork as Network>::StateRoot> {
        Ok(self.state_root)
    }

    fn get_state_path_for_commitment(&self, commitment: &FieldNative) -> Result<StatePathNative> {
        self.state_paths.get(commitment).cloned().ok_or(anyhow!("State path not found for commitment"))
    }

    async fn get_state_path_for_commitment_async(&self, commitment: &FieldNative) -> Result<StatePathNative> {
        self.state_paths.get(commitment).cloned().ok_or(anyhow!("State path not found for commitment"))
    }

    fn get_state_paths_for_commitments(&self, commitments: &[FieldNative]) -> Result<Vec<StatePathNative>> {
        let state_paths = commitments
            .iter()
            .filter_map(|commitment| self.state_paths.get(commitment).cloned())
            .collect::<Vec<StatePathNative>>();
        ensure!(
            state_paths.len() == commitments.len(),
            "Not all commitments found in stored state paths, please ensure the offline query object contains all commitments and statepaths required"
        );
        Ok(state_paths)
    }

    async fn get_state_paths_for_commitments_async(&self, commitments: &[FieldNative]) -> Result<Vec<StatePathNative>> {
        self.get_state_paths_for_commitments(commitments)
    }

    fn current_block_height(&self) -> Result<u32> {
        Ok(self.block_height)
    }

    async fn current_block_height_async(&self) -> Result<u32> {
        Ok(self.block_height)
    }
}

/// Fabricates a self-consistent global state path for every supplied commitment, all sharing a
/// single global state root. The commitments are placed as leaves (variant 3 = Record) in one
/// transition tree; the transaction, transactions, header and block layers above are shared, so
/// every returned state path resolves to the same global state root.
///
/// This mirrors `snarkvm_console::program::state_path::test_helpers::sample_global_state_path`, but
/// supports multiple commitments under one root (required because an execution's inclusion proof
/// must reference a single global state root across all of its input records).
fn sample_global_state_paths(
    commitments: &[FieldNative],
) -> Result<(<CurrentNetwork as Network>::StateRoot, Vec<StatePathNative>)> {
    type N = CurrentNetwork;
    let rng = &mut rand::rng();

    // A single transition commitment shared by all leaves.
    let tcm = FieldNative::rand(rng);

    // Build a single transition tree whose leaves are the record commitments.
    let transition_leaves = commitments
        .iter()
        .enumerate()
        .map(|(index, commitment)| {
            // The number of record commitments in a single execution is far below `u8::MAX`.
            let index = u8::try_from(index).map_err(|_| anyhow!("Too many commitments for a single transition"))?;
            Ok(TransitionLeaf::new(index, 3, *commitment))
        })
        .collect::<Result<Vec<_>>>()?;
    let transition_tree: TransitionTree<N> =
        N::merkle_tree_bhp(&transition_leaves.iter().map(|leaf| leaf.to_bits_le()).collect::<Vec<_>>())?;
    let transition_root = *transition_tree.root();
    let transition_id = N::hash_bhp512(&(transition_root, tcm).to_bits_le())?;

    // The transaction, transactions, header and block layers are shared across all commitments.
    let transaction_leaf = TransactionLeaf::new_execution(0, transition_id);
    let transaction_tree: TransactionTree<N> = N::merkle_tree_bhp(&[transaction_leaf.to_bits_le()])?;
    let transaction_id = *transaction_tree.root();
    let transaction_path = transaction_tree.prove(0, &transaction_leaf.to_bits_le())?;

    let transactions_tree: TransactionsTree<N> = N::merkle_tree_bhp(&[transaction_id.to_bits_le()])?;
    let transactions_root = transactions_tree.root();
    let transactions_path = transactions_tree.prove(0, &transaction_id.to_bits_le())?;

    let header_leaf = HeaderLeaf::<N>::new(1, *transactions_root);
    let header_tree: HeaderTree<N> =
        N::merkle_tree_bhp(&[FieldNative::zero().to_bits_le(), header_leaf.to_bits_le()])?;
    let header_root = header_tree.root();
    let header_path = header_tree.prove(1, &header_leaf.to_bits_le())?;

    let previous_block_hash: <N as Network>::BlockHash = FieldNative::rand(rng).into();
    let preimage = (*previous_block_hash).to_bits_le().into_iter().chain(header_root.to_bits_le());
    let block_hash = N::hash_bhp1024(&preimage.collect::<Vec<_>>())?;

    // The inclusion (V1) circuit requires that records consumed by `credits.aleo` were created at a
    // block height at or after `INCLUSION_UPGRADE_HEIGHT + 1`. Rather than build a full block tree
    // (2^BLOCKS_DEPTH leaves), we construct the block Merkle path directly at that leaf index with
    // zero siblings, then derive the resulting global state root by folding the block-hash leaf up
    // the path exactly as `MerklePath::verify` does (BHP leaf/path hashing).
    let block_index = u64::from(N::INCLUSION_UPGRADE_HEIGHT()?.saturating_add(1));
    let block_siblings = vec![FieldNative::zero(); BLOCKS_DEPTH as usize];

    // Leaf hash: BHP1024 over `false || block_hash_bits`.
    let mut current = {
        let mut leaf_preimage = vec![false];
        block_hash.write_bits_le(&mut leaf_preimage);
        N::hash_bhp1024(&leaf_preimage)?
    };
    // Path hash: BHP512 over `true || left_bits || right_bits`, ordered by the leaf-index bits.
    for (level, sibling) in block_siblings.iter().enumerate() {
        let current_is_left = ((block_index >> level) & 1) == 0;
        let (left, right) = if current_is_left { (current, *sibling) } else { (*sibling, current) };
        let mut node_preimage = vec![true];
        left.write_bits_le(&mut node_preimage);
        right.write_bits_le(&mut node_preimage);
        current = N::hash_bhp512(&node_preimage)?;
    }
    let global_state_root = current;
    let block_path = BlockPath::<N>::try_from((U64Native::new(block_index), block_siblings))?;

    // Build one state path per commitment, sharing every layer except the transition leaf/path.
    let mut state_paths = Vec::with_capacity(commitments.len());
    for (index, transition_leaf) in transition_leaves.iter().enumerate() {
        let transition_path = transition_tree.prove(index, &transition_leaf.to_bits_le())?;
        state_paths.push(StatePathNative::from(
            global_state_root.into(),
            block_path.clone(),
            block_hash.into(),
            previous_block_hash,
            *header_root,
            header_path.clone(),
            header_leaf,
            transactions_path.clone(),
            transaction_id.into(),
            transaction_path.clone(),
            transaction_leaf,
            transition_root,
            tcm,
            transition_path,
            *transition_leaf,
        ));
    }

    Ok((global_state_root.into(), state_paths))
}

#[cfg(test)]
mod tests {
    use super::*;

    use wasm_bindgen_test::*;

    const OFFLINE_QUERY: &str = r#"{"block_height":0,"state_paths":{},"state_root":"sr1wjueje6hy86yw9j4lhl7jwvhjxwunw34paj4k3cn2wm5h5r2syfqd83yw4"}"#;
    //const RECORD: &str = "{  owner: aleo1rlwt9w0fl242h40w454m68vttd6vm4lmetu5r57unm5g354y9yzsyexf0y.private,  microcredits: 1000000u64.private,  _nonce: 2899260364216345893364017846447050369739821279831870104066405119445828210771group.public}";
    //const RECORD_STATE_PATH: &str = "path1q96tnxt82uslg3ck2h7ll6fej7gemjd6x58k2k68zdfmwj7sd2q39u24qgqqqqqqqz8vhmupdu4wg3cv08ul4sjlz6je764cznh6ye9qkuc57272er7qzzy3nhhnyfxkvfs2m8zplzsxq2ctf2u5edwp0yavvyxsz54c99qrfs9aay3vhyecmc8f560glgmqv9c0awkg3upuj9rtm5u8t36dyyz7jsksttvfdkd75znvh6h83lqpq6q0eclym87t8ra2days24ew5racm54fffl3z4u2c29tzwykys7plxmct7khyuddgh6268ywgzyfzxe4uqm5svma27ptqccznezwmkj0vcpma3e9vu5lun96knvf5qus44sz5093p5wcdxwkjjr356knt65wjpnzpek2ad789req5e67rqqwrln54hlvhefl2xg36g6n2dn06k6l5jwn3y8xtlfg60wcr5huzvxluvc62x7sx74rpvjldq67v7fmtj0n3mvmczqg5dunz8aa7dumzpkehlddjk7gpjcn0fselmwx08ggf0vtfr4lvr6mpjycgtvfres5qwsgsu25xd27p23f4czqalhf3fhyvg4evwa2u4y27f2q59khvhjsfkqrr67gkw23s47vrmql5q0uk8cp63dpr4ttdehtq8rls0zmj2qvtns3uqeg2fann8e777nhmsddggxn3x67203309kngauujtuw0g8436902ggxze9cfprv8nh8n265phfls95ud9lfzwnvj80let33cpt2x5c5avy0czx3m5vv3ra8r0cw2f2e22dz72lzwkl3c5z8qfuupgs7xhpg42areg227kkflyhpn0cj260yhpeg567fkskljmv7zckqwz6rnk6l2yg7xpeyc3dy907wefjn5w35prnacapd4acn20qeldgwwmuev0d8t6tz02x2kv8qg9sxhakx6fmw5rd35fda735pchuct5gcg9v7559gaxswfjytkkhslq44kvj8ld2pj29xvvqdlsn6zez45pyyzk022z5wng8yez9mttc0s26mxfrlk4qe9znxxqxlcfapv326qjzpt849p28f5rjv3za44u8c9ddny3lm2svj3fnrqr0uy7skg4dqfpq4n6js4r56pexg3w667ruzkkejgla4gxfg5e3sph7z0gty2ksyss2eafg236dqunyghdd0p7pttvey0765ry52vccqmlp859j9tgzgg9v7559gaxswfjytkkhslq44kvj8ld2pj29xvvqdlsn6zez45pyyzk022z5wng8yez9mttc0s26mxfrlk4qe9znxxqxlcfapv326qjzpt849p28f5rjv3za44u8c9ddny3lm2svj3fnrqr0uy7skg4dqfpq4n6js4r56pexg3w667ruzkkejgla4gxfg5e3sph7z0gty2ksyss2eafg236dqunyghdd0p7pttvey0765ry52vccqmlp859j9tgzgg9v7559gaxswfjytkkhslq44kvj8ld2pj29xvvqdlsn6zez45pyyzk022z5wng8yez9mttc0s26mxfrlk4qe9znxxqxlcfapv326qjzpt849p28f5rjv3za44u8c9ddny3lm2svj3fnrqr0uy7skg4dqfpq4n6js4r56pexg3w667ruzkkejgla4gxfg5e3sph7z0gty2ksyxqgy0ryzze4sllaq3hvhsk90h2qhx308xmfg63n740w6wjrk3qgl99r8gr9efj5yeddqdetk6n8cww9sawuhes4l5tan0zctne6n6px58ez93eujhk4qrreq9m0a9m54s93f4zvfa25k0a4w79gfl9grp5qsqqqqqqqqqqzr7mae3y6kkgqc3q3u2cte5vu328u7slgw9dnw9zu4x6uyvt5apykyzgq7g2pjq384shpxqvenrf2xzqpe6era69vcprljemjfu7rq98km83fkceft37tef3l5yd0u3d0vklnrre0xxus0x4cuy48dafs9q8a9z296cvk40q48sva0ndq7uhz4fk87xxrkku9x487afcaus0fpqqsqqqqqqqqqqzzpt849p28f5rjv3za44u8c9ddny3lm2svj3fnrqr0uy7skg4dqgcnhf9dy704t3qcqwfz2zn23tyaax8uyfw9rflmz807edsq542qdss2eafg236dqunyghdd0p7pttvey0765ry52vccqmlp859j9tgzgg9v7559gaxswfjytkkhslq44kvj8ld2pj29xvvqdlsn6zez45pyyzk022z5wng8yez9mttc0s26mxfrlk4qe9znxxqxlcfapv326qjzpt849p28f5rjv3za44u8c9ddny3lm2svj3fnrqr0uy7skg4dqfpq4n6js4r56pexg3w667ruzkkejgla4gxfg5e3sph7z0gty2ksyss2eafg236dqunyghdd0p7pttvey0765ry52vccqmlp859j9tgzgg9v7559gaxswfjytkkhslq44kvj8ld2pj29xvvqdlsn6zez45pyyzk022z5wng8yez9mttc0s26mxfrlk4qe9znxxqxlcfapv326qjzpt849p28f5rjv3za44u8c9ddny3lm2svj3fnrqr0uy7skg4dqfpq4n6js4r56pexg3w667ruzkkejgla4gxfg5e3sph7z0gty2ksyss2eafg236dqunyghdd0p7pttvey0765ry52vccqmlp859j9tgzgg9v7559gaxswfjytkkhslq44kvj8ld2pj29xvvqdlsn6zez45pyyzk022z5wng8yez9mttc0s26mxfrlk4qe9znxxqxlcfapv326qjzpt849p28f5rjv3za44u8c9ddny3lm2svj3fnrqr0uy7skg4dqfvfkqsgfjgwe874pq983afd72ptcv6hx664appmslfk2jptvjecdqqqqqqqqqqqqppq4n6js4r56pexg3w667ruzkkejgla4gxfg5e3sph7z0gty2ksyss2eafg236dqunyghdd0p7pttvey0765ry52vccqmlp859j9tgzgg9v7559gaxswfjytkkhslq44kvj8ld2pj29xvvqdlsn6zez45pyyzk022z5wng8yez9mttc0s26mxfrlk4qe9znxxqxlcfapv326qjzpt849p28f5rjv3za44u8c9ddny3lm2svj3fnrqr0uy7skg4dqgqgqqzk3ftj0dmy8gphrl85l8cfgrf8vpzdflzw7zu4ppfnxsn3vv2wqvatgjpp5234t647yyh37w3jmz37yyur5c5cg4rxgpwjecnpm2xsrceze3ptsf2gw50t0zznhzx0an9ezz8zfa37kxkw8ucw7f3gwlvqsyqqqqqqqqqqq0ylf8je3k7c464x6fpcur8s7ju93yum7kyq0p6hjkqdg24smwsz9vllufwczy2t0v3elfsv5ymkh8rp34acu9cc0rhjut7d9x684cqvyzk022z5wng8yez9mttc0s26mxfrlk4qe9znxxqxlcfapv326qjzpt849p28f5rjv3za44u8c9ddny3lm2svj3fnrqr0uy7skg4dqfpq4n6js4r56pexg3w667ruzkkejgla4gxfg5e3sph7z0gty2ksyqypq8m5dp6ejcmzg46vm4ng7xvxrya7dd4z5qam2afc8gclnkz50cgsgkwy6dt";
    const STATE_ROOT: &str = "sr1wjueje6hy86yw9j4lhl7jwvhjxwunw34paj4k3cn2wm5h5r2syfqd83yw4";

    #[wasm_bindgen_test]
    fn test_to_string_and_from_string() {
        let offline_query = OfflineQuery::new(0, STATE_ROOT).unwrap();
        assert_eq!(offline_query.to_string(), OFFLINE_QUERY);

        let offline_query_from_str = OfflineQuery::from_string(OFFLINE_QUERY).unwrap();
        assert_eq!(offline_query_from_str, offline_query);
    }

    /*#[wasm_bindgen_test]
    async fn test_state_path_construction() {
        // Create an offline query
        let mut offline_query = OfflineQuery::new(STATE_ROOT).unwrap();

        // Compute the record commitment for the input record
        let record_plaintext = RecordPlaintext::from_string(RECORD).unwrap();
        let record_commitment = record_plaintext.commitment("credits.aleo", "credits").unwrap();

        // Add a valid state path
        offline_query.add_state_path(&record_commitment.to_string(), RECORD_STATE_PATH).unwrap();

        // Construct the expected state path and expected state root
        let expected_state_path = StatePath::<CurrentNetwork>::from_str(RECORD_STATE_PATH).unwrap();
        println!("expected_state_path: {:?}", expected_state_path.global_state_root().to_string());
        let expected_state_root = <CurrentNetwork as Network>::StateRoot::from_str(STATE_ROOT).unwrap();

        // Check that the state path can be retrieved from the query trait
        assert_eq!(
            offline_query.get_state_path_for_commitment(&record_commitment.clone().into()).unwrap(),
            expected_state_path
        );
        assert_eq!(
            offline_query
                .get_state_path_for_commitment_async(&record_commitment.into())
                .await
                .unwrap()
                .global_state_root(),
            expected_state_root
        );

        // Check that the state root can be retrieved from the query trait
        assert_eq!(offline_query.current_state_root().unwrap(), expected_state_root);
        assert_eq!(offline_query.current_state_root_async().await.unwrap(), expected_state_root);
    }*/
}
