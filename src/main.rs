use aleo::{
    cli::{CLI, Command},
    private_key::PrivateKey,
    view_key::ViewKey,
};

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

            println!("\n  Generated a new Aleo account\n");
            println!("\tPrivate Key - {}", private_key);
            println!("\tView Key - {}", view_key);
            println!("");
        }
    }

    Ok(())
}
