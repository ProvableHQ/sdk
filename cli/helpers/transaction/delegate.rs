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
use aleo_network::Network;
use aleo_transaction::{Transaction, TransactionKernel};

use snarkvm_algorithms::{
    merkle_tree::{MerklePath, MerkleTreeDigest},
    CommitmentScheme,
    SignatureScheme,
};
use snarkvm_dpc::{
    testnet1::{BaseDPCComponents, PrivateProgramInput, Transaction as DPCTransaction},
    traits::DPCComponents,
    LedgerScheme,
};

use rand::{CryptoRng, Rng};

/// Delegated execution of program proof generation and transaction online phase.
pub fn delegate_transaction<R: Rng + CryptoRng, N: Network, L: LedgerScheme>(
    transaction_kernel: TransactionKernel<N>,
    ledger: &L,
    old_death_program_proofs: Vec<PrivateProgramInput>,
    new_birth_program_proofs: Vec<PrivateProgramInput>,
    rng: &mut R,
) -> anyhow::Result<Transaction<N>>
where
    L: LedgerScheme<
        Commitment = <<<N as Network>::Components as DPCComponents>::RecordCommitment as CommitmentScheme>::Output,
        MerkleParameters = <<N as Network>::Components as BaseDPCComponents>::MerkleParameters,
        MerklePath = MerklePath<<<N as Network>::Components as BaseDPCComponents>::MerkleParameters>,
        MerkleTreeDigest = MerkleTreeDigest<<<N as Network>::Components as BaseDPCComponents>::MerkleParameters>,
        SerialNumber = <<<N as Network>::Components as DPCComponents>::AccountSignature as SignatureScheme>::PublicKey,
        Transaction = DPCTransaction<<N as Network>::Components>,
    >,
{
    let transaction = Transaction::<N>::new()
        .transaction_kernel(transaction_kernel)
        .add_old_death_program_proofs(old_death_program_proofs)
        .add_new_birth_program_proofs(new_birth_program_proofs)
        .build(ledger, rng)?;

    Ok(transaction)
}
