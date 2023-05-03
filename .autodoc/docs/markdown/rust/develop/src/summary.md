[View code on GitHub](https://github.com/AleoHQ/aleo/.autodoc/docs/json/rust/develop/src)

The code in this folder is part of the Aleo Development Server, which provides a REST API for developers to interact with the Aleo network. The server handles proving and verification operations required for deploying and executing Aleo programs and broadcasting the results to the Aleo Network. The main components of the server are the `CLI` struct, the `Rest` struct, and the request structures.

The `CLI` struct in `cli.rs` is the entry point for the command-line interface, allowing developers to start the server with various configurations. For example, to start the server with a specific private key ciphertext and debug logging enabled, a developer would run:

```sh
aleo-develop start --key-ciphertext <ciphertext> --server-address 0.0.0.0:4040 --peer https://vm.aleo.org/api --debug
```

The `Rest` struct in `routes.rs` sets up the API routes and their corresponding handlers. The server offers three main endpoints: `/deploy` for deploying programs, `/execute` for executing programs, and `/transfer` for transferring Aleo credits. The `Rest` struct also contains helper methods for handling private keys and API clients.

The request structures in `requests.rs` define the data format for interacting with the Aleo network. These structures are serialized and deserialized using the Serde library, allowing them to be easily sent and received over the network. The three request structures are `DeployRequest`, `ExecuteRequest`, and `TransferRequest`.

The `helpers` folder contains utility modules and functions for handling authentication, error handling, macros, middleware, and rejection handling. These utilities can be used throughout the Aleo project to simplify repetitive tasks, provide syntactic sugar, and ensure consistent error handling and reporting.

For example, a developer might use the `with_auth` function from the `helpers::auth` module to secure an API endpoint, requiring a valid JWT in the "authorization" header:

```rust
use aleo::helpers::with_auth;
use warp::Filter;

let protected_route = warp::path("protected")
    .and(with_auth())
    .and_then(protected_handler);
```

Overall, the code in this folder is essential for setting up and configuring the Aleo Development Server, allowing developers to easily interact with the Aleo Network and deploy their programs.
