use snarkvm_console::{network::MainnetV0, types::U64};
use snarkvm_ledger_block::{Execution, Input, Output, Transaction, Transition};
#[cfg(all(feature = "mainnet", feature = "testnet"))]
compile_error!("Only one of the `mainnet` or `testnet` features can be enabled at a time.");

#[cfg(feature = "mainnet")]
pub type CurrentNetwork = snarkvm_console::network::MainnetV0;

#[cfg(feature = "testnet")]
pub type CurrentNetwork = snarkvm_console::network::TestnetV0;

#[cfg(feature = "mainnet")]
pub type CurrentAleo = snarkvm_circuit_network::AleoV0;

#[cfg(feature = "testnet")]
pub type CurrentAleo = snarkvm_circuit_network::AleoTestnetV0;

#[cfg(not(any(feature = "mainnet", feature = "testnet")))]
compile_error!("Either the `mainnet` or `testnet` feature must be enabled to select a network.");

// Re-export common types for convenience
pub use snarkvm_console::{
    account::{Address, ComputeKey, GraphKey, PrivateKey, Signature, ViewKey},
    program::{Field, Group},
    types::{Field as FieldElement, Scalar},
};

pub use snarkvm_synthesizer::{Authorization, Process, Program};

// Re-export record and encryption types from definitive SDK pattern
pub use snarkvm_console::program::{Ciphertext, Plaintext, Record};

pub mod plaintext_wrapper;
pub use plaintext_wrapper::PlaintextWrapper;

pub mod native;
pub use native::*;

// Type aliases matching definitive SDK pattern and SnarkVM 4.2.1 compatibility
pub type CiphertextNative = Ciphertext<CurrentNetwork>;
pub type PlaintextNative = Plaintext<CurrentNetwork>;
pub type ProgramNative = Program<CurrentNetwork>;
pub type ExecutionNative = Execution<CurrentNetwork>;
pub type TransactionNative = Transaction<CurrentNetwork>;
pub type TransitionNative = Transition<CurrentNetwork>;
pub type InputNative = Input<CurrentNetwork>;
pub type OutputNative = Output<CurrentNetwork>;
pub type U64Native = U64<CurrentNetwork>;

// Correct Record type definitions for SnarkVM 4.2.1
// Use PlaintextNative for plaintext records (not Private)
pub type RecordCiphertext<N> = Record<N, Ciphertext<N>>;
pub type RecordPlaintext<N> = Record<N, Plaintext<N>>;
pub type RecordCiphertextNative = Record<CurrentNetwork, CiphertextNative>;
pub type RecordPlaintextNative = Record<CurrentNetwork, PlaintextNative>;

// Additional utility types for encryption
// Note: Plaintext is already imported above as part of PlaintextNative
