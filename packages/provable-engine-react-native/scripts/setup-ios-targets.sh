#!/bin/bash
# Script to setup Rust toolchain for iOS builds

set -e

# Add system paths for basic commands since Xcode builds have restricted PATH
export PATH="/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

# Function to setup Rust toolchain for iOS builds
setup_ios_targets() {
    local CARGO="$1"

    if [ -z "$CARGO" ]; then
        echo "Error: CARGO not provided to setup_ios_targets" >&2
        exit 1
    fi

    # Find rustup - try standard cargo directory first, then cargo's directory, then PATH
    local CARGO_DIR=$(dirname "$CARGO")
    local RUSTUP=""

    if [ -f "$HOME/.cargo/bin/rustup" ]; then
        RUSTUP="$HOME/.cargo/bin/rustup"
    elif [ -f "$CARGO_DIR/rustup" ]; then
        RUSTUP="$CARGO_DIR/rustup"
    elif command -v rustup &> /dev/null; then
        RUSTUP=$(command -v rustup)
    else
        echo "Warning: rustup not found, skipping iOS target installation"
        echo "You may need to manually run: rustup target add aarch64-apple-ios aarch64-apple-ios-sim x86_64-apple-ios"
        return 0
    fi

    echo "Debug: Found rustup at $RUSTUP"

    # For iOS builds, ensure the iOS targets are installed
    for TARGET in aarch64-apple-ios aarch64-apple-ios-sim x86_64-apple-ios; do
        if ! "$RUSTUP" target list --installed 2>/dev/null | /usr/bin/grep -q "^${TARGET}$"; then
            echo "Installing Rust target: $TARGET"
            if ! "$RUSTUP" target add $TARGET; then
                echo "Warning: Failed to install target $TARGET"
                echo "You may need to run: $RUSTUP target add $TARGET"
            fi
        else
            echo "Target $TARGET already installed"
        fi
    done
}

# Main execution
if [ $# -eq 0 ]; then
    echo "Error: No cargo path provided" >&2
    echo "Usage: $0 <cargo_path>" >&2
    exit 1
fi

setup_ios_targets "$1"
