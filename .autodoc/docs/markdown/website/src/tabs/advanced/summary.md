[View code on GitHub](https://github.com/AleoHQ/aleo/.autodoc/docs/json/website/src/tabs/advanced)

The `advanced` folder contains two main components, `DecryptAccount.js` and `EncryptAccount.js`, which are responsible for decrypting and encrypting Aleo accounts, respectively. These components are built using React and the Ant Design library for UI components and utilize the Aleo WASM library for cryptographic functions.

`DecryptAccount.js` provides a UI for users to input their encrypted private key ciphertext and a password. The component maintains three state variables: `accountFromCiphertext`, `inputCiphertext`, and `inputPassword`. It defines two event handlers, `onCiphertextChange` and `onPasswordChange`, to handle changes in the input fields. When either input changes, the corresponding event handler attempts to decrypt the private key ciphertext using the provided password. If successful, the decrypted account information is stored in `accountFromCiphertext`. The component's UI consists of a card containing a form with two input fields and, if the decryption is successful, an additional form displaying the decrypted private key, view key, and address.

Example usage of `DecryptAccount` component:

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

`EncryptAccount.js` provides a UI for users to generate a new Aleo account and encrypt the private key using a password. The component uses the `useState` hook to manage the state of the account, encrypted account, loading status, and password. It defines functions `generateAccount`, `encryptAccount`, and `clear` to create a new Aleo private key, encrypt the private key using the provided password, and reset the state, respectively. The `onPasswordChange` function updates the password state when the user inputs a new password. The component renders a form with buttons to generate a new account, clear the form, and encrypt the account. When an account is generated, the form displays the private key, view key, and address. The user can input a password to encrypt the account, and the encrypted private key is displayed as ciphertext.

Example usage of `EncryptAccount` component:

```jsx
import { EncryptAccount } from "./path/to/EncryptAccount";

function App() {
  return (
    <div>
      <EncryptAccount />
    </div>
  );
}

export default App;
```

These components can be used in the larger Aleo project to provide users with an interface for creating, encrypting, and decrypting their accounts, ensuring the security of their private keys.
