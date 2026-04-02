#!/bin/bash

# Script to configure OpenSSL for cross-compilation
# This isolates all OpenSSL-specific configuration logic

set -e

# Add system paths for basic commands since Xcode builds have restricted PATH
export PATH="/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "--- OpenSSL Configuration ---"

# Function to set up Android NDK environment for OpenSSL
setup_android_openssl_env() {
    # Find NDK path
    if [ -n "$ANDROID_NDK_ROOT" ]; then
        NDK_PATH="$ANDROID_NDK_ROOT"
    elif [ -n "$ANDROID_NDK_HOME" ]; then
        NDK_PATH="$ANDROID_NDK_HOME"
    elif [ -n "$ANDROID_NDK_LATEST_HOME" ]; then
        NDK_PATH="$ANDROID_NDK_LATEST_HOME"
    elif [ -d "$HOME/Library/Android/sdk/ndk" ]; then
        # macOS default Android Studio NDK location - use latest version
        NDK_PATH=$(find "$HOME/Library/Android/sdk/ndk" -maxdepth 1 -type d -name "[0-9]*" | sort -V | tail -1)
    else
        echo "Error: Android NDK not found. Please set ANDROID_NDK_ROOT or install Android NDK."
        exit 1
    fi

    # Detect host platform for NDK toolchain
    HOST_OS=$(uname -s)
    case "$HOST_OS" in
        Darwin)
            # Prefer Apple Silicon prebuilt if available to avoid Rosetta hangs
            if [ -d "$NDK_PATH/toolchains/llvm/prebuilt/darwin-aarch64" ]; then
                NDK_HOST="darwin-aarch64"
            else
                NDK_HOST="darwin-x86_64"
            fi
            ;;
        Linux) NDK_HOST="linux-x86_64" ;;
        *) echo "Unsupported host OS: $HOST_OS"; exit 1 ;;
    esac

    NDK_TOOLCHAIN_PATH="$NDK_PATH/toolchains/llvm/prebuilt/$NDK_HOST/bin"

    if [ -d "$NDK_TOOLCHAIN_PATH" ]; then
        echo "Using Android NDK: $NDK_PATH"
        echo "NDK toolchain: $NDK_TOOLCHAIN_PATH"

        # Set up environment for OpenSSL cross-compilation
        export ANDROID_NDK_ROOT="$NDK_PATH"

        # Set target-specific environment variables for Rust cross-compilation
        # These are used by cargo for linking and build scripts
        export CC_armv7_linux_androideabi="$NDK_TOOLCHAIN_PATH/armv7a-linux-androideabi21-clang"
        export CXX_armv7_linux_androideabi="$NDK_TOOLCHAIN_PATH/armv7a-linux-androideabi21-clang++"
        export AR_armv7_linux_androideabi="$NDK_TOOLCHAIN_PATH/llvm-ar"
        export RANLIB_armv7_linux_androideabi="$NDK_TOOLCHAIN_PATH/llvm-ranlib"
        export CFLAGS_armv7_linux_androideabi="-D__ANDROID_API__=21"
        export CXXFLAGS_armv7_linux_androideabi="-D__ANDROID_API__=21"
        export CARGO_TARGET_ARMV7_LINUX_ANDROIDEABI_LINKER="$NDK_TOOLCHAIN_PATH/armv7a-linux-androideabi21-clang"

        export CC_aarch64_linux_android="$NDK_TOOLCHAIN_PATH/aarch64-linux-android21-clang"
        export CXX_aarch64_linux_android="$NDK_TOOLCHAIN_PATH/aarch64-linux-android21-clang++"
        export AR_aarch64_linux_android="$NDK_TOOLCHAIN_PATH/llvm-ar"
        export RANLIB_aarch64_linux_android="$NDK_TOOLCHAIN_PATH/llvm-ranlib"
        export CFLAGS_aarch64_linux_android="-D__ANDROID_API__=21"
        export CXXFLAGS_aarch64_linux_android="-D__ANDROID_API__=21"
        export CARGO_TARGET_AARCH64_LINUX_ANDROID_LINKER="$NDK_TOOLCHAIN_PATH/aarch64-linux-android21-clang"

        export CC_i686_linux_android="$NDK_TOOLCHAIN_PATH/i686-linux-android21-clang"
        export CXX_i686_linux_android="$NDK_TOOLCHAIN_PATH/i686-linux-android21-clang++"
        export AR_i686_linux_android="$NDK_TOOLCHAIN_PATH/llvm-ar"
        export RANLIB_i686_linux_android="$NDK_TOOLCHAIN_PATH/llvm-ranlib"
        export CFLAGS_i686_linux_android="-D__ANDROID_API__=21"
        export CXXFLAGS_i686_linux_android="-D__ANDROID_API__=21"
        export CARGO_TARGET_I686_LINUX_ANDROID_LINKER="$NDK_TOOLCHAIN_PATH/i686-linux-android21-clang"

        export CC_x86_64_linux_android="$NDK_TOOLCHAIN_PATH/x86_64-linux-android21-clang"
        export CXX_x86_64_linux_android="$NDK_TOOLCHAIN_PATH/x86_64-linux-android21-clang++"
        export AR_x86_64_linux_android="$NDK_TOOLCHAIN_PATH/llvm-ar"
        export RANLIB_x86_64_linux_android="$NDK_TOOLCHAIN_PATH/llvm-ranlib"
        export CFLAGS_x86_64_linux_android="-D__ANDROID_API__=21"
        export CXXFLAGS_x86_64_linux_android="-D__ANDROID_API__=21"
        export CARGO_TARGET_X86_64_LINUX_ANDROID_LINKER="$NDK_TOOLCHAIN_PATH/x86_64-linux-android21-clang"

        echo "Set up Android NDK environment variables for OpenSSL cross-compilation"
    else
        echo "Error: NDK toolchain path not found: $NDK_TOOLCHAIN_PATH"
        exit 1
    fi
}

# Setup OpenSSL configuration based on build environment
# Prioritize Android config regardless of CI to avoid incorrect host OpenSSL usage.
if [ -n "$ANDROID_ABI" ] || [ "$PLATFORM" = "android" ]; then
    # Android builds
    echo "Android build: configuring NDK environment for OpenSSL"

    # For Android cross-compilation, we need to set up the NDK environment
    setup_android_openssl_env

    # Android NDK does not ship OpenSSL in the sysroot. Avoid misleading variables.
    export OPENSSL_STATIC=1
    export PKG_CONFIG_ALLOW_CROSS=1
    unset OPENSSL_LIB_DIR
    unset OPENSSL_INCLUDE_DIR
    # Ensure OpenSSL build uses LLVM binutils instead of CROSS_COMPILE-prefixed tools
    export AR="$NDK_TOOLCHAIN_PATH/llvm-ar"
    export RANLIB="$NDK_TOOLCHAIN_PATH/llvm-ranlib"
    unset CROSS_COMPILE
    echo "Android: No system OpenSSL in NDK. Use vendored OpenSSL (e.g. enable vendored feature upstream)."
elif [[ "$(uname)" == "Darwin" ]] && [ -z "$ANDROID_ABI" ]; then
    # On macOS, distinguish between iOS cross-compilation and pure macOS host builds
    # If building for iOS/iOS-simulator, do NOT use Homebrew OpenSSL (macOS dylibs are incompatible)
    if [[ "$PLATFORM_NAME" == *"iphone"* ]] || [[ "$SDK_NAME" == *"iphone"* ]] || [[ "$PLATFORM" == "ios" ]]; then
        echo "iOS build detected on macOS: forcing vendored OpenSSL and disabling pkg-config to avoid Homebrew dylibs."
        # Ensure Brew OpenSSL is not picked up
        unset OPENSSL_DIR
        unset OPENSSL_INCLUDE_DIR
        unset OPENSSL_LIB_DIR
        # Disable pkg-config lookup so brew openssl is not used
        export OPENSSL_NO_PKG_CONFIG=1
        export OPENSSL_STATIC=1
        export OPENSSL_VENDORED=1
        export PKG_CONFIG_ALLOW_CROSS=1
        # Sanitize PKG_CONFIG_PATH to remove any openssl references
        if [ -n "$PKG_CONFIG_PATH" ]; then
          CLEAN_PKG=$(echo "$PKG_CONFIG_PATH" | tr ':' '\n' | grep -vi 'openssl' | paste -sd ':' -)
          export PKG_CONFIG_PATH="$CLEAN_PKG"
        fi
    else
        # Pure macOS host builds may use Homebrew OpenSSL
        if command -v brew &> /dev/null && brew --prefix openssl@3 &> /dev/null; then
            OPENSSL_DIR=$(brew --prefix openssl@3)
            export OPENSSL_DIR
            export PKG_CONFIG_PATH="$OPENSSL_DIR/lib/pkgconfig:$PKG_CONFIG_PATH"
            echo "Using Homebrew OpenSSL: $OPENSSL_DIR"
        else
            echo "Warning: Homebrew OpenSSL not found. Install with: brew install openssl@3"
            echo "Falling back to vendored OpenSSL build"
            export OPENSSL_VENDORED=1
        fi
    fi
else
    # CI or other environments (non-Android): allow cross pkg-config if needed
    if [ -n "$CI" ]; then
        echo "CI build: enabling PKG_CONFIG_ALLOW_CROSS"
        export PKG_CONFIG_ALLOW_CROSS=1
    fi
fi

echo "OpenSSL configuration complete"
