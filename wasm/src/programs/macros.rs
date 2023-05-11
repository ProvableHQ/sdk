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

#[macro_export]
macro_rules! execute_program {
    ($inputs:expr, $program:expr, $function:expr, $private_key:expr) => {{
        let mut inputs_native = vec![];
        web_sys::console::log_1(&"parsing inputs".into());
        for input in $inputs.to_vec().iter() {
            if let Some(input) = input.as_string() {
                inputs_native.push(input);
            } else {
                return Err("Invalid input - all inputs must be a string specifying the type".to_string());
            }
        }

        web_sys::console::log_1(&"loading process".into());
        let mut process = ProcessNative::load_web().map_err(|_| "Failed to load the process".to_string())?;
        web_sys::console::log_1(&"Loading program".into());
        let program =
            ProgramNative::from_str(&$program).map_err(|_| "The program ID provided was invalid".to_string())?;
        web_sys::console::log_1(&"Loading function".into());
        let function_name =
            IdentifierNative::from_str(&$function).map_err(|_| "The function name provided was invalid".to_string())?;

        if program.id().to_string() != "credits.aleo" {
            web_sys::console::log_1(&"Adding program to the process".into());
            process.add_program(&program).map_err(|_| "Failed to add program".to_string())?;
        }

        web_sys::console::log_1(&"Creating authorization".into());
        let authorization = process
            .authorize::<CurrentAleo, _>(
                &$private_key,
                program.id(),
                function_name,
                inputs_native.iter(),
                &mut StdRng::from_entropy(),
            )
            .map_err(|err| err.to_string())?;

        web_sys::console::log_1(&"Creating authorization".into());

        (
            process
                .execute::<CurrentAleo, _>(authorization, &mut StdRng::from_entropy())
                .map_err(|err| err.to_string())?,
            process,
        )
    }};
}

#[macro_export]
macro_rules! inclusion_proof {
    ($inclusion:expr, $execution:expr, $url:expr) => {{
        let (assignments, global_state_root) =
            $inclusion.prepare_execution_wasm(&$execution, &$url).await.map_err(|err| err.to_string())?;
        let execution = $inclusion
            .prove_execution::<CurrentAleo, _>($execution, &assignments, global_state_root, &mut StdRng::from_entropy())
            .map_err(|err| err.to_string())?;

        execution
    }};
}

#[macro_export]
macro_rules! fee_inclusion_proof {
    ($process:expr, $private_key:expr, $fee_record:expr, $fee_microcredits:expr, $submission_url:expr) => {{
        let fee_record_native = RecordPlaintextNative::from_str(&$fee_record.to_string()).unwrap();
        let (_, fee_transition, inclusion, _) = $process
            .execute_fee::<CurrentAleo, _>(
                &$private_key,
                fee_record_native,
                $fee_microcredits,
                &mut StdRng::from_entropy(),
            )
            .map_err(|err| err.to_string())?;

        // Prepare the assignments.
        let assignment =
            inclusion.prepare_fee_wasm(&fee_transition, &$submission_url).await.map_err(|err| err.to_string())?;

        let fee = inclusion
            .prove_fee::<CurrentAleo, _>(fee_transition, &assignment, &mut StdRng::from_entropy())
            .map_err(|err| err.to_string())?;

        fee
    }};
}
