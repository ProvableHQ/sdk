// Copyright (C) 2019-2023 Aleo Systems Inc.
// This file is part of the Aleo SDK library.

// The Aleo SDK library is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// The Aleo SDK library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with the Aleo SDK library. If not, see <https://www.gnu.org/licenses/>.

use super::*;

impl<N: Network> Rest<N> {
    /// Initializes the routes for the development server REST API
    pub fn routes(&self) -> impl Filter<Extract = (impl Reply,), Error = Rejection> + Clone {
        // POST /deploy
        let deploy = warp::post()
            .and(warp::path!("testnet3" / "deploy"))
            .and(warp::body::content_length_limit(16 * 1024 * 1024))
            .and(warp::body::json())
            .and(with(self.record_finder.clone()))
            .and(with(self.private_key_ciphertext.clone()))
            .and(with(self.api_client.clone()))
            .and_then(Self::deploy_program);

        // POST /execute
        let execute = warp::post()
            .and(warp::path!("testnet3" / "execute"))
            .and(warp::body::content_length_limit(16 * 1024 * 1024))
            .and(warp::body::json())
            .and(with(self.record_finder.clone()))
            .and(with(self.private_key_ciphertext.clone()))
            .and(with(self.api_client.clone()))
            .and_then(Self::execute_program);

        // POST /transfer
        let transfer = warp::post()
            .and(warp::path!("testnet3" / "transfer"))
            .and(warp::body::content_length_limit(16 * 1024 * 1024))
            .and(warp::body::json())
            .and(with(self.record_finder.clone()))
            .and(with(self.private_key_ciphertext.clone()))
            .and(with(self.api_client.clone()))
            .and_then(Self::transfer);

        // GET /health
        let health = warp::get().and(warp::path!("health")).map(reply::reply);

        deploy.or(execute).or(transfer).or(health)
    }
}

impl<N: Network> Rest<N> {
    // Get the private key if one is specified in the request or decrypt the local request
    fn get_private_key(
        private_key_ciphertext: Option<Ciphertext<N>>,
        private_key: Option<PrivateKey<N>>,
        password: Option<String>,
    ) -> Result<PrivateKey<N>, Rejection> {
        if let Some(private_key) = private_key {
            Ok(private_key)
        } else if let Some(password) = private_key_ciphertext.as_ref().and(password) {
            let private_key_ciphertext = private_key_ciphertext.as_ref().unwrap();
            Encryptor::decrypt_private_key_with_secret(private_key_ciphertext, &password).or_reject()
        } else {
            if private_key_ciphertext.is_none() {
                return Err(reject::custom(RestError::Request(
                    "No private key was provided, and no encrypted keys were found in the server's configuration."
                        .to_string(),
                )));
            }
            Err(reject::custom(RestError::Request("No private key or decryption passwords were provided.".to_string())))
        }
    }

    // If a separate peer url is provided in the request, use that instead of the one in the config
    fn get_api_client(api_client: AleoAPIClient<N>, peer_url: &Option<String>) -> Result<AleoAPIClient<N>, Rejection> {
        if let Some(peer_url) = peer_url {
            AleoAPIClient::new(peer_url, "testnet3").or_reject()
        } else {
            Ok(api_client)
        }
    }

    // Deploy a program to the network specified
    async fn deploy_program(
        request: DeployRequest<N>,
        record_finder: RecordFinder<N>,
        private_key_ciphertext: Option<Ciphertext<N>>,
        api_client: AleoAPIClient<N>,
    ) -> Result<impl Reply, Rejection> {
        // Error if fee == 0
        if request.fee == 0 {
            return Err(reject::custom(RestError::Request(
                "Fee must be greater than zero in order to deploy a program to the Aleo Network".to_string(),
            )));
        }
        // Get API client and private key and create a program manager
        let api_client = Self::get_api_client(api_client, &request.peer_url)?;
        let private_key = Self::get_private_key(private_key_ciphertext, request.private_key, request.password.clone())?;
        let mut program_manager = ProgramManager::new(Some(private_key), None, Some(api_client), None).or_reject()?;
        program_manager.add_program(&request.program).or_reject()?;

        // Get the fee record if it is not provided in the request
        let fee_record = if request.fee_record.is_none() {
            spawn_blocking!(record_finder.find_one_record(&private_key, request.fee))?
        } else {
            request.fee_record.unwrap()
        };

        // Deploy the program and return the resulting transaction id
        let transaction_id =
            spawn_blocking!(program_manager.deploy_program(request.program.id(), request.fee, fee_record, None))?;

        Ok(reply::json(&transaction_id))
    }

    // Execute a program on the network specified
    async fn execute_program(
        mut request: ExecuteRequest<N>,
        record_finder: RecordFinder<N>,
        private_key_ciphertext: Option<Ciphertext<N>>,
        api_client: AleoAPIClient<N>,
    ) -> Result<impl Reply, Rejection> {
        if request.fee == 0 {
            return Err(reject::custom(RestError::Request(
                "Fee must be greater than zero in order to execute a program on the Aleo Network".to_string(),
            )));
        }
        // Get API client and private key and create a program manager
        let api_client = Self::get_api_client(api_client, &request.peer_url)?;
        let private_key = Self::get_private_key(private_key_ciphertext, request.private_key, request.password.clone())?;
        let mut program_manager = ProgramManager::new(Some(private_key), None, Some(api_client), None).or_reject()?;

        // Find a fee record if a fee is specified and a fee record is not provided
        let fee_record = if request.fee_record.is_none() {
            spawn_blocking!(record_finder.find_one_record(&private_key, request.fee))?
        } else {
            request.fee_record.take().unwrap()
        };

        // Execute the program and return the resulting transaction id
        let transaction_id = spawn_blocking!(program_manager.execute_program(
            request.program_id,
            request.program_function,
            request.inputs.iter(),
            request.fee,
            fee_record,
            None,
        ))?;

        Ok(reply::json(&transaction_id))
    }

    // Create a value transfer on the network specified
    async fn transfer(
        request: TransferRequest<N>,
        record_finder: RecordFinder<N>,
        private_key_ciphertext: Option<Ciphertext<N>>,
        api_client: AleoAPIClient<N>,
    ) -> Result<impl Reply, Rejection> {
        // Get API client and private key and create a program manager
        if request.fee == 0 {
            return Err(reject::custom(RestError::Request(
                "Fee must be greater than zero in order to transfer funds on the Aleo Network".to_string(),
            )));
        }
        let api_client = Self::get_api_client(api_client, &request.peer_url)?;
        let private_key = Self::get_private_key(private_key_ciphertext, request.private_key, request.password.clone())?;
        let program_manager = ProgramManager::new(Some(private_key), None, Some(api_client), None).or_reject()?;

        let specified_transfer_type = request.transfer_type.as_str();
        info!("Transfer type specified: {specified_transfer_type}");
        let transfer_type = match specified_transfer_type {
            "private" => { TransferType::Private },
            "public" => { TransferType::Public },
            "private_to_public" => { TransferType::PrivateToPublic },
            "public_to_private" => { TransferType::PublicToPrivate },
            _ => Err(anyhow!("Invalid transfer type specified, type must be one of the following: private, public, private-to-public, public-to-private")).or_reject()?,
        };

        let (amount_record, fee_record) =
            match transfer_type {
                TransferType::Public => {
                    if let Some(fee_record) = request.fee_record {
                        (None, fee_record)
                    } else {
                        (None, spawn_blocking!(record_finder.find_one_record(&private_key, request.fee))?)
                    }
                }
                TransferType::PublicToPrivate => {
                    if let Some(fee_record) = request.fee_record {
                        (None, fee_record)
                    } else {
                        (None, spawn_blocking!(record_finder.find_one_record(&private_key, request.fee))?)
                    }
                }
                _ => {
                    match (request.amount_record, request.fee_record) {
                        (Some(amount_record), Some(fee_record)) => (Some(amount_record), fee_record),
                        (Some(amount_record), None) => {
                            // Find a fee record if a fee is specified and a fee record is not provided
                            (
                                Some(amount_record),
                                spawn_blocking!(record_finder.find_one_record(&private_key, request.fee))?,
                            )
                        }
                        (None, Some(fee_record)) => (
                            Some(spawn_blocking!(record_finder.find_one_record(&private_key, request.amount))?),
                            fee_record,
                        ),
                        (None, None) => {
                            let (amount_record, fee_record) = spawn_blocking!(
                                record_finder.find_amount_and_fee_records(request.amount, request.fee, &private_key)
                            )?;
                            (Some(amount_record), fee_record)
                        }
                    }
                }
            };

        // Run the transfer program within credits.aleo and return the resulting transaction id
        let transaction_id = spawn_blocking!(program_manager.transfer(
            request.amount,
            request.fee,
            request.recipient,
            transfer_type,
            None,
            amount_record,
            fee_record
        ))?;
        Ok(reply::json(&transaction_id))
    }
}
