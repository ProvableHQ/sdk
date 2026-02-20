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

// `Console` is the network-agnostic environment that implements the BLS12-377 / Edwards BLS12
// curve constants. Both MainnetV0 and TestnetV0 share the same underlying curve and Poseidon
// parameters, so `Console` is sufficient for all address serialization operations.
pub use snarkvm_console::network::Console;

pub type AddressNative = snarkvm_console::account::Address<Console>;
pub type FieldNative = snarkvm_console::types::Field<Console>;
pub type GroupNative = snarkvm_console::types::Group<Console>;
