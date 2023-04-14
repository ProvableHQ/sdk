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

use super::*;

/// Accessor trait for all requests that send transactions to the Aleo Network. This trait is allows
/// generalized handling of requests
pub(crate) trait TransactionRequest<N: Network>: Send + Sync {
    /// Get the amount of a transfer
    fn amount(&self) -> Option<u64> {
        None
    }

    /// Get the record to fund a transfer if provided in the request
    fn amount_record(&mut self) -> Option<Record<N, Plaintext<N>>> {
        None
    }

    /// Get the fee specified for a transaction
    fn fee(&self) -> u64;

    /// Get the record to pay a fee if provided in the request
    fn fee_record(&mut self) -> Option<Record<N, Plaintext<N>>>;

    /// Get the inputs for a program function execution
    fn inputs(&mut self) -> Option<Vec<String>> {
        None
    }

    /// Get the password to decrypt the private key ciphertext if it is stored on the server
    fn password(&mut self) -> Option<String>;

    /// Get the optional peer url to send the transaction to
    fn peer_url(&mut self) -> Option<String>;

    /// Get the private key from the request
    fn private_key(&mut self) -> Option<PrivateKey<N>>;

    /// Get the program associated with a deployment
    fn program(&self) -> Option<Program<N>> {
        None
    }

    /// Get the program id associated with a program function execution or program deployment
    fn program_id(&self) -> Option<ProgramID<N>> {
        None
    }

    /// Get the program function associated with a program function execution
    fn program_function(&mut self) -> Option<Identifier<N>> {
        None
    }

    /// Get the recipient address of a transfer
    fn recipient(&mut self) -> Option<Address<N>> {
        None
    }

    /// Get the type of request
    fn transaction_type(&self) -> &'static str;
}
