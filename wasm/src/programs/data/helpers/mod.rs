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

pub mod input;
pub use input::input_to_js_value;

pub mod literal;
pub use literal::literal_to_js_value;

pub mod output;
pub use output::output_to_js_value;

pub mod plaintext;
pub use plaintext::{insert_plaintext, plaintext_to_js_value, struct_to_js_object};

pub mod record;
pub use record::record_to_js_object;

pub mod future;
pub use future::future_to_js_value;
