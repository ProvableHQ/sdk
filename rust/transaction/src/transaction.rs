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

use crate::{EmptyLedger, TransactionBuilder, TransactionError, TransactionKernel};
use aleo_account::{Address, PrivateKey};
use aleo_network::Network;
use aleo_record::Record;

use snarkvm_algorithms::{merkle_tree::MerkleTreeDigest, CommitmentScheme, MerkleParameters, SignatureScheme, CRH};
use snarkvm_dpc::{
    testnet1::{
        payload::Payload,
        transaction::AleoAmount,
        BaseDPCComponents,
        EncryptedRecord,
        NoopProgram,
        PublicParameters,
        Transaction as DPCTransaction,
        TransactionKernel as DPCTransactionKernel,
        DPC,
    },
    AccountAddress,
    AccountPrivateKey,
    DPCComponents,
    DPCScheme,
    LedgerScheme,
    ProgramScheme,
    RecordScheme,
    TransactionError as DPCTransactionError,
    TransactionScheme,
};
use snarkvm_parameters::{testnet1::GenesisBlock, Genesis, LedgerMerkleTreeParameters, Parameter};
use snarkvm_utilities::{to_bytes, FromBytes, ToBytes};

use rand::{CryptoRng, Rng};
use std::{
    io::{Read, Result as IoResult, Write},
    str::FromStr,
    sync::Arc,
};

/// Stores transaction data that is computed online - with on-chain data.
/// To compute a transaction offline, see `TransactionKernel`.
#[derive(Derivative)]
#[derivative(
    Clone(bound = "N: Network"),
    PartialEq(bound = "N: Network"),
    Eq(bound = "N: Network")
)]
pub struct Transaction<N: Network> {
    pub(crate) transaction: DPCTransaction<N::Components>,
}

impl<N: Network> Transaction<N> {
    ///
    /// Returns a new transaction builder.
    ///
    #[allow(clippy::new_ret_no_self)]
    pub fn new() -> TransactionBuilder<N> {
        TransactionBuilder { ..Default::default() }
    }

    ///
    /// Returns a new transaction from the given TransactionKernel.
    ///
    pub fn from<R: Rng + CryptoRng>(
        parameters: Option<PublicParameters<<N as Network>::Components>>,
        transaction_kernel: TransactionKernel<N>,
        rng: &mut R,
    ) -> Result<Self, TransactionError> {
        // Load public parameters if they are not provided
        let parameters = match parameters {
            Some(parameters) => parameters,
            None => PublicParameters::<N::Components>::load(false)?,
        };

        // Delegate online phase of transaction generation
        let random_path: u16 = rng.gen();

        let mut path = std::env::current_dir()?;
        path.push(format!("storage_db_{}", random_path));

        // Load ledger parameters from snarkvm-parameters
        let crh_parameters =
            <<<<N as Network>::Components as BaseDPCComponents>::MerkleParameters as MerkleParameters>::H as CRH>::Parameters::read(&LedgerMerkleTreeParameters::load_bytes().unwrap()[..]).unwrap();
        let merkle_tree_hash_parameters =
            <<N::Components as BaseDPCComponents>::MerkleParameters as MerkleParameters>::H::from(crh_parameters);
        let ledger_parameters = Arc::new(From::from(merkle_tree_hash_parameters));

        // Load genesis block
        let genesis_block = FromBytes::read(GenesisBlock::load_bytes().as_slice())?;

        // todo (collin) Deprecate EmptyLedger, set ledger as an argument to the function.
        let ledger = EmptyLedger::<
            DPCTransaction<N::Components>,
            <N::Components as BaseDPCComponents>::MerkleParameters,
        >::new(Some(&path), ledger_parameters, genesis_block)?;

        let transaction =
            Self::delegate_transaction(Some(parameters), transaction_kernel.transaction_kernel, &ledger, rng)?;

        drop(ledger);

        Ok(transaction)
    }

    ///
    /// Returns a transaction constructed with dummy records.
    ///
    pub fn new_dummy<R: Rng + CryptoRng>(network_id: u8, rng: &mut R) -> Result<Self, TransactionError> {
        let parameters = PublicParameters::<N::Components>::load(false)?;

        // Create dummy spender
        let spender = AccountPrivateKey::<N::Components>::new(
            &parameters.system_parameters.account_signature,
            &parameters.system_parameters.account_commitment,
            rng,
        )?;
        let private_key = PrivateKey::from_str(&spender.to_string())?;

        // Create dummy input record

        let sn_randomness: [u8; 32] = rng.gen();
        let old_sn_nonce = parameters.system_parameters.serial_number_nonce.hash(&sn_randomness)?;

        let address = AccountAddress::<N::Components>::from_private_key(
            parameters.account_signature_parameters(),
            parameters.account_commitment_parameters(),
            parameters.account_encryption_parameters(),
            &spender,
        )?;

        let noop_program_id = to_bytes![
            parameters
                .system_parameters
                .program_verification_key_crh
                .hash(&to_bytes![parameters.noop_program_snark_parameters.verification_key]?)?
        ]?;

        let dummy_record = DPC::<N::Components>::generate_record(
            &parameters.system_parameters,
            old_sn_nonce,
            address,
            true,
            0,
            Payload::default(),
            noop_program_id.clone(),
            noop_program_id.clone(),
            rng,
        )?;
        let record = Record::<N> { record: dummy_record };

        // Create dummy recipient
        let new_recipient_private_key = PrivateKey::new(rng)?;
        let new_recipient = Address::from(&new_recipient_private_key)?;

        // Create dummy amount
        let amount = 0;

        // Create payload: 0
        let payload = Payload::default();

        // Build transaction_kernel
        let transaction_kernel = TransactionKernel::new()
            .add_input(private_key, record)
            .add_output(
                new_recipient,
                amount,
                payload,
                noop_program_id.clone(),
                noop_program_id.clone(),
            )
            .network_id(network_id)
            .build(rng)?;

        // Delegate online phase of transaction generation
        Self::from(Some(parameters), transaction_kernel, rng)
    }

    ///
    /// Delegated execution of program proof generation and transaction online phase.
    ///
    pub fn delegate_transaction<R: Rng>(
        parameters: Option<PublicParameters<<N as Network>::Components>>,
        transaction_kernel: DPCTransactionKernel<N::Components>,
        ledger: &EmptyLedger<DPCTransaction<N::Components>, <N::Components as BaseDPCComponents>::MerkleParameters>,
        rng: &mut R,
    ) -> Result<Self, TransactionError> {
        // Load public parameters if they are not provided
        let parameters = match parameters {
            Some(parameters) => parameters,
            None => PublicParameters::<N::Components>::load(false)?,
        };

        let local_data = transaction_kernel.into_local_data();

        // Enforce that the record programs are the noop program
        // TODO (add support for arbitrary programs)

        let noop_program_id = to_bytes![
            parameters
                .system_parameters
                .program_verification_key_crh
                .hash(&to_bytes![parameters.noop_program_snark_parameters.verification_key]?)?
        ]?;

        for old_record in &local_data.old_records {
            assert_eq!(old_record.death_program_id().to_vec(), noop_program_id);
        }

        for new_record in &local_data.new_records {
            assert_eq!(new_record.birth_program_id().to_vec(), noop_program_id);
        }

        // Generate the program proofs

        let noop_program =
            NoopProgram::<_, <N::Components as BaseDPCComponents>::NoopProgramSNARK>::new(noop_program_id);

        let mut old_death_program_proofs = Vec::new();
        for i in 0..N::Components::NUM_INPUT_RECORDS {
            let private_input = noop_program.execute(
                &parameters.noop_program_snark_parameters.proving_key,
                &parameters.noop_program_snark_parameters.verification_key,
                &local_data,
                i as u8,
                rng,
            )?;

            old_death_program_proofs.push(private_input);
        }

        let mut new_birth_program_proofs = Vec::new();
        for j in 0..N::Components::NUM_OUTPUT_RECORDS {
            let private_input = noop_program.execute(
                &parameters.noop_program_snark_parameters.proving_key,
                &parameters.noop_program_snark_parameters.verification_key,
                &local_data,
                (N::Components::NUM_INPUT_RECORDS + j) as u8,
                rng,
            )?;

            new_birth_program_proofs.push(private_input);
        }

        // Online execution to generate a DPC transaction

        let (_new_records, transaction) = DPC::<N::Components>::execute_online(
            &parameters,
            transaction_kernel,
            old_death_program_proofs,
            new_birth_program_proofs,
            ledger,
            rng,
        )?;

        Transaction::new()
            .network(transaction.network)
            .ledger_digest(transaction.ledger_digest)
            .old_serial_numbers(transaction.old_serial_numbers)
            .new_commitments(transaction.new_commitments)
            .program_commitment(transaction.program_commitment)
            .local_data_root(transaction.local_data_root)
            .value_balance(transaction.value_balance)
            .signatures(transaction.signatures)
            .encrypted_records(transaction.encrypted_records)
            .transaction_proof(transaction.transaction_proof)
            .memorandum(transaction.memorandum)
            .inner_circuit_id(transaction.inner_circuit_id)
            .build()
    }
}

impl<N: Network> TransactionScheme for Transaction<N> {
    type Commitment = <<N::Components as DPCComponents>::RecordCommitment as CommitmentScheme>::Output;
    type Digest = MerkleTreeDigest<<N::Components as BaseDPCComponents>::MerkleParameters>;
    type EncryptedRecord = EncryptedRecord<N::Components>;
    type InnerCircuitID = <<N::Components as DPCComponents>::InnerCircuitIDCRH as CRH>::Output;
    type LocalDataRoot = <<N::Components as DPCComponents>::LocalDataCRH as CRH>::Output;
    // todo: make this type part of components in snarkvm_dpc
    type Memorandum = [u8; 32];
    type ProgramCommitment =
        <<N::Components as DPCComponents>::ProgramVerificationKeyCommitment as CommitmentScheme>::Output;
    type SerialNumber = <<N::Components as DPCComponents>::AccountSignature as SignatureScheme>::PublicKey;
    // todo: make this type part of components in snarkvm_dpc
    type ValueBalance = AleoAmount;

    fn transaction_id(&self) -> Result<[u8; 32], DPCTransactionError> {
        self.transaction.transaction_id()
    }

    fn network_id(&self) -> u8 {
        self.transaction.network_id()
    }

    fn ledger_digest(&self) -> &Self::Digest {
        self.transaction.ledger_digest()
    }

    fn inner_circuit_id(&self) -> &Self::InnerCircuitID {
        self.transaction.inner_circuit_id()
    }

    fn old_serial_numbers(&self) -> &[Self::SerialNumber] {
        self.transaction.old_serial_numbers()
    }

    fn new_commitments(&self) -> &[Self::Commitment] {
        self.transaction.new_commitments()
    }

    fn program_commitment(&self) -> &Self::ProgramCommitment {
        self.transaction.program_commitment()
    }

    fn local_data_root(&self) -> &Self::LocalDataRoot {
        self.transaction.local_data_root()
    }

    fn value_balance(&self) -> Self::ValueBalance {
        self.transaction.value_balance()
    }

    fn encrypted_records(&self) -> &[Self::EncryptedRecord] {
        self.transaction.encrypted_records()
    }

    fn memorandum(&self) -> &Self::Memorandum {
        self.transaction.memorandum()
    }

    fn size(&self) -> usize {
        self.transaction.size()
    }
}

impl<N: Network> ToBytes for Transaction<N> {
    #[inline]
    fn write<W: Write>(&self, mut writer: W) -> IoResult<()> {
        self.transaction.write(&mut writer)
    }
}

impl<N: Network> FromBytes for Transaction<N> {
    #[inline]
    fn read<R: Read>(mut reader: R) -> IoResult<Self> {
        Ok(Self {
            transaction: FromBytes::read(&mut reader)?,
        })
    }
}
