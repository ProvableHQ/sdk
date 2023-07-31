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

mod account;
pub use account::*;

mod build;
pub use build::*;

mod clean;
pub use clean::*;

mod deploy;
pub use deploy::*;

mod execute;
pub use execute::*;

mod new;
pub use new::*;

// mod node;
// pub use node::*;

mod run;
pub use run::*;

mod transfer;
pub use transfer::*;

mod update;
pub use update::*;

use anyhow::Result;
use clap::Parser;

#[derive(Debug, Parser)]
#[clap(name = "aleo", author = "The Aleo Team <hello@aleo.org>")]
pub struct CLI {
    /// Specify the verbosity [options: 0, 1, 2, 3]
    #[clap(default_value = "2", short, long)]
    pub verbosity: u8,
    /// Specify a subcommand.
    #[clap(subcommand)]
    pub command: Command,
}

#[derive(Debug, Parser)]
pub enum Command {
    #[clap(subcommand)]
    Account(Account),
    #[clap(name = "build")]
    Build(Build),
    #[clap(name = "clean")]
    Clean(Clean),
    #[clap(name = "deploy")]
    Deploy(Deploy),
    #[clap(name = "execute")]
    Execute(Execute),
    #[clap(name = "new")]
    New(New),
    #[clap(name = "run")]
    Run(Run),
    #[clap(name = "transfer")]
    Transfer(Transfer),
    #[clap(name = "update")]
    Update(Update),
}

impl Command {
    /// Parses the command.
    pub fn parse(self) -> Result<String> {
        match self {
            Self::Account(command) => command.parse(),
            Self::Build(command) => command.parse(),
            Self::Clean(command) => command.parse(),
            Self::Deploy(command) => command.parse(),
            Self::Execute(command) => command.parse(),
            Self::New(command) => command.parse(),
            // Self::Node(command) => command.parse(),
            Self::Run(command) => command.parse(),
            Self::Transfer(command) => command.parse(),
            Self::Update(command) => command.parse(),
        }
    }
}
