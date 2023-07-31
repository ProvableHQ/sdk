# Aleo SDK Website

This project was bootstrapped with [Vite](https://vitejs.dev/).

## Getting Started

### Prerequisites

-   Follow [SDK Build Guide](https://github.com/AleoHQ/sdk#2-build-guide) to get Rust installed
-   Nodejs `18` or `20`. Install through [official website](https://nodejs.org/) or via a node manager like [NVM](https://github.com/creationix/nvm)
-   [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/)

```bash
rustup toolchain install nightly-2023-05-24
rustup component add rust-src --toolchain nightly-2023-05-24
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

## Available Scripts

In the project directory, you can run:

### `preview:netlify`

Locally preview production build.

### `npm run build`

Builds the app for production to the `dist` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

## `yarn` support

We recommend using `npm` for your package manager but if you want to use `yarn` make sure to replace the following line in your `package.json` file:

```diff
-"@aleohq/wasm": "file:../wasm/pkg-parallel"
+"@aleohq/wasm": "link:../wasm/pkg-parallel",
```
