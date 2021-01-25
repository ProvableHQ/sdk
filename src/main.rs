use aleo::{
    cli::{Command, CLI},
    commands::parse,
};

use structopt::StructOpt;

fn main() -> anyhow::Result<()> {
    let cli = CLI::from_args();

    if cli.debug {
        println!("\n{:#?}\n", cli);
    }

    println!("{}", parse(cli.command)?);

    Ok(())
}
