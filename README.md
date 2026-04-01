<p align="center">
    <a href="https://docs.leo-lang.org"> <img alt="Website" src="https://img.shields.io/badge/Developer_Docs-online-blue"></a>
    <a href="https://discord.com/invite/aleo"><img src="https://img.shields.io/discord/700454073459015690?logo=discord"/></a>
    <a href="https://github.com/ProvableHQ/sdk#%EF%B8%8F-contributors"><img src="https://img.shields.io/badge/contributors-23-ee8449"/></a>
</p>

# Zero-Knowledge Web App SDK

The [Provable SDK](https://github.com/ProvableHQ/sdk) provides tools for building zero-knowledge applications on the
[Aleo](https://aleo.org) blockchain. It re-exports core protocol objects from [SnarkVM](https://github.com/ProvableHQ/snarkVM)
as TypeScript & JavaScript libraries so developers can build Aleo dApps, wallets, servers, and CLI tools entirely in JS/TS.

All of this functionality is demonstrated on [Provable.tools](https://provable.tools).

## Table of Contents

📦 [**Packages**](#packages) — [Provable SDK](#1-provable-sdk---build-zero-knowledge-web-apps) · [Create-Leo-App](#2-create-leo-app---zero-knowledge-web-app-examples) · [Aleo Wasm](#3-aleo-wasm---zero-knowledge-algorithms-in-javascript--webassembly)

⚙️ [**Features**](#features) — [Roadmap](#roadmap) · [Core](#core-features) · [Aleo RPC](#aleo-rpc-features) · [AI Agents](#ai-agent-support) · [Networks](#networks-supported) · [Runtimes](#javascript-runtimes--frameworks)

📚 [**Documentation**](#-documentation) — API reference, SDK guide, and tutorials

❤️ [**Contributors**](#%EF%B8%8F-contributors)

---

## Packages

The Provable SDK is divided into three TypeScript/JavaScript packages:

### 1. Provable SDK - Build Zero-Knowledge Web Apps

<a href="https://www.npmjs.com/package/@provablehq/sdk"> <img alt="Provable SDK" src="https://img.shields.io/npm/l/%40provablehq%2Fsdk?label=NPM%20-%20Aleo%20SDK&labelColor=green&color=blue"></a>

The official Provable SDK providing JavaScript/TypeScript tools for creating zero-knowledge applications.

#### ⚡ Build your own app

Start here with the [Provable SDK Readme](https://github.com/ProvableHQ/sdk#readme) to get started building your
first zero-knowledge web app.

Source: [`@provablehq/sdk`](https://www.npmjs.com/package/@provablehq/sdk)

### 2. Create-Leo-App - Zero-Knowledge Web App Examples

<a href="https://www.npmjs.com/package/create-leo-app"> <img alt="Create Leo App" src="https://img.shields.io/npm/l/create-leo-app?label=NPM%20-%20Create-Leo-App&labelColor=green&color=blue"></a>

Create-Leo-App provides zero-knowledge web app examples in common web frameworks such as React. Developers looking to
start with working examples should start here.

Source: [`create-leo-app`](https://github.com/ProvableHQ/sdk/tree/mainnet/create-leo-app)

### 3. Aleo Wasm - Zero-Knowledge Algorithms in JavaScript + WebAssembly

<a href="https://www.npmjs.com/package/@provablehq/wasm"> <img alt="Aleo Wasm" src="https://img.shields.io/npm/l/%40provablehq%2Fwasm?label=NPM%20-%20Aleo%20Wasm&labelColor=green&color=blue"></a>

Aleo Wasm is a Rust crate that compiles the Aleo source code responsible for creating and executing zero-knowledge programs into
WebAssembly.

When compiled with `wasm-pack`, JavaScript bindings are generated for the WebAssembly, allowing Aleo zero-knowledge programs to be used in the browser and Node.js. This package is available on NPM (linked above). The Aleo Wasm
readme provides instructions for compiling this crate and using it in web projects for those interested in building from
source.

Source: [`@provablehq/wasm`](https://www.npmjs.com/package/@provablehq/wasm)

---

# Features

## Roadmap

The SDK feature roadmap can be found in the repo milestones below.

### [Milestones](https://github.com/ProvableHQ/sdk/milestones)

## Core Features

<table>
  <tr>
    <td width="180"><b>🔑 Account Management</b></td>
    <td>Create, import, and encrypt/decrypt Aleo accounts. Full key derivation chain (PrivateKey, ViewKey, ComputeKey, Address, GraphKey). Password-based private key encryption with key material zeroization for secure memory handling.</td>
  </tr>
  <tr>
    <td><b>⚡ Program Execution</b></td>
    <td>Execute arbitrary Aleo programs locally or on-chain. Build and submit execution transactions with zero-knowledge proofs. Offline execution for testing. Dynamic dispatch support.</td>
  </tr>
  <tr>
    <td><b>🚀 Program Deployment</b></td>
    <td>Deploy and upgrade Aleo programs to the network. Fee estimation, devnode deployments, and recursive import resolution.</td>
  </tr>
  <tr>
    <td><b>🔍 Program Inspection</b></td>
    <td>Parse Aleo programs and introspect their structure: list functions, read function input/output types, enumerate mappings with key/value types, inspect record definitions and struct members, and resolve program imports.</td>
  </tr>
  <tr>
    <td><b>📋 Aleo Record Management</b></td>
    <td>Full lifecycle management for Aleo records. Decrypt individual or bulk records in parallel. Read record data fields and check ownership. Discover unspent records via serial number and tag verification. Convert between static and dynamic (Merkle-root) record representations. Generate and share record view keys for selective disclosure.</td>
  </tr>
  <tr>
    <td><b>💸 Credit Transfers</b></td>
    <td>Private, public, private-to-public, and public-to-private Aleo credit transfers. Record join and split operations.</td>
  </tr>
  <tr>
    <td><b>🏛️ Validator Operations</b></td>
    <td>Bond/unbond validators, claim unbonded credits, and set validator state.</td>
  </tr>
  <tr>
    <td><b>🌐 Network Client</b></td>
    <td>Full REST API client for the Aleo network: query blocks, transactions, programs, mappings, mempool, committee state, state roots, and public balances. Submit transactions and poll for confirmation.</td>
  </tr>
  <tr>
    <td><b>🧮 Cryptographic Primitives</b></td>
    <td>Field, Group, and Scalar types. Hash functions: BHP256/512/768/1024, Pedersen64/128, Poseidon2/4/8. Digital signatures over raw bytes and typed Aleo values. These primitives enable custom cryptographic schemes for Aleo dApps, wallets that support Aleo, and servers and CLI applications that interact with the Aleo network.</td>
  </tr>
  <tr>
    <td><b>✅ Proof Verification</b></td>
    <td>Single and batch zk-SNARK proof verification. Verify function execution proofs offline.</td>
  </tr>
  <tr>
    <td><b>✍️ Authorization &amp; External Signing</b></td>
    <td>Build execution and fee authorizations offline for hardware wallets, multi-signature schemes, and custom signing flows. Construct execution requests from externally signed data with multiple input-ID resolution strategies (explicit record view keys, view key derivation, pre-computed input IDs).</td>
  </tr>
  <tr>
    <td><b>🗝️ Proving Key Management</b></td>
    <td>Synthesize, cache, fetch, and verify proving/verifying keys. In-memory and file-based keystores. SHA-256 fingerprint verification for key integrity. Offline key provider for air-gapped environments.</td>
  </tr>
  <tr>
    <td><b>🛡️ Security</b></td>
    <td>Private key material zeroization on drop (<code>Zeroize</code> trait in Rust, <code>Symbol.dispose</code> in TS). libsodium <code>crypto_box_seal</code> encryption for delegated proving and record scanner payloads. Encrypted private key storage with password-based symmetric encryption.</td>
  </tr>
</table>

## Aleo RPC Features

<table>
  <tr>
    <td width="180"><b>☁️ Delegated Proving Service</b></td>
    <td>Offload expensive proof generation to a remote proving service. Proving requests and authorizations are encrypted with the service's X25519 public key via libsodium. Supports API key and JWT authentication.</td>
  </tr>
  <tr>
    <td><b>📡 Record Scanner Service</b></td>
    <td>Privacy-preserving record discovery. Register an encrypted view key with the scanner service, then query for owned records without exposing the view key to the network. Supports revocation, status checking, serial number verification, and filtered queries.</td>
  </tr>
  <tr>
    <td><b>⚖️ Sealance Integration</b></td>
    <td>Merkle tree construction and proof generation for compliance and KYC exclusion proofs using the Sealance compliant stablecoin standard.</td>
  </tr>
</table>

## AI Agent Support

<p>
  <img src="https://img.shields.io/badge/Claude_Code-ready-blueviolet?logo=anthropic&logoColor=white" alt="Claude Code">
  <img src="https://img.shields.io/badge/GitHub_Copilot-ready-blueviolet?logo=github&logoColor=white" alt="GitHub Copilot">
  <img src="https://img.shields.io/badge/Cursor-ready-blueviolet?logo=cursor&logoColor=white" alt="Cursor">
</p>

The Provable SDK is designed to be used by AI coding agents out of the box. The repository ships with built-in **agent skills** ([`.agents/skills/`](https://github.com/ProvableHQ/sdk/tree/mainnet/.agents/skills)), project context ([`.claude/`](https://github.com/ProvableHQ/sdk/tree/mainnet/.claude)), and **SDK documentation** ([`docs/`](https://github.com/ProvableHQ/sdk/tree/mainnet/docs)) — including a [step-by-step guide](https://github.com/ProvableHQ/sdk/tree/mainnet/docs/guide), [API reference](https://github.com/ProvableHQ/sdk/tree/mainnet/docs/api_reference), and [runnable examples](https://github.com/ProvableHQ/sdk/tree/mainnet/docs/examples). Together these give AI assistants the context they need to build Aleo dApps, contribute to the SDK, and generate correct code against the Rust/WASM/TypeScript stack — no manual prompting required. Compatible with any agent framework that supports skill files, including [Claude Code](https://docs.anthropic.com/en/docs/claude-code), GitHub Copilot, and Cursor.

## Networks Supported

<table>
  <tr>
    <td width="140"><img src="https://img.shields.io/badge/Mainnet-live-brightgreen" alt="Mainnet"></td>
    <td>Production Aleo mainnet.</td>
  </tr>
  <tr>
    <td><img src="https://img.shields.io/badge/Testnet-live-blue" alt="Testnet"></td>
    <td>Aleo testnet for development and testing.</td>
  </tr>
</table>

## JavaScript Runtimes & Frameworks

<p>
  <img src="https://img.shields.io/badge/Browser-supported-brightgreen?logo=googlechrome&logoColor=white" alt="Browser">
  <img src="https://img.shields.io/badge/Node.js-supported-brightgreen?logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Next.js-supported-brightgreen?logo=nextdotjs&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/Bun-supported-brightgreen?logo=bun&logoColor=white" alt="Bun">
  <img src="https://img.shields.io/badge/Deno-supported-brightgreen?logo=deno&logoColor=white" alt="Deno">
</p>

Full **browser** support with single-threaded and multi-threaded (web worker) modes — multi-threaded uses Rust-native threading via `rayon` for significant performance improvements during proof generation. First-class **Node.js** support for server-side Aleo applications, CLI tools, and backend services. Compatible with **Next.js**, **Bun**, and **Deno**.

---

# 📚 Documentation

| Resource | Description |
|----------|-------------|
| [Aleo RPC / Provable API](https://docs.provable.com) | Documentation on interacting with the Aleo network via Provable's API & RPC endpoints. |
| [SDK Guide](https://developer.aleo.org/sdk/guides/getting_started) | Core concepts for executing zero-knowledge programs on the web, with detailed examples of how to build apps using Aleo. |

---

# ❤️ Contributors

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/iamalwaysuncomfortable"><img src="https://avatars.githubusercontent.com/u/26438809?v=4?s=100" width="100px;" alt="Mike Turner"/><br /><sub><b>Mike Turner</b></sub></a><br /><a href="https://github.com/ProvableHQ/sdk/commits?author=iamalwaysuncomfortable" title="Code">💻</a> <a href="#maintenance-iamalwaysuncomfortable" title="Maintenance">🚧</a> <a href="#question-iamalwaysuncomfortable" title="Answering Questions">💬</a> <a href="https://github.com/ProvableHQ/sdk/pulls?q=is%3Apr+reviewed-by%3Aiamalwaysuncomfortable" title="Reviewed Pull Requests">👀</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/onetrickwolf"><img src="https://avatars.githubusercontent.com/u/13836477?v=4?s=100" width="100px;" alt="Brent C"/><br /><sub><b>Brent C</b></sub></a><br /><a href="https://github.com/ProvableHQ/sdk/commits?author=onetrickwolf" title="Code">💻</a> <a href="#maintenance-onetrickwolf" title="Maintenance">🚧</a> <a href="#question-onetrickwolf" title="Answering Questions">💬</a> <a href="https://github.com/ProvableHQ/sdk/pulls?q=is%3Apr+reviewed-by%3Aonetrickwolf" title="Reviewed Pull Requests">👀</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/collinc97"><img src="https://avatars.githubusercontent.com/u/16715212?v=4?s=100" width="100px;" alt="Collin Chin"/><br /><sub><b>Collin Chin</b></sub></a><br /><a href="https://github.com/ProvableHQ/sdk/commits?author=collinc97" title="Code">💻</a> <a href="#maintenance-collinc97" title="Maintenance">🚧</a> <a href="#question-collinc97" title="Answering Questions">💬</a> <a href="https://github.com/ProvableHQ/sdk/pulls?q=is%3Apr+reviewed-by%3Acollinc97" title="Reviewed Pull Requests">👀</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/howardwu"><img src="https://avatars.githubusercontent.com/u/9260812?v=4?s=100" width="100px;" alt="Howard Wu"/><br /><sub><b>Howard Wu</b></sub></a><br /><a href="https://github.com/ProvableHQ/sdk/commits?author=howardwu" title="Code">💻</a> <a href="#ideas-howardwu" title="Ideas, Planning, & Feedback">🤔</a> <a href="#research-howardwu" title="Research">🔬</a> <a href="https://github.com/ProvableHQ/sdk/pulls?q=is%3Apr+reviewed-by%3Ahowardwu" title="Reviewed Pull Requests">👀</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/raychu86"><img src="https://avatars.githubusercontent.com/u/14917648?v=4?s=100" width="100px;" alt="Raymond Chu"/><br /><sub><b>Raymond Chu</b></sub></a><br /><a href="https://github.com/ProvableHQ/sdk/commits?author=raychu86" title="Code">💻</a> <a href="#ideas-raychu86" title="Ideas, Planning, & Feedback">🤔</a> <a href="#research-raychu86" title="Research">🔬</a> <a href="https://github.com/ProvableHQ/sdk/pulls?q=is%3Apr+reviewed-by%3Araychu86" title="Reviewed Pull Requests">👀</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/d0cd"><img src="https://avatars.githubusercontent.com/u/23022326?v=4?s=100" width="100px;" alt="d0cd"/><br /><sub><b>d0cd</b></sub></a><br /><a href="https://github.com/ProvableHQ/sdk/commits?author=d0cd" title="Code">💻</a> <a href="#ideas-d0cd" title="Ideas, Planning, & Feedback">🤔</a> <a href="#research-d0cd" title="Research">🔬</a> <a href="https://github.com/ProvableHQ/sdk/pulls?q=is%3Apr+reviewed-by%3Ad0cd" title="Reviewed Pull Requests">👀</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://alessandrocoglio.info"><img src="https://avatars.githubusercontent.com/u/2409151?v=4?s=100" width="100px;" alt="Alessandro Coglio"/><br /><sub><b>Alessandro Coglio</b></sub></a><br /><a href="https://github.com/ProvableHQ/sdk/commits?author=acoglio" title="Documentation">📖</a> <a href="#research-acoglio" title="Research">🔬</a> <a href="https://github.com/ProvableHQ/sdk/pulls?q=is%3Apr+reviewed-by%3Aacoglio" title="Reviewed Pull Requests">👀</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/aharshbe"><img src="https://avatars.githubusercontent.com/u/17191728?v=4?s=100" width="100px;" alt="a h"/><br /><sub><b>a h</b></sub></a><br /><a href="https://github.com/ProvableHQ/sdk/commits?author=aharshbe" title="Code">💻</a> <a href="https://github.com/ProvableHQ/sdk/commits?author=aharshbe" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/adiprinzio"><img src="https://avatars.githubusercontent.com/u/32148721?v=4?s=100" width="100px;" alt="Anthony DiPrinzio"/><br /><sub><b>Anthony DiPrinzio</b></sub></a><br /><a href="https://github.com/ProvableHQ/sdk/commits?author=adiprinzio" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/amousa11"><img src="https://avatars.githubusercontent.com/u/12452142?v=4?s=100" width="100px;" alt="Ali Mousa"/><br /><sub><b>Ali Mousa</b></sub></a><br /><a href="https://github.com/ProvableHQ/sdk/commits?author=amousa11" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ilitteri"><img src="https://avatars.githubusercontent.com/u/67517699?v=4?s=100" width="100px;" alt="Ivan Litteri"/><br /><sub><b>Ivan Litteri</b></sub></a><br /><a href="https://github.com/ProvableHQ/sdk/commits?author=ilitteri" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.linkedin.com/in/ignacio-avecilla-39386a191/"><img src="https://avatars.githubusercontent.com/u/63374472?v=4?s=100" width="100px;" alt="Nacho Avecilla"/><br /><sub><b>Nacho Avecilla</b></sub></a><br /><a href="https://github.com/ProvableHQ/sdk/commits?author=IAvecilla" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ljedrz"><img src="https://avatars.githubusercontent.com/u/3750347?v=4?s=100" width="100px;" alt="ljedrz"/><br /><sub><b>ljedrz</b></sub></a><br /><a href="https://github.com/ProvableHQ/sdk/commits?author=ljedrz" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://facundoolano.github.io/"><img src="https://avatars.githubusercontent.com/u/1040941?v=4?s=100" width="100px;" alt="Facundo Olano"/><br /><sub><b>Facundo Olano</b></sub></a><br /><a href="https://github.com/ProvableHQ/sdk/commits?author=facundoolano" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ncontinanza"><img src="https://avatars.githubusercontent.com/u/17294394?v=4?s=100" width="100px;" alt="Nicolas Continanza"/><br /><sub><b>Nicolas Continanza</b></sub></a><br /><a href="https://github.com/ProvableHQ/sdk/commits?author=ncontinanza" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/fulltimemike"><img src="https://avatars.githubusercontent.com/u/32080293?v=4?s=100" width="100px;" alt="Mike"/><br /><sub><b>Mike</b></sub></a><br /><a href="https://github.com/ProvableHQ/sdk/commits?author=fulltimemike" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/jrchatruc"><img src="https://avatars.githubusercontent.com/u/49622509?v=4?s=100" width="100px;" alt="Javier Rodríguez Chatruc"/><br /><sub><b>Javier Rodríguez Chatruc</b></sub></a><br /><a href="https://github.com/ProvableHQ/sdk/commits?author=jrchatruc" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/pablodeymo"><img src="https://avatars.githubusercontent.com/u/12279806?v=4?s=100" width="100px;" alt="Pablo Deymonnaz"/><br /><sub><b>Pablo Deymonnaz</b></sub></a><br /><a href="https://github.com/ProvableHQ/sdk/commits?author=pablodeymo" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/spartucus"><img src="https://avatars.githubusercontent.com/u/6071887?v=4?s=100" width="100px;" alt="Bob Niu"/><br /><sub><b>Bob Niu</b></sub></a><br /><a href="https://github.com/ProvableHQ/sdk/commits?author=spartucus" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/dev-sptg"><img src="https://avatars.githubusercontent.com/u/585251?v=4?s=100" width="100px;" alt="sptg"/><br /><sub><b>sptg</b></sub></a><br /><a href="https://github.com/ProvableHQ/sdk/commits?author=dev-sptg" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Hamzakh777"><img src="https://avatars.githubusercontent.com/u/40059557?v=4?s=100" width="100px;" alt="Hamza Khchichine"/><br /><sub><b>Hamza Khchichine</b></sub></a><br /><a href="https://github.com/ProvableHQ/sdk/commits?author=Hamzakh777" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/KendrickDrews"><img src="https://avatars.githubusercontent.com/u/15710081?v=4s=100" width="100px;" alt="Kendrick"/><br /><sub><b>Kendrick</b></sub></a><br /><a href="https://github.com/ProvableHQ/sdk/commits?author=KendrickDrews" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/features/security"><img src="https://avatars.githubusercontent.com/u/27347476?v=4?s=100" width="100px;" alt="Dependabot"/><br /><sub><b>Dependabot</b></sub></a><br /><a href="https://github.com/ProvableHQ/sdk/commits?author=dependabot" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://allcontributors.org/"><img src="https://avatars.githubusercontent.com/u/46410174?v=4?s=100" width="100px;" alt="All Contributors"/><br /><sub><b>All Contributors</b></sub></a><br /><a href="https://github.com/ProvableHQ/sdk/commits?author=all-contributors" title="Documentation">📖</a></td>
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
