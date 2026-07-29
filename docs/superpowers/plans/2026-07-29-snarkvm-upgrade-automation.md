# SnarkVM Upgrade Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A repo skill (`/snarkvm-upgrade`) plus a replacement GitHub Action that upgrade the SDK's snarkVM dependency to the latest non-testnet release tag, migrate the code, verify with the full test suite, bump npm package versions, and open a PR against `mainnet`.

**Architecture:** The procedure lives in one skill at `.agents/skills/snarkvm-upgrade/` (with a `.claude/skills/` symlink for discovery). A shared bash script (`check-version.sh`) does deterministic version resolution; the GitHub Action runs it as a pre-flight to exit early with zero Claude tokens, then invokes `anthropics/claude-code-action@v1` with the prompt `/snarkvm-upgrade`.

**Tech Stack:** Bash, GitHub Actions (`anthropics/claude-code-action@v1`, repo composite actions `setup-yarn`/`setup-rust`), Markdown skill.

**Spec:** `docs/superpowers/specs/2026-07-29-snarkvm-upgrade-automation-design.md`

## Global Constraints

- Skill canonical location is `.agents/skills/snarkvm-upgrade/`; `.claude/skills/snarkvm-upgrade` MUST be a real symlink (git mode 120000) — the existing `provable-sdk-tutorial-docs` pointer is a regular file (100644) and does not work.
- All snarkvm deps pin identically: crates.io `version = "X.Y.Z"` when the tag is published there, else `git = "https://github.com/ProvableHQ/snarkVM.git", tag = "vX.Y.Z"`. Feature lists preserved exactly.
- Non-testnet tag filter is exactly `^v[0-9]+\.[0-9]+\.[0-9]+$`, semver-sorted (`sort -V`).
- Verification order is fixed: `yarn test:wasm` → `yarn build:all` → `yarn test:sdk`. No PR with red tests.
- Version bumps: `@provablehq/wasm`, `@provablehq/sdk`, `create-leo-app` each set to `npm view <pkg> version` + 1 patch; cross-references updated (`sdk/package.json` dep on `@provablehq/wasm`, `create-leo-app/template-*/package.json` deps on `@provablehq/sdk`).
- All comments/docs written during an upgrade follow `.agents/voice.md`.
- No Co-Authored-By/attribution lines in commits made by the skill.
- PRs target `mainnet`; branch name `update-snarkvm-<tag>`.
- Cron: `0 15 * * *` (08:00 PDT; UTC-only cron drifts to 07:00 PST in winter — documented in a YAML comment).
- Work happens on the existing `snarkvm-upgrade-automation` branch (spec already committed there).

**Verified facts the plan relies on** (checked 2026-07-29):
- Current pin: `rev = "b7f0859592c75dd251430377240c7697a37ab899"` on all 10 `snarkvm-*` deps — that rev IS tag `v4.8.1`, the latest release tag, so a live run today takes the early-exit path.
- `snarkvm-wasm 4.8.1` is published on crates.io (API returns 200).
- npm published versions: all three packages at `0.11.5`.
- No `actionlint`/`yamllint`/`shellcheck` installed locally — YAML validated with `npx --yes js-yaml`.

---

### Task 1: Shared version-check script

**Files:**
- Create: `.agents/skills/snarkvm-upgrade/scripts/check-version.sh`
- Test fixtures (scratch only, not committed): `/tmp` fixtures below

**Interfaces:**
- Produces: `check-version.sh [path-to-Cargo.toml]` (default `wasm/Cargo.toml`) printing exactly these KEY=VALUE lines on stdout: `PIN_STYLE=version|tag|rev`, `CURRENT=vX.Y.Z` (empty if rev matches no tag), `LATEST=vX.Y.Z`, `UPDATE_NEEDED=true|false`, `CRATES_PUBLISHED=true|false|` (empty when no update needed). Exit 1 with a message on stderr if no snarkvm pin is found. The KEY=VALUE format is consumed verbatim by `$GITHUB_OUTPUT` in Task 3 and read by the skill in Task 2.

- [ ] **Step 1: Create the script**

Write `.agents/skills/snarkvm-upgrade/scripts/check-version.sh` with exactly this content (already validated against the real repo and fixtures):

```bash
#!/usr/bin/env bash
# Resolves the SDK's current snarkVM pin and the latest upstream release tag,
# then reports whether an upgrade is needed and whether the target version is
# published on crates.io.
#
# Emits KEY=VALUE lines on stdout:
#   PIN_STYLE=version|tag|rev   How wasm/Cargo.toml currently pins snarkvm-*
#   CURRENT=vX.Y.Z              Current version (empty if rev matches no tag)
#   LATEST=vX.Y.Z               Latest non-testnet release tag upstream
#   UPDATE_NEEDED=true|false
#   CRATES_PUBLISHED=true|false Whether LATEST is published on crates.io
#                               (only checked when UPDATE_NEEDED=true)
set -euo pipefail

CARGO_TOML="${1:-wasm/Cargo.toml}"
SNARKVM_REPO="https://github.com/ProvableHQ/snarkVM.git"

# First version/rev/tag key inside any [dependencies.snarkvm-*] block. All
# snarkvm-* deps are pinned identically, so one representative is enough.
PIN_INFO=$(awk '
    /^\[dependencies\.snarkvm-/ { in_block = 1; next }
    /^\[/ { in_block = 0 }
    in_block && /^(version|rev|tag)[ =]/ { gsub(/[" ]/, ""); print; exit }
' "$CARGO_TOML")

if [[ -z "$PIN_INFO" ]]; then
    echo "error: no snarkvm-* pin found in $CARGO_TOML" >&2
    exit 1
fi

PIN_STYLE="${PIN_INFO%%=*}"
PIN_VALUE="${PIN_INFO#*=}"

TAG_LIST=$(git ls-remote --tags "$SNARKVM_REPO")

# Highest vX.Y.Z tag; the anchored grep drops ^{} peeled entries and
# testnet/pre-release tags.
LATEST=$(echo "$TAG_LIST" \
    | awk -F'refs/tags/' '{ print $2 }' \
    | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' \
    | sort -V | tail -1)

case "$PIN_STYLE" in
    version) CURRENT="v$PIN_VALUE" ;;
    tag) CURRENT="$PIN_VALUE" ;;
    rev)
        # Map the rev to a tag, matching both lightweight tags and the peeled
        # (^{}) entries of annotated tags. Empty if the rev is untagged.
        CURRENT=$(echo "$TAG_LIST" | awk -v rev="$PIN_VALUE" '
            index($1, rev) == 1 {
                t = $2
                sub(/^refs\/tags\//, "", t)
                sub(/\^\{\}$/, "", t)
                print t
                exit
            }')
        ;;
esac

if [[ "$CURRENT" == "$LATEST" ]]; then
    UPDATE_NEEDED=false
    CRATES_PUBLISHED=""
else
    UPDATE_NEEDED=true
    # crates.io requires a User-Agent; 404 means the version is unpublished.
    if curl -sf -A "provablehq-sdk-snarkvm-update" \
        "https://crates.io/api/v1/crates/snarkvm-wasm/${LATEST#v}" > /dev/null; then
        CRATES_PUBLISHED=true
    else
        CRATES_PUBLISHED=false
    fi
fi

echo "PIN_STYLE=$PIN_STYLE"
echo "CURRENT=$CURRENT"
echo "LATEST=$LATEST"
echo "UPDATE_NEEDED=$UPDATE_NEEDED"
echo "CRATES_PUBLISHED=$CRATES_PUBLISHED"
```

Then: `chmod +x .agents/skills/snarkvm-upgrade/scripts/check-version.sh`

- [ ] **Step 2: Test against the real repo (rev-pinned, up to date)**

Run from repo root: `bash .agents/skills/snarkvm-upgrade/scripts/check-version.sh wasm/Cargo.toml`

Expected output (LATEST may be newer than v4.8.1 if upstream tagged since 2026-07-29; UPDATE_NEEDED flips to true in that case):

```
PIN_STYLE=rev
CURRENT=v4.8.1
LATEST=v4.8.1
UPDATE_NEEDED=false
CRATES_PUBLISHED=
```

- [ ] **Step 3: Test the version-pin and tag-pin fixture cases**

```bash
printf '[dependencies.snarkvm-console]\nversion = "4.7.4"\nfeatures = ["wasm"]\n' > /tmp/cargo-version.toml
printf '[dependencies.other]\nversion = "1.0"\n\n[dependencies.snarkvm-wasm]\ngit = "https://github.com/ProvableHQ/snarkVM.git"\ntag = "v4.8.1"\n' > /tmp/cargo-tag.toml
bash .agents/skills/snarkvm-upgrade/scripts/check-version.sh /tmp/cargo-version.toml
bash .agents/skills/snarkvm-upgrade/scripts/check-version.sh /tmp/cargo-tag.toml
```

Expected: first prints `PIN_STYLE=version`, `CURRENT=v4.7.4`, `UPDATE_NEEDED=true`, `CRATES_PUBLISHED=true`; second prints `PIN_STYLE=tag`, `CURRENT=v4.8.1`, `UPDATE_NEEDED=false`. (Note the tag fixture proves the `[dependencies.other]` version key is not picked up.)

Also test the error path: `bash .agents/skills/snarkvm-upgrade/scripts/check-version.sh /dev/null` — expected: exit 1, stderr `error: no snarkvm-* pin found in /dev/null`.

- [ ] **Step 4: Commit**

```bash
git add .agents/skills/snarkvm-upgrade/scripts/check-version.sh
git commit -m "feat: add snarkVM version check script for upgrade automation"
```

---

### Task 2: The snarkvm-upgrade skill

**Files:**
- Create: `.agents/skills/snarkvm-upgrade/SKILL.md`
- Create: `.claude/skills/snarkvm-upgrade` (symlink → `../../.agents/skills/snarkvm-upgrade`)
- Fix: `.claude/skills/provable-sdk-tutorial-docs` (regular file → real symlink; same discovery bug)

**Interfaces:**
- Consumes: `scripts/check-version.sh` output keys from Task 1.
- Produces: skill invocable as `/snarkvm-upgrade`; Task 3's workflow prompt is exactly `/snarkvm-upgrade`.

- [ ] **Step 1: Write SKILL.md**

Create `.agents/skills/snarkvm-upgrade/SKILL.md` with exactly this content:

````markdown
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

From the repo root, on a clean checkout of `mainnet`:

```bash
bash .agents/skills/snarkvm-upgrade/scripts/check-version.sh wasm/Cargo.toml
```

The script prints `PIN_STYLE`, `CURRENT`, `LATEST`, `UPDATE_NEEDED`, and
`CRATES_PUBLISHED`.

**If `UPDATE_NEEDED=false`, report that the SDK is already on the latest
snarkVM release tag and STOP.** Nothing below runs.

## Step 2: Review the upstream changeset

Compare the current pin to the target tag. `<old>` is `CURRENT` when set,
otherwise the raw `rev` from `wasm/Cargo.toml`:

```bash
gh api "repos/ProvableHQ/snarkVM/compare/<old>...<LATEST>" --jq '.commits[].commit.message' | head -100
gh api "repos/ProvableHQ/snarkVM/compare/<old>...<LATEST>" --jq '.files[].filename' | sort -u
gh api "repos/ProvableHQ/snarkVM/releases/tags/<LATEST>" --jq '.body' 2>/dev/null || true
```

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

- **If `CRATES_PUBLISHED=true`:** delete the `git` and `rev`/`tag` keys and
  set `version = "<LATEST without the v prefix>"`.
- **If `CRATES_PUBLISHED=false`:** keep
  `git = "https://github.com/ProvableHQ/snarkVM.git"`, delete `rev`, and set
  `tag = "<LATEST>"`.

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

Run in this order, fixing failures and repeating until all three pass:

```bash
yarn test:wasm
yarn build:all
yarn test:sdk
```

## Step 7: Bump npm package versions

For each published package, set the version to one patch above what npm
currently serves (NOT one above the local version — they can differ):

```bash
npm view @provablehq/wasm version   # bump wasm/package.json to this +1 patch
npm view @provablehq/sdk version    # bump sdk/package.json to this +1 patch
npm view create-leo-app version     # bump create-leo-app/package.json to this +1 patch
```

If any registry query fails, stop and report — a PR without the version
bumps is incomplete.

Then update cross-references to match:

- `sdk/package.json`: dependency `"@provablehq/wasm": "^<new wasm version>"`
- every `create-leo-app/template-*/package.json`:
  `"@provablehq/sdk": "^<new sdk version>"`

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
- Test results: confirmation that `yarn test:wasm`, `yarn build:all`, and
  `yarn test:sdk` all passed.
- The npm version bumps applied.
````

- [ ] **Step 2: Create the discovery symlink and fix the broken existing one**

```bash
ln -s ../../.agents/skills/snarkvm-upgrade .claude/skills/snarkvm-upgrade
rm .claude/skills/provable-sdk-tutorial-docs
ln -s ../../.agents/skills/provable-sdk-tutorial-docs .claude/skills/provable-sdk-tutorial-docs
```

- [ ] **Step 3: Verify symlinks resolve and are symlinks in the git index**

```bash
cat .claude/skills/snarkvm-upgrade/SKILL.md | head -3
cat .claude/skills/provable-sdk-tutorial-docs/SKILL.md | head -3
git add .agents/skills/snarkvm-upgrade/SKILL.md .claude/skills/snarkvm-upgrade .claude/skills/provable-sdk-tutorial-docs
git ls-files -s .claude/skills/
```

Expected: both `cat`s print YAML frontmatter (`---` / `name:` lines); `git ls-files -s` shows mode `120000` for both `.claude/skills/` entries.

- [ ] **Step 4: Verify the frontmatter parses**

```bash
npx --yes js-yaml <(sed -n '/^---$/,/^---$/p' .agents/skills/snarkvm-upgrade/SKILL.md | sed '1d;$d')
```

Expected: JSON object with `name: "snarkvm-upgrade"` and the description; no parse error. (If process substitution misbehaves, extract the frontmatter to a temp file first.)

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: add snarkvm-upgrade skill

Fixes the .claude/skills pointer for provable-sdk-tutorial-docs, which was
committed as a regular file instead of a symlink and was not discovered."
```

---

### Task 3: Replacement GitHub Action

**Files:**
- Modify (full replacement): `.github/workflows/update-snarkvm.yml`

**Interfaces:**
- Consumes: `check-version.sh` KEY=VALUE output (piped into `$GITHUB_OUTPUT`), the `/snarkvm-upgrade` skill, composite actions `./.github/actions/setup-yarn` and `./.github/actions/setup-rust`, repo secret `ANTHROPIC_API_KEY`.

- [ ] **Step 1: Replace the workflow file**

Overwrite `.github/workflows/update-snarkvm.yml` with exactly:

```yaml
name: Update snarkVM dependency

on:
  schedule:
    # 08:00 PDT (15:00 UTC). GitHub cron is UTC-only, so during PST (winter)
    # this fires at 07:00 Pacific instead.
    - cron: '0 15 * * *'
  workflow_dispatch:

permissions:
  contents: write
  pull-requests: write

concurrency:
  group: update-snarkvm
  cancel-in-progress: false

jobs:
  update-snarkvm:
    name: Upgrade snarkVM to latest release tag
    runs-on: ubuntu-latest-m
    timeout-minutes: 120
    steps:
      - name: Checkout mainnet
        uses: actions/checkout@v5
        with:
          ref: mainnet

      # Deterministic pre-flight: resolve versions and skip the (expensive)
      # Claude run entirely when there is nothing to do.
      - name: Check snarkVM versions
        id: preflight
        env:
          GH_TOKEN: ${{ github.token }}
        run: |
          bash .agents/skills/snarkvm-upgrade/scripts/check-version.sh wasm/Cargo.toml | tee -a "$GITHUB_OUTPUT"

          # Also skip if an upgrade PR for the target tag is already open.
          LATEST=$(grep '^LATEST=' "$GITHUB_OUTPUT" | tail -1 | cut -d= -f2)
          if gh pr list --state open --json headRefName \
              --jq '.[].headRefName' | grep -qx "update-snarkvm-${LATEST}"; then
            echo "PR_EXISTS=true" >> "$GITHUB_OUTPUT"
          else
            echo "PR_EXISTS=false" >> "$GITHUB_OUTPUT"
          fi

      - name: Set up yarn
        if: steps.preflight.outputs.UPDATE_NEEDED == 'true' && steps.preflight.outputs.PR_EXISTS == 'false'
        uses: ./.github/actions/setup-yarn

      - name: Set up rust
        if: steps.preflight.outputs.UPDATE_NEEDED == 'true' && steps.preflight.outputs.PR_EXISTS == 'false'
        uses: ./.github/actions/setup-rust

      - name: Configure git identity
        if: steps.preflight.outputs.UPDATE_NEEDED == 'true' && steps.preflight.outputs.PR_EXISTS == 'false'
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"

      - name: Run the snarkvm-upgrade skill
        if: steps.preflight.outputs.UPDATE_NEEDED == 'true' && steps.preflight.outputs.PR_EXISTS == 'false'
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          # PRs opened with the default GITHUB_TOKEN do not trigger CI
          # workflows (GitHub restriction). Swap in a PAT or GitHub App token
          # if the upgrade PRs should run the SDK CI automatically.
          github_token: ${{ secrets.GITHUB_TOKEN }}
          prompt: /snarkvm-upgrade
          claude_args: |
            --allowedTools Bash(bash .agents/skills/snarkvm-upgrade/scripts/check-version.sh*) Bash(yarn *) Bash(cargo *) Bash(npm view:*) Bash(git *) Bash(gh *) Bash(curl *) Read Write Edit Glob Grep

      - name: Summary
        if: always()
        run: |
          {
            echo "## snarkVM upgrade check"
            echo "- Current: ${{ steps.preflight.outputs.CURRENT }}"
            echo "- Latest tag: ${{ steps.preflight.outputs.LATEST }}"
            echo "- Update needed: ${{ steps.preflight.outputs.UPDATE_NEEDED }}"
            echo "- Upgrade PR already open: ${{ steps.preflight.outputs.PR_EXISTS }}"
            echo "- crates.io published: ${{ steps.preflight.outputs.CRATES_PUBLISHED }}"
          } >> "$GITHUB_STEP_SUMMARY"
```

- [ ] **Step 2: Validate the YAML parses**

Run: `npx --yes js-yaml .github/workflows/update-snarkvm.yml > /dev/null && echo OK`
Expected: `OK`

- [ ] **Step 3: Rehearse the pre-flight step locally**

```bash
GITHUB_OUTPUT=$(mktemp)
bash .agents/skills/snarkvm-upgrade/scripts/check-version.sh wasm/Cargo.toml | tee -a "$GITHUB_OUTPUT"
LATEST=$(grep '^LATEST=' "$GITHUB_OUTPUT" | tail -1 | cut -d= -f2)
echo "LATEST parsed as: $LATEST"
```

Expected: the five KEY=VALUE lines, then `LATEST parsed as: v4.8.1` (or newer). This proves the `$GITHUB_OUTPUT` plumbing and the `LATEST` re-parse line work.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/update-snarkvm.yml
git commit -m "feat: replace staging-tracking snarkVM workflow with Claude-driven release upgrader"
```

---

### Task 4: Global CLAUDE.md edit (outside the repo)

**Files:**
- Modify: `~/.claude/CLAUDE.md` (NOT in this git repo — no commit)

- [ ] **Step 1: Remove the snarkVM-update runbook example**

In `~/.claude/CLAUDE.md`, the vault section contains the line:

```
- I'm running a recurring procedure that has a runbook there (e.g. snarkVM update, SDK release) — then read that runbook first.
```

Change it to:

```
- I'm running a recurring procedure that has a runbook there (e.g. SDK release) — then read that runbook first.
```

- [ ] **Step 2: Verify**

Run: `grep -c "snarkVM update" ~/.claude/CLAUDE.md || echo "0 — removed"`
Expected: `0 — removed`

---

### Task 5: Final verification against the spec

- [ ] **Step 1: Check every spec requirement has landed**

Walk `docs/superpowers/specs/2026-07-29-snarkvm-upgrade-automation-design.md` section by section and confirm: skill exists with all 9 procedure steps (including voice.md rule and early exit), workflow replaced with cron `0 15 * * *` + `workflow_dispatch` + pre-flight early exits + claude-code-action invocation, CLAUDE.md edited, old staging-tracking behavior fully gone (`grep -c staging .github/workflows/update-snarkvm.yml` → 0).

- [ ] **Step 2: Full-tree sanity**

```bash
git status --short   # only expected files on the branch
git log --oneline mainnet..HEAD
```

Expected commits (spec + 3 implementation commits), no stray modified files.

- [ ] **Step 3: Report**

Summarize for the user: what was built, that the live early-exit path was exercised locally, and that the full-upgrade path can only be end-to-end tested when snarkVM tags a release newer than the current pin (or by temporarily pinning an older version on a scratch branch). Offer the finishing-a-development-branch flow (push + PR of `snarkvm-upgrade-automation` to `mainnet`).
