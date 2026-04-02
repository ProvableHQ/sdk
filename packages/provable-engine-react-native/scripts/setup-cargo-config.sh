#!/bin/bash

# Script to generate .cargo/config.toml with dynamic Xcode and Android NDK paths

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CARGO_CONFIG_DIR="$PROJECT_DIR/.cargo"
CARGO_CONFIG_FILE="$CARGO_CONFIG_DIR/config.toml"

# Create .cargo directory if it doesn't exist
mkdir -p "$CARGO_CONFIG_DIR"

# Detect if we're building on macOS and collect Xcode SDK paths
if [[ "$(uname)" == "Darwin" ]]; then
    # Detect Xcode installation
    XCODE_PATH=$(xcode-select -p 2>/dev/null)
    if [ -z "$XCODE_PATH" ]; then
        echo "Error: Xcode not found. Please install Xcode and run 'xcode-select --install'" >&2
        exit 1
    fi

    # Construct SDK paths
    IOS_SDK_PATH="$XCODE_PATH/Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS.sdk"
    IOS_SIM_SDK_PATH="$XCODE_PATH/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator.sdk"
    MACOS_SDK_PATH="$XCODE_PATH/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk"

    # Verify SDK paths (only enforce iOS paths when actually doing iOS work)
    if [ -z "$ANDROID_ABI" ]; then
        if [ ! -d "$IOS_SDK_PATH" ]; then
            echo "Error: iOS SDK not found at $IOS_SDK_PATH" >&2
            exit 1
        fi
        if [ ! -d "$IOS_SIM_SDK_PATH" ]; then
            echo "Error: iOS Simulator SDK not found at $IOS_SIM_SDK_PATH" >&2
            exit 1
        fi
    fi

    # macOS SDK may be used for host builds even when cross-compiling to iOS
    if [ ! -d "$MACOS_SDK_PATH" ]; then
        # Fall back to xcrun query if path differs
        MACOS_SDK_PATH=$(xcrun --sdk macosx --show-sdk-path 2>/dev/null || true)
    fi
    if [ -z "$MACOS_SDK_PATH" ] || [ ! -d "$MACOS_SDK_PATH" ]; then
        echo "Warning: macOS SDK not found via Xcode path or xcrun; host builds may fail" >&2
    fi
fi

# Detect Android NDK for Android builds
if [ -n "$ANDROID_ABI" ] || [ "$PLATFORM" = "android" ]; then
    if [ -n "$ANDROID_NDK_ROOT" ]; then
        NDK_PATH="$ANDROID_NDK_ROOT"
    elif [ -n "$ANDROID_HOME" ]; then
        NDK_PATH=$(find "$ANDROID_HOME/ndk" -maxdepth 1 -type d -name "[0-9]*" | sort -V | tail -1)
    elif [ -n "$ANDROID_SDK_ROOT" ]; then
        NDK_PATH=$(find "$ANDROID_SDK_ROOT/ndk" -maxdepth 1 -type d -name "[0-9]*" | sort -V | tail -1)
    else
        echo "Warning: Android NDK not found. Set ANDROID_NDK_ROOT or ANDROID_HOME" >&2
        NDK_PATH=""
    fi

    if [ -n "$NDK_PATH" ] && [ -d "$NDK_PATH" ]; then
        echo "Using Android NDK: $NDK_PATH"
    else
        echo "Warning: Android NDK path not found or invalid: $NDK_PATH" >&2
    fi
fi

# Set iOS deployment target - use IOS_DEPLOYMENT_TARGET or default to 15.1
IOS_DEPLOYMENT_TARGET="${IOS_DEPLOYMENT_TARGET:-15.1}"

# Start generating config.toml
cat > "$CARGO_CONFIG_FILE" << EOF
# Generated cargo config for cross-compilation

EOF

# Add iOS configuration if building for iOS
if [[ "$(uname)" == "Darwin" ]] && [ -z "$ANDROID_ABI" ] && [ -n "$IOS_SDK_PATH" ]; then
    cat >> "$CARGO_CONFIG_FILE" << EOF
[target.aarch64-apple-ios]
linker = "clang"
rustflags = [
  "-C", "link-arg=-target",
  "-C", "link-arg=aarch64-apple-ios$IOS_DEPLOYMENT_TARGET",
  "-C", "link-arg=-isysroot",
  "-C", "link-arg=$IOS_SDK_PATH",
  "-C", "link-arg=-mios-version-min=$IOS_DEPLOYMENT_TARGET"
]

[target.x86_64-apple-ios]
linker = "clang"
rustflags = [
  "-C", "link-arg=-target",
  "-C", "link-arg=x86_64-apple-ios$IOS_DEPLOYMENT_TARGET-simulator",
  "-C", "link-arg=-isysroot",
  "-C", "link-arg=$IOS_SIM_SDK_PATH",
  "-C", "link-arg=-mios-simulator-version-min=$IOS_DEPLOYMENT_TARGET"
]

[target.aarch64-apple-ios-sim]
linker = "clang"
rustflags = [
  "-C", "link-arg=-target",
  "-C", "link-arg=aarch64-apple-ios$IOS_DEPLOYMENT_TARGET-simulator",
  "-C", "link-arg=-isysroot",
  "-C", "link-arg=$IOS_SIM_SDK_PATH",
  "-C", "link-arg=-mios-simulator-version-min=$IOS_DEPLOYMENT_TARGET"
]

EOF
fi

# Always add host macOS configuration on Darwin to avoid SDKROOT contamination
if [[ "$(uname)" == "Darwin" ]] && [ -n "$MACOS_SDK_PATH" ]; then
    cat >> "$CARGO_CONFIG_FILE" << EOF

[target.aarch64-apple-darwin]
linker = "clang"
rustflags = [
  "-C", "link-arg=-isysroot",
  "-C", "link-arg=$MACOS_SDK_PATH",
  "-C", "link-arg=-Wl,-syslibroot,$MACOS_SDK_PATH"
]

[target.x86_64-apple-darwin]
linker = "clang"
rustflags = [
  "-C", "link-arg=-isysroot",
  "-C", "link-arg=$MACOS_SDK_PATH",
  "-C", "link-arg=-Wl,-syslibroot,$MACOS_SDK_PATH"
]

EOF
fi

# Add Android NDK toolchain configuration if building for Android
if [ -n "$NDK_PATH" ] && [ -d "$NDK_PATH" ]; then
    # Detect host OS for NDK prebuilt directory
    HOST_OS=$(uname -s)
    case "$HOST_OS" in
        Darwin)
            # Prefer Apple Silicon prebuilt if present to avoid Rosetta
            if [ -d "$NDK_PATH/toolchains/llvm/prebuilt/darwin-aarch64" ]; then
                NDK_HOST="darwin-aarch64"
            else
                NDK_HOST="darwin-x86_64"
            fi
            ;;
        Linux) NDK_HOST="linux-x86_64" ;;
        *) echo "Warning: Unsupported host OS: $HOST_OS, defaulting to linux-x86_64" >&2; NDK_HOST="linux-x86_64" ;;
    esac

    # Use API level 21 (minimum for 64-bit Android)
    ANDROID_API_LEVEL="21"

    echo "Using Android NDK host: $NDK_HOST, API level: $ANDROID_API_LEVEL"

    cat >> "$CARGO_CONFIG_FILE" << EOF

[target.aarch64-linux-android]
linker = "$NDK_PATH/toolchains/llvm/prebuilt/$NDK_HOST/bin/aarch64-linux-android$ANDROID_API_LEVEL-clang"
ar = "$NDK_PATH/toolchains/llvm/prebuilt/$NDK_HOST/bin/llvm-ar"

[target.armv7-linux-androideabi]
linker = "$NDK_PATH/toolchains/llvm/prebuilt/$NDK_HOST/bin/armv7a-linux-androideabi$ANDROID_API_LEVEL-clang"
ar = "$NDK_PATH/toolchains/llvm/prebuilt/$NDK_HOST/bin/llvm-ar"

[target.i686-linux-android]
linker = "$NDK_PATH/toolchains/llvm/prebuilt/$NDK_HOST/bin/i686-linux-android$ANDROID_API_LEVEL-clang"
ar = "$NDK_PATH/toolchains/llvm/prebuilt/$NDK_HOST/bin/llvm-ar"

[target.x86_64-linux-android]
linker = "$NDK_PATH/toolchains/llvm/prebuilt/$NDK_HOST/bin/x86_64-linux-android$ANDROID_API_LEVEL-clang"
ar = "$NDK_PATH/toolchains/llvm/prebuilt/$NDK_HOST/bin/llvm-ar"

EOF
fi

# Add environment configuration
cat >> "$CARGO_CONFIG_FILE" << EOF

[env]
# OpenSSL configuration - let build script handle this
# PKG_CONFIG_ALLOW_CROSS = "1"
EOF

echo "Generated .cargo/config.toml"
if [ -n "$IOS_SDK_PATH" ]; then
    echo "  iOS SDK: $IOS_SDK_PATH"
    echo "  iOS Simulator SDK: $IOS_SIM_SDK_PATH"
    echo "  iOS Deployment Target: $IOS_DEPLOYMENT_TARGET"
fi
if [ -n "$NDK_PATH" ]; then
    echo "  Android NDK: $NDK_PATH"
fi
