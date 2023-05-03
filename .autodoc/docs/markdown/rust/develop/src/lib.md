[View code on GitHub](https://github.com/AleoHQ/aleo/rust/develop/src/lib.rs)

The Aleo Development Server is a REST server that provides endpoints for proving and verification operations necessary to create Aleo program deployments/executions and broadcast them to the Aleo network. It is designed for use in trusted contexts like local development environments, CI/CD pipelines, or private cloud networks.

The server offers three REST endpoints:
- `/deploy`: Create a program deployment
- `/execute`: Create a program execution
- `/transfer`: Create a transfer of Aleo credits

The server can be installed using `cargo install aleo-develop` and started with `aleo-develop start`. It can be configured with an encrypted private key, which requires a password field in the incoming request body to decrypt the private key.

The endpoints accept POST requests with a JSON body. A JavaScript client for the server is available in the [Aleo SDK](https://www.npmjs.com/package/@aleohq/sdk). The server's API is under active development and may change in the future.

Here's an example of a curl request to deploy a program:

```bash
curl -X POST -H "Content-Type: application/json" \
-d '{
    "program": "program hello.aleo;\n\nfunction main:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n",
    "fee": 100000,
    "private_key": "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH"
}' \
http://0.0.0.0:4040/testnet3/deploy
```

The server is initialized with a socket address, private key ciphertext, peer URL, and a debug flag. It uses the AleoAPIClient to communicate with the Aleo network and the RecordFinder to search for suitable records for fees and transfers.
## Questions: 
 1. **What are the available REST endpoints and their functionalities?**

   The Aleo Development Server provides three REST endpoints:
   - `/deploy`: Creates a program deployment.
   - `/execute`: Creates a program execution.
   - `/transfer`: Creates a transfer of Aleo credits.

2. **How can the server be started with an encrypted private key?**

   The server can be started with an encrypted private key by using the following command:
   ```
   aleo-develop start --key-ciphertext <encrypted_private_key>
   ```
   When this option is used, the server will look for a password field in the body of incoming requests to decrypt the private key.

3. **Is there a JavaScript client for this server?**

   Yes, a JavaScript client for this server is available in the [Aleo SDK](https://www.npmjs.com/package/@aleohq/sdk).