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

[//]: # (### 3.2 Decrypt an Aleo record ciphertext.)

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
