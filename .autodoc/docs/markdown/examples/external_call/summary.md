[View code on GitHub](https://github.com/AleoHQ/aleo/.autodoc/docs/json/examples/external_call)

The `program.json` file in the `external_call` folder serves as a configuration file for the `external_call.aleo` program within the Aleo project. Aleo is a platform that enables developers to build private applications using zero-knowledge proofs. This configuration file is essential for managing the program's settings and ensuring proper functionality within the larger Aleo project.

The `program.json` file contains key-value pairs in JSON format, providing important information about the program, its version, and development-related details. For example:

```json
{
  "program": "external_call.aleo",
  "version": "0.0.0",
  "description": "",
  "development": {
    "private_key": "APrivateKey1zkp2p4ieFsUJZ2EkudZEsxJTfw81T3qjdKjdbdWcJWKXapG",
    "address": "aleo1f72p3g82eur6x8ysd4u6hl8rmt8un6eelpzrdsvfkp663wf6uuzs2v8cfk"
  },
  "license": "MIT"
}
```

The `program` key specifies the name of the Aleo program, which is "external_call.aleo" in this case. This program is likely responsible for handling external calls within the Aleo project. The `version` key indicates the current version of the program, which is "0.0.0". As the program evolves, this version number will be updated.

The `description` key is meant to store a brief description of the program. Currently, it is empty, but it can be filled in with a relevant description as the project progresses.

The `development` key contains an object with two properties related to the development environment. The `private_key` key stores a private key, which is a secret cryptographic key used for signing transactions and other operations within the Aleo network. The `address` key holds the Aleo address associated with the private key, which is used to identify the developer or user on the Aleo network.

The `license` key specifies the software license for the program, which is the "MIT" license in this case.

In the larger Aleo project, the `external_call.aleo` program might be used to handle external calls, such as interacting with other smart contracts or external data sources. The `program.json` configuration file ensures that the program has the correct settings and environment to function properly within the Aleo ecosystem. For example, the private key and address information stored in the `development` object might be used to sign transactions or authenticate the developer when deploying the program on the Aleo network.

In summary, the `program.json` file in the `external_call` folder is a crucial component for managing the settings and environment of the `external_call.aleo` program within the Aleo project. It provides essential information about the program's version, development environment, and license, ensuring proper functionality and integration with other parts of the Aleo project.
