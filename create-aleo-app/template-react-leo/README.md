# React + Aleo + Leo

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/fork/github/AleoHQ/sdk/tree/testnet3/create-aleo-app/template-react)

This template provides a minimal setup to get React and Aleo working in Vite with HMR and some ESLint rules.

This template includes a Leo program that is loaded by the web app located in the `helloworld` directory.

Note: Webpack is currently used for production builds due to a [bug](https://github.com/vitejs/vite/issues/13367) with Vite related to nested workers.

### Start in development mode

```bash
npm run dev
```

Your app should be running on http://localhost:5173/

### Build Leo program

1. Copy the `helloworld/.env.example` file in this directory to `.env` (this will be ignored by Git):

    ```bash
    cd helloworld
    cp .env.example .env
    ```

2. Follow instructions to install Leo here: https://github.com/AleoHQ/leo

3. Edit `helloworld/src/main.leo` and run `leo run` to compile and update the Aleo instructions under `build`.

## Production deployment

### Build

`npm run build`

Upload `dist` folder to your host of choice.

### ⚠️ Header warnings

`DOMException: Failed to execute 'postMessage' on 'Worker': SharedArrayBuffer transfer requires self.crossOriginIsolated`

If you get a warning similar to this when deploying your application, you need to make sure your web server is
configured with the following headers:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

We've included a `_headers` file that works with some web hosts (e.g. Netlify) but depending on your host / server setup
you may need to configure the headers manually.
