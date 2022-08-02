<h1 align="center">Aleo SDK</h1>

<p align="center">
    <a href="https://github.com/AleoHQ/aleo/actions"><img src="https://github.com/AleoHQ/aleo/workflows/CI/badge.svg"></a>
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

**EthDenver 2022 participants click [here](https://github.com/AleoHQ/bounty-2022-ethdenver).**

For more information, on Aleo visit [Welcome to Aleo](https://developer.aleo.org/aleo/getting_started/overview/) to get started.

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

### 2.2a Build from Crates.io

We recommend installing `aleo` this way. In your terminal, run:

```bash
cargo install aleo
```

Now to use `aleo`, in your terminal, run:
```bash
aleo
```

### 2.2b Build from Source Code

Alternatively, you can install `aleo` by building from the source code as follows:

```bash
# Download the source code
git clone https://github.com/AleoHQ/aleo && cd aleo

# Install Aleo
$ cargo install --path .
```

Now to use `aleo`, in your terminal, run:
```bash
aleo
```

## 3. Usage Guide

### 3.1 Generate a new Aleo account.

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

#### 3.2.1 Create a new project

To create a new project, we'll use the `new` command. Our project:

``` bash
aleo new foo
```

This will create **foo** directory and the files with the basic structure of the project:

- **README.md** having the skeleton of a README with instructions on how to compile.
- **main.aleo** the main file of the source code.
- **program.json** containing the identification of the project in JSON format. Particularly, a dev address and its private key for the program.

Let's open *main.aleo* and define the sum function:

```
// The 'foo.aleo' program.
program foo.aleo;
function sum:
    input r0 as u32.public;
    input r1 as u32.private;
    add r0 r1 into r2;
    output r2 as u32.private;
```

We will dig on what this code means in a second. First, we are going to build our foo program.

#### 3.2.2 Compile a new project

To compile the project, run in the main directory:

``` bash
aleo build
```

You will see output like this:

```
⏳ Compiling 'foo.aleo'...
 • Loaded universal setup (in 1478 ms)
 • Built 'sum' (in 6323 ms)
✅ Built 'foo.aleo' (in "[...]/foo")
```

First, a "universal setup" is loaded into your environment. You can read more about this [here](https://www.aleo.org/post/announcing-aleo-setup) or in the [Marlin paper](https://eprint.iacr.org/2019/1047.pdf).

Once the universal setup is ready, every function in your *main.aleo* file is built, generating this in the output folder:

* **sum.prover** the prover for the sum function.
* **sum.verifier** the verifier for the sum function.
* **main.avm** the bytecode of your aleo program to be run by the VM.

As you can already guess, we have only one `.avm` file for the whole program, but a prover and verifier for every function.

#### 3.2.3 Running a program

You can run a program with the `aleo run` command, followed by the function name you want to execute and its input parameters. Let's run our sum functions:

``` bash
aleo run sum 2u32 3u32
```

when the executing is finished, you should see the following output:

``` bash
🚀 Executing 'foo.aleo/sum'...
 • Calling 'foo.aleo/sum'...
 • Executed 'sum' (in 1170 ms)
➡️  Output
 • 5u32
✅ Executed 'foo.aleo/sum' (in "[...]/foo")
```

As you can see here, the sum function execution lasted 1170ms and the output register was assigned with the `5u32` value, representing the sum of the inputs.

[//]: # (### 3.3 Decrypt an Aleo record ciphertext.)

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
