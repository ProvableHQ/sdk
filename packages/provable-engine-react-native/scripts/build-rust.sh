#!/bin/bash
# Script to build Rust static library for React Native

set -e

# Add system paths for basic commands since Xcode builds have restricted PATH
export PATH="/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

SCRIPT_DIR="$(cd "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
CRATE_DIR="$SCRIPT_DIR/.."
BUILD_DIR="$SCRIPT_DIR/../build"

# Setup cargo environment
eval "$("$SCRIPT_DIR/setup-cargo.sh")"

# For iOS builds, ensure the iOS target is installed
if [ "$PLATFORM" != "android" ]; then
  "$SCRIPT_DIR/setup-ios-targets.sh" "$CARGO"
fi



# Create output directory for CI artifacts
if [ -n "$CI" ] || [ -n "$GITHUB_ACTIONS" ]; then
    OUTPUT_DIR="$HOME/output"
    mkdir -p "$OUTPUT_DIR"
    BUILD_LOG="$OUTPUT_DIR/rust-build.log"
    exec > >(tee -a "$BUILD_LOG") 2>&1
fi

echo "--- Rust Build Script ---"
echo "Platform     : '$PLATFORM'"
echo "Platform Name: '$PLATFORM_NAME'"
echo "Architectures: '$ARCHS'"
echo "Configuration: '$CONFIGURATION'"
echo "SDK Name     : '$SDK_NAME'"
echo "Android ABI  : '$ANDROID_ABI'"
echo "Current Arch : '$CURRENT_ARCH'"
echo "cargo        : '$CARGO'"
echo "rustc        : '$RUSTC'"

# Prevent Xcode's iOS SDKROOT from contaminating cargo host builds. Set SDKROOT to macOS SDK so host linkers can find libSystem.
ORIG_SDKROOT="$SDKROOT"
if [[ "$(uname)" == "Darwin" ]]; then
  MACOS_SDK_PATH=$(xcrun --sdk macosx --show-sdk-path 2>/dev/null || true)
  if [ -n "$MACOS_SDK_PATH" ]; then
    export SDKROOT="$MACOS_SDK_PATH"
    echo "Configured SDKROOT for host builds to macOS SDK: $SDKROOT"
  else
    # As a fallback, unset SDKROOT to avoid iOS SDK poisoning
    if [ -n "$SDKROOT" ]; then
      echo "Could not resolve macOS SDK; unsetting SDKROOT to avoid iOS sysroot: $SDKROOT"
      unset SDKROOT
    fi
  fi
  # Ensure host CC/CXX are clang/clang++
  export CC=clang
  export CXX=clang++

  # Explicitly instruct cargo to use clang and macOS sysroot for host target link steps
  if [ -n "$MACOS_SDK_PATH" ]; then
    export CARGO_TARGET_AARCH64_APPLE_DARWIN_LINKER=clang
    export CARGO_TARGET_X86_64_APPLE_DARWIN_LINKER=clang
    export CARGO_TARGET_AARCH64_APPLE_DARWIN_RUSTFLAGS="$CARGO_TARGET_AARCH64_APPLE_DARWIN_RUSTFLAGS -C link-arg=-isysroot -C link-arg=$MACOS_SDK_PATH"
    export CARGO_TARGET_X86_64_APPLE_DARWIN_RUSTFLAGS="$CARGO_TARGET_X86_64_APPLE_DARWIN_RUSTFLAGS -C link-arg=-isysroot -C link-arg=$MACOS_SDK_PATH"
    echo "Configured host linker to use clang with macOS SDK: $MACOS_SDK_PATH"
  fi
fi

# Setup OpenSSL configuration
source "$SCRIPT_DIR/setup-openssl.sh"

# Detect platform (iOS or Android)
if [ -n "$ANDROID_ABI" ]; then
  # Android build
  PLATFORM="android"
  # Map Android ABI to architecture name expected by the script
  case "$ANDROID_ABI" in
    aarch64-linux-android)
      ARCHS="arm64-v8a"
      ;;
    armv7-linux-androideabi)
      ARCHS="armeabi-v7a"
      ;;
    i686-linux-android)
      ARCHS="x86"
      ;;
    x86_64-linux-android)
      ARCHS="x86_64"
      ;;
    *)
      # If it's already in the expected format, use as-is
      ARCHS="$ANDROID_ABI"
      ;;
  esac
else
  # iOS build - detect from Xcode environment or set defaults
  PLATFORM="ios"

  # Try to detect platform from Xcode environment variables
  if [ -n "$SDK_NAME" ]; then
    if [[ "$SDK_NAME" == *"simulator"* ]]; then
      PLATFORM_NAME="iphonesimulator"
    else
      PLATFORM_NAME="iphoneos"
    fi
  elif [ -z "$PLATFORM_NAME" ]; then
    # Default to simulator for CI builds, device for local builds
    if [ -n "$CI" ] || [ -n "$GITHUB_ACTIONS" ]; then
      PLATFORM_NAME="iphonesimulator"
    else
      PLATFORM_NAME="iphoneos"
    fi
  fi

  # Handle architecture detection for both CI and local builds
  if [ -n "$CURRENT_ARCH" ] && [ "$CURRENT_ARCH" != "undefined_arch" ]; then
    # Local Xcode build - use the specific architecture
    ARCHS="$CURRENT_ARCH"
  elif [ -n "$ARCHS" ]; then
    # CI build or multi-arch build - ARCHS already set, keep it
    echo "Using provided architectures: $ARCHS"
  else
    # Fallback based on platform
    if [ "$PLATFORM_NAME" = "iphonesimulator" ]; then
      # For simulator, build both architectures for universal support
      ARCHS="arm64 x86_64"
    else
      # For device, just arm64
      ARCHS="arm64"
    fi
  fi
fi

# Create necessary directories
mkdir -p $BUILD_DIR/includes/rust
mkdir -p $BUILD_DIR/android
mkdir -p $BUILD_DIR/ios

# Determine iOS variant directory for prebuilt binaries
if [ "$PLATFORM_NAME" = "iphonesimulator" ]; then
  IOS_PREBUILT_DIR="$BUILD_DIR/ios-simulator"
else
  IOS_PREBUILT_DIR="$BUILD_DIR/ios-device"
fi

# Exit early if prebuilt binaries exist, and copy them to the canonical build/ios/ location
EARLY_SKIP=true
if [ ! -f "$BUILD_DIR/includes/rust/cxx.h" ]; then
  EARLY_SKIP=false
elif [ "$PLATFORM" = "android" ]; then
  case "$ANDROID_ABI" in
    aarch64-linux-android) ABI_CHECK="arm64-v8a" ;;
    armv7-linux-androideabi) ABI_CHECK="armeabi-v7a" ;;
    i686-linux-android) ABI_CHECK="x86" ;;
    x86_64-linux-android) ABI_CHECK="x86_64" ;;
    *) ABI_CHECK="$ANDROID_ABI" ;;
  esac
  if [ ! -f "$BUILD_DIR/android/mainnet/$ABI_CHECK/libshield_mobile_sdk_mainnet.a" ] || \
     [ ! -f "$BUILD_DIR/android/testnet/$ABI_CHECK/libshield_mobile_sdk_testnet.a" ]; then
    EARLY_SKIP=false
  fi
else
  # Check for prebuilt iOS binaries (device or simulator depending on PLATFORM_NAME)
  if [ -f "$IOS_PREBUILT_DIR/mainnet/libshield_mobile_sdk_mainnet.a" ] && \
     [ -f "$IOS_PREBUILT_DIR/testnet/libshield_mobile_sdk_testnet.a" ] && \
     [ -f "$IOS_PREBUILT_DIR/mainnet/libcxxbridge1_mainnet.a" ] && \
     [ -f "$IOS_PREBUILT_DIR/testnet/libcxxbridge1_testnet.a" ]; then
    # Copy prebuilt binaries to canonical location
    echo "Found prebuilt iOS binaries in $IOS_PREBUILT_DIR, copying to build/ios/..."
    mkdir -p "$BUILD_DIR/ios/mainnet" "$BUILD_DIR/ios/testnet"
    cp -f "$IOS_PREBUILT_DIR/mainnet/"*.a "$BUILD_DIR/ios/mainnet/"
    cp -f "$IOS_PREBUILT_DIR/testnet/"*.a "$BUILD_DIR/ios/testnet/"
  elif [ -f "$BUILD_DIR/ios/mainnet/libshield_mobile_sdk_mainnet.a" ] && \
       [ -f "$BUILD_DIR/ios/testnet/libshield_mobile_sdk_testnet.a" ] && \
       [ -f "$BUILD_DIR/ios/mainnet/libcxxbridge1_mainnet.a" ] && \
       [ -f "$BUILD_DIR/ios/testnet/libcxxbridge1_testnet.a" ]; then
    # Binaries already in canonical location (local dev / yarn link)
    true
  else
    EARLY_SKIP=false
  fi
fi

if [ "$EARLY_SKIP" = true ]; then
  echo "All build outputs found — skipping Rust build (prebuilt)"
  echo "--- Build skipped (cache hit) ---"
  exit 0
fi

# Flatten nitro headers
$SCRIPT_DIR/flatten-nitro-headers.sh $BUILD_DIR

# Determine Rust targets based on platform
if [ "$PLATFORM" = "android" ]; then
  # Android target mapping
  case "$ARCHS" in
    arm64-v8a)
      RUST_TARGETS="aarch64-linux-android"
      ;;
    armeabi-v7a)
      RUST_TARGETS="armv7-linux-androideabi"
      ;;
    x86)
      RUST_TARGETS="i686-linux-android"
      ;;
    x86_64)
      RUST_TARGETS="x86_64-linux-android"
      ;;
    *)
      echo "Unsupported Android architecture: $ARCHS"
      exit 1
      ;;
  esac
else
  # iOS target mapping - handle multiple architectures
  RUST_TARGETS=""
  case "$PLATFORM_NAME" in
    iphonesimulator)
      # Parse multiple architectures for simulator
      for arch in $ARCHS; do
        case "$arch" in
          x86_64)
            RUST_TARGETS="$RUST_TARGETS x86_64-apple-ios"
            ;;
          arm64)
            RUST_TARGETS="$RUST_TARGETS aarch64-apple-ios-sim"
            ;;
          *)
            echo "Unsupported simulator architecture: $arch"
            exit 1
            ;;
        esac
      done
      ;;
    *)
      # Default to physical device
      RUST_TARGETS="aarch64-apple-ios"
      ;;
  esac
  # Clean up extra spaces
  RUST_TARGETS=$(echo $RUST_TARGETS | xargs)
fi

echo "Building for $PLATFORM targets: $RUST_TARGETS"

# Use cached build outputs if possible
if [ -n "$CI" ] || [ -n "$GITHUB_ACTIONS" ]; then
  SKIP_BUILD=true
  NETWORKS_CHECK=("mainnet" "testnet")
  for NETWORK in "${NETWORKS_CHECK[@]}"; do
    if [ "$PLATFORM" = "android" ]; then
      for RUST_TARGET in $RUST_TARGETS; do
        case "$RUST_TARGET" in
          aarch64-linux-android) ABI_DIR="arm64-v8a" ;;
          armv7-linux-androideabi) ABI_DIR="armeabi-v7a" ;;
          i686-linux-android) ABI_DIR="x86" ;;
          x86_64-linux-android) ABI_DIR="x86_64" ;;
          *) ABI_DIR="$RUST_TARGET" ;;
        esac
        EXPECTED="$BUILD_DIR/android/$NETWORK/$ABI_DIR/libshield_mobile_sdk_${NETWORK}.a"
        if [ ! -f "$EXPECTED" ]; then
          echo "Cache miss: $EXPECTED not found"
          SKIP_BUILD=false
          break 2
        fi
      done
    else
      EXPECTED="$BUILD_DIR/ios/$NETWORK/libshield_mobile_sdk_${NETWORK}.a"
      if [ ! -f "$EXPECTED" ]; then
        echo "Cache miss: $EXPECTED not found"
        SKIP_BUILD=false
        break
      fi
      EXPECTED_CXX="$BUILD_DIR/ios/$NETWORK/libcxxbridge1_${NETWORK}.a"
      if [ ! -f "$EXPECTED_CXX" ]; then
        echo "Cache miss: $EXPECTED_CXX not found"
        SKIP_BUILD=false
        break
      fi
    fi
  done

  # Only use cache if cxx.h exists
  if [ "$SKIP_BUILD" = true ]; then
    if [ ! -f "$BUILD_DIR/includes/rust/cxx.h" ]; then
      echo "Cache miss: cxx.h header not found"
      SKIP_BUILD=false
    fi
  fi

  if [ "$SKIP_BUILD" = true ]; then
    echo "All cached build outputs found — skipping Rust build"
    echo "--- Build skipped (cache hit) ---"
    exit 0
  fi
fi

# Set platform-specific configuration
if [ "$PLATFORM" != "android" ]; then
  # Generate dynamic cargo config for iOS cross-compilation
  echo "Setting up iOS cross-compilation configuration..."
  "$SCRIPT_DIR/setup-cargo-config.sh"

  # Set iOS-specific environment variables - use IOS_DEPLOYMENT_TARGET or default to 15.1
  export IPHONEOS_DEPLOYMENT_TARGET="${IOS_DEPLOYMENT_TARGET:-15.1}"
fi
export PKG_CONFIG_ALLOW_CROSS=1

# Set up Android NDK environment if building for Android
if [ "$PLATFORM" = "android" ]; then
  # Generate cargo config which handles NDK toolchain setup
  "$SCRIPT_DIR/setup-cargo-config.sh"
fi

# perform builds from crate root
pushd $CRATE_DIR

# Clean any existing target folder to prevent issues
BASE_TARGET_DIR="/tmp/shield-rust-build-target"
rm -rf target
rm -rf "$BASE_TARGET_DIR"

# Set target directory for all cargo operations in this session
export CARGO_TARGET_DIR="$BASE_TARGET_DIR"

# Install cxxbridge-cmd if not available
if ! command -v cxxbridge &> /dev/null; then
    echo "Installing cxxbridge-cmd..."
    $CARGO install cxxbridge-cmd
fi

# Generate C++ headers to build/includes/rust (not target directory to avoid ENAMETOOLONG)
echo "Generating C++ support headers..."
cxxbridge --header -o "$BUILD_DIR/includes/rust/cxx.h"

NETWORKS=("mainnet" "testnet")

for NETWORK in "${NETWORKS[@]}"; do
  if [ "$NETWORK" = "mainnet" ]; then
    FEATURE_FLAG="mainnet"
    CXX_NAMESPACE="shield_mainnet"
  else
    FEATURE_FLAG="testnet"
    CXX_NAMESPACE="shield_testnet"
  fi

  echo ""
  echo "--- Building Rust artifacts for $NETWORK ---"

  HEADER_OUTPUT="$BUILD_DIR/includes/rust/${CXX_NAMESPACE}.h"
  cxxbridge src/rust/lib.rs --header --cfg "feature=\"$FEATURE_FLAG\"" -o "$HEADER_OUTPUT"

  for RUST_TARGET in $RUST_TARGETS; do
    echo "Building Rust library for target: $RUST_TARGET ($NETWORK)"

    TARGET_DIR="$BASE_TARGET_DIR/$NETWORK/$RUST_TARGET"
    mkdir -p "$TARGET_DIR"

    CARGO_TARGET_DIR="$TARGET_DIR" $CARGO build --target "$RUST_TARGET" --release --no-default-features --features "$FEATURE_FLAG"

    ARTIFACT_DIR="$TARGET_DIR/$RUST_TARGET/release"
    LIB_PATH="$ARTIFACT_DIR/libshield_mobile_sdk.a"
    if [ ! -f "$LIB_PATH" ]; then
      LIB_PATH="$ARTIFACT_DIR/libshield_mobile_sdk.so"
    fi
    if [ ! -f "$LIB_PATH" ]; then
      echo "Error: Shield library not found for $RUST_TARGET ($NETWORK) in $ARTIFACT_DIR"
      exit 1
    fi

    # Merge libsodium.a into the Rust staticlib so iOS linker can resolve sodium symbols.
    # libsodium-sys-stable compiles libsodium from source but does not archive its objects
    # into the Rust staticlib output; we must merge them ourselves.
    LIBSODIUM_A=$(find "$TARGET_DIR/$RUST_TARGET/release/build" -name "libsodium.a" -type f 2>/dev/null | head -1)
    if [ -n "$LIBSODIUM_A" ] && [ -f "$LIBSODIUM_A" ]; then
      echo "Merging libsodium into Rust staticlib: $LIBSODIUM_A"
      MERGED_TMP="/tmp/merged_shield_${NETWORK}_${RUST_TARGET}.a"
      if [ "$PLATFORM" = "android" ]; then
        # Use NDK's llvm-ar for Android ELF libraries (macOS libtool only handles Mach-O)
        HOST_OS=$(uname -s)
        case "$HOST_OS" in
          Darwin)
            if [ -d "$ANDROID_NDK_ROOT/toolchains/llvm/prebuilt/darwin-aarch64" ]; then
              NDK_HOST="darwin-aarch64"
            else
              NDK_HOST="darwin-x86_64"
            fi
            ;;
          Linux) NDK_HOST="linux-x86_64" ;;
          *) NDK_HOST="linux-x86_64" ;;
        esac
        LLVM_AR="$ANDROID_NDK_ROOT/toolchains/llvm/prebuilt/$NDK_HOST/bin/llvm-ar"
        "$LLVM_AR" -M <<EOF
CREATE $MERGED_TMP
ADDLIB $LIB_PATH
ADDLIB $LIBSODIUM_A
SAVE
END
EOF
      else
        libtool -static -o "$MERGED_TMP" "$LIB_PATH" "$LIBSODIUM_A"
      fi
      mv "$MERGED_TMP" "$LIB_PATH"
      echo "Merged libsodium into $LIB_PATH"
    else
      echo "Warning: libsodium.a not found in build tree for $RUST_TARGET ($NETWORK) — sodium symbols may be unresolved"
    fi

    EXTENSION="${LIB_PATH##*.}"

    if [ "$PLATFORM" = "android" ]; then
      case "$RUST_TARGET" in
        aarch64-linux-android) ANDROID_ABI_TARGET="arm64-v8a" ;;
        armv7-linux-androideabi) ANDROID_ABI_TARGET="armeabi-v7a" ;;
        i686-linux-android) ANDROID_ABI_TARGET="x86" ;;
        x86_64-linux-android) ANDROID_ABI_TARGET="x86_64" ;;
        *)
          echo "Unknown Android target: $RUST_TARGET"
          exit 1
          ;;
      esac

      DEST_DIR="$BUILD_DIR/android/$NETWORK/$ANDROID_ABI_TARGET"
      mkdir -p "$DEST_DIR"
      DEST_LIB="$DEST_DIR/libshield_mobile_sdk_${NETWORK}.${EXTENSION}"
      cp "$LIB_PATH" "$DEST_LIB"
      echo "Copied $LIB_PATH to $DEST_LIB"
    else
      IOS_VARIANT_DIR="$BUILD_DIR/ios/$NETWORK"
      mkdir -p "$IOS_VARIANT_DIR"

      DEST_LIB="$IOS_VARIANT_DIR/libshield_mobile_sdk_${NETWORK}_${RUST_TARGET}.${EXTENSION}"
      cp "$LIB_PATH" "$DEST_LIB"
      echo "Copied $LIB_PATH to $DEST_LIB"

      CXXBRIDGE_LIB=$(find "$TARGET_DIR/$RUST_TARGET/release/build" -name "libcxxbridge1.a" -type f | head -1)
      if [ -n "$CXXBRIDGE_LIB" ] && [ -f "$CXXBRIDGE_LIB" ]; then
        cp "$CXXBRIDGE_LIB" "$IOS_VARIANT_DIR/libcxxbridge1_${NETWORK}_${RUST_TARGET}.a"
        echo "Copied cxxbridge runtime library for $RUST_TARGET ($NETWORK)"
      else
        echo "Warning: cxxbridge runtime library not found for $RUST_TARGET ($NETWORK)"
      fi
    fi
  done

  if [ "$PLATFORM" != "android" ]; then
    IOS_VARIANT_DIR="$BUILD_DIR/ios/$NETWORK"
    if [ $(echo $RUST_TARGETS | wc -w) -gt 1 ]; then
      echo "Creating universal iOS library for $NETWORK..."
      LIPO_INPUTS=""
      CXXBRIDGE_INPUTS=""
      for RUST_TARGET in $RUST_TARGETS; do
        LIPO_INPUTS="$LIPO_INPUTS $IOS_VARIANT_DIR/libshield_mobile_sdk_${NETWORK}_${RUST_TARGET}.a"
        if [ -f "$IOS_VARIANT_DIR/libcxxbridge1_${NETWORK}_${RUST_TARGET}.a" ]; then
          CXXBRIDGE_INPUTS="$CXXBRIDGE_INPUTS $IOS_VARIANT_DIR/libcxxbridge1_${NETWORK}_${RUST_TARGET}.a"
        fi
      done

      lipo -create $LIPO_INPUTS -output "$IOS_VARIANT_DIR/libshield_mobile_sdk_${NETWORK}.a"

      if [ -n "$CXXBRIDGE_INPUTS" ]; then
        lipo -create $CXXBRIDGE_INPUTS -output "$IOS_VARIANT_DIR/libcxxbridge1_${NETWORK}.a"
        echo "Created universal cxxbridge runtime library for $NETWORK"
      fi

      for RUST_TARGET in $RUST_TARGETS; do
        rm -f "$IOS_VARIANT_DIR/libshield_mobile_sdk_${NETWORK}_${RUST_TARGET}.a"
        rm -f "$IOS_VARIANT_DIR/libcxxbridge1_${NETWORK}_${RUST_TARGET}.a"
      done
    else
      RUST_TARGET=$(echo $RUST_TARGETS | xargs)
      mv "$IOS_VARIANT_DIR/libshield_mobile_sdk_${NETWORK}_${RUST_TARGET}.a" "$IOS_VARIANT_DIR/libshield_mobile_sdk_${NETWORK}.a"
      if [ -f "$IOS_VARIANT_DIR/libcxxbridge1_${NETWORK}_${RUST_TARGET}.a" ]; then
        mv "$IOS_VARIANT_DIR/libcxxbridge1_${NETWORK}_${RUST_TARGET}.a" "$IOS_VARIANT_DIR/libcxxbridge1_${NETWORK}.a"
        echo "Captured cxxbridge runtime library for $NETWORK"
      else
        echo "Warning: cxxbridge runtime library not found for $RUST_TARGET ($NETWORK)"
      fi
    fi
  fi
done

# Verify required libraries exist
if [ "$PLATFORM" != "android" ]; then
  for NETWORK in "${NETWORKS[@]}"; do
    IOS_VARIANT_DIR="$BUILD_DIR/ios/$NETWORK"
    LIB_FILE="$IOS_VARIANT_DIR/libshield_mobile_sdk_${NETWORK}.a"
    if [ ! -f "$LIB_FILE" ]; then
      echo "Error: Shield library not found at $LIB_FILE"
      exit 1
    fi

    CXX_LIB_FILE="$IOS_VARIANT_DIR/libcxxbridge1_${NETWORK}.a"
    if [ ! -f "$CXX_LIB_FILE" ]; then
      echo "Error: cxxbridge runtime library not found at $CXX_LIB_FILE"
      exit 1
    fi

    LIB_SIZE=$(stat -f%z "$LIB_FILE" 2>/dev/null || echo "unknown")
    CXX_SIZE=$(stat -f%z "$CXX_LIB_FILE" 2>/dev/null || echo "unknown")
    echo "Successfully created iOS libraries for $NETWORK:"
    echo "  $(basename "$LIB_FILE"): $LIB_SIZE bytes"
    echo "  $(basename "$CXX_LIB_FILE"): $CXX_SIZE bytes"
  done
fi

# Headers are generated automatically by cxx-build during Rust compilation

popd



echo "--- Build completed successfully ---"

# Restore original SDKROOT if it was set
if [ -n "$ORIG_SDKROOT" ]; then
  export SDKROOT="$ORIG_SDKROOT"
fi
