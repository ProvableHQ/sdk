[View code on GitHub](https://github.com/AleoHQ/aleo/sdk/src/development_client.d.ts)

The `DevelopmentClient` class provides a TypeScript and JavaScript API for deploying and executing programs on the Aleo Network using an Aleo Development Server. It sends RESTful requests to the server and returns the resulting transaction_id. The Aleo Development Server is a Rust-based server that runs all the proving and verification operations needed to deploy and execute programs and posts program deployments and executions to the Aleo Network.

The class has the following methods:

1. `constructor(baseURL: string)`: Creates a new `DevelopmentClient` instance to interact with an Aleo Development Server at the specified `baseURL`.

2. `deployProgram(...)`: Deploys a program on the Aleo Network via an Aleo development server. It takes the program text, fee, optional private key, password, and fee record as arguments and returns the transaction_id of the deployment transaction if successful.

   Example usage:
   ```
   const client = new DevelopmentClient("http://0.0.0.0:4040");
   const transaction_id = await client.deployProgram(Program, 6000000, privateKeyString);
   ```

3. `executeProgram(...)`: Executes a program on the Aleo Network via an Aleo development server. It takes the program ID, program function, fee, inputs, optional private key, password, and fee record as arguments and returns the transaction_id of the execution transaction if successful.

   Example usage:
   ```
   const client = new DevelopmentClient("http://0.0.0.0:4040");
   const transaction_id = await client.executeProgram("hello.aleo", "main", 0, ["5u32", "5u32"], privateKeyString);
   ```

4. `transfer(...)`: Sends an amount in credits to a specified recipient on the Aleo Network via an Aleo development server. It takes the amount, fee, recipient, optional private key, password, fee record, and amount record as arguments and returns the transaction_id of the execution transaction if successful.

   Example usage:
   ```
   const client = new DevelopmentClient("http://0.0.0.0:4040");
   const transaction_id = await client.transfer(1.5, 0, recipient, privateKey);
   ```

These methods enable developers to interact with the Aleo Network for deploying, executing, and transferring credits using an Aleo Development Server.
## Questions: 
 1. **Question:** What is the purpose of the `sendRequest` method and what are its parameters?
   **Answer:** The `sendRequest` method is a generic method used to send RESTful requests to the Aleo Development Server. It takes two parameters: `path`, which is the API endpoint path, and `request`, which is the request payload to be sent.

2. **Question:** How does the `deployProgram` method handle errors if the Aleo Development Server is not running?
   **Answer:** If the Aleo Development Server is not running, the `deployProgram` method will throw an error, indicating that the server is required for the method to work properly.

3. **Question:** What is the purpose of the `password` parameter in the `executeProgram` method?
   **Answer:** The `password` parameter is required if the Aleo Development Server is started with an encrypted private key. It is used to decrypt the private key for the user who is executing the program.