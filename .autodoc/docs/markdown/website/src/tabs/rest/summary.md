[View code on GitHub](https://github.com/AleoHQ/aleo/.autodoc/docs/json/website/src/tabs/rest)

The `rest` folder contains React components that interact with the Aleo blockchain through API requests. These components allow users to search for blocks, transactions, and programs by their respective identifiers (hash, height, or ID). The components use the Ant Design library for UI components and Axios for making API requests.

1. **GetBlockByHash.js**: This component allows users to search for a specific block by its hash. When a user submits a search, the `tryRequest` function sends an API request to the Aleo VM server to fetch the block data. The fetched data is displayed in a read-only text area with a copy button.

   Example usage:

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

2. **GetBlockByHeight.js**: This component allows users to search for a specific block by its height. Similar to `GetBlockByHash`, it sends an API request to fetch the block data and displays it in a read-only text area with a copy button.

   Example usage:

   ```jsx
   import React from 'react';
   import { GetBlockByHeight } from './aleo/GetBlockByHeight';

   const App = () => {
     return (
       <div>
         <h1>Aleo Blockchain Explorer</h1>
         <GetBlockByHeight />
       </div>
     );
   };

   export default App;
   ```

3. **GetProgram.js**: This component allows users to search for a program by its ID and display its bytecode. It sends an API request to fetch the program bytecode and displays it in a text area with a copy button.

   Example usage:

   ```jsx
   import React from 'react';
   import { GetProgram } from './aleo';

   const App = () => {
     return (
       <div>
         <h1>Search for a Program</h1>
         <GetProgram />
       </div>
     );
   };

   export default App;
   ```

4. **GetTransaction.js**: This component allows users to search for a specific transaction by its transaction ID. It sends an API request to fetch the transaction data and displays it in a read-only text area with a copy button.

   Example usage:

   ```jsx
   import React from 'react';
   import { GetTransaction } from './aleo/GetTransaction';

   function App() {
     return (
       <div>
         <h1>Aleo Transaction Explorer</h1>
         <GetTransaction />
       </div>
     );
   }

   export default App;
   ```

These components can be used together in a larger project, such as an Aleo blockchain explorer, to provide users with the ability to search for and view details about blocks, transactions, and programs on the Aleo blockchain.
