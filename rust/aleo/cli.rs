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

use structopt::StructOpt;

#[derive(StructOpt, Debug)]
#[structopt(name = "aleo", author = "The Aleo Team <hello@aleo.org>", setting = structopt::clap::AppSettings::ColoredHelp)]
pub struct CLI {
    /// Enable debug mode
    #[structopt(short, long)]
    pub debug: bool,

    /// Enable verbose mode
    #[structopt(short, long, parse(from_occurrences))]
    pub verbose: u8,

    #[structopt(subcommand)]
    pub command: Command, // /// Set speed
                          // #[structopt(short, long, default_value = "42")]
                          // speed: f64,
                          //
                          // /// Output file
                          // #[structopt(short, long, parse(from_os_str))]
                          // output: PathBuf,
                          //
                          // // the long option will be translated by default to kebab case,
                          // // i.e. `--nb-cars`.
                          // /// Number of cars
                          // #[structopt(short = "c", long)]
                          // nb_cars: Option<i32>,
                          //
                          // /// admin_level to consider
                          // #[structopt(short, long)]
                          // level: Vec<String>,
                          //
                          // /// Files to process
                          // #[structopt(name = "FILE", parse(from_os_str))]
                          // files: Vec<PathBuf>
}

#[derive(StructOpt, Debug)]
pub enum Command {
    /// Generates a new Aleo account
    New {
        /// Seed the RNG with a numeric value
        #[structopt(short = "s", long)]
        seed: Option<u64>,
    },
    /// Generates a new Aleo record
    NewRecord {},
    /// Update Aleo to the latest version
    Update {
        /// Lists all available versions of Aleo
        #[structopt(short = "l", long)]
        list: bool,

        /// Suppress outputs to terminal
        #[structopt(short = "q", long)]
        quiet: bool,
    },
}
