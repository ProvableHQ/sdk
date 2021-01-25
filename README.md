<h1 align="center">Aleo</h1>

<p align="center">
    <a href="https://github.com/AleoHQ/aleo/actions"><img src="https://github.com/AleoHQ/aleo/workflows/CI/badge.svg"></a>
    <a href="https://codecov.io/gh/AleoHQ/aleo"><img src="https://codecov.io/gh/AleoHQ/aleo/branch/master/graph/badge.svg?token=HIVCMHYMTZ"/></a>
    <a href="https://discord.gg/WYQNdbHzZR"><img src="https://img.shields.io/discord/700454073459015690?logo=discord"/></a>
</p>

## Table of Contents

* [1. Overview](#1-overview)
* [2. Build Guide](#2-build-guide)
* [3. Usage Guide](#3-usage-guide)

## 1. Overview

** ATTENTION: This codebase is in active development. **

The Aleo SDK is a developer framework to make it simple to create a new account, craft a transaction,
and broadcast it to the network.

For more information, visit [Welcome to Aleo](https://github.com/AleoHQ/welcome) to get started.

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
aleo new [FLAGS] [OPTIONS]
```

The command can be run with the following optional parameters:
```
FLAGS:
    -h, --help       Prints help information
    -V, --version    Prints version information

OPTIONS:
    -s, --seed <seed> 
```

## Development

```
cargo run --release --example dummy_transaction
```