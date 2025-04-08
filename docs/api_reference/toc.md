# Code documentation

## Table of contents

* ![category:other](https://img.shields.io/badge/category-other-blue.svg?style=flat-square)
  * [src/account](sdk-src_account.md) - _Key Management class. Enables the creation of a new Aleo Account, importation of an existing account from
an existing private key or seed, and message signing and verification functionality. An Aleo Account is generated
from a randomly generated seed (number) from which an account private key, view key, and a public account address are
derived. The private key lies at the root of an Aleo account. It is a highly sensitive secret and should be protected
as it allows for creation of Aleo Program executions and arbitrary value transfers. The View Key allows for decryption
of a user&#x27;s activity on the blockchain. The Address is the public address to which other users of Aleo can send Aleo
credits and other records to. This class should only be used in environments where the safety of the underlying key
material can be assured._
  * [src/function-key-provider](sdk-src_function-key-provider.md) - _AleoKeyProvider class. Implements the KeyProvider interface. Enables the retrieval of Aleo program proving and
verifying keys for the credits.aleo program over http from official Aleo sources and storing and retrieving function
keys from a local memory cache._
  * [src/network-client](sdk-src_network-client.md) - _Client library that encapsulates REST calls to publicly exposed endpoints of Aleo nodes. The methods provided in this
allow users to query public information from the Aleo blockchain and submit transactions to the network._
  * [src/offline-key-provider](sdk-src_offline-key-provider.md) - _A key provider meant for building transactions offline on devices such as hardware wallets. This key provider is not
able to contact the internet for key material and instead relies on the user to insert Aleo function proving &amp;
verifying keys from local storage prior to usage._
  * [src/program-manager](sdk-src_program-manager.md) - _The ProgramManager class is used to execute and deploy programs on the Aleo network and create value transfers._
  * [src/record-provider](sdk-src_record-provider.md) - _BlockHeightSearch is a RecordSearchParams implementation that allows for searching for records within a given
block height range._
  * [src/wasm](sdk-src_wasm.md) - _Verifying key for a function within an Aleo program_

