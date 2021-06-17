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

use aleo::{cli::CLI, commands::parse, updater::Updater};

use structopt::StructOpt;

fn main() -> anyhow::Result<()> {
    let cli = CLI::from_args();

    if cli.debug {
        println!("\n{:#?}\n", cli);
    }

    println!("{}", Updater::print_cli());

    println!("{}", parse(cli.command)?);

    Ok(())
}

// use structopt::StructOpt;
//
// #[derive(Debug, StructOpt)]
// pub struct Bar {
//     pub bar: Option<String>,
// }
//
// #[derive(Debug, StructOpt)]
// pub enum Foo {
//     #[structopt(name = "bar")]
//     Bar(Bar),
// }
//
// #[derive(Debug, StructOpt)]
// pub enum Command {
//     #[structopt(name = "foo")]
//     Foo(Foo),
// }
//
// #[derive(Debug, StructOpt)]
// #[structopt(name = "classify")]
// pub struct ApplicationArguments {
//     #[structopt(subcommand)]
//     pub command: Command,
// }
//
// fn main() {
//     let opt = ApplicationArguments::from_args();
//     println!("{:?}", opt);
// }
