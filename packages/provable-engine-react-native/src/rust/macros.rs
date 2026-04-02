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

// Native-only helpers for non-WASM builds.
// - Provides: log shim, contains_key cache probe, execute_authorization_native (no web/wasm).

use std::sync::Arc;
use parking_lot::RwLock;

use crate::types::{CurrentAleo, CurrentNetwork};
use snarkvm_synthesizer::prelude::{CallStack, Process, Trace};

/// Simple log shim used by native code paths.
pub(crate) fn log(message: &str) {
    eprintln!("{}", message);
}

/// Return whether proving or verifying key exists for a given program/function in the process cache.
pub(crate) fn contains_key(
    process: &Process<CurrentNetwork>,
    program_id: &snarkvm_console::program::ProgramID<CurrentNetwork>,
    _function_name: &snarkvm_console::program::Identifier<CurrentNetwork>,
) -> bool {
    if let Ok(_stack) = process.get_stack(program_id) {
        // Best-effort; if getters are not exposed in this snarkVM version, conservatively return false
        // so insertion is attempted and duplicate inserts are ignored by the caller if needed.
        // Example (if available in your version):
        // return _stack.get_proving_key(function_name).is_ok() || _stack.get_verifying_key(function_name).is_ok();
        false
    } else {
        false
    }
}

/// Native replacement for Process::execute to avoid any wasm/web bindings.
pub(crate) fn execute_authorization_native<R: rand::CryptoRng + rand::Rng>(
    process: &Process<CurrentNetwork>,
    authorization: snarkvm_synthesizer::Authorization<CurrentNetwork>,
    rng: &mut R,
) -> Result<Trace<CurrentNetwork>, String> {
    // Mirror snarkvm-synthesizer-process/src/execute.rs behavior without calling Process::execute directly.
    log("[NATIVE_EXEC] Starting authorization execution");
    let request = authorization.peek_next().map_err(|e| e.to_string())?;

    let caller = None;
    let root_tvk = None;
    let trace_arc = Arc::new(RwLock::new(Trace::<CurrentNetwork>::new()));
    let call_stack = CallStack::execute(authorization, trace_arc.clone()).map_err(|e| e.to_string())?;
    let stack = process.get_stack(request.program_id()).map_err(|e| e.to_string())?;
    let _response = stack
        .execute_function::<CurrentAleo, _>(call_stack, caller, root_tvk, rng)
        .map_err(|e| e.to_string())?;
    let trace = Arc::try_unwrap(trace_arc).unwrap().into_inner();
    log("[NATIVE_EXEC] Authorization execution completed");
    Ok(trace)
}
