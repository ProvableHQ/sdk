[View code on GitHub](https://github.com/AleoHQ/aleo/.autodoc/docs/json/examples/token)

The `program.json` file in the `token` folder is a configuration file for the Aleo project, specifically for a token program named `token.aleo`. This file contains important metadata and settings that are used by the Aleo project to manage and configure the token program.

The configuration file has the following properties:

- `program`: This property specifies the name of the Aleo program file, which is `token.aleo` in this case. This file contains the actual Aleo code that implements the token functionality.
- `version`: This property indicates the version of the token program. It is set to `0.0.0`, which suggests that this is an initial version or a work in progress.
- `description`: This property is currently empty but can be used to provide a brief description of the token program's functionality or purpose.
- `development`: This property is an object that contains development-related settings. It has two sub-properties:
  - `private_key`: This property holds a private key (`APrivateKey1zkp4XPrUCPZLTxTac9kJE7hMYwDQS9xocthq77EkKtsv3sY`) that is used for signing transactions and other cryptographic operations during development.
  - `address`: This property specifies the Aleo address (`aleo1hf0jutqqeqv2nhazntuted4z99ax873lgfaw623ytqc68z72cqqqa9xeg4`) associated with the private key. This address is used to identify the developer or the development environment on the Aleo network.
- `license`: This property indicates that the token program is licensed under the MIT License, which is a permissive open-source software license.

In the larger Aleo project, this configuration file is used to set up the development environment and manage the token program's metadata. Developers can update the properties in this file to modify the program's settings, such as changing the private key, updating the version number, or adding a description. This file is essential for the proper functioning and management of the token program within the Aleo project.

For example, if a developer wants to update the version number of the token program, they can modify the `version` property in the `program.json` file:

```json
{
  "program": "token.aleo",
  "version": "0.1.0",
  ...
}
```

Similarly, if a developer wants to add a description to the token program, they can update the `description` property:

```json
{
  ...
  "description": "A custom token implementation for the Aleo platform",
  ...
}
```

By modifying the properties in the `program.json` file, developers can easily manage the token program's settings and metadata, ensuring that the program is properly configured and integrated within the larger Aleo project.
