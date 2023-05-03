[View code on GitHub](https://github.com/AleoHQ/aleo/.autodoc/docs/json/website/src/tabs)

The `tabs` folder in the Aleo project contains various React components organized into subfolders, each providing specific functionality related to interacting with the Aleo platform. These components can be integrated into the larger Aleo project to provide a seamless user experience.

The `account` subfolder contains components for account management, such as creating new accounts, loading accounts from private keys, signing messages, and verifying messages. For example, the `AccountFromPrivateKey.js` component allows users to load an Aleo account using a private key:

```jsx
import React from 'react';
import { AccountFromPrivateKey } from './path/to/AccountFromPrivateKey';

const App = () => {
  return (
    <div>
      <h1>Aleo Account Loader</h1>
      <AccountFromPrivateKey />
    </div>
  );
};

export default App;
```

The `advanced` subfolder contains components for decrypting and encrypting Aleo accounts, such as `DecryptAccount.js` and `EncryptAccount.js`. These components ensure the security of users' private keys. For example, the `DecryptAccount` component can be used to decrypt an account:

```jsx
import React from 'react';
import { DecryptAccount } from './aleo/DecryptAccount';

function App() {
  return (
    <div>
      <h1>Aleo Account Decryptor</h1>
      <DecryptAccount />
    </div>
  );
}

export default App;
```

The `record` subfolder contains the `DecryptRecord.js` component, which is responsible for decrypting a given ciphertext using a provided view key. This component can be used to provide a user interface for decrypting records:

```jsx
import DecryptRecord from './DecryptRecord';

function App() {
  return (
    <div>
      <h1>Decrypt a Record</h1>
      <DecryptRecord />
    </div>
  );
}

export default App;
```

The `rest` subfolder contains components that interact with the Aleo blockchain through API requests, allowing users to search for blocks, transactions, and programs. For example, the `GetBlockByHash.js` component can be used to search for a specific block by its hash:

```jsx
import React from 'react';
import { GetBlockByHash } from './aleo/GetBlockByHash';

function App() {
  return (
    <div>
      <h1>Aleo Blockchain Explorer</h1>
      <GetBlockByHash />
    </div>
  );
}

export default App;
```

In summary, the components in the `tabs` folder provide essential functionality for interacting with the Aleo platform, such as account management, encryption and decryption, and blockchain exploration. These components can be integrated into the larger Aleo project to provide a seamless user experience.
