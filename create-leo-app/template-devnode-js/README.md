# Aleo Local Development Server + Node.js

## Initializing a Leo Devnode server
Note:  Prior to the release of Leo 4.4.0, the Leo CLI should be installed from the following commit in order to use the Devnode tool:  [5baf94e](https://github.com/ProvableHQ/leo/pull/28982/commits/5baf94e491189b89dca7c981c2b79dfc6af1d108)

The Leo Devnode server is designed to enable developers to rapidly iterate on their Aleo program design.  Deployment transactions do not require key synthesis or certificate generation and execution transitions do not require proofs.

To initialize a Devnode server, run the following command:
```bash
leo devnode start --private-key APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH
```
with optional `--verbosity` feature flag with settings `0, 1, and 2`.  

There is an additional command which lets users "fast-forward" a specified number of blocks:
```
leo devnode advance N
```
for an integer `N`.

The default setting will initialize the server to the latest Consensus Version.

To terminate the Devnode, simply use `ctrl + c`.

## Example
The example code in the `index.js` file deploys a sample program to the Devnode, then submits an upgrade transaction which adds a new method to the existing program, and then submits an execution transaction that uses the new method.
The code can be run using:
```bash
yarn dev
```
Note:  The Devnode support programs with dependencies, but the SDK's Devnode deploy method does not currently support nested deployments.  Each dependency must be deployed independently using the `buildDevnodeDeploymentTransaction` method.




