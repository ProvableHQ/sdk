// Copyright (C) 2019-2023 Aleo Systems Inc.
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

// Test a deployment of a program, this test will only succeed if there is a beacon node running on localhost:3030
#[cfg(test)]
mod tests {
    #[cfg(not(feature = "wasm"))]
    use aleo_rust::{api::NetworkConfig, program::ProgramManager, resolvers::HybridResolver};
    #[cfg(not(feature = "wasm"))]
    use snarkvm_console::{account::PrivateKey, network::Testnet3};

    #[test]
    #[cfg(not(feature = "wasm"))]
    #[ignore]
    fn test_deploy() {
        let rng = &mut rand::thread_rng();
        let private_key = PrivateKey::<Testnet3>::new(rng).unwrap();
        let temp_dir = std::env::current_dir().unwrap();
        let network_config = NetworkConfig::local_testnet3("3030");
        let mut program_manager =
            ProgramManager::<Testnet3, HybridResolver<Testnet3>>::program_manager_with_hybrid_resolution(
                Some(private_key),
                None,
                temp_dir,
                network_config.clone(),
            )
            .unwrap();

        program_manager.deploy_program("test_aleo.aleo", None, 0, None, None).unwrap();
    }
}
