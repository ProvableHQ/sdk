use crate::{
    account::{Address, PrivateKey, ViewKey},
    cli::Command,
};

use anyhow::anyhow;
use colored::*;
use rand::SeedableRng;
use rand_chacha::ChaChaRng;

pub fn parse(command: Command) -> anyhow::Result<String> {
    match command {
        Command::New { seed } => {
            // Sample a new Aleo private key.
            let private_key = match seed {
                Some(seed) => PrivateKey::new(&mut ChaChaRng::seed_from_u64(seed))?,
                None => PrivateKey::new(&mut rand::thread_rng())?,
            };
            let view_key = ViewKey::from(&private_key)?;
            let address = Address::from(&private_key)?;

            // Print the new Aleo account.
            let mut output = format!("\n {:>12}  {}\n", "Private Key".cyan().bold(), private_key);
            output += &format!(" {:>12}  {}\n", "View Key".cyan().bold(), view_key);
            output += &format!(" {:>12}  {}\n", "Address".cyan().bold(), address);

            Ok(output)
        } // _ => Err(anyhow!("\nUnknown command\n")),
    }
}
