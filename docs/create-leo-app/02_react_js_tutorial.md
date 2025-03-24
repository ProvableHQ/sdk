# React + Aleo + Leo

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/fork/github/ProvableHQ/sdk/tree/mainnet/create-leo-app/template-react-leo)

This template provides a minimal setup to get React and Aleo working in Webpack or Vite with HMR and some ESLint rules.

This template includes a Leo program that is loaded by the web app located in
the `helloworld` directory.

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
   can use an existing one or generate your own at https://provable.tools/account)

3. Follow instructions to install Leo here: https://github.com/ProvableHQ/leo

4. You can edit `helloworld/src/main.leo` and run `leo run` to compile and update the
   Aleo instructions under `build` which are loaded by the web app.

## Deploy program from web app

> [!WARNING]
> This is for demonstration purposes or local testing only, in production applications you
> should avoid building a public facing web app with private key information

Information on generating a private key, seeding a wallet with funds, and finding a spendable record can be found here
if you are unfamiliar: https://docs.leo-lang.org/testnet/getting_started/deploy_execute_demo

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
