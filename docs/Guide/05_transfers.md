---
id: transfers
title: Aleo Credit Transfers
sidebar_label: Aleo Credits Transfers
---

# Aleo Credit Transfers

##  Aleo credits

Aleo Credits are used to access blockspace and computational resources on the network, with users paying Credits to submit transactions and have them processed.

Aleo credits are defined in the [credits.aleo](https://explorer.provable.com/program/credits.aleo) program. This program is
deployed to the Aleo network and defines data structures representing Aleo credits and the functions used to manage them.

There are two ways to hold Aleo credits:

### 1 - Private balances via  `credits.aleo` records
The first method is owning a `credits` record which enables a participant in the Aleo
network to hold a private balance of Aleo credits.
```
record credits:
    owner as address.private;
    microcredits as u64.private;
```

A user's total private credits balance will consist of all unspent `credits` records owned by the user with a non-zero
`microcredits` value.

### 2 - Public balances via `credits.aleo` account mappings
The second method is by holding a `balance` in the `account` mapping in the `credits.aleo` program on the Aleo network.

```
mapping account:
    key owner as address.public;
    value microcredits as u64.public;
```

The total public credits balance of a user is the value of the account mapping at the user's address. Users can hold both private and public balances simultaneously.

## Transferring Aleo credits
The `ProgramManager` allows transfers of Aleo credits via the `transfer` method. This function executes the `credits.aleo`
program under the hood.

There are four transfer functions available.

### 1. `transfer_private`

Takes a `credits` record owned by the sender, subtracts an amount from it, and adds that amount
to a new record owned by the receiver. This function is 100% private and does not affect the `account` mapping.

```mermaid
graph LR
    user1--record1 \n owner: user1address \n balance: 10000u64-->t1[transfer_private]
    user1--amount: 4000u64-->t1
    t1-.record2 \n owner: user1address \n amount: 6000u64.->user1
    t1--record3  \n owner: user2address \n balance: 4000u64-->user2

```

### 2. `transfer_private_to_public`

Takes a `credits` record owned by the sender, subtracts an amount from it, and adds
that amount to the `account` mapping of the receiver. This function is 50% private and 50% public. It consumes a record
as a private input and generates a public balance in the `account` mapping entry belonging to the receiver.

```mermaid
graph LR
    subgraph credits.aleo
        m1[account mapping \n key: user3address \n value: 3000u64]
    end
    user1--record3 \n owner: user2address \n balance: 4000u64-->t1[transfer_private_to_public]
    t1-.record4 \n owner: user2address \n amount: 1000u64.->user1
    t1--amount 3000u64-->m1
```

### 3. `transfer_public`

Subtracts an amount of `credits` stored in the `account` mapping of the `credits.aleo` program, and
adds that amount to the `account` mapping of the receiver. This function is 100% public and does not consume or generate
any records.

```mermaid
graph LR
    subgraph credits.aleo account mappings - state 2
        m3[account mapping \n key: user4address \n value: 3000u64]
        m4[account mapping \n key: user3address \n value: 0u64]
    end

    subgraph credits.aleo account mappings - state 1
        m2[account mapping \n key: user3address \n value: 3000u64]--transfer_public \n recipient: user4address \n amount: 3000u64-->m3
        m1[account mapping \n key: user4address \n value: N/A]
    end
```

### 4. `transfer_public_to_private`

Subtracts an amount `credits` stored in the `account` mapping of the `credits.aleo program`
and adds that amount to a new private record owned by the receiver. This function is 50% private and 50% public.
It publicly consumes a balance in the `account` mapping entry belonging to the sender and generates a private record
as a private output.

```mermaid
graph LR
    subgraph credits.aleo account mappings - state 2
        m2[account mapping \n key: user5address \n value: 0u64]
    end

    subgraph credits.aleo account mappings - state 1
        m1[account mapping \n key: user5address \n value: 3000u64]
    end

    m1--recipient: user6address \n amount: 3000u64-->transfer_public_to_private
    transfer_public_to_private--record5 \n owner: user6address \n amount: 3000u64-->user6
```

All four of these functions can be used to transfer credits between users via the `transfer` function in the
`ProgramManager` by specifying the transfer type as the third argument.

```typescript
import { Account, ProgramManager, AleoKeyProvider, NetworkRecordProvider, AleoNetworkClient } from '@provablehq/sdk';

// Create a new NetworkClient, KeyProvider, and RecordProvider
const account = Account.from_string({privateKey: "user1PrivateKey"});
const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);

// Initialize a program manager with the key provider to automatically fetch keys for executions
const myAddress = account.address();
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
programManager.setAccount(account);

// Send a private transfer to yourself
const tx_id = await programManager.transfer(1, myAddress, "transfer_private", 0.2);

// Update or initialize a public balance in your own account mapping
const tx_id_2 = await programManager.transfer(1, myAddress, "transfer_private_to_public", 0.2);

// Check the value of your public balance
let public_balance = programManager.networkClient.getMappingValue("credits.aleo", myAddress);
assert(public_balance === 0.2*1_000_000);

/// Send public transfer to another user
const USER_2_ADDRESS = "user2Address";
const tx_id_3 = await programManager.transfer(1, USER_2_ADDRESS, "transfer_public", 0.1);

// Check the value of the public balance and assert that it has been updated
public_balance = programManager.networkClient.getMappingValue("credits.aleo", myAddress);
const user2_public_balance = programManager.networkClient.getMappingValue("credits.aleo", myAddress);
assert(public_balance === 0.1*1_000_000);
assert(user2_public_balance === 0.1*1_000_000);

/// Create a private record from a public balance
const tx_id_4 = await programManager.transfer(1, myAddress, "transfer_public_to_private", 0.1);

// Check the value of the public balance and assert that it has been updated
public_balance = programManager.networkClient.getMappingValue("credits.aleo", myAddress);
assert(public_balance === 0);
```

## Checking public balances
As shown above, a public balance of any address can be checked with `getMappingValue` function of the `NetworkClient`.

```typescript
const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
const USER_1_ADDRESS = "user1Address";
const public_balance = networkClient.getMappingValue("credits.aleo", USER_1_ADDRESS);
```