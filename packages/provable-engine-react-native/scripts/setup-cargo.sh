#!/bin/bash
# Script to find cargo and output environment setup for sourcing
# This is mostly if you need to build this in XCode, which doesn't inherit environment variables

set -e

# Function to check if Rust toolchain is working
check_rust_toolchain() {
    local CARGO_PATH="$1"
    local CARGO_DIR=$(dirname "$CARGO_PATH")

    # Check if rustc exists and works
    if [ -f "$CARGO_DIR/rustc" ]; then
        if "$CARGO_DIR/rustc" -vV &> /dev/null; then
            return 0
        else
            return 1
        fi
    elif command -v rustc &> /dev/null; then
        if rustc -vV &> /dev/null; then
            return 0
        else
            return 1
        fi
    else
        return 1
    fi
}

# Function to find cargo in multiple locations
find_cargo() {
    local CARGO=""

    # First try: rustup which cargo (most reliable - gets the active toolchain)
    if command -v rustup &> /dev/null && rustup which cargo &> /dev/null 2>&1; then
        local CARGO_CANDIDATE=$(rustup which cargo 2>/dev/null)
        if [ -n "$CARGO_CANDIDATE" ] && check_rust_toolchain "$CARGO_CANDIDATE"; then
            CARGO="$CARGO_CANDIDATE"
        fi
    fi

    # Second try: command -v (checks PATH)
    if [ -z "$CARGO" ] && command -v cargo &> /dev/null; then
        local CARGO_CANDIDATE="cargo"
        if check_rust_toolchain "$CARGO_CANDIDATE"; then
            CARGO="$CARGO_CANDIDATE"
        fi
    fi

    # Third try: standard cargo location
    if [ -z "$CARGO" ] && [ -f "$HOME/.cargo/bin/cargo" ]; then
        local CARGO_CANDIDATE="$HOME/.cargo/bin/cargo"
        if check_rust_toolchain "$CARGO_CANDIDATE"; then
            CARGO="$CARGO_CANDIDATE"
        fi
    fi

    # Fourth try: homebrew locations
    if [ -z "$CARGO" ]; then
        for BREW_PATH in "/usr/local/bin/cargo" "/opt/homebrew/bin/cargo"; do
            if [ -f "$BREW_PATH" ]; then
                if check_rust_toolchain "$BREW_PATH"; then
                    CARGO="$BREW_PATH"
                    break
                fi
            fi
        done
    fi

    # Fifth try: search rustup toolchains
    if [ -z "$CARGO" ] && [ -d "$HOME/.rustup/toolchains" ]; then
        # Try to find the default/active toolchain first
        if [ -f "$HOME/.rustup/settings.toml" ]; then
            local DEFAULT_TOOLCHAIN=$(grep "default_toolchain" "$HOME/.rustup/settings.toml" 2>/dev/null | cut -d'"' -f2)
            if [ -n "$DEFAULT_TOOLCHAIN" ] && [ -f "$HOME/.rustup/toolchains/$DEFAULT_TOOLCHAIN/bin/cargo" ]; then
                local CARGO_CANDIDATE="$HOME/.rustup/toolchains/$DEFAULT_TOOLCHAIN/bin/cargo"
                if check_rust_toolchain "$CARGO_CANDIDATE"; then
                    CARGO="$CARGO_CANDIDATE"
                fi
            fi
        fi

        # Fallback: search for any cargo in toolchains
        if [ -z "$CARGO" ]; then
            while IFS= read -r -d '' CARGO_CANDIDATE; do
                if [ -x "$CARGO_CANDIDATE" ] && check_rust_toolchain "$CARGO_CANDIDATE"; then
                    CARGO="$CARGO_CANDIDATE"
                    break
                fi
            done < <(find "$HOME/.rustup/toolchains" -name "cargo" -type f -executable -print0 2>/dev/null)
        fi
    fi

    # Check if we found a working cargo
    if [ -z "$CARGO" ]; then
        echo "Error: No working Rust toolchain found. Please ensure Rust is properly installed." >&2
        echo "" >&2
        echo "Searched locations:" >&2
        echo "  - PATH (via command -v)" >&2
        echo "  - rustup which cargo" >&2
        echo "  - $HOME/.cargo/bin/cargo" >&2
        echo "  - /usr/local/bin/cargo" >&2
        echo "  - /opt/homebrew/bin/cargo" >&2
        echo "  - $HOME/.rustup/toolchains/*/bin/cargo" >&2
        echo "" >&2
        echo "To install Rust, visit: https://rustup.rs/" >&2
        echo "Or try: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh" >&2
        exit 1
    fi

    # Final verification that cargo is executable
    if ! [ -x "$CARGO" ] && ! command -v "$CARGO" &> /dev/null; then
        echo "Error: Found cargo at $CARGO but it's not executable" >&2
        exit 1
    fi

    echo "$CARGO"
}

# Function to output environment setup for sourcing
setup_cargo_env() {
    local CARGO=$(find_cargo)
    local CARGO_DIR=$(dirname "$CARGO")

    echo "Debug: Found CARGO=$CARGO" >&2
    echo "Debug: Found CARGO_DIR=$CARGO_DIR" >&2

    # Find rustc
    local RUSTC=""
    if [ -f "$CARGO_DIR/rustc" ]; then
        RUSTC="$CARGO_DIR/rustc"
        echo "Debug: Found RUSTC=$RUSTC (same directory as cargo)" >&2
    elif command -v rustc &> /dev/null; then
        RUSTC=$(command -v rustc)
        echo "Debug: Found RUSTC=$RUSTC (from PATH)" >&2
    else
        echo "Error: Cannot find rustc" >&2
        exit 1
    fi

    # Validate that rustc works
    if ! "$RUSTC" -vV > /dev/null 2>&1; then
        echo "Error: rustc at $RUSTC is not working properly" >&2
        exit 1
    fi

    # Validate that cargo works
    if ! "$CARGO" --version > /dev/null 2>&1; then
        echo "Error: cargo at $CARGO is not working properly" >&2
        exit 1
    fi

    echo "Debug: Validation successful - both cargo and rustc are working" >&2

    # Output environment setup for sourcing
    echo "export CARGO='$CARGO'"
    echo "export RUSTC='$RUSTC'"

    # Build PATH components, preserving existing PATH and ensuring system directories
    local PATH_COMPONENTS=""

    # Add rustup bin directory if present
    if [ -d "$HOME/.rustup/bin" ]; then
        PATH_COMPONENTS="$HOME/.rustup/bin:$PATH_COMPONENTS"
    fi

    # Add standard cargo bin directory for installed binaries like cxxbridge
    if [ -d "$HOME/.cargo/bin" ]; then
        PATH_COMPONENTS="$HOME/.cargo/bin:$PATH_COMPONENTS"
    fi

    # Add cargo directory
    PATH_COMPONENTS="$CARGO_DIR:$PATH_COMPONENTS"

    # Remove trailing colon from PATH_COMPONENTS if present
    PATH_COMPONENTS="${PATH_COMPONENTS%:}"

    # Export PATH preserving existing PATH (which should include system directories)
    # Use actual current PATH value instead of $PATH variable reference
    echo "export PATH='$PATH_COMPONENTS:$PATH'"

    # Set CARGO_HOME if not set
    if [ -z "$CARGO_HOME" ] && [ -d "$HOME/.cargo" ]; then
        echo "export CARGO_HOME='$HOME/.cargo'"
    fi

    # Set RUSTUP_HOME if not set and rustup exists
    if [ -z "$RUSTUP_HOME" ] && [ -d "$HOME/.rustup" ]; then
        echo "export RUSTUP_HOME='$HOME/.rustup'"
    fi
}

# Main execution
setup_cargo_env
