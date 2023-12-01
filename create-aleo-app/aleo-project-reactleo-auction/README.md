# React + Aleo + Leo

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/fork/github/AleoHQ/sdk/tree/testnet3/create-aleo-app/template-react)

This template provides a minimal setup to get React and Aleo working in Vite
with HMR and some ESLint rules.

This template includes a Leo program that is loaded by the web app located in
the `helloworld` directory.

Note: Webpack is currently used for production builds due to a
[bug](https://github.com/vitejs/vite/issues/13367) with Vite related to nested
workers.

### Start in development mode

```bash
npm run dev
```

Your app should be running on http://localhost:5173/

### Build Leo program

1. Copy the `helloworld/.env.example` to `helloworld/.env` (this will be ignored
   by Git):

   ```bash
   cd helloworld
   cp .env.example .env
   ```

2. Replace `PRIVATE_KEY=user1PrivateKey` in the `.env` with your own key (you
   can use an existing one or generate your own at https://aleo.tools/account)

3. Follow instructions to install Leo here: https://github.com/AleoHQ/leo

4. You can edit `helloworld/src/main.leo` and run `leo run` to compile and update the
   Aleo instructions under `build` which are loaded by the web app.

## Deploy program from web app

> [!WARNING]  
> This is for demonstration purposes or local testing only, in production applications you
> should avoid building a public facing web app with private key information

Information on generating a private key, seeding a wallet with funds, and finding a spendable record can be found here
if you are unfamiliar: https://developer.aleo.org/testnet/getting_started/deploy_execute_demo

Aleo programs deployed require unique names, make sure to edit the program's name to something unique in `helloworld/src/main.leo`, `helloworld/program.json`, rename `helloworld/inputs/helloworld.in` and rebuild.

1. In the `worker.js` file modify the privateKey to be an account with available
   funds

   ```js
   // Use existing account with funds
   const account = new Account({
     privateKey: "user1PrivateKey",
   });
   ```

2. (Optional) Provide a fee record manually (located in commented code within `worker.js`)

   If you do not provide a manual fee record, the SDK will attempt to scan for a record starting at the latest block. A simple way to speed this up would be to make a public transaction to this account right before deploying.
   
3. Run the web app and hit the deploy button

## Production deployment

### Build

`npm run build`

Upload `dist` folder to your host of choice.

### ⚠️ Header warnings

`DOMException: Failed to execute 'postMessage' on 'Worker': SharedArrayBuffer transfer requires self.crossOriginIsolated`

If you get a warning similar to this when deploying your application, you need
to make sure your web server is configured with the following headers:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

We've included a `_headers` file that works with some web hosts (e.g. Netlify)
but depending on your host / server setup you may need to configure the headers
manually.




### frank




- run a devnet
   - ./devnet.sh for local devnet
   - ./start.sh for aws instances

- record devnet information
   - 👋 Welcome to Aleo! We thank you for running a node and supporting privacy.
   - 🔑 Your development private key for node 0 is APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH
   - 🪪 Your Aleo address is aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px
   - 🧭 Starting a validator node on Aleo Testnet 3 Phase 3 at 0.0.0.0:4130
   - 🌐 Starting the REST server at 0.0.0.0:3030
   - 🔑 Your one-time JWT token is eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhbGVvMXJoZ2R1NzdoZ3lxZDN4amo4dWN1M2pqOXIya3J3ejZtbnp5ZDgwZ25jcjVmeGN3bGg1cnN2enA5cHgiLCJpYXQiOjE3MDEzMDM2NDYsImV4cCI6MjAxNjY2MzY0Nn0.agal7k5NEjFi3VBG3uogCFyg4dGrYSRFzhCzakBJCDM


- regular reactleo execution failing
   - use "https://api.explorer.aleo.org/v1", helloworld.aleo already exists, but execution fails
   - execution fails with "https://api.explorer.aleo.org/v1" // https://api.explorer.aleo.org/v1/testnet3/program/helloworld.aleo
   - execution fails with "https://vm.aleo.org/api" too

- regular reactleo deploy works but getting this error
   - helloworld_test_fronk.aleo
      - https://api.explorer.aleo.org/v1/testnet3/transaction/at1a23m0dj5mr8h35tgrk4cutxyjccv3ywp5tnj9c4g5gdv22wexuzq24xmgs
      - https://api.explorer.aleo.org/v1/testnet3/program/helloworld_test_fronk.aleo
   - helloworld_fronkles9999
      - https://api.explorer.aleo.org/v1/testnet3/transaction/at1zvduvuqgq8ac4y5zxxc5nslhk2gev65etsfwpmn67u4qky77jc9sd4elu2
      - https://api.explorer.aleo.org/v1/testnet3/program/helloworld_fronkles9999.aleo 
   - can't find program id though or txn



- deploy the program on the devnet


- query devnet to see what you did


- figure out auction players


- clean up stuff from devnet