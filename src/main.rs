use aleo::{
    account::{Address, PrivateKey, ViewKey},
    cli::{Command, CLI},
};

use colored::*;
use structopt::StructOpt;

fn main() -> anyhow::Result<()> {
    let cli = CLI::from_args();

    if cli.debug {
        println!("\n{:#?}\n", cli);
    }

    match cli.command {
        Command::New => {
            let rng = &mut rand::thread_rng();

            let private_key = PrivateKey::new(rng)?;
            let view_key = ViewKey::from(&private_key)?;
            let address = Address::from(&private_key)?;

            println!("\n {:>12}  {}", "Private Key".cyan().bold(), private_key);
            println!(" {:>12}  {}", "View Key".cyan().bold(), view_key);
            println!(" {:>12}  {}\n", "Address".cyan().bold(), address);
        }
    }

    Ok(())
}
