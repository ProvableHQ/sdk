use crate::helpers::Ledger;
use snarkvm::prelude::{Field, Network, RecordsFilter, Transaction, ViewKey};

use anyhow::Result;
use core::marker::PhantomData;
use indexmap::IndexMap;
use std::sync::Arc;
use tokio::{sync::mpsc, task::JoinHandle};
use warp::{http::StatusCode, reject, reply, Filter, Rejection, Reply};

/// An enum of error handlers for the server.
#[derive(Debug)]
enum ServerError {
    Request(String),
}

impl reject::Reject for ServerError {}

/// A trait to unwrap a `Result` or `Reject`.
pub trait OrReject<T> {
    /// Returns the result if it is successful, otherwise returns a rejection.
    fn or_reject(self) -> Result<T, Rejection>;
}

impl<T> OrReject<T> for anyhow::Result<T> {
    /// Returns the result if it is successful, otherwise returns a rejection.
    fn or_reject(self) -> Result<T, Rejection> {
        Ok(self.map_err(|e| reject::custom(ServerError::Request(e.to_string())))?)
    }
}

/// A middleware to include the given item in the handler.
fn with<T: Clone + Send>(item: T) -> impl Filter<Extract = (T,), Error = std::convert::Infallible> + Clone {
    warp::any().map(move || item.clone())
}

/// Shorthand for the parent half of the `Ledger` message channel.
pub type LedgerSender<N> = mpsc::Sender<LedgerRequest<N>>;
/// Shorthand for the child half of the `Ledger` message channel.
pub type LedgerReceiver<N> = mpsc::Receiver<LedgerRequest<N>>;

/// An enum of requests that the `Ledger` struct processes.
#[derive(Debug)]
pub enum LedgerRequest<N: Network> {
    TransactionBroadcast(Transaction<N>),
}

/// A server for the ledger.
#[allow(dead_code)]
#[derive(Debug)]
pub struct Server<N: Network> {
    /// The runtime.
    runtime: tokio::runtime::Runtime,
    /// The ledger sender.
    ledger_sender: LedgerSender<N>,
    /// The server handles.
    handles: Vec<JoinHandle<()>>,
    /// PhantomData.
    _phantom: PhantomData<N>,
}

impl<N: Network> Server<N> {
    /// Initializes a new instance of the server.
    pub fn start(ledger: Arc<Ledger<N>>) -> Result<Self> {
        // Initialize a runtime.
        let runtime = tokio::runtime::Builder::new_multi_thread()
            .enable_all()
            .thread_stack_size(8 * 1024 * 1024)
            .build()?;

        // Initialize a channel to send requests to the ledger.
        let (ledger_sender, ledger_receiver) = mpsc::channel(64);

        // Initialize the server.
        let sender = ledger_sender.clone();
        let handles = runtime.block_on(async move {
            // Initialize a vector for the server handles.
            let mut handles = Vec::new();

            // Initialize the routes.
            let routes = Self::routes(ledger.clone(), sender);

            // Spawn the server.
            handles.push(tokio::spawn(async move {
                // Start the server.
                println!("\n🌐 Server is running at http://0.0.0.0:4180\n");
                warp::serve(routes).run(([0, 0, 0, 0], 4180)).await;
            }));

            // Spawn the ledger handler.
            handles.push(Self::start_handler(ledger, ledger_receiver));

            // Return the handles.
            handles
        });

        Ok(Self {
            runtime,
            ledger_sender,
            handles,
            _phantom: PhantomData,
        })
    }

    /// Initializes a ledger handler.
    fn start_handler(ledger: Arc<Ledger<N>>, mut ledger_receiver: LedgerReceiver<N>) -> JoinHandle<()> {
        tokio::spawn(async move {
            while let Some(request) = ledger_receiver.recv().await {
                match request {
                    LedgerRequest::TransactionBroadcast(transaction) => {
                        // Retrieve the transaction ID.
                        let transaction_id = transaction.id();
                        // Add the transaction to the memory pool.
                        match ledger.add_to_memory_pool(transaction) {
                            Ok(()) => println!("✉️ Added transaction '{transaction_id}' to the memory pool"),
                            Err(error) => eprintln!("⚠️ Failed to add transaction '{transaction_id}' to the memory pool: {error}")
                        }
                    }
                };
            }
        })
    }

    /// Initializes the routes, given the ledger sender.
    fn routes(ledger: Arc<Ledger<N>>, ledger_sender: LedgerSender<N>) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
        // GET /testnet3/latest/block/height
        let latest_block_height = warp::get()
            .and(warp::path!("testnet3" / "latest" / "block" / "height"))
            .and(with(ledger.clone()))
            .and_then(Self::latest_block_height);

        // GET /testnet3/latest/block/hash
        let latest_block_hash = warp::get()
            .and(warp::path!("testnet3" / "latest" / "block" / "hash"))
            .and(with(ledger.clone()))
            .and_then(Self::latest_block_hash);

        // GET /testnet3/latest/block
        let latest_block = warp::get()
            .and(warp::path!("testnet3" / "latest" / "block"))
            .and(with(ledger.clone()))
            .and_then(Self::latest_block);

        // GET /testnet3/block/{height}
        let get_block = warp::get()
            .and(warp::path!("testnet3" / "block" / u32))
            .and(with(ledger.clone()))
            .and_then(Self::get_block);

        // GET /testnet3/statePath/{commitment}
        let state_path = warp::get()
            .and(warp::path!("testnet3" / "statePath"))
            .and(warp::body::content_length_limit(128))
            .and(warp::body::json())
            .and(with(ledger.clone()))
            .and_then(Self::state_path);

        // GET /testnet3/records/all
        let records_all = warp::get()
            .and(warp::path!("testnet3" / "records" / "all"))
            .and(warp::body::content_length_limit(256))
            .and(warp::body::json())
            .and(with(ledger.clone()))
            .and_then(Self::records_all);

        // GET /testnet3/records/spent
        let records_spent = warp::get()
            .and(warp::path!("testnet3" / "records" / "spent"))
            .and(warp::body::content_length_limit(256))
            .and(warp::body::json())
            .and(with(ledger.clone()))
            .and_then(Self::records_spent);

        // GET /testnet3/records/unspent
        let records_unspent = warp::get()
            .and(warp::path!("testnet3" / "records" / "unspent"))
            .and(warp::body::content_length_limit(128))
            .and(warp::body::json())
            .and(with(ledger.clone()))
            .and_then(Self::records_unspent);

        // POST /testnet3/transaction/broadcast
        let transaction_broadcast = warp::post()
            .and(warp::path!("testnet3" / "transaction" / "broadcast"))
            .and(warp::body::content_length_limit(10 * 1024 * 1024))
            .and(warp::body::json())
            .and(with(ledger_sender.clone()))
            .and_then(Self::transaction_broadcast);

        // Prepare the list of routes.
        let routes = latest_block_height
            .or(latest_block_hash)
            .or(latest_block)
            .or(get_block)
            .or(state_path)
            .or(records_all)
            .or(records_spent)
            .or(records_unspent)
            .or(transaction_broadcast);

        // Return the routes.
        routes
    }
}

impl<N: Network> Server<N> {
    /// Returns the latest block height.
    async fn latest_block_height(ledger: Arc<Ledger<N>>) -> Result<impl Reply, Rejection> {
        Ok(reply::json(&ledger.ledger.read().latest_height()))
    }

    /// Returns the latest block hash.
    async fn latest_block_hash(ledger: Arc<Ledger<N>>) -> Result<impl Reply, Rejection> {
        Ok(reply::json(&ledger.ledger.read().latest_hash()))
    }

    /// Returns the latest block.
    async fn latest_block(ledger: Arc<Ledger<N>>) -> Result<impl Reply, Rejection> {
        Ok(reply::json(&ledger.ledger.read().latest_block().or_reject()?))
    }

    /// Returns the block for the given block height.
    async fn get_block(height: u32, ledger: Arc<Ledger<N>>) -> Result<impl Reply, Rejection> {
        Ok(reply::json(&ledger.ledger.read().get_block(height).or_reject()?))
    }

    /// Returns the state path for the given commitment.
    async fn state_path(commitment: Field<N>, ledger: Arc<Ledger<N>>) -> Result<impl Reply, Rejection> {
        Ok(reply::json(
            &ledger.ledger.read().to_state_path(&commitment).or_reject()?,
        ))
    }

    /// Returns all of the records for the given view key.
    async fn records_all(view_key: ViewKey<N>, ledger: Arc<Ledger<N>>) -> Result<impl Reply, Rejection> {
        // Fetch the records using the view key.
        let records: IndexMap<_, _> = ledger
            .ledger
            .read()
            .find_records(&view_key, RecordsFilter::All).or_reject()?
            .collect();
        // Return the records.
        Ok(reply::with_status(reply::json(&records), StatusCode::OK))
    }

    /// Returns the spent records for the given view key.
    async fn records_spent(view_key: ViewKey<N>, ledger: Arc<Ledger<N>>) -> Result<impl Reply, Rejection> {
        // Fetch the records using the view key.
        let records = ledger
            .ledger
            .read()
            .find_records(&view_key, RecordsFilter::Spent).or_reject()?
            .collect::<IndexMap<_, _>>();
        // Return the records.
        Ok(reply::with_status(reply::json(&records), StatusCode::OK))
    }

    /// Returns the unspent records for the given view key.
    async fn records_unspent(view_key: ViewKey<N>, ledger: Arc<Ledger<N>>) -> Result<impl Reply, Rejection> {
        // Fetch the records using the view key.
        let records = ledger
            .ledger
            .read()
            .find_records(&view_key, RecordsFilter::Unspent).or_reject()?
            .collect::<IndexMap<_, _>>();
        // Return the records.
        Ok(reply::with_status(reply::json(&records), StatusCode::OK))
    }

    /// Broadcasts the transaction to the ledger.
    async fn transaction_broadcast(
        transaction: Transaction<N>,
        ledger_sender: LedgerSender<N>,
    ) -> Result<impl Reply, Rejection> {
        // Send the transaction to the ledger.
        match ledger_sender
            .send(LedgerRequest::TransactionBroadcast(transaction))
            .await
        {
            Ok(()) => Ok("OK"),
            Err(error) => Err(reject::custom(ServerError::Request(format!("{error}")))),
        }
    }
}
