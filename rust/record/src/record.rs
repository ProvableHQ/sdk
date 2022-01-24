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

pub use snarkvm_wasm::{
    network::testnet2::Testnet2,
    AleoAmount,
    Ciphertext as AleoCiphertext,
    DecryptionKey as AleoDecryptionKey,
    Network,
    Payload as AleoPayload,
    Record as AleoRecord,
};

pub type Record = AleoRecord<Testnet2>;
pub type RecordCiphertext = <Testnet2 as Network>::RecordCiphertext;
pub type RecordViewKey = <Testnet2 as Network>::RecordViewKey;
pub type Ciphertext = AleoCiphertext<Testnet2>;
pub type DecryptionKey = AleoDecryptionKey<Testnet2>;
pub type Payload = AleoPayload<Testnet2>;
