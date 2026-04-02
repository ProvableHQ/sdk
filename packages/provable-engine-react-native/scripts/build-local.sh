#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="$SCRIPT_DIR/../build"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

step() {
  echo ""
  echo -e "${BOLD}=== $1 ===${NC}"
}

success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Parse flags
SKIP_TS=false
SKIP_IOS_DEVICE=false
SKIP_IOS_SIMULATOR=false
SKIP_ANDROID=false

for arg in "$@"; do
  case $arg in
    --skip-ts)           SKIP_TS=true ;;
    --skip-ios-device)   SKIP_IOS_DEVICE=true ;;
    --skip-ios-sim)      SKIP_IOS_SIMULATOR=true ;;
    --skip-android)      SKIP_ANDROID=true ;;
    --ios-only)          SKIP_ANDROID=true ;;
    --help)
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  --skip-ts           Skip TypeScript build"
      echo "  --skip-ios-device   Skip iOS device Rust build"
      echo "  --skip-ios-sim      Skip iOS simulator Rust build"
      echo "  --skip-android      Skip Android Rust build"
      echo "  --ios-only          Build iOS only (skips Android)"
      exit 0
      ;;
  esac
done

cd "$SCRIPT_DIR/.."
chmod +x scripts/*.sh

# TypeScript
if [ "$SKIP_TS" = false ]; then
  step "Building TypeScript library"
  bun release
  success "TypeScript build complete"
fi

# iOS device
if [ "$SKIP_IOS_DEVICE" = false ]; then
  step "Building Rust — iOS device (arm64)"
  rm -rf "$BUILD_DIR/ios-device"
  PLATFORM_NAME=iphoneos ARCHS=arm64 CI=true bash scripts/build-rust.sh
  mv "$BUILD_DIR/ios" "$BUILD_DIR/ios-device"
  success "iOS device build complete"
fi

# iOS simulator
if [ "$SKIP_IOS_SIMULATOR" = false ]; then
  step "Building Rust — iOS simulator (arm64)"
  rm -rf "$BUILD_DIR/ios-simulator"
  PLATFORM_NAME=iphonesimulator ARCHS=arm64 CI=true bash scripts/build-rust.sh
  mv "$BUILD_DIR/ios" "$BUILD_DIR/ios-simulator"
  success "iOS simulator build complete"
fi

# Android
if [ "$SKIP_ANDROID" = false ]; then
  step "Building Rust — Android (arm64-v8a)"
  PLATFORM=android ANDROID_ABI=aarch64-linux-android CI=true bash scripts/build-rust.sh
  success "Android build complete"
fi

# Summary
step "Build artifacts"
echo "=== iOS Device ==="
ls -lh "$BUILD_DIR/ios-device/mainnet/" "$BUILD_DIR/ios-device/testnet/"
echo ""
echo "=== iOS Simulator ==="
ls -lh "$BUILD_DIR/ios-simulator/mainnet/" "$BUILD_DIR/ios-simulator/testnet/"
if [ "$SKIP_ANDROID" = false ]; then
  echo ""
  echo "=== Android ==="
  ls -lhR "$BUILD_DIR/android/"
fi

echo ""
success "All builds complete"
