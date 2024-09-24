# Aleo SDK Website

This project was bootstrapped with [Vite](https://vitejs.dev/).

## Getting Started

### Prerequisites

-   Follow the [SDK Build Guide](https://github.com/ProvableHQ/sdk#2-build-guide) to get Rust installed
-   Install Node.js `18` or `20` through the [official website](https://nodejs.org/) or via a node manager like [NVM](https://github.com/creationix/nvm)
-   Install [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/)

```bash
rustup toolchain install nightly-2024-07-21
rustup component add rust-src --toolchain nightly-2024-07-21
yarn
yarn dev
```

Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

## Available Scripts

In the project directory, you can run:

### `yarn build`

Builds the app for production to the `dist` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.
