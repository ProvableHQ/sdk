# Node.js Credits.aleo Functions Example

This example builds execution transactions for all 6 credits.aleo functions
using the ProgramManager: `transfer_public`, `transfer_public_to_private`,
`transfer_private`, `transfer_private_to_public`, `join`, and `split`.

Run all 6 functions:

```bash
yarn start
# or
npm run start
```

Run a single function:

```bash
yarn start transfer_public
# or
npm run start -- transfer_public
```

Available functions: `transfer_public`, `transfer_public_to_private`,
`transfer_private`, `transfer_private_to_public`, `join`, `split`.

Requires network connectivity to fetch inclusion proofs from the explorer API.
Recommend Node.js 20+ for best performance.
