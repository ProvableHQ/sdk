[View code on GitHub](https://github.com/AleoHQ/aleo/.autodoc/docs/json/website/src/tabs/record)

The `DecryptRecord.js` file contains a React functional component called `DecryptRecord` that is responsible for decrypting a given ciphertext using a provided view key. This component is a part of the Aleo project and can be used to provide a user interface for decrypting records, allowing users to view the plaintext content of a record if they have the correct view key.

The `DecryptRecord` component uses the `useState` hook for managing state and the custom `useAleoWASM` hook for interacting with the Aleo WASM library. It renders a form with two input fields: one for the ciphertext and another for the view key. It also provides a "Demo" button to populate the form with sample data, and a "Clear" button to clear the form.

When the ciphertext or view key is changed, the `onCiphertextChange` and `onViewKeyChange` functions are called, respectively. These functions update the state and call the `tryDecrypt` function. The `tryDecrypt` function attempts to decrypt the ciphertext using the view key. If successful, it sets the decrypted plaintext and the ownership status to true. If the decryption fails, it checks if the ciphertext is valid and sets the ownership status to false. If the ciphertext is invalid, it sets the ownership status to null.

The component renders a `Card` containing the form and the decrypted plaintext. If the decryption is successful, the plaintext is displayed in a disabled `Input.TextArea` component, along with a `CopyButton` to copy the plaintext to the clipboard. If the decryption is in progress or has not yet been attempted, a `Skeleton` component is displayed as a placeholder.

Here's an example of how the `DecryptRecord` component might be used in the Aleo project:

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

In this example, the `DecryptRecord` component is imported and used within the `App` component. When rendered, the user will see a form with input fields for the ciphertext and view key, as well as the "Demo" and "Clear" buttons. The user can input their ciphertext and view key, or use the "Demo" button to populate the form with sample data. After inputting the required information, the component will attempt to decrypt the ciphertext and display the decrypted plaintext if successful.
