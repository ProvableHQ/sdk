# React Credits.aleo Functions Template

This template demonstrates building execution transactions for 6 credits.aleo
functions that demonstrate value transfers and record manipulation functions in
a React application.

## Functions Demonstrated

### Public Transfers

- **transfer_public**: Transfer credits between public balances.
- **transfer_public_to_private**: Convert public credits to a private record.

### Private Transfers

- **transfer_private**: Transfer credits using private records.
- **transfer_private_to_public**: Convert private record to public balance.

### Record Operations

- **join**: Combine two credit records into one.
- **split**: Split one credit record into two.

## Getting Started

```bash
npm install
npm run dev
```

Your app should be running on http://localhost:5173/

## Key Concepts

### Transaction Building

This template uses `buildExecutionTransaction` to create real transactions that
could be broadcast to the Aleo network. The SDK:

1. Generates zero-knowledge proofs locally in your browser.
2. Builds transactions from the proof ready for broadcast.

**Note:** Transactions are built but not broadcast, so sample records remain
unspent and can be reused.

### Credits Records

Private credits in the credits.aleo program (the official representation of
value on the Aleo Network) are stored as Aleo records with this structure:

```
{
  owner: aleo1xxx...xxx.private, // An aleo address that owns the record.
  microcredits: 1000000u64.private, // The amount in microcredits contained in the record.
  _nonce: 123...789group.public, // The unique nonce identifying the record.
  _version: 1u8.public // The version of the record.
}
```

### Microcredits

1 Aleo credit = 1,000,000 microcredits. All amounts are specified in
microcredits as plain numbers (e.g., `50000`).

## Notes

- Network connectivity is required for this app.
- Public function execution takes ~10-15 seconds.
- Private function execution takes ~30-120 seconds (depending on whether keys
  are locally cached or not).
- Sample records are pre-filled for testing.
- First execution downloads proving keys (~40-100MB).

## Production Build

```bash
npm run build
```

Upload the `dist` folder to your host of choice.

### Header Requirements

If you see `SharedArrayBuffer` errors, ensure your web server has these headers:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

A `_headers` file is included that works with some hosts (e.g., Netlify).
