# Provable SDK Documentation Voice — Examples

Documentation voice for this repo — JSDoc in `sdk/src/`, Rust `///` doc
comments in `wasm/src/` (they surface in the generated TypeScript
definitions), and prose in `docs/guide/`. The rules bind on every
contribution, human or agent; the examples show what they look like in
practice. Drawn from `sdk/src/program-manager.ts` (JSDoc) and
`docs/guide/05_transfers.md`, `docs/guide/06_executing_programs.md` (prose).

## The rules

- Every public class, function, and exported symbol has a JSDoc comment.
- The first line is a one-sentence summary led by a present-tense verb
  ("Builds a deployment transaction"). Tooling shows the first paragraph, so
  do not bury the summary, and do not open with "This function is designed
  to…".
- Give one or two sentences of context: what it does and when it applies.
- Write comments in the third person or the imperative — never "you", "we",
  or "I". Name the actor ("the caller", "a developer", "the wallet") or drop
  it. Do not write "reach for"; say when the symbol applies ("Applies when…",
  "Use for…", "Suited to…") or state the discriminating fact.
- Document every `@param`, `@returns`, and `@throws` by its consequence, not
  by restating its name. `options — The options for the transaction` is a
  failure.
- Do not repeat TypeScript types in tags. The signature already carries them;
  write `@param to …`, not `@param {string} to …`. Repeated types drift.
- State the default for every optional parameter if a default applies, and
  concisely state the case for when one would choose to use it
  (`@param fee Optional fee in microcredits. Defaults to 0.`).
- Document units, widths, and bounds: microcredits rather than credits where
  applicable, valid ranges, and the numeric width (`number` for u64 and
  smaller, `bigint` for u128 and larger).
- Note side effects: whether the call hits the network, signs, proves
  locally, or is pure and local.
- Document object-type fields with `@property` tags on the type's docblock,
  not with inline per-field comments.
- Include an `@example` that compiles in context.
- `@deprecated` carries a migration path — say what to use instead and when
  it is removed, never just "do not use".
- In prose docs, state facts plainly, anchor unfamiliar concepts to known
  ones, explain why and when, address "a developer" or "the caller", and give
  hard rules emphasis (MUST / Do not).
- Do not write: (A) filler or throat-clearing, (B) restatements of the
  signature, (C) hype adjectives ("powerful", "seamless", "robust", "simply",
  "just"), (D) hedging or statements of the obvious ("it's important to
  note").
- Write concise, clear comments inside function/closure bodies explaining
  what blocks of code do.

## JSDoc

Lead with a verb in the present tense, give one or two sentences of context,
and document each `@param` / `@returns` / `@throws` by its consequence.

### Good

```ts
/**
 * Builds a deployment transaction for submission to the Aleo network.
 *
 * Signs locally and submits to the configured network client, so it reaches
 * the network and costs a fee.
 *
 * @param program Program source code.
 * @param priorityFee Optional priority fee in microcredits (u64). Defaults to 0.
 * @param privateFee Use a private record to pay the fee. If false this uses the
 *   account's public credit balance.
 * @param feeRecord Optional fee record to spend for the fee.
 * @returns The transaction id of the deployed program.
 * @throws If the account cannot cover the fee.
 *
 * @example
 * const id = await programManager.buildDeploymentTransaction(source, 1, true);
 */
```

Why it works: the description starts with "Builds"; the second sentence names the
side effect (network + fee); `priorityFee` gives units and a default; `privateFee`
explains the branch its value selects; the `@example` compiles against the
documented call. Types are not repeated in the tags — the TypeScript signature
already carries them.

### Bad

```ts
/**
 * This function is designed to allow you to easily build a powerful deployment
 * transaction in a seamless way. It's important to note that it returns a result.
 *
 * @param {string} options The options for the deployment transaction.
 * @param {number} fee The fee.
 * @returns {string} The result.
 */
```

Why it fails: "This function is designed to" is filler (A); "powerful" and
"seamless" are hype (C); `options — The options for the deployment transaction`
restates the name (B); `fee — The fee` gives no units, width, or default (B);
"It's important to note" hedges (D); the `{string}`/`{number}` types duplicate the
signature and will drift; no `@example`.

## More JSDoc rules in practice

### Units, widths, and bounds

```ts
// Good — units, width, and range stated.
/** @param amount Amount in microcredits (u64), 1..=u64::MAX. */
// Bad — caller has to guess credits vs microcredits, and the width.
/** @param amount The amount. */
```

Use `number` for u64 and smaller, `bigint` for u128 and larger.

### Defaults for optional params

```ts
// Good.
/** @param network Optional target network. Defaults to "testnet". */
// Bad — the default is hidden in the body.
/** @param network Optional target network. */
```

### Side effects

```ts
// Good — the caller learns it hits the network and signs.
/** Submits the transaction to the connected Aleo node and waits for acceptance. */
// Good — the caller learns it is pure and local.
/** Computes the view key from the private key locally. Does not touch the network. */
```

### Object-type fields with `@property` on the docblock

```ts
// Good — fields documented with @property on the type's docblock.
/**
 * Parameters for a public transfer.
 *
 * @property to Recipient address.
 * @property amount Amount in microcredits (u64).
 * @property priorityFee Optional priority fee in microcredits. Defaults to 0.
 */
export type TransferPublicParams = {
  to: string;
  amount: number;
  priorityFee?: number;
};

// Bad — inline per-field comments instead of @property.
export type TransferPublicParams = {
  to: string; // recipient
  amount: number; // amount
  priorityFee?: number; // fee
};
```

### Third person, imperative — never "you", "we", or "I"

Comments and JSDoc are written in the third person or the imperative mood.
Pronouns referring to the reader or author are banned: no "you", "your", "we",
"our", "I". Name the actor instead — "the caller", "a developer", "the wallet",
"the client" — or drop the actor entirely with an imperative.

```ts
// Good — imperative, no pronoun.
/** Use `getBlocks` for complete block contents. */
// Good — third person, the actor is named.
/** The caller supplies the proving configuration. */
// Bad — second person.
/** Use this when you need complete block contents. */
/** You supply the proving configuration. */
```

### Do not write "reach for"

"Reach for this when…" is a tic; it flags machine-written text. Say when the
symbol applies, or state the discriminating fact and let it choose:

```ts
// Good — states when it applies.
/** Applies when only the header is needed; `getBlock` returns full contents. */
// Good — imperative alternative.
/** Use for header-only queries; `getBlock` returns full contents. */
// Good — the contrast itself does the work.
/** Fetches the block header. `getBlock` fetches the full block. */
// Bad.
/** Reach for this when you need only the header. */
```

### `@deprecated` carries a migration path

```ts
// Good — says what to use instead.
/** @deprecated Use `buildExecutionTransaction` instead; this is removed in 0.12. */
// Bad — leaves the caller stranded.
/** @deprecated Do not use. */
```

## Prose (guides and tutorials)

State facts plainly. Anchor unfamiliar concepts to known ones. Explain why and
when. Address "a developer" or "the caller". Give hard rules emphasis.

### Good

> All value transfers on the Aleo Network are done by calling functions in the
> `credits.aleo` program. A user's total private balance consists of all unspent
> `credits` records the user owns. These records are analogous to UTXOs in
> Bitcoin. `initThreadPool` MUST be called once, before any other operation, and
> never again for the lifetime of the application.

Why it works: declarative; the Bitcoin analogy anchors an unfamiliar idea; the
hard rule is emphasized with MUST.

### Bad

> The SDK provides a powerful and seamless way to easily transfer value. You can
> simply call the function and it will just work. It's worth noting that records
> are an important concept you should probably understand.

Why it fails: hype (C: "powerful", "seamless"), filler ("easily", "simply",
"just"), and hedging (D: "worth noting", "probably") — and it never says what a
record actually is.

## Quick reference

| Anti-pattern | Avoid | Use |
| --- | --- | --- |
| A. Filler | "This function is designed to allow you to…" | "Builds a deployment transaction." |
| B. Restating the signature | "`userId` — the user ID" | "`userId` — owner whose unspent records are summed." |
| C. Hype adjectives | "powerful", "seamless", "robust", "simply", "just" | (delete them) |
| D. Hedging / obvious | "It's important to note that…" | (state the fact directly) |
| Types in tags | `@param {string} to …` | `@param to …` (TS carries the type) |
| Bare optional | `@param fee Optional fee.` | `@param fee Optional fee in microcredits. Defaults to 0.` |
| First/second person | "you", "your", "we", "our", "I" | "the caller", "a developer", or imperative mood |
| "Reach for" | "Reach for this when…" | "Applies when…", "Use for…", "Suited to…", or state the discriminating fact |
