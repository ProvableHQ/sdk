<h1 align="center">Aleo SDK</h1>

<p align="center">
    <a href="https://developer.aleo.org"> <img alt="Website" src="https://img.shields.io/badge/Developer_Docs-online-blue"></a>
    <a href="https://circleci.com/gh/AleoHQ/aleo"><img src="https://circleci.com/gh/AleoHQ/sdk.svg?style=svg"></a>
    <a href="https://discord.gg/5v2ynrw2ds"><img src="https://img.shields.io/discord/700454073459015690?logo=discord"/></a>
    <a href="https://github.com/AleoHQ/sdk#%EF%B8%8F-contributors"><img src="https://img.shields.io/badge/contributors-23-ee8449"/></a>
</p>

The Aleo SDK is a developer framework to make it simple to create a new account, craft a transaction,
and broadcast it to the network.

## Table of Contents

* [🍎 Overview](#-overview)
* [🏗️ Build Guide](#-build-guide)
  * [🦀 Install Rust](#-install-rust)
  * [🐙 Build from Source Code](#-build-from-source-code)
* [❤️ Contributors](#-contributors)

## 🍎 Overview

The [Aleo github repository](https://github.com/AleoHQ/sdk) is the home of
1. [`sdk/`](https://github.com/AleoHQ/sdk) - The Aleo SDK in Rust https://crates.io/crates/aleo
2. [`sdk/sdk`](https://github.com/AleoHQ/sdk/tree/testnet3/sdk) - The Aleo SDK in Javascript https://www.npmjs.com/package/@aleohq/sdk
3. [`sdk/wasm`](https://github.com/AleoHQ/sdk/tree/testnet3/wasm) - The Aleo Wasm library in Rust https://crates.io/crates/aleo-wasm
4. [`sdk/wasm/pkg`](https://github.com/AleoHQ/sdk/tree/testnet3/wasm) - The Aleo Wasm library in JavaScript https://www.npmjs.com/package/@aleohq/wasm

We recommend developers to use the interfaces provided by the Aleo SDKs (1. and 2.) for their respective languages.

For more information on Aleo, visit [Welcome to Aleo](https://developer.aleo.org/overview/) to get started.

## 🏗️ Build Guide

### 🦀 Install Rust

We recommend installing Rust using [rustup](https://www.rustup.rs/). You can install `rustup` as follows:

- macOS or Linux:
  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  ```

- Windows (64-bit):

  Download the [Windows 64-bit executable](https://win.rustup.rs/x86_64) or
  [Windows 32-bit executable](https://win.rustup.rs/i686) and follow the on-screen instructions.

### 🐙 Build from Source Code

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

## ❤️ Contributors

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/iamalwaysuncomfortable"><img src="https://avatars.githubusercontent.com/u/26438809?v=4?s=100" width="100px;" alt="Mike Turner"/><br /><sub><b>Mike Turner</b></sub></a><br /><a href="https://github.com/AleoHQ/sdk/commits?author=iamalwaysuncomfortable" title="Code">💻</a> <a href="#maintenance-iamalwaysuncomfortable" title="Maintenance">🚧</a> <a href="#question-iamalwaysuncomfortable" title="Answering Questions">💬</a> <a href="https://github.com/AleoHQ/sdk/pulls?q=is%3Apr+reviewed-by%3Aiamalwaysuncomfortable" title="Reviewed Pull Requests">👀</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/onetrickwolf"><img src="https://avatars.githubusercontent.com/u/13836477?v=4?s=100" width="100px;" alt="Brent C"/><br /><sub><b>Brent C</b></sub></a><br /><a href="https://github.com/AleoHQ/sdk/commits?author=onetrickwolf" title="Code">💻</a> <a href="#maintenance-onetrickwolf" title="Maintenance">🚧</a> <a href="#question-onetrickwolf" title="Answering Questions">💬</a> <a href="https://github.com/AleoHQ/sdk/pulls?q=is%3Apr+reviewed-by%3Aonetrickwolf" title="Reviewed Pull Requests">👀</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/collinc97"><img src="https://avatars.githubusercontent.com/u/16715212?v=4?s=100" width="100px;" alt="Collin Chin"/><br /><sub><b>Collin Chin</b></sub></a><br /><a href="https://github.com/AleoHQ/sdk/commits?author=collinc97" title="Code">💻</a> <a href="#maintenance-collinc97" title="Maintenance">🚧</a> <a href="#question-collinc97" title="Answering Questions">💬</a> <a href="https://github.com/AleoHQ/sdk/pulls?q=is%3Apr+reviewed-by%3Acollinc97" title="Reviewed Pull Requests">👀</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/howardwu"><img src="https://avatars.githubusercontent.com/u/9260812?v=4?s=100" width="100px;" alt="Howard Wu"/><br /><sub><b>Howard Wu</b></sub></a><br /><a href="https://github.com/AleoHQ/sdk/commits?author=howardwu" title="Code">💻</a> <a href="#ideas-howardwu" title="Ideas, Planning, & Feedback">🤔</a> <a href="#research-howardwu" title="Research">🔬</a> <a href="https://github.com/AleoHQ/sdk/pulls?q=is%3Apr+reviewed-by%3Ahowardwu" title="Reviewed Pull Requests">👀</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/raychu86"><img src="https://avatars.githubusercontent.com/u/14917648?v=4?s=100" width="100px;" alt="Raymond Chu"/><br /><sub><b>Raymond Chu</b></sub></a><br /><a href="https://github.com/AleoHQ/sdk/commits?author=raychu86" title="Code">💻</a> <a href="#ideas-raychu86" title="Ideas, Planning, & Feedback">🤔</a> <a href="#research-raychu86" title="Research">🔬</a> <a href="https://github.com/AleoHQ/sdk/pulls?q=is%3Apr+reviewed-by%3Araychu86" title="Reviewed Pull Requests">👀</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/d0cd"><img src="https://avatars.githubusercontent.com/u/23022326?v=4?s=100" width="100px;" alt="d0cd"/><br /><sub><b>d0cd</b></sub></a><br /><a href="https://github.com/AleoHQ/sdk/commits?author=d0cd" title="Code">💻</a> <a href="#ideas-d0cd" title="Ideas, Planning, & Feedback">🤔</a> <a href="#research-d0cd" title="Research">🔬</a> <a href="https://github.com/AleoHQ/sdk/pulls?q=is%3Apr+reviewed-by%3Ad0cd" title="Reviewed Pull Requests">👀</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://www.kestrel.edu/~coglio"><img src="https://avatars.githubusercontent.com/u/2409151?v=4?s=100" width="100px;" alt="Alessandro Coglio"/><br /><sub><b>Alessandro Coglio</b></sub></a><br /><a href="https://github.com/AleoHQ/sdk/commits?author=acoglio" title="Documentation">📖</a> <a href="#research-acoglio" title="Research">🔬</a> <a href="https://github.com/AleoHQ/sdk/pulls?q=is%3Apr+reviewed-by%3Aacoglio" title="Reviewed Pull Requests">👀</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/aharshbe"><img src="https://avatars.githubusercontent.com/u/17191728?v=4?s=100" width="100px;" alt="a h"/><br /><sub><b>a h</b></sub></a><br /><a href="https://github.com/AleoHQ/sdk/commits?author=aharshbe" title="Code">💻</a> <a href="https://github.com/AleoHQ/sdk/commits?author=aharshbe" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/adiprinzio"><img src="https://avatars.githubusercontent.com/u/32148721?v=4?s=100" width="100px;" alt="Anthony DiPrinzio"/><br /><sub><b>Anthony DiPrinzio</b></sub></a><br /><a href="https://github.com/AleoHQ/sdk/commits?author=adiprinzio" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/amousa11"><img src="https://avatars.githubusercontent.com/u/12452142?v=4?s=100" width="100px;" alt="Ali Mousa"/><br /><sub><b>Ali Mousa</b></sub></a><br /><a href="https://github.com/AleoHQ/sdk/commits?author=amousa11" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ilitteri"><img src="https://avatars.githubusercontent.com/u/67517699?v=4?s=100" width="100px;" alt="Ivan Litteri"/><br /><sub><b>Ivan Litteri</b></sub></a><br /><a href="https://github.com/AleoHQ/sdk/commits?author=ilitteri" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.linkedin.com/in/ignacio-avecilla-39386a191/"><img src="https://avatars.githubusercontent.com/u/63374472?v=4?s=100" width="100px;" alt="Nacho Avecilla"/><br /><sub><b>Nacho Avecilla</b></sub></a><br /><a href="https://github.com/AleoHQ/sdk/commits?author=IAvecilla" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ljedrz"><img src="https://avatars.githubusercontent.com/u/3750347?v=4?s=100" width="100px;" alt="ljedrz"/><br /><sub><b>ljedrz</b></sub></a><br /><a href="https://github.com/AleoHQ/sdk/commits?author=ljedrz" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://facundoolano.github.io/"><img src="https://avatars.githubusercontent.com/u/1040941?v=4?s=100" width="100px;" alt="Facundo Olano"/><br /><sub><b>Facundo Olano</b></sub></a><br /><a href="https://github.com/AleoHQ/sdk/commits?author=facundoolano" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ncontinanza"><img src="https://avatars.githubusercontent.com/u/17294394?v=4?s=100" width="100px;" alt="Nicolas Continanza"/><br /><sub><b>Nicolas Continanza</b></sub></a><br /><a href="https://github.com/AleoHQ/sdk/commits?author=ncontinanza" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/fulltimemike"><img src="https://avatars.githubusercontent.com/u/32080293?v=4?s=100" width="100px;" alt="Mike"/><br /><sub><b>Mike</b></sub></a><br /><a href="https://github.com/AleoHQ/sdk/commits?author=fulltimemike" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/jrchatruc"><img src="https://avatars.githubusercontent.com/u/49622509?v=4?s=100" width="100px;" alt="Javier Rodríguez Chatruc"/><br /><sub><b>Javier Rodríguez Chatruc</b></sub></a><br /><a href="https://github.com/AleoHQ/sdk/commits?author=jrchatruc" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/pablodeymo"><img src="https://avatars.githubusercontent.com/u/12279806?v=4?s=100" width="100px;" alt="Pablo Deymonnaz"/><br /><sub><b>Pablo Deymonnaz</b></sub></a><br /><a href="https://github.com/AleoHQ/sdk/commits?author=pablodeymo" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/spartucus"><img src="https://avatars.githubusercontent.com/u/6071887?v=4?s=100" width="100px;" alt="Bob Niu"/><br /><sub><b>Bob Niu</b></sub></a><br /><a href="https://github.com/AleoHQ/sdk/commits?author=spartucus" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/dev-sptg"><img src="https://avatars.githubusercontent.com/u/585251?v=4?s=100" width="100px;" alt="sptg"/><br /><sub><b>sptg</b></sub></a><br /><a href="https://github.com/AleoHQ/sdk/commits?author=dev-sptg" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Hamzakh777"><img src="https://avatars.githubusercontent.com/u/40059557?v=4?s=100" width="100px;" alt="Hamza Khchichine"/><br /><sub><b>Hamza Khchichine</b></sub></a><br /><a href="https://github.com/AleoHQ/sdk/commits?author=Hamzakh777" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/features/security"><img src="https://avatars.githubusercontent.com/u/27347476?v=4?s=100" width="100px;" alt="Dependabot"/><br /><sub><b>Dependabot</b></sub></a><br /><a href="https://github.com/AleoHQ/sdk/commits?author=dependabot" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://allcontributors.org/"><img src="https://avatars.githubusercontent.com/u/46410174?v=4?s=100" width="100px;" alt="All Contributors"/><br /><sub><b>All Contributors</b></sub></a><br /><a href="https://github.com/AleoHQ/sdk/commits?author=all-contributors" title="Documentation">📖</a></td>
    </tr>
  </tbody>
  <tfoot>
    <tr>
      <td align="center" size="13px" colspan="7">
        <img src="https://raw.githubusercontent.com/all-contributors/all-contributors-cli/1b8533af435da9854653492b1327a23a4dbd0a10/assets/logo-small.svg">
          <a href="https://all-contributors.js.org/docs/en/bot/usage">Add your contributions</a>
        </img>
      </td>
    </tr>
  </tfoot>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!