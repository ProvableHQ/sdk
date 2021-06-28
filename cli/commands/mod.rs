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

pub mod account;
pub use account::*;

pub mod transaction;
pub use transaction::*;

pub mod update;
pub use update::*;

use structopt::StructOpt;

#[derive(StructOpt, Debug)]
#[structopt(name = "aleo", author = "The Aleo Team <hello@aleo.org>", setting = structopt::clap::AppSettings::ColoredHelp)]
#[allow(clippy::upper_case_acronyms)]
pub struct CLI {
    /// Enable debug mode
    #[structopt(short, long)]
    pub debug: bool,

    /// Enable verbose mode
    #[structopt(short, long, parse(from_occurrences))]
    pub verbose: u8,

    #[structopt(subcommand)]
    pub command: Command,
}

#[derive(StructOpt, Debug)]
pub enum Command {
    #[structopt(name = "account")]
    Account(Account),
    #[structopt(name = "tx")]
    Transaction(Transaction),
    #[structopt(name = "update")]
    Update(Update),
}

impl Command {
    pub fn parse(self) -> anyhow::Result<String> {
        match self {
            Self::Account(command) => command.parse(),
            Self::Transaction(command) => command.parse(),
            Self::Update(command) => command.parse(),
        }
    }
}
