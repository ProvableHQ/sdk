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

use super::*;

#[derive(Deserialize, Serialize)]
#[serde(bound(serialize = "N: Serialize", deserialize = "N: for<'a> Deserialize<'a>"))]
struct DeployRequest<N: Network> {
    pub program: Program<N>,
    pub private_key: Option<PrivateKey<N>>,
    pub password: Option<String>,
    pub fee: u64,
    pub fee_record: Option<Record<N, Plaintext<N>>>,
}

#[derive(Deserialize, Serialize)]
#[serde(bound(serialize = "N: Serialize", deserialize = "N: for<'a> Deserialize<'a>"))]
struct ExecuteRequest<N: Network> {
    pub program_id: ProgramID<N>,
    pub program_function: Identifier<N>,
    pub inputs: Vec<String>,
    pub private_key: Option<PrivateKey<N>>,
    pub password: Option<String>,
    pub fee: u64,
    pub fee_record: Option<Record<N, Plaintext<N>>>,
}

#[derive(Deserialize, Serialize)]
#[serde(bound(serialize = "N: Serialize", deserialize = "N: for<'a> Deserialize<'a>"))]
struct TransferRequest<N: Network> {
    pub amount: u64,
    pub fee: u64,
    pub recipient: Address<N>,
    pub private_key: Option<PrivateKey<N>>,
    pub password: Option<String>,
    pub fee_record: Option<Record<N, Plaintext<N>>>,
    pub amount_record: Option<Record<N, Plaintext<N>>>,
}

impl<N: Network> Rest<N> {
    /// Initializes the routes, given the ledger and ledger sender.
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

        deploy.or(execute).or(transfer)
    }
}

impl<N: Network> Rest<N> {
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

    async fn deploy_program(
        request: DeployRequest<N>,
        record_finder: RecordFinder<N>,
        private_key_ciphertext: Option<Ciphertext<N>>,
        api_client: AleoAPIClient<N>,
    ) -> Result<impl Reply, Rejection> {
        // Error if fee == 0
        if request.fee == 0 {
            return Err(reject::custom(RestError::Request("Fee must be greater than zero".to_string())));
        }
        let private_key = Self::get_private_key(private_key_ciphertext, request.private_key, request.password.clone())?;
        let mut program_manager = ProgramManager::new(Some(private_key), None, Some(api_client), None).or_reject()?;
        program_manager.add_program(&request.program).or_reject()?;
        let fee_record =
            request.fee_record.unwrap_or(record_finder.find_one_record(&private_key, request.fee).or_reject()?);
        let transaction_id =
            program_manager.deploy_program(request.program.id(), request.fee, fee_record, None).or_reject()?;
        Ok(reply::json(&transaction_id))
    }

    async fn execute_program(
        request: ExecuteRequest<N>,
        record_finder: RecordFinder<N>,
        private_key_ciphertext: Option<Ciphertext<N>>,
        api_client: AleoAPIClient<N>,
    ) -> Result<impl Reply, Rejection> {
        let private_key = Self::get_private_key(private_key_ciphertext, request.private_key, request.password.clone())?;
        let mut program_manager = ProgramManager::new(Some(private_key), None, Some(api_client), None).or_reject()?;
        let fee_record = if request.fee > 0 {
            Some(
                request
                    .fee_record
                    .clone()
                    .unwrap_or(record_finder.find_one_record(&private_key, request.fee).or_reject()?),
            )
        } else {
            None
        };
        let transaction_id = program_manager
            .execute_program(
                request.program_id,
                request.program_function,
                request.inputs.iter(),
                request.fee,
                fee_record,
                None,
            )
            .or_reject()?;
        Ok(reply::json(&transaction_id))
    }

    async fn transfer(
        request: TransferRequest<N>,
        record_finder: RecordFinder<N>,
        private_key_ciphertext: Option<Ciphertext<N>>,
        api_client: AleoAPIClient<N>,
    ) -> Result<impl Reply, Rejection> {
        let private_key = Self::get_private_key(private_key_ciphertext, request.private_key, request.password.clone())?;
        let program_manager =
            ProgramManager::new(Some(private_key), None, Some(api_client.clone()), None).or_reject()?;
        let fee_record = if request.fee > 0 {
            Some(request.fee_record.unwrap_or(record_finder.find_one_record(&private_key, request.fee).or_reject()?))
        } else {
            None
        };

        let amount_record = if let Some(amount_record) = request.amount_record {
            amount_record
        } else {
            tokio::task::spawn_blocking(move || record_finder.find_one_record(&private_key, request.amount).or_reject())
                .await
                .or_reject()??
        };

        let result = tokio::task::spawn_blocking(move || {
            program_manager
                .transfer(request.amount, request.fee, request.recipient, None, amount_record, fee_record)
                .or_reject()
        })
        .await
        .or_reject()??;
        Ok(reply::json(&result))
    }
}
