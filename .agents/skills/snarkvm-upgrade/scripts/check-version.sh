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
