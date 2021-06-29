// Copyright (C) 2019-2021 Aleo Systems Inc.
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

use crate::{EmptyLedger, TransactionError, TransactionKernel};
use aleo_account::{Address, PrivateKey};
use aleo_network::Network;
use aleo_record::Record;

use snarkvm_algorithms::CRH;
use snarkvm_dpc::{
    testnet1::{
        payload::Payload,
        BaseDPCComponents,
        NoopProgramSNARKParameters,
        SystemParameters,
        Transaction as DPCTransaction,
        DPC,
    },
    AccountAddress,
    AccountError,
    AccountPrivateKey,
    DPCComponents,
    DPCScheme,
    RecordScheme,
};
use snarkvm_utilities::{to_bytes, ToBytes};

use once_cell::sync::OnceCell;
use rand::Rng;
use std::{marker::PhantomData, str::FromStr};

#[derive(Derivative)]
#[derivative(Debug(bound = "N: Network"))]
pub struct TransactionInput<N: Network> {
    pub(crate) private_key: PrivateKey,
    pub(crate) record: Record<N>,
}

#[derive(Derivative)]
#[derivative(Clone(bound = "N: Network"), Debug(bound = "N: Network"))]
pub struct TransactionOutput<N: Network> {
    pub(crate) recipient: Address,
    pub(crate) amount: u64,
    pub(crate) payload: Payload,
    pub(crate) birth_program_id: Vec<u8>,
    pub(crate) death_program_id: Vec<u8>,
    _network: PhantomData<N>,
}

/// A builder struct for the TransactionKernel data type.
#[derive(Derivative)]
#[derivative(Default(bound = "N: Network"), Debug(bound = "N: Network"))]
pub struct TransactionKernelBuilder<N: Network> {
    /// Transaction inputs
    pub(crate) inputs: Vec<TransactionInput<N>>,
    /// Transaction outputs
    pub(crate) outputs: Vec<TransactionOutput<N>>,
    /// Transaction memo
    pub(crate) memo: OnceCell<[u8; 32]>,

    /// Transaction builder errors
    pub(crate) errors: Vec<TransactionError>,
}

impl<N: Network> TransactionKernelBuilder<N> {
    ///
    /// Returns a new record builder.
    /// To return a record and consume the record builder, call the `.build()` method.
    ///
    pub fn new() -> Self {
        Self { ..Default::default() }
    }

    ///
    /// Returns a new transaction builder with the added transaction input.
    /// Otherwise, logs a `TransactionError`.
    ///
    pub fn add_input(mut self, private_key: PrivateKey, record: Record<N>) -> Self {
        // Check that the transaction is limited to `N::Components::NUM_INPUT_RECORDS` inputs.
        if self.inputs.len() > N::Components::NUM_INPUT_RECORDS {
            self.errors.push(TransactionError::InvalidNumberOfInputs(
                self.inputs.len() + 1,
                N::Components::NUM_INPUT_RECORDS,
            ));
        } else {
            // Construct the transaction input.
            self.inputs.push(TransactionInput { private_key, record });
        }
        self
    }

    ///
    /// Returns a new transaction builder with the added transaction output.
    /// Otherwise, logs a `TransactionError`.
    ///
    pub fn add_output(
        mut self,
        recipient: Address,
        amount: u64,
        payload: Payload,
        birth_program_id: Vec<u8>,
        death_program_id: Vec<u8>,
    ) -> Self {
        // Check that the transaction is limited to `N::Components::NUM_OUTPUT_RECORDS` inputs.
        if self.outputs.len() > N::Components::NUM_OUTPUT_RECORDS {
            self.errors.push(TransactionError::InvalidNumberOfOutputs(
                self.outputs.len() + 1,
                N::Components::NUM_OUTPUT_RECORDS,
            ));
        } else {
            // Construct the transaction output.
            let output = TransactionOutput::<N> {
                recipient,
                amount,
                payload,
                birth_program_id,
                death_program_id,
                _network: PhantomData,
            };
            self.outputs.push(output);
        }

        self
    }

    ///
    /// Returns a new transaction builder with the updated network id.
    ///
    pub fn memo(mut self, memo: [u8; 32]) -> Self {
        if let Err(memo) = self.memo.set(memo) {
            self.errors.push(TransactionError::DuplicateArgument(format!(
                "memo: {}",
                hex::encode(&memo[..])
            )))
        }
        self
    }

    ///
    /// Returns the transaction kernel (offline transaction) derived from the provided builder
    /// attributes.
    ///
    /// Otherwise, returns `TransactionError`.
    ///
    pub fn build<R: Rng>(self, rng: &mut R) -> Result<TransactionKernel<N>, TransactionError> {
        // Get network
        let network_id = N::ID;

        // Get memorandum or derive random
        let memo = match self.memo.get() {
            Some(value) => *value,
            None => rng.gen(),
        };

        // Check that the transaction is limited to `Components::NUM_INPUT_RECORDS` inputs.
        match self.inputs.len() {
            1 | 2 => {}
            num_inputs => {
                return Err(TransactionError::InvalidNumberOfInputs(
                    num_inputs,
                    N::Components::NUM_INPUT_RECORDS,
                ));
            }
        }

        // Check that the transaction has at least one output and is limited to `Components::NUM_OUTPUT_RECORDS` outputs.
        match self.outputs.len() {
            0 => return Err(TransactionError::MissingOutputs),
            1 | 2 => {}
            num_inputs => {
                return Err(TransactionError::InvalidNumberOfInputs(
                    num_inputs,
                    N::Components::NUM_INPUT_RECORDS,
                ));
            }
        }

        // Construct the parameters from the given transaction inputs.
        let mut spenders = vec![];
        let mut records_to_spend = vec![];

        for input in self.inputs {
            spenders.push(input.private_key);
            records_to_spend.push(input.record);
        }

        // Construct the parameters from the given transaction outputs.
        let mut recipients = vec![];
        let mut recipient_amounts = vec![];

        for output in &self.outputs {
            recipients.push(output.recipient.clone());
            recipient_amounts.push(output.amount);
        }

        // Construct the transaction kernel
        let parameters = SystemParameters::<N::Components>::load().unwrap();

        let noop_program_snark_parameters = NoopProgramSNARKParameters::<N::Components>::load().unwrap();
        assert!(!spenders.is_empty());
        assert_eq!(spenders.len(), records_to_spend.len());

        assert!(!recipients.is_empty());
        assert_eq!(recipients.len(), recipient_amounts.len());

        let noop_program_id = to_bytes![
            parameters
                .program_verification_key_crh
                .hash(&to_bytes![noop_program_snark_parameters.verification_key]?)?
        ]?;

        // Decode old record data
        let mut old_records = vec![];
        for record in records_to_spend {
            old_records.push(record);
        }

        let mut old_account_private_keys = vec![];
        for private_key in spenders {
            old_account_private_keys.push(private_key);
        }

        // Fill any unused old_record indices with dummy output values
        while old_records.len() < N::Components::NUM_INPUT_RECORDS {
            let sn_randomness: [u8; 32] = rng.gen();
            let old_sn_nonce = parameters.serial_number_nonce.hash(&sn_randomness)?;

            let private_key = PrivateKey::from_str(&old_account_private_keys[0].to_string())?;
            let address = Address::from(&private_key)?;

            // Convert to more generic AccountAddress<N::Components>.
            let address: AccountAddress<N::Components> = FromStr::from_str(&address.address.to_string())?;

            let dummy_record = DPC::<N::Components>::generate_record(
                &parameters,
                old_sn_nonce,
                address,
                true, // The input record is dummy
                0,
                Default::default(),
                noop_program_id.clone(),
                noop_program_id.clone(),
                rng,
            )?;

            old_records.push(Record { record: dummy_record });
            old_account_private_keys.push(private_key);
        }

        assert_eq!(old_records.len(), N::Components::NUM_INPUT_RECORDS);

        // Enforce that the old record addresses correspond with the private keys
        for (private_key, record) in old_account_private_keys.iter().zip(&old_records) {
            let address = Address::from(&private_key)?;

            assert_eq!(address.to_string(), record.owner().to_string());
        }

        assert_eq!(old_records.len(), N::Components::NUM_INPUT_RECORDS);
        assert_eq!(old_account_private_keys.len(), N::Components::NUM_INPUT_RECORDS);

        // Decode new recipient data
        let mut new_record_owners = vec![];
        let mut new_is_dummy_flags = vec![];
        let mut new_values = vec![];
        let mut new_payloads = vec![];
        let mut new_birth_program_ids = vec![];
        let mut new_death_program_ids = vec![];

        for output in &self.outputs {
            new_record_owners.push(output.recipient.clone());
            new_is_dummy_flags.push(false);
            new_values.push(output.amount);
            new_payloads.push(output.payload.clone());
            new_birth_program_ids.push(output.birth_program_id.clone());
            new_death_program_ids.push(output.death_program_id.clone());
        }

        // Fill any unused new_record indices with dummy output values
        while new_record_owners.len() < N::Components::NUM_OUTPUT_RECORDS {
            new_record_owners.push(new_record_owners[0].clone());
            new_is_dummy_flags.push(true);
            new_values.push(0);
            new_payloads.push(Payload::default());
            new_birth_program_ids.push(noop_program_id.clone());
            new_death_program_ids.push(noop_program_id.clone());
        }

        assert_eq!(new_record_owners.len(), N::Components::NUM_OUTPUT_RECORDS);
        assert_eq!(new_is_dummy_flags.len(), N::Components::NUM_OUTPUT_RECORDS);
        assert_eq!(new_values.len(), N::Components::NUM_OUTPUT_RECORDS);

        // Generate transaction

        // Convert old_records to inner DPCRecord<N::Components>
        let old_records = old_records.iter().map(|record| record.record.clone()).collect();

        // Convert to old_account_private_keys to more generic AccountPrivateKey<N::Components>
        let old_account_private_keys = old_account_private_keys
            .iter()
            .map(|key| AccountPrivateKey::<N::Components>::from_str(&key.to_string()))
            .collect::<Result<Vec<AccountPrivateKey<N::Components>>, AccountError>>()?;

        // Convert new_record_owners to more generic AccountAddress<N::Components>
        let new_record_owners = new_record_owners
            .iter()
            .map(|owner| AccountAddress::<N::Components>::from_str(&owner.to_string()))
            .collect::<Result<Vec<AccountAddress<N::Components>>, AccountError>>()?;

        // Offline execution to generate a DPC transaction
        let transaction_kernel = <DPC<N::Components> as DPCScheme<
            EmptyLedger<DPCTransaction<N::Components>, <N::Components as BaseDPCComponents>::MerkleParameters>,
        >>::execute_offline(
            parameters,
            old_records,
            old_account_private_keys,
            new_record_owners,
            &new_is_dummy_flags,
            &new_values,
            new_payloads,
            new_birth_program_ids,
            new_death_program_ids,
            memo,
            network_id,
            rng,
        )?;

        Ok(TransactionKernel(transaction_kernel))
    }
}
