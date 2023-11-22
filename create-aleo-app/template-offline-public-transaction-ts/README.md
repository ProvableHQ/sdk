# Offline Transaction Builder 

## 1. Overview
### 1.1 Proving Keys for Zero Knowledge Function Execution
To achieve zero knowledge execution, all Aleo functions require a `ProvingKey` and `VerifyingKey` in order to build a
zero knowledge ZkSnark proof of execution. If a user does not possess these keys for a function, they are normally
downloaded from the internet when the function is called.

### 1.2 Key Providers
They `KeyProvider` interface is designed to allow users to provide their own implementations for providing key material
to Aleo function executions.

### 1.3 Building Transactions Offline

The `OfflineKeyProvider` enables Transaction Building without connection to the internet.

The `OfflineKeyProvider` and `OfflineSearchParams` are concrete implementations of the `KeyProvider` and `KeySearchParams` 
interfaces. They are designed to fetch proving key material for Aleo functions from a local machine instead of contacting
the internet for it. This provides a way to build Aleo execution transactions without being connected to the internet.

This pathway is suitable for use-cases such as hardware wallets or air-gapped machines used
for building secure transactions.

### 1.4 Assumptions

The key material in this example is assumed to be pre-downloaded onto the machine performing the 
construction of the offline transaction.

## 2. Usage

### 2.1 Pre-Download the Keys
First run this command online to download the key material to disk:

`npm start`

Once this command is run, all proving keys for the `transfer_public`, `bond_public`, `unbond_public`, and
`claim_unbond_public` functions will be downloaded to the `./keys` folder. The machine can then be disconnected from
the internet and the `OfflineKeyProvider` will search this directory for the function proving keys when building the
transaction instead of connecting to the internet. Alternatively you can skip the online step entirely by adding the proving key creating this directory manually and
adding the key material yourself.

### 2.2 Build the Transaction Offline

Once the key material is downloaded, turn off your internet connection and run the following command:

`npm start`

You should see the transactions being built and the resulting transaction IDs printed to the console.

## 3. Notes

Node.js 20+ is recommended for best performance.
