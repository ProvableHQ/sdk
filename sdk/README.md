# Aleo SDK

## Tools for Building Zero Knowledge Web Apps

The Aleo SDK is a collection of JavaScript libraries for building zero knowledge web applications in both the browser 
and node.js. 

## Overview

Aleo provides the ability to run programs in zero knowledge. The Aleo SDK provides the tools to use these programs 
within the browser and all other levels of the web stack to build privacy protecting applications.

What the Aleo SDK provides (Click to see examples):
* [Tools for executing, deploying, and interacting with Aleo programs in the browser](https://aleo.tools/develop)
* [Aleo account creation and Aleo account data management](https://aleo.tools/account)
* [Management of program state and data](https://aleo.tools/record)
* [Communication with the Aleo network](https://aleo.tools/rest)

This package is published at [**@aleohq/sdk**](https://www.npmjs.com/package/@aleohq/sdk) and makes use of
[**@aleohq/wasm**](https://www.npmjs.com/package/@aleohq/wasm) under the hood.

## Build Guide

To build the project from source, go to the project's root and execute `npm install && npm run build`.

## Documentation

API documentation for this package can be found on the [Aleo Developer Hub](https://developer.aleo.org/sdk/typescript/overview). 

To view the documentation locally, open `docs/index.html`. To regenerate the documentation, run `npx jsdoc --configure jsdoc.json --verbose`

## Usage

This SDK is used to power [Aleo.tools](https://aleo.tools/develop). Aleo.tools is open source and can be used as a 
reference for how to use the SDK to build your own zero knowledge web app.

Sources can be found here: https://github.com/AleoHQ/sdk/tree/testnet3/website

You can visit the [SnarkVM repo](https://github.com/AleoHQ/snarkVM) and [SnarkOS repo](https://github.com/AleoHQ/snarkOS) 
if you're interested in learning more about the architecture that powers the Aleo SDK.
