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

#[macro_export]
macro_rules! execute_program {
    ($process: expr, $inputs:expr, $program_string:expr, $function_id_string:expr, $private_key:expr, $proving_key:expr, $verifying_key:expr) => {{
        if (($proving_key.is_some() && $verifying_key.is_none())
            || ($proving_key.is_none() && $verifying_key.is_some()))
        {
            return Err(
                "If specifying a key for a program execution, both the proving and verifying key must be specified"
                    .to_string(),
            );
        }

        let mut inputs_native = vec![];
        log("parsing inputs");
        for input in $inputs.to_vec().iter() {
            if let Some(input) = input.as_string() {
                inputs_native.push(input);
            } else {
                return Err("Invalid input - all inputs must be a string specifying the type".to_string());
            }
        }

        log("Loading program");
        let program =
            ProgramNative::from_str(&$program_string).map_err(|_| "The program ID provided was invalid".to_string())?;
        log("Loading function");
        let function_name = IdentifierNative::from_str(&$function_id_string)
            .map_err(|_| "The function name provided was invalid".to_string())?;

        let program_id = program.id().to_string();

        if program_id != "credits.aleo" {
            log("Adding program to the process");
            if let Ok(stored_program) = $process.get_program(program.id()) {
                if stored_program != &program {
                    return Err("The program provided does not match the program stored in the cache, please clear the cache before proceeding".to_string());
                }
            } else {
                $process.add_program(&program).map_err(|e| e.to_string())?;
            }
        }

        if let Some(proving_key) = $proving_key {
            if Self::contains_key($process, program.id(), &function_name) {
                log(&format!("Proving & verifying keys were specified for {program_id} - {function_name:?} but a key already exists in the cache. Using cached keys"));
            } else {
                log(&format!("Inserting externally provided proving and verifying keys for {program_id} - {function_name:?}"));
                $process
                    .insert_proving_key(program.id(), &function_name, ProvingKeyNative::from(proving_key))
                    .map_err(|e| e.to_string())?;
                if let Some(verifying_key) = $verifying_key {
                    $process.insert_verifying_key(program.id(), &function_name, VerifyingKeyNative::from(verifying_key)).map_err(|e| e.to_string())?;
                }
            }
        };

        log("Creating authorization");
        let authorization = $process
            .authorize::<CurrentAleo, _>(
                &$private_key,
                program.id(),
                function_name,
                inputs_native.iter(),
                &mut StdRng::from_entropy(),
            )
            .map_err(|err| err.to_string())?;

        log("Executing program");
        let result = $process
            .execute::<CurrentAleo, _>(authorization, &mut StdRng::from_entropy())
            .map_err(|err| err.to_string())?;

        result
    }};
}

#[macro_export]
macro_rules! inclusion_proof {
    ($process:expr, $inclusion:expr, $execution:expr, $url:expr) => {{
        log("Preparing execution inclusion proof");
        let (assignments, global_state_root) = $inclusion
            .prepare_execution_async::<CurrentBlockMemory, _>(&$execution, &$url)
            .await
            .map_err(|err| err.to_string())?;

        log("Proving execution inclusion proof");
        let execution = $inclusion
            .prove_execution::<CurrentAleo, _>($execution, &assignments, global_state_root, &mut StdRng::from_entropy())
            .map_err(|err| err.to_string())?;

        log("Verifying execution");
        $process.verify_execution::<true>(&execution).map_err(|e| e.to_string())?;

        execution
    }};
}

#[macro_export]
macro_rules! fee_inclusion_proof {
    ($process:expr, $private_key:expr, $fee_record:expr, $fee_microcredits:expr, $submission_url:expr, $fee_proving_key:expr, $fee_verifying_key:expr) => {{
        if (($fee_proving_key.is_some() && $fee_verifying_key.is_none())
            || ($fee_proving_key.is_none() && $fee_verifying_key.is_some()))
        {
            return Err(
                 "Missing key - both the proving and verifying key must be specified for a program execution"
                    .to_string(),
            );
        }

        if let Some(fee_proving_key) = $fee_proving_key {
            let credits = ProgramIDNative::from_str("credits.aleo").unwrap();
            let fee = IdentifierNative::from_str("fee").unwrap();
            if Self::contains_key($process, &credits, &fee) {
                log("Fee proving & verifying keys were specified but a key already exists in the cache. Using cached keys");
            } else {
                log("Inserting externally provided fee proving and verifying keys");
                $process
                    .insert_proving_key(&credits, &fee, ProvingKeyNative::from(fee_proving_key)).map_err(|e| e.to_string())?;
                if let Some(fee_verifying_key) = $fee_verifying_key {
                    $process
                        .insert_verifying_key(&credits, &fee, VerifyingKeyNative::from(fee_verifying_key))
                        .map_err(|e| e.to_string())?;
                }
            }

        };

        log("Executing fee program");
        let fee_record_native = RecordPlaintextNative::from_str(&$fee_record.to_string()).unwrap();
        let (_, fee_transition, inclusion, _) = $process
            .execute_fee::<CurrentAleo, _>(
                &$private_key,
                fee_record_native,
                $fee_microcredits,
                &mut StdRng::from_entropy(),
            )
            .map_err(|err| err.to_string())?;

        log("Preparing fee inclusion proof");
        let assignment = inclusion
            .prepare_fee_async::<CurrentBlockMemory, _>(&fee_transition, &$submission_url)
            .await
            .map_err(|err| err.to_string())?;

        log("Proving fee inclusion proof");
        let fee = inclusion
            .prove_fee::<CurrentAleo, _>(fee_transition, &assignment, &mut StdRng::from_entropy())
            .map_err(|err| err.to_string())?;

        log("Verifying fee execution");
        $process.verify_fee(&fee).map_err(|e| e.to_string())?;

        fee
    }};
}

#[macro_export]
macro_rules! get_process {
    ($self:expr, $cache:expr, $new_process:expr) => {
        if $cache {
            &mut $self.process
        } else {
            let new_process = ProcessNative::load_web().map_err(|err| err.to_string())?;
            $new_process = Some(new_process);
            $new_process.as_mut().unwrap()
        }
    };
}
