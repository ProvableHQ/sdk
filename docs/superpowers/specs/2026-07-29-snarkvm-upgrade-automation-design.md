# SnarkVM Upgrade Automation — Design

**Date:** 2026-07-29
**Status:** Approved (Approach A)

## Goal

Automate upgrading the SDK's snarkVM dependency to the latest tagged (non-testnet) release, with Claude handling changeset review and API migrations, verified by the full test suite, and delivered as a PR for human review. The procedure must be runnable both locally (as a skill) and on a schedule in CI (as a GitHub Action).

This **replaces** the existing `.github/workflows/update-snarkvm.yml` (which tracked the snarkVM `staging` branch by commit and PR'd into `staging`).

## Architecture (Approach A)

The procedure lives in one place — a repo skill — and the GitHub Action is a thin wrapper:

1. **Skill** `.agents/skills/snarkvm-upgrade/SKILL.md` — checked into the repo (alongside the existing `provable-sdk-tutorial-docs` skill), invocable locally as `/snarkvm-upgrade` and by Claude in CI. Single source of truth for the whole procedure.
2. **GitHub Action** `.github/workflows/update-snarkvm.yml` — deterministic bash pre-flight (early exit costs zero Claude tokens), then invokes `anthropics/claude-code-action@v1` with a prompt to run the skill.
3. **Global CLAUDE.md edit** — remove "snarkVM update" from the vault-runbook examples in `~/.claude/CLAUDE.md`. The vault runbook itself stays (it covers the separate Demox fork chain); its relevant migration notes are folded into the skill.

## Component 1: Skill (`.agents/skills/snarkvm-upgrade/SKILL.md`)

Procedure encoded by the skill:

1. **Resolve current version.** Parse `wasm/Cargo.toml`. The snarkvm-* deps are pinned either as `version = "X.Y.Z"` (crates.io) or `git = ...` + `rev`/`tag`. If pinned by rev, map the rev to a tag via `git ls-remote --tags https://github.com/ProvableHQ/snarkVM.git` (a rev not at any tag is treated as older than the latest tag; the changeset comparison uses the rev directly).
2. **Find latest non-testnet tag.** `git ls-remote --tags`, keep only tags matching `^v[0-9]+\.[0-9]+\.[0-9]+$` (excludes `testnet*` and any suffixed tags), sort by semver, take the highest.
3. **Early exit** if the current version already equals the latest tag. Report "up to date" and stop.
4. **crates.io check.** Query `https://crates.io/api/v1/crates/<crate>/versions` for the target version (check `snarkvm-wasm` as the representative crate, verify the rest before switching).
   - Published → pin all 10 `snarkvm-*` deps as `version = "X.Y.Z"` (drop `git`/`rev`).
   - Not published → pin `git = "https://github.com/ProvableHQ/snarkVM.git", tag = "vX.Y.Z"`.
   - Feature lists on each dep are preserved exactly.
5. **Review the changeset.** `gh api repos/ProvableHQ/snarkVM/compare/<old>...<new>` plus release notes for the tag. Identify API changes affecting `wasm/src/` (and transitively `sdk/src/`). Known migration patterns (from prior upgrade runs) are listed in the skill as reference:
   - `Process<N>` lock/guard refactor: `add_program*` moved onto `ProcessExclusiveGuard`; `process.add_program(x)` → `process.lock().add_program(x)`.
   - `verify_execution` became an associated fn (no `self`) with a 5th arg `execution_stacks: &IndexMap<ProgramID<N>, Arc<Stack<N>>>`; build from `process.get_stack(transition.program_id())` per transition. Defaults-to-latest: `consensus_version_from_u8(255)`, `VarunaVersion::V2`, `InclusionVersion::V1`.
   - rand 0.8 → 0.10: `StdRng::from_entropy()` → `rand::make_rng::<StdRng>()`, `rand::thread_rng()` → `rand::rng()`, `.gen()` → `.random()`. Old rngs no longer satisfy `CryptoRng`.
   - getrandom 0.4 on wasm32: needs the `wasm_js` feature AND `--cfg getrandom_backend="wasm_js"` appended to `build.rustflags` in the wasm rollup config (not via `RUSTFLAGS` env — that clobbers atomics flags).
6. **Update the SDK.** Apply migrations to `wasm/src/` first, then `sdk/src/` TypeScript if the exposed WASM API surface changed. Regenerate `wasm/Cargo.lock`. All comments, JSDoc, Rust `///` doc comments, and prose written or modified during the upgrade MUST follow the repo documentation voice guide at `.agents/voice.md` — the skill instructs Claude to read it before editing.
7. **Verify** (in order, fixing and repeating until green):
   1. `yarn test:wasm`
   2. `yarn build:all`
   3. `yarn test:sdk`
8. **Version bumps.** For each published workspace package — `@provablehq/wasm`, `@provablehq/sdk`, `create-leo-app` — query `npm view <pkg> version` and set the local `package.json` version to that value +1 patch (semver). Internal cross-references between workspace packages are updated to match.
9. **PR.** Branch `update-snarkvm-<tag>` off `mainnet`; commit; push; `gh pr create --base mainnet` with a body summarizing the changeset, migrations applied, crates.io vs git-tag pin decision, test results, and version bumps. No attribution/Co-Authored-By lines in commits.

## Component 2: GitHub Action (`.github/workflows/update-snarkvm.yml`)

Replaces the existing file entirely.

- **Triggers:** `workflow_dispatch` (manual) + `schedule: cron '0 15 * * *'` — 08:00 PDT. GitHub cron is UTC-only, so this drifts to 07:00 PST in winter (documented in a YAML comment).
- **Permissions:** `contents: write`, `pull-requests: write`.
- **Job flow:**
  1. Checkout `mainnet`.
  2. **Bash pre-flight** (no Claude tokens spent):
     - Extract current pin from `wasm/Cargo.toml`; resolve latest non-testnet tag via `git ls-remote`.
     - Exit success early if current == latest.
     - Exit success early if an open PR from a `update-snarkvm-*` branch already exists (avoid duplicate work).
  3. Install toolchains: Rust per `rust-toolchain.toml`, Node + Yarn, `wasm-pack`/build deps as needed by `yarn build:all`.
  4. `anthropics/claude-code-action@v1`:
     - Prompt: invoke the `snarkvm-upgrade` skill (target tag passed from pre-flight).
     - Auth: `ANTHROPIC_API_KEY` repo secret.
     - Allowed tools scoped to the build/test commands, file edits, `git`, and `gh pr create`.
  5. Workflow summary step reporting outcome (up-to-date / PR URL / failure).

## Component 3: Global CLAUDE.md edit

In `~/.claude/CLAUDE.md`, the vault-runbook clause currently reads "…a runbook there (e.g. snarkVM update, SDK release) — then read that runbook first." Remove the "snarkVM update" example so the vault is no longer the pointer for this procedure. The vault runbook file (`runbooks/snarkvm-update.md`) is left untouched — it documents the Demox fork chain, which this automation does not replace.

## Error handling

- **Skill/CI run fails tests after migration attempts:** the skill does not open a PR with red tests. In CI, the workflow fails with a summary of what broke so a human can pick it up; locally, Claude reports the blocking failure.
- **Tag not on crates.io:** not an error — fall back to git tag pin (per design decision).
- **npm registry query fails:** abort before the version-bump step; a PR without version bumps is not opened (bump is part of the deliverable).
- **Rev not matching any tag** (current state): treated as "behind latest tag"; the compare uses the raw rev.

## Testing the automation itself

- Skill: run `/snarkvm-upgrade` locally against the current repo state (currently pinned to a rev, so it will exercise the full path).
- Action: trigger via `workflow_dispatch` after merge; verify early-exit path by re-running once the PR exists.

## Out of scope (YAGNI)

- Publishing to npm/crates.io (release remains a human step).
- Auto-merging the PR.
- Updating the Demox fork chain (vault runbook still covers that).
- Handling testnet-suffixed or pre-release snarkVM tags.
