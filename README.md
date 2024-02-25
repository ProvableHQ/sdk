<img alt="Aleo SDK" width="1412" src="./.resources/banner.png">
<p align="center">
    <a href="https://developer.aleo.org"> <img alt="Website" src="https://img.shields.io/badge/Developer_Docs-online-blue"></a>
    <a href="https://circleci.com/gh/AleoHQ/aleo"><img src="https://circleci.com/gh/AleoHQ/sdk.svg?style=svg"></a>
    <a href="https://discord.com/invite/aleo"><img src="https://img.shields.io/discord/700454073459015690?logo=discord"/></a>
    <a href="https://github.com/AleoHQ/sdk#%EF%B8%8F-contributors"><img src="https://img.shields.io/badge/contributors-23-ee8449"/></a>
</p>


# Zero Knowledge Web App SDK

The [Aleo SDK](https://github.com/AleoHQ/sdk) provides tools for building zero knowledge applications. It consists of
several TypeScript & JavaScript libraries which provide the following functionality:
1. [Aleo account  management](https://aleo.tools/account)
2. [Web-based program execution and deployment](https://aleo.tools/develop)
3. [Aleo credit transfers](https://aleo.tools/transfer)
4. [Management of program state and data](https://aleo.tools/record)
5. [Communication with the Aleo network](https://aleo.tools/rest)

All of this functionality is demonstrated on [Aleo.tools](https://aleo.tools). 


The Aleo SDK is divided into three Typescript/Javascript packages

## 1. Aleo SDK - Build Zero Knowledge Web Apps

<a href="https://www.npmjs.com/package/@aleohq/sdk"> <img alt="Aleo SDK" src="https://img.shields.io/npm/l/%40aleohq%2Fsdk?label=NPM%20-%20Aleo%20SDK&labelColor=green&color=blue"></a>

The official Aleo SDK providing Javascript/Typescript tools for creating zero knowledge app.

### ⚡ Build your own app

Start here with the [Aleo SDK Readme](/sdk/README.md) to get started building your 
first zero knowledge web app.

#### Source: [`sdk/sdk`](/sdk)


## 2. Create-Aleo-App - Zero Knowledge Web App Examples
<a href="https://www.npmjs.com/package/create-aleo-app"> <img alt="Create Aleo App" src="https://img.shields.io/npm/l/create-aleo-app?label=NPM%20-%20Create-Aleo-App&labelColor=green&color=blue"></a>

Create-aleo-app provides zero-knowledge web app examples in common web frameworks such as React. Developers looking to
start with working examples should start here.

### ⚡ Build your own app


You can start with a template by running
```bash
npm create aleo-app@latest
```

#### Source: [`sdk/create-aleo-app`](/create-aleo-app)

## 3. Aleo-Wasm - Zero Knowledge Algorithms in JavaScript + WebAssembly
<a href="https://www.npmjs.com/package/@aleohq/wasm"> <img alt="Create Aleo App" src="https://img.shields.io/npm/l/%40aleohq%2Fwasm?label=NPM%20-%20Aleo%20Wasm&labelColor=green&color=blue"></a>
<a href="https://www.npmjs.com/package/@aleohq/nodejs"> <img alt="Create Aleo App" src="https://img.shields.io/npm/l/%40aleohq%2Fnodejs?label=NPM%20-%20Aleo%20Nodejs&labelColor=green&color=blue"></a>
<a href="https://crates.io/crates/aleo-wasm"> <img alt="Aleo-Wasm" src="https://img.shields.io/crates/v/aleo-wasm.svg?color=neon"></a>

Aleo Wasm is a Rust crate which compiles Aleo code responsible for creating and executing zero knowledge programs into 
WebAssembly.

When compiled with `wasm-pack` JavaScript bindings are generated for the WebAssembly allowing Aleo zero
knowledge programs to be used in the browser and NodeJS. This package is available on NPM (linked above). The Aleo WASM
Readme provides instructions for compiling this crate and using it in web projects for those interested in building from
source.

❗ Currently program execution is only available in web Browsers. However account, program and data management within
NodeJS is functional.

Source: [`sdk/wasm`](/wasm)

## 📚 Documentation

#### [API Documentation](https://developer.aleo.org/sdk/typescript/overview)
API Documentation, tutorials for the Aleo SDK, and documentation on how to build Leo and Aleo Instructions programs can
be found on the [Aleo Developer Docs](https://developer.aleo.org/sdk/typescript/overview) page.

#### [SDK Readme](/sdk/README.md)
The SDK Readme provides concepts core to executing zero knowledge programs in the web and several detailed examples of
how to use the SDK to build web apps using Aleo.

#### [Aleo Wasm Readme](/wasm/README.md)
The Aleo Wasm Readme provides instructions for compiling the Aleo Wasm crate and using it in web projects. Those who
want to build from source or create their own WebAssembly bindings should start here

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
      <td align="center" valign="top" width="14.28%"><a href="https://alessandrocoglio.info"><img src="https://avatars.githubusercontent.com/u/2409151?v=4?s=100" width="100px;" alt="Alessandro Coglio"/><br /><sub><b>Alessandro Coglio</b></sub></a><br /><a href="https://github.com/AleoHQ/sdk/commits?author=acoglio" title="Documentation">📖</a> <a href="#research-acoglio" title="Research">🔬</a> <a href="https://github.com/AleoHQ/sdk/pulls?q=is%3Apr+reviewed-by%3Aacoglio" title="Reviewed Pull Requests">👀</a></td>
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
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/KendrickDrews"><img src="https://avatars.githubusercontent.com/u/15710081?v=4s=100" width="100px;" alt="Kendrick"/><br /><sub><b>Kendrick</b></sub></a><br /><a href="https://github.com/AleoHQ/sdk/commits?author=KendrickDrews" title="Code">💻</a></td>
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
