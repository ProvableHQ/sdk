#!/bin/bash
# Fetches third-party header-only libraries into third_party/.
# Each library is downloaded once and verified by SHA-256 checksum.
#
# To add a new library, append an entry to the LIBRARIES array below:
#   "<dest_path> <url> <sha256>"
# where dest_path is relative to third_party/.

set -euo pipefail

THIRD_PARTY_DIR="$(cd "$(dirname "$0")/.." && pwd)/third_party"

LIBRARIES=(
  "nlohmann/json.hpp https://github.com/nlohmann/json/releases/download/v3.11.3/json.hpp 9bea4c8066ef4a1c206b2be5a36302f8926f7fdc6087af5d20b417d0cf103ea6"
)

sha256_of() {
  if command -v shasum &>/dev/null; then
    shasum -a 256 "$1" | awk '{print $1}'
  elif command -v sha256sum &>/dev/null; then
    sha256sum "$1" | awk '{print $1}'
  else
    echo ""
  fi
}

for entry in "${LIBRARIES[@]}"; do
  read -r dest_path url expected_sha256 <<< "$entry"
  dest_file="$THIRD_PARTY_DIR/$dest_path"

  if [ -f "$dest_file" ]; then
    continue
  fi

  name=$(dirname "$dest_path")/$(basename "$dest_path")
  echo "[third-party] Fetching $name ..."
  mkdir -p "$(dirname "$dest_file")"
  curl -fsSL "$url" -o "$dest_file"

  actual_sha256=$(sha256_of "$dest_file")
  if [ -z "$actual_sha256" ]; then
    echo "[third-party] Warning: no sha256 tool found, skipping checksum verification for $name"
    continue
  fi

  if [ "$actual_sha256" != "$expected_sha256" ]; then
    echo "[third-party] ERROR: checksum mismatch for $name"
    echo "  Expected: $expected_sha256"
    echo "  Actual:   $actual_sha256"
    rm -f "$dest_file"
    exit 1
  fi

  echo "[third-party] Verified $name"
done
