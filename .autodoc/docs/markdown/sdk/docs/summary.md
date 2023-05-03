[View code on GitHub](https://github.com/AleoHQ/aleo/.autodoc/docs/json/sdk/docs)

The `.autodoc/docs/json/sdk/docs` folder contains documentation and code for the Aleo project, which provides high-level utilities in JavaScript for handling Accounts, Records, and Node connections in the browser. The project is organized into three main classes: `Account`, `AleoNetworkClient`, and `DevelopmentClient`.

The `Account` class offers methods for managing accounts, such as creating an account from a private key ciphertext, encrypting and decrypting records, checking if an account owns a ciphertext record, and signing and verifying messages with the account's private key. For example, to create an account from a private key ciphertext, you can use the following code:

```javascript
const account = Account.fromCiphertext(privateKeyCiphertext);
```

The `AleoNetworkClient` class is responsible for interacting with the Aleo blockchain. It provides methods for finding unspent records, getting account information, retrieving blocks and block ranges, fetching the latest block, hash, and height, and querying transactions and programs. For instance, to get the latest block, you can use the following code:

```javascript
const aleoClient = new AleoNetworkClient();
const latestBlock = await aleoClient.getLatestBlock();
```

The `DevelopmentClient` class is designed for deploying and executing programs on the Aleo network using an Aleo Development Server. It provides methods for deploying a program (`deployProgram`), executing a program (`executeProgram`), and transferring credits between accounts (`transfer`). Note that an Aleo Development Server must be running locally or remotely for these methods to work. Here's an example of how to use the `DevelopmentClient` class to deploy a program:

```javascript
const devClient = new DevelopmentClient();
devClient.deployProgram(programSourceCode);
```

The folder also contains various JavaScript files responsible for handling user interface (UI) functionalities and interactions in the Aleo project's documentation website, such as theme toggling, accordion behavior, font size adjustment, code block interactions, search functionality, and more.

The CSS files in the `styles` folder define the styling and layout for the Aleo project's user interface, ensuring a consistent and visually appealing appearance across the entire project, including typography, colors, layout, and responsive design for different screen sizes.

In summary, the `.autodoc/docs/json/sdk/docs` folder provides a set of functionalities that enable developers to manage accounts, interact with the Aleo blockchain, and deploy and execute programs on the Aleo network. These tools are essential for building and testing applications on the Aleo platform, and they work together with other parts of the project to provide a seamless development experience.
