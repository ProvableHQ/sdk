use aleo::cli::CLI;

use structopt::StructOpt;

fn main() {
    let cli = CLI::from_args();
    println!("{:#?}", cli);
}
