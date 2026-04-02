use std::str::FromStr;

use crate::{
    ffi,
    string_error_result, string_success_result, string_vec_error_result, string_vec_success_result,
};

use snarkvm_console::algorithms::{
    Hash, HashMany, HashToGroup, HashToScalar, Pedersen128, Pedersen64, Poseidon2, Poseidon4,
    Poseidon8, BHP1024, BHP256, BHP512, BHP768,
};
use snarkvm_console::network::{MainnetV0, TestnetV0};
use snarkvm_console::prelude::{Commit, CommitUncompressed, HashUncompressed};
use snarkvm_console::types::{Field, Scalar};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ActiveNetwork {
    Mainnet,
    Testnet,
}

impl ActiveNetwork {
    fn as_str(self) -> &'static str {
        match self {
            ActiveNetwork::Mainnet => "mainnet",
            ActiveNetwork::Testnet => "testnet",
        }
    }
}

// --- Feature-gated network selection (mutually exclusive) ---
#[cfg(all(feature = "mainnet", feature = "testnet"))]
compile_error!("features 'mainnet' and 'testnet' are mutually exclusive");

#[cfg(feature = "mainnet")]
pub const ACTIVE_NETWORK: ActiveNetwork = ActiveNetwork::Mainnet;
#[cfg(feature = "testnet")]
pub const ACTIVE_NETWORK: ActiveNetwork = ActiveNetwork::Testnet;


impl Default for ActiveNetwork {
    fn default() -> Self {
        ActiveNetwork::Mainnet
    }
}

pub fn current_active_network() -> ActiveNetwork {
    return ACTIVE_NETWORK;
}

fn bits_from_vec(bits: Vec<u8>) -> Result<Vec<bool>, String> {
    bits.into_iter()
        .map(|b| match b {
            0 => Ok(false),
            1 => Ok(true),
            _ => Err(format!("Invalid bit value: {b}")),
        })
        .collect()
}

fn scalar_from_string<N: snarkvm_console::network::Network>(
    value: &str,
) -> Result<Scalar<N>, String> {
    Scalar::<N>::from_str(value).map_err(|e| e.to_string())
}

fn fields_from_strings<N: snarkvm_console::network::Network>(
    fields: Vec<String>,
) -> Result<Vec<Field<N>>, String> {
    fields
        .into_iter()
        .map(|field| Field::<N>::from_str(&field).map_err(|e| e.to_string()))
        .collect()
}
macro_rules! generate_bhp_functions {
    ($hash_fn:ident, $hash_to_group_fn:ident, $commit_fn:ident, $commit_to_group_fn:ident, $type:ident, $domain:expr) => {
        pub fn $hash_fn(bits: Vec<u8>) -> ffi::StringResult {
            let bits = match bits_from_vec(bits) {
                Ok(bits) => bits,
                Err(err) => return string_error_result(err),
            };

            let result = match current_active_network() {
                ActiveNetwork::Mainnet => match $type::<MainnetV0>::setup($domain) {
                    Ok(hasher) => hasher
                        .hash(&bits)
                        .map(|field| field.to_string())
                        .map_err(|e| e.to_string()),
                    Err(err) => Err(err.to_string()),
                },
                ActiveNetwork::Testnet => match $type::<TestnetV0>::setup($domain) {
                    Ok(hasher) => hasher
                        .hash(&bits)
                        .map(|field| field.to_string())
                        .map_err(|e| e.to_string()),
                    Err(err) => Err(err.to_string()),
                },
            };

            match result {
                Ok(value) => string_success_result(value),
                Err(err) => string_error_result(err),
            }
        }

        pub fn $hash_to_group_fn(bits: Vec<u8>) -> ffi::StringResult {
            let bits = match bits_from_vec(bits) {
                Ok(bits) => bits,
                Err(err) => return string_error_result(err),
            };

            let result = match current_active_network() {
                ActiveNetwork::Mainnet => match $type::<MainnetV0>::setup($domain) {
                    Ok(hasher) => hasher
                        .hash_uncompressed(&bits)
                        .map(|group| group.to_string())
                        .map_err(|e| e.to_string()),
                    Err(err) => Err(err.to_string()),
                },
                ActiveNetwork::Testnet => match $type::<TestnetV0>::setup($domain) {
                    Ok(hasher) => hasher
                        .hash_uncompressed(&bits)
                        .map(|group| group.to_string())
                        .map_err(|e| e.to_string()),
                    Err(err) => Err(err.to_string()),
                },
            };

            match result {
                Ok(value) => string_success_result(value),
                Err(err) => string_error_result(err),
            }
        }

        pub fn $commit_fn(bits: Vec<u8>, scalar: String) -> ffi::StringResult {
            let bits = match bits_from_vec(bits) {
                Ok(bits) => bits,
                Err(err) => return string_error_result(err),
            };

            let result =
                match current_active_network() {
                    ActiveNetwork::Mainnet => scalar_from_string::<MainnetV0>(&scalar).and_then(
                        |randomizer| match $type::<MainnetV0>::setup($domain) {
                            Ok(hasher) => hasher
                                .commit(&bits, &randomizer)
                                .map(|field| field.to_string())
                                .map_err(|e| e.to_string()),
                            Err(err) => Err(err.to_string()),
                        },
                    ),
                    ActiveNetwork::Testnet => scalar_from_string::<TestnetV0>(&scalar).and_then(
                        |randomizer| match $type::<TestnetV0>::setup($domain) {
                            Ok(hasher) => hasher
                                .commit(&bits, &randomizer)
                                .map(|field| field.to_string())
                                .map_err(|e| e.to_string()),
                            Err(err) => Err(err.to_string()),
                        },
                    ),
                };

            match result {
                Ok(value) => string_success_result(value),
                Err(err) => string_error_result(err),
            }
        }

        pub fn $commit_to_group_fn(bits: Vec<u8>, scalar: String) -> ffi::StringResult {
            let bits = match bits_from_vec(bits) {
                Ok(bits) => bits,
                Err(err) => return string_error_result(err),
            };

            let result =
                match current_active_network() {
                    ActiveNetwork::Mainnet => scalar_from_string::<MainnetV0>(&scalar).and_then(
                        |randomizer| match $type::<MainnetV0>::setup($domain) {
                            Ok(hasher) => hasher
                                .commit_uncompressed(&bits, &randomizer)
                                .map(|group| group.to_string())
                                .map_err(|e| e.to_string()),
                            Err(err) => Err(err.to_string()),
                        },
                    ),
                    ActiveNetwork::Testnet => scalar_from_string::<TestnetV0>(&scalar).and_then(
                        |randomizer| match $type::<TestnetV0>::setup($domain) {
                            Ok(hasher) => hasher
                                .commit_uncompressed(&bits, &randomizer)
                                .map(|group| group.to_string())
                                .map_err(|e| e.to_string()),
                            Err(err) => Err(err.to_string()),
                        },
                    ),
                };

            match result {
                Ok(value) => string_success_result(value),
                Err(err) => string_error_result(err),
            }
        }
    };
}

generate_bhp_functions!(
    bhp256_hash,
    bhp256_hash_to_group,
    bhp256_commit,
    bhp256_commit_to_group,
    BHP256,
    "AleoBHP256"
);
generate_bhp_functions!(
    bhp512_hash,
    bhp512_hash_to_group,
    bhp512_commit,
    bhp512_commit_to_group,
    BHP512,
    "AleoBHP512"
);
generate_bhp_functions!(
    bhp768_hash,
    bhp768_hash_to_group,
    bhp768_commit,
    bhp768_commit_to_group,
    BHP768,
    "AleoBHP768"
);
generate_bhp_functions!(
    bhp1024_hash,
    bhp1024_hash_to_group,
    bhp1024_commit,
    bhp1024_commit_to_group,
    BHP1024,
    "AleoBHP1024"
);

macro_rules! generate_pedersen_functions {
    ($hash_fn:ident, $commit_fn:ident, $commit_to_group_fn:ident, $type:ident, $domain:expr) => {
        pub fn $hash_fn(bits: Vec<u8>) -> ffi::StringResult {
            let bits = match bits_from_vec(bits) {
                Ok(bits) => bits,
                Err(err) => return string_error_result(err),
            };

            let result = match current_active_network() {
                ActiveNetwork::Mainnet => {
                    let hasher = $type::<MainnetV0>::setup($domain);
                    hasher
                        .hash(&bits)
                        .map(|field| field.to_string())
                        .map_err(|e| e.to_string())
                }
                ActiveNetwork::Testnet => {
                    let hasher = $type::<TestnetV0>::setup($domain);
                    hasher
                        .hash(&bits)
                        .map(|field| field.to_string())
                        .map_err(|e| e.to_string())
                }
            };

            match result {
                Ok(value) => string_success_result(value),
                Err(err) => string_error_result(err),
            }
        }

        pub fn $commit_fn(bits: Vec<u8>, scalar: String) -> ffi::StringResult {
            let bits = match bits_from_vec(bits) {
                Ok(bits) => bits,
                Err(err) => return string_error_result(err),
            };

            let result = match current_active_network() {
                ActiveNetwork::Mainnet => {
                    scalar_from_string::<MainnetV0>(&scalar).and_then(|randomizer| {
                        let hasher = $type::<MainnetV0>::setup($domain);
                        hasher
                            .commit(&bits, &randomizer)
                            .map(|field| field.to_string())
                            .map_err(|e| e.to_string())
                    })
                }
                ActiveNetwork::Testnet => {
                    scalar_from_string::<TestnetV0>(&scalar).and_then(|randomizer| {
                        let hasher = $type::<TestnetV0>::setup($domain);
                        hasher
                            .commit(&bits, &randomizer)
                            .map(|field| field.to_string())
                            .map_err(|e| e.to_string())
                    })
                }
            };

            match result {
                Ok(value) => string_success_result(value),
                Err(err) => string_error_result(err),
            }
        }

        pub fn $commit_to_group_fn(bits: Vec<u8>, scalar: String) -> ffi::StringResult {
            let bits = match bits_from_vec(bits) {
                Ok(bits) => bits,
                Err(err) => return string_error_result(err),
            };

            let result = match current_active_network() {
                ActiveNetwork::Mainnet => {
                    scalar_from_string::<MainnetV0>(&scalar).and_then(|randomizer| {
                        let hasher = $type::<MainnetV0>::setup($domain);
                        hasher
                            .commit_uncompressed(&bits, &randomizer)
                            .map(|group| group.to_string())
                            .map_err(|e| e.to_string())
                    })
                }
                ActiveNetwork::Testnet => {
                    scalar_from_string::<TestnetV0>(&scalar).and_then(|randomizer| {
                        let hasher = $type::<TestnetV0>::setup($domain);
                        hasher
                            .commit_uncompressed(&bits, &randomizer)
                            .map(|group| group.to_string())
                            .map_err(|e| e.to_string())
                    })
                }
            };

            match result {
                Ok(value) => string_success_result(value),
                Err(err) => string_error_result(err),
            }
        }
    };
}

generate_pedersen_functions!(
    pedersen64_hash,
    pedersen64_commit,
    pedersen64_commit_to_group,
    Pedersen64,
    "AleoPedersen64"
);
generate_pedersen_functions!(
    pedersen128_hash,
    pedersen128_commit,
    pedersen128_commit_to_group,
    Pedersen128,
    "AleoPedersen128"
);

macro_rules! generate_poseidon_functions {
    ($hash_fn:ident, $hash_to_scalar_fn:ident, $hash_to_group_fn:ident, $hash_many_fn:ident, $type:ident, $domain:expr) => {
        pub fn $hash_fn(fields: Vec<String>) -> ffi::StringResult {
            let result = match (current_active_network(), fields) {
                (ActiveNetwork::Mainnet, values) => fields_from_strings::<MainnetV0>(values)
                    .and_then(|parsed| {
                        $type::<MainnetV0>::setup($domain)
                            .map_err(|e| e.to_string())
                            .and_then(|hasher| {
                                hasher
                                    .hash(&parsed)
                                    .map(|field| field.to_string())
                                    .map_err(|e| e.to_string())
                            })
                    }),
                (ActiveNetwork::Testnet, values) => fields_from_strings::<TestnetV0>(values)
                    .and_then(|parsed| {
                        $type::<TestnetV0>::setup($domain)
                            .map_err(|e| e.to_string())
                            .and_then(|hasher| {
                                hasher
                                    .hash(&parsed)
                                    .map(|field| field.to_string())
                                    .map_err(|e| e.to_string())
                            })
                    }),
            };

            match result {
                Ok(value) => string_success_result(value),
                Err(err) => string_error_result(err),
            }
        }

        pub fn $hash_to_scalar_fn(fields: Vec<String>) -> ffi::StringResult {
            let result = match (current_active_network(), fields) {
                (ActiveNetwork::Mainnet, values) => fields_from_strings::<MainnetV0>(values)
                    .and_then(|parsed| {
                        $type::<MainnetV0>::setup($domain)
                            .map_err(|e| e.to_string())
                            .and_then(|hasher| {
                                hasher
                                    .hash_to_scalar(&parsed)
                                    .map(|scalar| scalar.to_string())
                                    .map_err(|e| e.to_string())
                            })
                    }),
                (ActiveNetwork::Testnet, values) => fields_from_strings::<TestnetV0>(values)
                    .and_then(|parsed| {
                        $type::<TestnetV0>::setup($domain)
                            .map_err(|e| e.to_string())
                            .and_then(|hasher| {
                                hasher
                                    .hash_to_scalar(&parsed)
                                    .map(|scalar| scalar.to_string())
                                    .map_err(|e| e.to_string())
                            })
                    }),
            };

            match result {
                Ok(value) => string_success_result(value),
                Err(err) => string_error_result(err),
            }
        }

        pub fn $hash_to_group_fn(fields: Vec<String>) -> ffi::StringResult {
            let result = match (current_active_network(), fields) {
                (ActiveNetwork::Mainnet, values) => fields_from_strings::<MainnetV0>(values)
                    .and_then(|parsed| {
                        $type::<MainnetV0>::setup($domain)
                            .map_err(|e| e.to_string())
                            .and_then(|hasher| {
                                hasher
                                    .hash_to_group(&parsed)
                                    .map(|group| group.to_string())
                                    .map_err(|e| e.to_string())
                            })
                    }),
                (ActiveNetwork::Testnet, values) => fields_from_strings::<TestnetV0>(values)
                    .and_then(|parsed| {
                        $type::<TestnetV0>::setup($domain)
                            .map_err(|e| e.to_string())
                            .and_then(|hasher| {
                                hasher
                                    .hash_to_group(&parsed)
                                    .map(|group| group.to_string())
                                    .map_err(|e| e.to_string())
                            })
                    }),
            };

            match result {
                Ok(value) => string_success_result(value),
                Err(err) => string_error_result(err),
            }
        }

        pub fn $hash_many_fn(fields: Vec<String>, rate: u32) -> ffi::StringVecResult {
            let result = match (current_active_network(), fields) {
                (ActiveNetwork::Mainnet, values) => fields_from_strings::<MainnetV0>(values)
                    .and_then(|parsed| {
                        $type::<MainnetV0>::setup($domain)
                            .map_err(|e| e.to_string())
                            .and_then(|hasher| {
                                let outputs = hasher.hash_many(&parsed, rate as u16);
                                Ok(outputs
                                    .into_iter()
                                    .map(|field| field.to_string())
                                    .collect::<Vec<String>>())
                            })
                    }),
                (ActiveNetwork::Testnet, values) => fields_from_strings::<TestnetV0>(values)
                    .and_then(|parsed| {
                        $type::<TestnetV0>::setup($domain)
                            .map_err(|e| e.to_string())
                            .and_then(|hasher| {
                                let outputs = hasher.hash_many(&parsed, rate as u16);
                                Ok(outputs
                                    .into_iter()
                                    .map(|field| field.to_string())
                                    .collect::<Vec<String>>())
                            })
                    }),
            };

            match result {
                Ok(values) => string_vec_success_result(values),
                Err(err) => string_vec_error_result(err),
            }
        }
    };
}

generate_poseidon_functions!(
    poseidon2_hash,
    poseidon2_hash_to_scalar,
    poseidon2_hash_to_group,
    poseidon2_hash_many,
    Poseidon2,
    "AleoPoseidon2"
);
generate_poseidon_functions!(
    poseidon4_hash,
    poseidon4_hash_to_scalar,
    poseidon4_hash_to_group,
    poseidon4_hash_many,
    Poseidon4,
    "AleoPoseidon4"
);
generate_poseidon_functions!(
    poseidon8_hash,
    poseidon8_hash_to_scalar,
    poseidon8_hash_to_group,
    poseidon8_hash_many,
    Poseidon8,
    "AleoPoseidon8"
);
