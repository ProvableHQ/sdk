// Copyright (C) 2019-2026 Provable Inc.
// This file is part of the Provable SDK library.

// Licensed under the MIT License. See the LICENSE.md file in the project root
// or <https://opensource.org/licenses/MIT> for the full license text.

mod macros;

pub mod data;
pub use data::*;

pub mod execution;
pub use execution::*;

pub mod keypair;
pub use keypair::*;

#[cfg(feature = "browser")]
pub mod manager;
#[cfg(feature = "browser")]
pub use manager::*;

#[cfg(feature = "browser")]
pub mod callback_query;
#[cfg(feature = "browser")]
pub use callback_query::*;

pub mod offline_query;
pub use offline_query::*;

#[cfg(feature = "browser")]
pub mod query_option;
#[cfg(feature = "browser")]
pub use query_option::*;

pub mod program;
pub use program::*;

pub mod proving_key;
pub use proving_key::*;

pub mod request;
pub use request::*;

pub mod response;
pub use response::*;

pub mod snapshot_query;
pub use snapshot_query::*;

pub mod verifying_key;
pub use verifying_key::*;

use crate::types::native::{CurrentNetwork, ExecutionNative, ProcessNative, ProgramIDNative};
use indexmap::IndexMap;
use snarkvm_synthesizer::Stack;
use std::sync::Arc;

pub(crate) fn execution_stacks_for_execution(
    process: &ProcessNative,
    execution: &ExecutionNative,
) -> Result<IndexMap<ProgramIDNative, Arc<Stack<CurrentNetwork>>>, String> {
    execution
        .transitions()
        .map(|transition| {
            process
                .get_stack(transition.program_id())
                .map(|stack| (*transition.program_id(), stack))
                .map_err(|e| e.to_string())
        })
        .collect()
}
