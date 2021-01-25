<h1 align="center">Aleo</h1>

<p align="center">
    <a href="https://github.com/AleoHQ/aleo/actions"><img src="https://github.com/AleoHQ/aleo/workflows/CI/badge.svg"></a>
    <a href="https://codecov.io/gh/AleoHQ/aleo"><img src="https://codecov.io/gh/AleoHQ/aleo/branch/master/graph/badge.svg?token=HIVCMHYMTZ"/></a>
    <a href="https://discord.gg/WYQNdbHzZR"><img src="https://img.shields.io/discord/700454073459015690?logo=discord"/></a>
</p>


** ATTENTION: This codebase is in active development. **

Visit [Welcome to Aleo](https://github.com/AleoHQ/welcome) to get started.

## Table of Contents

## 1. Usage Guide

### 1.1 Generate a new Aleo account.

To generate a new Aleo account, run:
```bash
aleo new [OPTIONS]
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