---
id: public-state-data
title: Public Program State
sidebar_label: Public Program State
---

# Public Program State

## Mappings

Mappings are simple key value stores defined in a program. They are represented by a key and a value each of a specified
type. They are stored directly within the Aleo blockchain and can be publicly read by any participant in the Aleo network.

An example of a mapping usage is the `account` mapping in the `credits.aleo` program.
```
mapping account:
    key owner as address.public;
    value microcredits as u64.public;
```

The `account` mapping is used to store public credit balances on the Aleo network. It takes a public address as a key
and a public `u64` value representing the number of microcredits owned by the address.

Mappings within programs are identified by the `mapping` identifier. Any program where this keyword appears contains an
on-chain mapping. An example of a program that uses a mapping is shown below:
```
program player_mapping_example.aleo

// The mapping identifier representing a score
mapping score:
    key player as address.public;
    value score as u64.public;

// The update score function
function update_score:
    input r0 as address.public;
    input r1 as u64.public;
    async update_score r0 r1 into r2;
    output r2 as player_mapping_example.aleo/update_score.future;

// The finalize code block will be executed by Aleo network nodes.
// When it runs it will update the value of the mapping.
finalize update_score:
    input r0 as address.public;
    input r1 as u64.public;
    get.or_use score[r0] 0u64 into r2;
    add r1 r2 into r3;
    set r3 into account[r0];
```

Note that the above function has a `finalize` identifier. This identifier is used to identify a portion of a function's
code that should be executed by nodes on the Aleo network. Program mappings are updated exclusively by code run by nodes
on the Aleo network written in `finalize` blocks.

### Reading mappings
Any state within a program mapping is public and can be read by any participant in the Aleo network. The `NetworkClient`
class provides the `getMapping` method to read the public mappings within an program and the `getMappingValue` method to
read the value of a specific key within a mapping.

```typescript
import { AleoNetworkClient } from '@provablehq/sdk';

const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
const creditsMappings = networkClient.getMappings("credits.aleo");
assert(creditsMappings === ["account"]);

const publicCredits = networkClient.getMapping("credits.aleo", "[a valid aleo account with zero balance]");
assert(publicCredits === "0u64");
```

### Initializing & updating mappings
Updating mappings is done by executing a program function on the Aleo network which has a finalize block that updates the
program's mapping. For instance, the `transfer_public` function in the `credits.aleo` program updates the `account`
mapping (and thus a user's balance) when called.

```
// The public interface called by users
function transfer_public:
    input r0 as address.public;
    input r1 as u64.public;
    async transfer_public self.caller r0 r1 into r2;
    output r2 as credits.aleo/transfer_public.future;

// The finalize block run by nodes on the Aleo network which update a user's public balance
finalize transfer_public:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u64.public;
    get account[r0] into r3;
    sub r3 r2 into r4;
    set r4 into account[r0];
    get.or_use account[r1] 0u64 into r5;
    add r5 r2 into r6;
    set r6 into account[r1];
```

From the perspective of the caller of the API, this is as simple as executing a normal Aleo function. Given the inputs
to a function with an async scope that updates a mapping are valid, the mapping will either be initialized or updated
by the Aleo Validators when a new block is added. All that the user of the SDK must do is ensure that the inputs to the function are valid.

If function inputs are invalid, the network will return an error, but the fee paid for the transaction will still be
consumed. Therefore, it is important to ensure that the inputs to a function are valid before executing it.

A simple example of a mapping update can be shown by simply executing `transfer_public` as shown below.

```typescript
import { Account, ProgramManager, AleoKeyProvider, NetworkRecordProvider, AleoNetworkClient } from '@provablehq/sdk';

// Create a new NetworkClient, KeyProvider, and RecordProvider
const account = Account.from_string({privateKey: "user1PrivateKey"});
const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
const keyProvider = new AleoKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);

// Initialize a program manager with the key provider to automatically fetch keys for executions
const RECIPIENT_ADDRESS = "user1Address";
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
programManager.setAccount(account);

// Update or initialize a public balance
const tx_id = await programManager.transfer(1, RECIPIENT_ADDRESS, "transfer_private_to_public", 0.2);
```