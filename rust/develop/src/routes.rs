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
    // Deploy a program on the network specified
    async fn deploy_program(
        request: DeployRequest<N>,
        record_finder: RecordFinder<N>,
        private_key_ciphertext: Option<Ciphertext<N>>,
        api_client: AleoAPIClient<N>,
    ) -> Result<impl Reply, Rejection> {
        if request.fee == 0 {
            return Err(reject::custom(RestError::Request(
                "Cannot make a deployment without an associated fee".to_string(),
            )));
        }
        Self::initiate_client_connection(request, record_finder, private_key_ciphertext, api_client)
    }

    // Execute a program on the network specified
    async fn execute_program(
        request: ExecuteRequest<N>,
        record_finder: RecordFinder<N>,
        private_key_ciphertext: Option<Ciphertext<N>>,
        api_client: AleoAPIClient<N>,
    ) -> Result<impl Reply, Rejection> {
        Self::initiate_client_connection(request, record_finder, private_key_ciphertext, api_client)
    }

    // Create a value transfer on the network specified
    async fn transfer(
        request: TransferRequest<N>,
        record_finder: RecordFinder<N>,
        private_key_ciphertext: Option<Ciphertext<N>>,
        api_client: AleoAPIClient<N>,
    ) -> Result<impl Reply, Rejection> {
        if request.amount == 0 {
            return Err(reject::custom(RestError::Request("Cannot make a transfer with a zero amount".to_string())));
        }
        Self::initiate_client_connection(request, record_finder, private_key_ciphertext, api_client)
    }

    fn initiate_client_connection(
        mut request: impl TransactionRequest<N> + 'static,
        record_finder: RecordFinder<N>,
        private_key_ciphertext: Option<Ciphertext<N>>,
        api_client: AleoAPIClient<N>,
    ) -> Result<impl Reply, Rejection> {
        let api_client = Self::get_api_client(api_client, &request.peer_url())?;
        let private_key = Self::get_private_key(private_key_ciphertext, request.private_key(), request.password())?;
        let program_manager = ProgramManager::new(Some(private_key), None, Some(api_client), None).or_reject()?;
        let (tx, rx) = tokio::sync::mpsc::channel(10);
        let stream = Self::create_stream(rx);
        let transaction_future =
            Self::build_and_send_transaction(request, record_finder, private_key, program_manager, tx);
        tokio::task::spawn(transaction_future);
        Ok(warp::sse::reply(warp::sse::keep_alive().stream(stream)))
    }

    // Build a deployment or execution transaction and send it to the network
    //
    // This method sends a stream of messages to the client about the state of the transaction as it
    // is being built. This allows the client to display the progress of the transaction and respond
    // to any errors that may occur.
    async fn build_and_send_transaction(
        mut request: impl TransactionRequest<N> + 'static,
        record_finder: RecordFinder<N>,
        private_key: PrivateKey<N>,
        mut program_manager: ProgramManager<N>,
        tx: tokio::sync::mpsc::Sender<StreamState>,
    ) -> Result<(), Rejection> {
        // Find a fee record if a fee is specified and a fee record is not provided
        let fee = request.fee();
        let fee_record = if request.fee() > 0 {
            if request.fee_record().is_none() {
                let fee_record_finder = record_finder.clone();
                Some(await_streaming_task!(
                    fee_record_finder.find_one_record(&private_key, fee),
                    300.0,
                    "failed to find fee record",
                    &tx
                )?)
            } else {
                request.fee_record()
            }
        } else {
            None
        };

        // Determine the type of transaction and build it with the corresponding parameters
        let transaction_id = match request.transaction_type() {
            "execute" => await_streaming_task!(
                program_manager.execute_program(
                    request.program_id().or_reject()?,
                    request.program_function().or_reject()?,
                    request.inputs().or_reject()?.iter(),
                    request.fee(),
                    fee_record,
                    None,
                ),
                300.0,
                "failed to execute program",
                &tx
            )?,
            "deploy" => {
                program_manager.add_program(&request.program().or_reject()?).or_reject()?;
                await_streaming_task!(
                    program_manager.deploy_program(
                        request.program_id().or_reject()?,
                        request.fee(),
                        fee_record.or_reject()?,
                        None
                    ),
                    300.0,
                    "failed to deploy program",
                    &tx
                )?
            }
            "transfer" => {
                // Find an amount record if an amount record is not provided
                let amount_record = if let Some(amount_record) = request.amount_record() {
                    amount_record
                } else {
                    let amount = request.amount().or_reject()?;
                    await_streaming_task!(
                        record_finder.find_one_record(&private_key, amount),
                        300.0,
                        "failed to find record to fund transaction",
                        &tx
                    )?
                };
                await_streaming_task!(
                    program_manager.transfer(
                        request.amount().or_reject()?,
                        request.fee(),
                        request.recipient().or_reject()?,
                        None,
                        amount_record,
                        fee_record
                    ),
                    300.0,
                    "failed to make transfer",
                    &tx
                )?
            }
            _ => {
                return Err(reject::custom(RestError::Request("Unsupported request type".to_string())));
            }
        };

        // If successful send the result to the client. If a failure is encountered prior to this,
        // point, this method will error and the client will receive an error message corresponding
        // to the failure mode
        tx.send(StreamState::Result(transaction_id.clone())).await.or_reject()?;
        Ok(())
    }

    // Create a stream that receives messages from the transaction creation process and sends them
    // to the client
    fn create_stream(
        rx: tokio::sync::mpsc::Receiver<StreamState>,
    ) -> impl Stream<Item = Result<Event, warp::Error>> + Send + Sync + 'static {
        ReceiverStream::<StreamState>::new(rx).scan(StreamState::Processing, |state, result| match result {
            StreamState::Processing => futures::future::ready(Some(Ok(Event::default().event("processing")))),
            StreamState::Result(transaction_id) => {
                *state = StreamState::Finished;
                futures::future::ready(Some(Ok(Event::default().event("success").data(transaction_id))))
            }
            StreamState::Finished => futures::future::ready(None),
            StreamState::Error(error) => {
                *state = StreamState::Finished;
                tracing::info!("Error: {}", error);
                futures::future::ready(Some(Ok(Event::default().event("error").data(error))))
            }
            StreamState::Timeout(error) => {
                *state = StreamState::Finished;
                tracing::info!("Error: {}", error);
                futures::future::ready(Some(Ok(Event::default().event("timeout").data(error))))
            }
        })
    }

    // If a separate peer url is provided in the request, use that instead of the one in the server
    // config
    fn get_api_client(api_client: AleoAPIClient<N>, peer_url: &Option<String>) -> Result<AleoAPIClient<N>, Rejection> {
        if let Some(peer_url) = peer_url {
            AleoAPIClient::new(peer_url, "testnet3").or_reject()
        } else {
            Ok(api_client)
        }
    }

    // Get the private key if one is specified in the request or decrypt the local key ciphertext if
    // a password is provided
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
}
