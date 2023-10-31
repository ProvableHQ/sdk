use super::*;

use crate::types::{CurrentNetwork, Field};

use snarkvm_console::program::StatePath;
use snarkvm_ledger_query::QueryTrait;

pub struct OfflineQuery {
    state_path: CurrentNetwork::StatePath,
    state_root: Option<CurrentNetwork::StateRoot>,
}

impl OfflineQuery {
    pub fn new(state_path: CurrentNetwork::StatePath, state_root: Option<CurrentNetwork::StateRoot>) -> Self {
        Self { state_path, state_root }
    }
}

impl QueryTrait<CurrentNetwork> for OfflineQuery {
    fn current_state_root(&self) -> anyhow::Result<CurrentNetwork::StateRoot> {
        anyhow::bail!("Synchronous network calls not allowed from WebAssembly")
    }

    async fn current_state_root_async(&self) -> anyhow::Result<CurrentNetwork::StateRoot> {
        Ok(self.state_root.unwrap_or(CurrentNetwork::StateRoot::default()))
    }

    fn get_state_path_for_commitment(
        &self,
        _commitment: &Field<CurrentNetwork>,
    ) -> anyhow::Result<StatePath<CurrentNetwork>> {
        anyhow::bail!("Synchronous network calls not allowed from WebAssembly")
    }

    async fn get_state_path_for_commitment_async(
        &self,
        _commitment: &Field<CurrentNetwork>,
    ) -> anyhow::Result<StatePath<CurrentNetwork>> {
        Ok(self.state_path)
    }
}
