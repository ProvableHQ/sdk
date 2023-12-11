# React + Aleo + ZKML

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/fork/github/AleoHQ/sdk/tree/testnet3/create-aleo-app/template-react)

This template shows an example of how to use the Aleo SDK with React and ZKML.

Note: Webpack is currently used for production builds due to a
[bug](https://github.com/vitejs/vite/issues/13367) with Vite related to nested
workers.

### Start in development mode

```bash
yarn dev
```

Your app should be running on http://localhost:5173/

## Production deployment

### Build

`yarn run build`

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
