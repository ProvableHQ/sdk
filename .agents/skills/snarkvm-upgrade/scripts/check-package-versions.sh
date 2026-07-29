#!/usr/bin/env bash
# Asserts that the aleo-wasm crate version and the @provablehq/wasm npm version
# are the same, which is the invariant `yarn change-version` maintains and the
# one a hand-edited version bump tends to break.
#
# Prints OK or MISMATCH and exits nonzero on mismatch, so it fails loudly
# rather than needing to be read.
#
# This lives in a script rather than inline in the skill because the CI job
# runs under a tool allowlist that matches whole commands: an inline check
# built from a command substitution, `[` and `echo` joined by `&&`/`||` is
# four separate commands, none of which the allowlist grants.
set -euo pipefail

CARGO_TOML="${1:-wasm/Cargo.toml}"
PACKAGE_JSON="${2:-wasm/package.json}"

# One awk over both files. NR == FNR is true only while the first file is being
# read, which keeps this independent of what the files are named.
RESULT=$(awk -F'"' '
    NR == FNR {
        if ($0 ~ /^\[package\]/) inpkg = 1
        else if (inpkg && $0 ~ /^version *=/ && crate == "") crate = $2
        next
    }
    $2 == "version" && npm == "" { npm = $4 }
    END {
        if (crate != "" && crate == npm) print "OK " crate
        else print "MISMATCH " crate " " npm
    }
' "$CARGO_TOML" "$PACKAGE_JSON")

read -r STATUS CRATE NPM <<< "$RESULT"

if [[ "$STATUS" == "OK" ]]; then
    echo "OK: crate and npm agree at ${CRATE}"
else
    echo "MISMATCH: crate [${CRATE:-none}] vs npm [${NPM:-none}]" >&2
    echo "Run 'yarn change-version <version>' rather than editing versions by hand." >&2
    exit 1
fi
