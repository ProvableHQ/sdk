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

pub use snarkvm_dpc::AccountScheme;
use snarkvm_dpc::{
    network::testnet2::Testnet2,
    Account as AleoAccount,
    Address as AleoAddress,
    PrivateKey as AleoPrivateKey,
    ViewKey as AleoViewKey,
};

pub type Account = AleoAccount<Testnet2>;
pub type Address = AleoAddress<Testnet2>;
pub type PrivateKey = AleoPrivateKey<Testnet2>;
pub type ViewKey = AleoViewKey<Testnet2>;
