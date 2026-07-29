---
name: snarkvm-upgrade
description: Use when upgrading the SDK's snarkVM dependency to the latest tagged release — resolves the latest non-testnet tag, reviews the upstream changeset, migrates wasm/ and sdk/ code, verifies with the full test suite, bumps npm package versions, and opens a PR against mainnet.
---

# SnarkVM Upgrade

Upgrades every `snarkvm-*` dependency in `wasm/Cargo.toml` to the latest
non-testnet release tag of [ProvableHQ/snarkVM](https://github.com/ProvableHQ/snarkVM),
migrates the SDK for API changes, verifies the full test suite, bumps npm
package versions, and opens a PR against `mainnet` for human review.

Hard rules:

- Never open a PR with failing tests. If a migration cannot be made green,
  stop and report the blocking failure instead.
- Read `.agents/voice.md` before editing any code. Every comment, JSDoc
  block, Rust `///` doc comment, and prose change MUST follow it.
- No Co-Authored-By or other attribution lines in commits.

## Step 1: Determine whether an upgrade is needed

This procedure runs interactively, on a developer machine. The
`update-snarkvm.yml` workflow only notices that a release exists and files an
issue; it deliberately does not migrate, because the build-edit-build loop
needs incremental compiles and a human in the loop.

From the repo root, on a clean checkout of `mainnet`:

```bash
bash scripts/check-snarkvm-version.sh wasm/Cargo.toml
```

The script prints `PIN_STYLE`, `CURRENT`, `LATEST`, `UPDATE_NEEDED`, and
`CRATES_PUBLISHED` (`true` only when EVERY `snarkvm-*` crate in the
Cargo.toml has `LATEST` on crates.io — a half-published release reports
`false`).

**If `UPDATE_NEEDED=false`, report that the SDK is already on the latest
snarkVM release tag and STOP.** Nothing below runs.

## Step 2: Review the upstream changeset

Compare the current pin to the target tag. `<old>` is `CURRENT` when set,
otherwise the raw `rev` from `wasm/Cargo.toml`:

```bash
gh api "repos/ProvableHQ/snarkVM/compare/<old>...<LATEST>" --jq '.commits[].commit.message' | head -100
gh api "repos/ProvableHQ/snarkVM/compare/<old>...<LATEST>" --jq '.files[].filename' | sort -u
gh api "repos/ProvableHQ/snarkVM/releases/tags/<LATEST>" --jq '.body'
```

A 404 on the last one just means the tag was pushed without release notes;
continue without them.

Identify changes to APIs the SDK consumes: anything imported in
`wasm/src/` (grep for the changed module paths), and transitively the
TypeScript surface in `sdk/src/wasm.ts`.

Known migration patterns from previous upgrades (patch bumps are usually
clean; minor jumps have required all of these at once):

- **`Process<N>` lock/guard refactor:** `add_program*` moved onto
  `ProcessExclusiveGuard`; `process.add_program(x)` becomes
  `process.lock().add_program(x)`.
- **`verify_execution` is an associated fn** (no `self`) with a 5th arg
  `execution_stacks: &IndexMap<ProgramID<N>, Arc<Stack<N>>>`. Build it from
  `process.get_stack(transition.program_id())` per transition.
  Defaults-to-latest values: `consensus_version_from_u8(255)`,
  `VarunaVersion::V2`, `InclusionVersion::V1`.
- **rand 0.8 → 0.10:** `StdRng::from_entropy()` →
  `rand::make_rng::<StdRng>()`, `rand::thread_rng()` → `rand::rng()`,
  `.gen()` → `.random()`. Old rngs no longer satisfy `CryptoRng`.
- **getrandom 0.4 on wasm32:** requires the `wasm_js` feature AND
  `--cfg getrandom_backend="wasm_js"` appended to `build.rustflags` in the
  wasm rollup config — not via the `RUSTFLAGS` env var, which clobbers the
  atomics flags.

## Step 3: Create the working branch

```bash
git checkout mainnet && git pull
git checkout -b "update-snarkvm-<LATEST>"
```

## Step 4: Update wasm/Cargo.toml

Rewrite every `[dependencies.snarkvm-*]` block (there are 10), preserving
each block's `features` and `default-features` keys exactly:

- **If `CRATES_PUBLISHED=true`** (the script has already confirmed every
  `snarkvm-*` crate individually): delete the `git` and `rev`/`tag` keys and
  set `version = "<LATEST without the v prefix>"`.
- **If `CRATES_PUBLISHED=false`:** keep
  `git = "https://github.com/ProvableHQ/snarkVM.git"`, delete `rev`, and set
  `tag = "<LATEST>"`. Delete any `version` key in the block too — alongside a
  `git` source Cargo treats it as a requirement the source must satisfy, so a
  stale one fails the build outright on a major bump.

Prefer crates.io: a `version` pin is the goal and the git `tag` is only the
fallback for a release that is not fully published yet. Never leave a `rev`
pin in place after an upgrade — write `version` or `tag`, so the next run's
`CURRENT` resolves to a release tag rather than a bare commit.

`wasm/Cargo.lock` refreshes as a side effect of the first build in Step 6.
After that build, check `git diff wasm/Cargo.lock` — only `snarkvm-*` crates
and their new transitive dependencies should change. Unrelated churn means
the lockfile was regenerated too aggressively; restore and rebuild.

## Step 5: Migrate the code

Read `.agents/voice.md` now, before editing.

1. Fix `wasm/src/` for the API changes found in Step 2.
2. If the exposed WASM API surface changed (new/renamed/removed
   wasm-bindgen exports), update `sdk/src/` — starting from
   `sdk/src/wasm.ts`, which re-exports every WASM type.
3. Update tests in `sdk/tests/` and wasm tests when behavior changed —
   fix tests to match intended new behavior, never delete them to go green.

## Step 6: Verify

Locally, run all three in this order, fixing failures and repeating until
they pass:

```bash
yarn test:wasm
yarn build:all
yarn test:sdk
```

Both test commands need `PUZZLE_PK` (and `PUZZLE_VK` for the record scanner
tests) exported — several non-skipped wasm and SDK tests decrypt fixtures
with that key and fail outright when it is unset. A failure that traces back
to a missing key is an environment problem, not a migration problem — never
edit a test to route around it.

## Step 7: Bump package versions

The three published packages move in lockstep, so read what npm currently
serves (NOT the local version — they can differ) and confirm the three agree:

```bash
npm view @provablehq/wasm version
npm view @provablehq/sdk version
npm view create-leo-app version
```

If any registry query fails, stop and report — a PR without the version
bumps is incomplete. If the three do NOT agree, stop and report as well:
the single-argument script below cannot express divergent versions, and
guessing which one leads is not this skill's call to make.

Then apply one patch bump with the repo's own script, from the repo root:

```bash
yarn change-version <version>   # e.g. 0.11.5 -> 0.11.6
```

Do NOT hand-edit the versions. Two different things need to move, and the
second is much wider than it looks:

1. **The three published packages get a new `version`** — `wasm/`, `sdk/`
   and `create-leo-app/package.json` — plus the `[package] version` of the
   `aleo-wasm` crate in `wasm/Cargo.toml`, which must not drift behind them.
2. **Every `package.json` in the repo that names `@provablehq/wasm` or
   `@provablehq/sdk` gets its dependency reference updated**, whether or not
   that package is published. At the time of writing that is 24 files:
   `sdk/package.json` (`@provablehq/wasm`), 18 `create-leo-app/template-*`,
   all four `e2e/*`, and `website/`. The `e2e/*` and `website/` ones are the
   easy ones to forget — they are not published, so nothing about them
   changes except the reference, and a stale reference there resolves to the
   previously published package instead of the code in this PR.

`scripts/change-version.js` does all of it: it globs every `package.json`
outside `node_modules` and rewrites both dependency names wherever they
appear, in `dependencies` or `devDependencies` alike. Do not maintain a
hand-written list of paths — a new workspace would silently miss the bump.

Then prove the sweep is complete rather than assuming it. This prints
nothing when every reference points at the new version, and prints the
offenders when it does not:

```bash
grep -rn --include=package.json -E '"@provablehq/(sdk|wasm)": *"' . \
    | grep -v '/node_modules/' \
    | grep -v '"\^<new version>"'
```

Anything it lists is either a file the glob missed or a spec it could not
rewrite (a `workspace:` or pinned-exact range, for example). Fix those by
hand and report them in the PR body — the sweep is part of the upgrade, not
an optional tidy-up.

Confirm the crate came along too, since it is the one a manual pass tends to
leave behind:

```bash
bash scripts/check-package-versions.sh
```

It asserts that the `aleo-wasm` crate version equals the `@provablehq/wasm`
npm version and exits nonzero on a mismatch, so it fails loudly instead of
needing to be read. If it reports `MISMATCH`, re-run `yarn change-version`
rather than patching one file by hand.

## Step 8: Commit and open the PR

```bash
git add -A
git commit -m "Update snarkVM to <LATEST> and bump package versions to <new version>"
git push -u origin "update-snarkvm-<LATEST>"
gh pr create --base mainnet --title "Update snarkVM to <LATEST>" --body "<body>"
```

The PR body MUST cover:

- Old and new snarkVM versions, and the pin style chosen (crates.io
  `version` vs git `tag`) with the `CRATES_PUBLISHED` result.
- A summary of the upstream changeset and every migration applied.
- Test results, stated as exactly what you ran and nothing more:
  confirmation that `yarn test:wasm`, `yarn build:all` and `yarn test:sdk`
  all passed. Never claim a result you did not observe.
- The version bumps applied: the new version, the crate version alongside
  it, and confirmation that the `@provablehq/*` dependency sweep came back
  clean. Name any file that needed a hand fix.
