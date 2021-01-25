use std::path::PathBuf;
use structopt::StructOpt;

#[derive(StructOpt, Debug)]
#[structopt(name = "aleo", author = "The Aleo Team <hello@aleo.org>")]
pub struct CLI {
    /// Enable debug mode
    #[structopt(short, long)]
    pub debug: bool,

    /// Verbose mode (-v, -vv, -vvv, etc.)
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
    New,
    // /// Add magical sparkles -- the secret ingredient!
    // Sparkle {
    //     #[structopt(short, parse(from_occurrences))]
    //     magicality: u64,
    //     #[structopt(short)]
    //     color: String
    // },
    // Finish(Finish),
}
