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
#   CRATES_PUBLISHED=true|false Whether EVERY snarkvm-* crate in the Cargo.toml
#                               has LATEST published on crates.io (only checked
#                               when UPDATE_NEEDED=true)
set -euo pipefail

CARGO_TOML="${1:-wasm/Cargo.toml}"
SNARKVM_REPO="https://github.com/ProvableHQ/snarkVM.git"

# Pin keys from the first [dependencies.snarkvm-*] block, preferring
# rev > tag > version when several coexist (all snarkvm-* deps are pinned
# identically, so one block is representative). Inline comments are stripped.
PIN_INFO=$(awk '
    /^\[dependencies\.snarkvm-/ { in_block = 1; next }
    /^\[/ { if (found) exit; in_block = 0 }
    in_block && /^(version|rev|tag)[ =]/ {
        sub(/#.*$/, ""); gsub(/[" ]/, "")
        eq = index($0, "="); vals[substr($0, 1, eq - 1)] = substr($0, eq + 1)
        found = 1
    }
    END {
        if ("rev" in vals) print "rev=" vals["rev"]
        else if ("tag" in vals) print "tag=" vals["tag"]
        else if ("version" in vals) print "version=" vals["version"]
    }
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
    version)
        # Drop any Cargo range operator before prefixing "v", so CURRENT comes
        # out as a clean vX.Y.Z. It has to be a usable git ref as well as a
        # version: the skill feeds it to `gh api .../compare/<CURRENT>...` when
        # an upgrade is needed, and "v^4.9.0" resolves to nothing.
        CURRENT="v$(printf '%s' "$PIN_VALUE" | sed -E 's/^[[:space:]]*(\^|~|>=|<=|>|<|=)?[[:space:]]*v?//')"
        ;;
    tag) CURRENT="$PIN_VALUE" ;;
    rev)
        # Map the rev to a release tag, matching both lightweight tags and the
        # peeled (^{}) entries of annotated tags. One commit can carry several
        # tags — an earlier release, a testnet pre-release — so keep only
        # vX.Y.Z names and take the highest rather than whichever ls-remote
        # happens to list first; otherwise a co-located non-release tag makes
        # an already-current pin look stale. Empty when the rev carries no
        # release tag, which correctly reads as "needs an upgrade".
        CURRENT=$(echo "$TAG_LIST" | awk -v rev="$PIN_VALUE" '
            index($1, rev) == 1 {
                t = $2
                sub(/^refs\/tags\//, "", t)
                sub(/\^\{\}$/, "", t)
                if (t ~ /^v[0-9]+\.[0-9]+\.[0-9]+$/) print t
            }' | sort -V | tail -1)
        ;;
esac

# Reduce a pin to bare X.Y.Z so the comparison below is about versions and not
# about spelling. A leading "v", a Cargo range operator, and an omitted patch
# component are all noise: "^4.9", "=v4.9.0" and "4.9.0" describe the same
# release. Prints nothing for anything that is not purely numeric components
# (wildcards, pre-release suffixes, an untagged rev), and the caller treats
# that as "unknown" — which errs toward running the upgrade, never toward
# silently skipping one.
normalize_version() {
    local v
    # The "v" and the operator are accepted in either order ("v^4.9.0" as well
    # as "^v4.9.0"). Only those two tokens are stripped, never an arbitrary
    # alphabetic prefix — "testnet-v4.9.0" must NOT reduce to a release
    # version, or a pre-release pin would compare equal to the release.
    v=$(printf '%s' "$1" \
        | sed -E 's/^[[:space:]]*(v[[:space:]]*)?(\^|~|>=|<=|>|<|=)?[[:space:]]*(v[[:space:]]*)?//')
    [[ "$v" =~ ^[0-9]+(\.[0-9]+){0,2}$ ]] || return 0
    local major minor patch
    IFS=. read -r major minor patch <<< "$v"
    printf '%s.%s.%s' "$major" "${minor:-0}" "${patch:-0}"
}

# CURRENT itself stays in its original form — it is reported to the user and
# used as a git ref by the skill's changeset diff — so normalize into
# throwaway locals purely for the equality test.
CURRENT_NORM=$(normalize_version "$CURRENT")
LATEST_NORM=$(normalize_version "$LATEST")

if [[ -n "$CURRENT_NORM" && "$CURRENT_NORM" == "$LATEST_NORM" ]]; then
    UPDATE_NEEDED=false
    CRATES_PUBLISHED=""
else
    UPDATE_NEEDED=true
    # Every snarkvm-* crate named in the Cargo.toml must have LATEST on
    # crates.io — a half-published upstream release must fall back to the git
    # tag pin. crates.io requires a User-Agent; 404 means unpublished.
    # "[dependencies.snarkvm-wasm]" splits on "." and "]" into
    # "[dependencies" / "snarkvm-wasm" / "".
    CRATES=$(awk -F'[].]' '/^\[dependencies\.snarkvm-/ { print $2 }' "$CARGO_TOML")
    CRATES_PUBLISHED=true
    while read -r crate; do
        [[ -z "$crate" ]] && continue
        if ! curl -sf -A "provablehq-sdk-snarkvm-update" \
            "https://crates.io/api/v1/crates/${crate}/${LATEST#v}" > /dev/null; then
            CRATES_PUBLISHED=false
            break
        fi
    done <<< "$CRATES"
fi

echo "PIN_STYLE=$PIN_STYLE"
echo "CURRENT=$CURRENT"
echo "LATEST=$LATEST"
echo "UPDATE_NEEDED=$UPDATE_NEEDED"
echo "CRATES_PUBLISHED=$CRATES_PUBLISHED"
