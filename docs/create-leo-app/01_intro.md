# **Create Leo App**

Easily scaffold an Aleo project with `create-leo-app`. This tool helps
developers quickly set up a project with best practices and pre-configured
templates for working with Aleo smart contracts, zero-knowledge transactions,
and frontend integrations.

Create-leo-app is based on create-vite and follows a similar project structure.
It helps developers bootstrap zero-knowledge applications on the Aleo network.

## Getting Started

_Prerequisites_

Ensure you have:

- Node.js version 18+ installed.
- NPM 6.x+ or Yarn.

### Scaffold Your First Aleo Project!

To create a new Aleo project, run:

`npm create leo-app@latest`

Follow the prompts to select your preferred template. Each template provides
pre-configured dependencies and example code to get started. We recommend that
you explore the generated project files to understand the structure.

**\*Note**: you will need to replace the placeholder private key in the
templates with an actual private key in order to actually interact with the
network. Be sure to follow the best practices at the end of this doc to handle
your private key securely.\*

Read more
[here](https://docs.explorer.provable.com/docs/sdk/ghweubjq0or1x-creating-accounts)
about account creation and deriving an address from your newly generated private
key.

We currently support the following templates:

### 1. Vanilla JavaScript

A minimalistic web app that allows users to engage with the Aleo network.

### 2. React with JavaScript

A React-based frontend that interacts with Aleo smart contracts using
JavaScript.

### 3. React with TypeScript

A TypeScript version of the React template with improved type safety.

### 4. React with TypeScript + Next.js

A Next.js template for building Aleo-powered web applications.

### 5. Node.js

A backend template for building Aleo transactions and interacting with the Aleo
blockchain programmatically.

---

After scaffolding your project, modify and extend it to interact with your Aleo
program.

Learn more about writing Leo programs in our
[official Leo language docs](https://docs.leo-lang.org/leo).

### 🚨KEEP YOUR PRIVATE KEY SAFE!🚨

Do not simply paste your private key into your source code! Here are some basic
safety tips.

- Never hardcode your private key in your codebase (e.g., in your `worker.js`).
- Do not commit your private key to Git or any public repository.
- Use environment variables instead of storing your key in source files.
- Consider a secure key management service for production use.
- Always double-check your clipboard before pasting a private key. Malware can
  swap copied values.
