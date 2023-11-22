# Offline Transaction Builder 

## 1. Overview
This example makes use of concrete implementations of the `KeyProvider` and `KeySearchParams` interfaces designed to 
fetch key material from a local machine. This provides a way to build Aleo execution transactions without being connected
to the internet for use-cases such as hardware wallets or air-gapped machines.

Please note that the key material in this example is assumed to be pre-downloaded onto the machine performing the 
construction of the offline transaction.

`npm start`

Recommend Node.js 20+ for best performance.
