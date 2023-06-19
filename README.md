<h1 align="center">Aleo SDK</h1>

<p align="center">
    <a href="https://circleci.com/gh/AleoHQ/aleo"><img src="https://circleci.com/gh/AleoHQ/sdk.svg?style=svg"></a>
    <a href="https://codecov.io/gh/AleoHQ/aleo"><img src="https://codecov.io/gh/AleoHQ/aleo/branch/main/graph/badge.svg?token=HIVCMHYMTZ"/></a>
    <a href="https://discord.gg/5v2ynrw2ds"><img src="https://img.shields.io/discord/700454073459015690?logo=discord"/></a>
</p>

The Aleo SDK is a developer framework to make it simple to create a new account, craft a transaction,
and broadcast it to the network.

## Table of Contents

* [1. Overview](#1-overview)
* [2. Build Guide](#2-build-guide)
* [3. Usage Guide](#3-usage-guide)

## 1. Overview

The [Aleo github repository](https://github.com/AleoHQ/sdk) is the home of
1. [`sdk/`](https://github.com/AleoHQ/sdk) - The Aleo SDK in Rust https://crates.io/crates/aleo
2. [`sdk/sdk`](https://github.com/AleoHQ/sdk/tree/testnet3/sdk) - The Aleo SDK in Javascript https://www.npmjs.com/package/@aleohq/sdk
3. [`sdk/wasm`](https://github.com/AleoHQ/sdk/tree/testnet3/wasm) - The Aleo Wasm library in Rust https://crates.io/crates/aleo-wasm
4. [`sdk/wasm/pkg`](https://github.com/AleoHQ/sdk/tree/testnet3/wasm) - The Aleo Wasm library in JavaScript https://www.npmjs.com/package/@aleohq/wasm

We recommend developers to use the interfaces provided by the Aleo SDKs (1. and 2.) for their respective languages.

For more information on Aleo, visit [Welcome to Aleo](https://developer.aleo.org/overview/) to get started.

## 2. Build Guide

### 2.1 Install Rust

We recommend installing Rust using [rustup](https://www.rustup.rs/). You can install `rustup` as follows:

- macOS or Linux:
  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  ```

- Windows (64-bit):

  Download the [Windows 64-bit executable](https://win.rustup.rs/x86_64) or
  [Windows 32-bit executable](https://win.rustup.rs/i686) and follow the on-screen instructions.

### 2.2 Build from Source Code

We recommend installing `aleo` this way. In your terminal, run:

```bash
# Download the source code
git clone https://github.com/AleoHQ/sdk.git

# Enter the 'sdk' directory
cd sdk

# Install 'aleo'
cargo install --path .
```

Now to use `aleo`, in your terminal, run:
```bash
aleo
```

## 3. Usage Guide

### 3.1 Generate a new Aleo account

To generate a new Aleo account, run:
```bash
aleo account new [FLAGS] [OPTIONS]
```

The command can be run with the following optional parameters:
```
FLAGS:
    -h, --help       Prints help information
    -V, --version    Prints version information

OPTIONS:
    -s, --seed <seed>
```

### 3.2 Create and build a new project

To create a new project, we'll use the `new` command. Our project:

``` bash
aleo new foo
```

This will create **foo** directory and the files with the basic structure of the project:

- **README.md** having the skeleton of a README with instructions on how to compile.
- **main.aleo** the main file of the source code.
- **program.json** containing the identification of the project in JSON format. Particularly, a dev address and its private key for the program.

The main.aleo file should have contents like this:

```
// The 'foo.aleo' program.
program foo.aleo;

function hello:
    input r0 as u32.public;
    input r1 as u32.private;
    add r0 r1 into r2;
    output r2 as u32.private;
```

To compile the project, run in the main directory:

``` bash
aleo build
```

You will see output like this:

```
⏳ Compiling 'foo.aleo'...
 • Loaded universal setup (in 1478 ms)
 • Built 'hello' (in 3250 ms)
✅ Built 'foo.aleo' (in "~/foo")
```

First, a "universal setup" is loaded into your environment. You can read more about this [here](https://www.aleo.org/post/announcing-aleo-setup) or in the [Marlin paper](https://eprint.iacr.org/2019/1047.pdf).

Once the universal setup is ready, every function in your *main.aleo* file is built, generating this in the output folder:

- **hello.prover** the prover for the `hello` function.
- **hello.verifier** the verifier for the `hello` function.
- **main.avm** the bytecode of your aleo program to be run by the VM.

As you can already guess, we have only one `.avm` file for the whole program, but a prover and verifier for every function.

### 3.3 Running a program

You can run a program with the `aleo run` command, followed by the function name you want to execute and its input parameters

``` bash
aleo run hello 2u32 3u32
```

When the execution is finished, you should see the following output:

``` bash
🚀 Executing 'foo.aleo/hello'...
 • Calling 'foo.aleo/hello'...
 • Executed 'hello' (in 1170 ms)
➡️  Output
 • 5u32
✅ Executed 'foo.aleo/hello' (in "[...]/foo")
```

As you can see, the output register was assigned with the `5u32` value, representing the sum of the inputs.

### 3.4 Overview of a program

Let's examine the foo program inside the *main.aleo* file:

```
// The 'foo.aleo' program.
program foo.aleo;

function hello:
    input r0 as u32.public;
    input r1 as u32.private;
    add r0 r1 into r2;
    output r2 as u32.private;
```

First, we need to declare the program as the following:

```
program foo.aleo;
```

Afterwards, we can start writing its functions (or other Aleo structures such as structs, records, closures, as we will see later).

In the case of functions we have it very easy:

```
function [function_name]:
```

The functions are composed of three main parts:

- **The input section**

  Here we declare its input parameters:
  ```
      input r0 as u32.public;
      input r1 as u32.private;
  ```
  Everything in Aleo instructions is declared/stored inside a register with a type (`i8`,`field`,`bool`, etc.) and a visibility option (`public` or `private`), registers are named `r0`, `r1`, ..., `rn`.

  In this case we use `r0` and `r1` to store the inputs passed in sequential order to a program as `u32` values, where we can store 32-bit unsigned integers to perform our sum operation.

- **The instructions section**

  The next section consists in the core of our function, here we call the amount of Aleo Instructions we need to make our program do what we want. For example, performing an addition operation:
  ```
      add r0 r1 into r2;
  ```
  Every Aleo instruction is followed by its input parameters with its specific types, and the result is stored in the *into* register.

  You can find all the available aleo instructions [here](https://hackmd.io/@aleo/SJ0mrYRv5#shr).

- **The output section**

  Similar to the input section, the output section does the same for the output of the program. It's the return of the function.
  ```
      output r2 as u32.private;
  ```

### 3.5 Types

Aleo uses a strongly-typed syntax. The language supports 16 primitive types, and allows users to define custom types.

The Aleo primitive types include:
```
address
boolean
field
group
i8
i16
i32
i64
i128
u8
u16
u32
u64
u128
scalar
string
```

Users can define custom types using the `structs` or `record` keywords. We will explore these in the next few sections.

#### 3.5.1 Registers

Registers are the places where you store data to then be able to modify it.

#### 3.5.2 Interfaces

Interfaces are user-defined data structures. They are very much like traditional structs in conventional programming languages. You can store structs into registers, like with any other Aleo data types.

For example, let's build a struct representing a fixed-size array of 3 elements. Add this at the bottom of the *main.aleo* file:

```
struct array3:
    a0 as u32;
    a1 as u32;
    a2 as u32;
```

Now, just for example purposes, let's code a function that adds one to each element of a register with an `array3` data type stored in it.

```
function sum_one_to_array3:
    input r0 as array3.private;
    add r0.a0 1u32 into r1;
    add r0.a1 1u32 into r2;
    add r0.a2 1u32 into r3;
    cast r1 r2 r3 into r4 as array3;
    output r4 as array3.private;
```

As you can see, we can input a struct into register `r0` and access struct elements with the `.` syntax. We perform the `add` instruction on every element, storing the results in registers `r1`, `r2` and `r3` and, finally, we make use of the cast command to create a new `array3` struct into `r4`.

Now, let's run it. In this case, the only new thing you need to know is that structs are passed to the CLI in the following format:

```
"{a0: 1u32, a1: 2u32, a2: 3u32}"
```

Now we can execute the `aleo run` command. We will clean the project to pick up the new code:

```
aleo clean && aleo run sum_one_to_array3 "{a0: 0u32, a1: 1u32, a2: 2u32}"
```

And we get the new `array3` element as output:

```
🚀 Executing 'foo.aleo/sum_one_to_array3'...
 • Calling 'foo.aleo/sum_one_to_array3'...
 • Executed 'sum_one_to_array3' (in 1331 ms)
➡️  Output
 • {
  a0: 1u32,
  a1: 2u32,
  a2: 3u32
}
✅ Executed 'foo.aleo/sum_one_to_array3' (in "[...]/foo")
```

#### 3.5.3 Records

A record is a fundamental data structure for encoding user assets and application state. They are very similar to structs, but they have two non-optional parameters:

```
record token:
    owner as address.private
    gates as u64.private
```

the `owner` refers to the Aleo address that owns the record and `gates` is the amount of credits that the record has to spend.

Records are important because they represent the basic Aleo structure to handle state in your application.

When running an Aleo function, only records that belong to the application address can be passed as input registers. Otherwise, an error would be raised and the application wouldn't run.

You can find your development application address inside the *program.json* file:

```
{
    "program": "foo.aleo",
    "version": "0.0.0",
    "description": "",
    "development": {
        "private_key": "APrivateKey1zkpFsQNXJwdvjKs9bRsM91KcwJW1gW4CDtF3FJbgVBAvPds",
        "address": "aleo1x5nz5u4j50w482t5xtqc3jdwly9s8saaxlgjz0wvmuzmxv2l5q9qmypx09"
    },
    "license": "MIT"
}
```

#### 3.5.4 Aleo State

In Aleo, the state of an application is managed through records. An Aleo account can create a transaction to consume a record and produce a new record in its place. Records in Aleo are encrypted to the record owner address, ensuring that all records in Aleo are fully private.


### 3.6 Your first Aleo Program: Making a transfer


Consider this program:
```
// The 'foo.aleo' program.
program foo.aleo;
record token:
    owner as address.private;
    gates as u64.private;
    amount as u64.private;
function transfer_amount:
    //  sender token record
    input r0 as token.record;
    // receiver address
    input r1 as address.private;
    // amount to transfer
    input r2 as u64.private;
    // final balance of sender
    sub r0.amount r2 into r3;
    // final balance of receiver
    add 0u64 r2 into r4;
    // sender token record after the transfer
    cast r0.owner r0.gates r3 into r5 as token.record;
    // receiver token record after the transfer
    cast r1 0u64 r4 into r6 as token.record;
    // sender new token record
    output r5 as token.record;
    // receiver new token record
    output r6 as token.record;
```
First, we define our own record data type called `token`, that has the two non-optional parameters, `owner` and `gates`, and a user-defined parameter called `amount`, representing the amount of tokens we have.

This `transfer_amount` function receives 3 input parameters (`sender` record, `receiver` address and `amount`) and stores them in 3 registers (`r0`, `r1` and `r2`). After that, it computes the final balance for both of them and stores it in `r3` and `r4` (using **sub** and **add** instructions to compute the subtraction and addition respectively). With those final amounts, it creates the output records for sender and receiver, storing them in `r5` and `r6` . Finally, both records are sent out of the function with the **output** instruction.

To run this function, the first parameter is the input record of the program. The format of this parameter is the same as for struct types:

```
{
  owner: aleo1x5nz5u4j50w482t5xtqc3jdwly9s8saaxlgjz0wvmuzmxv2l5q9qmypx09.private,
  gates: 0u64.private,
  amount: 50u64.private
}
```

Where:

- owner: the public address of the program, as found in the `development.address` of the build/program.json file.
- gates: the gates that the record has.
- other parameters: depending on the program itself (in this example, we used the parameter _amount_ with the value 50).

Let's run the `transfer_amount` function (if you are following along, remember to use the address found in the program.json for the owner field):

``` bash
aleo clean && aleo run transfer_amount "{
owner: aleo1x5nz5u4j50w482t5xtqc3jdwly9s8saaxlgjz0wvmuzmxv2l5q9qmypx09.private,
gates: 0u64.private,
amount: 50u64.private
}" aleo1h3gu7fky36y8r7v2x9phc434fgf20g8qd7c7u45v269jfw6vmugqjegcvp 10u64
```

We get the following output records:

```
🚀 Executing 'foo.aleo/transfer_amount'...
 • Calling 'foo.aleo/transfer_amount'...
 • Executed 'transfer_amount' (in 3520 ms)
➡️  Outputs
 • {
  owner: aleo1x5nz5u4j50w482t5xtqc3jdwly9s8saaxlgjz0wvmuzmxv2l5q9qmypx09.private,
  gates: 0u64.private,
  amount: 40u64.private
  _nonce: 2293253577170800572742339369209137467208538700597121244293392265726446806023group.public
}
 • {
  owner: aleo1h3gu7fky36y8r7v2x9phc434fgf20g8qd7c7u45v269jfw6vmugqjegcvp.private,
  gates: 0u64.private,
  amount: 10u64.private
  _nonce: 2323253577170856894742339369235137467208538700597121244293392765726742543235group.public
}
✅ Executed 'foo.aleo/transfer_amount' (in "[...]/foo")
```

And that's it. You have transferred your first own-defined tokens in Aleo!

Note: the `_nonce` is not written in Aleo instructions. The compiler outputs the _nonce in record outputs. The user needs to provide it as input when using a record.

[//]: # (### 3.7 Decrypt an Aleo record ciphertext.)

[//]: # ()
[//]: # (To decrypt a record and view its contexts, run:)

[//]: # (```bash)

[//]: # (aleo record from [FLAGS] [OPTIONS])

[//]: # (```)

[//]: # ()
[//]: # (The command can be run with the following optional parameters:)

[//]: # (```)

[//]: # (FLAGS:)

[//]: # (    -h, --help       Prints help information)

[//]: # (    -V, --version    Prints version information)

[//]: # ()
[//]: # (OPTIONS:)

[//]: # (    -c, --ciphertext <ciphertext> &#40;required&#41; The cipherext hex string.)

[//]: # (    -k, --viewkey <view-key> &#40;required&#41; The Aleo view key string to decrypt the ciphertext.)

[//]: # (```)
