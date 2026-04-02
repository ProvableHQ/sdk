#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

BUILD_DIR="$SCRIPT_DIR/../build"
mkdir -p "$BUILD_DIR"
BUILD_DIR="$(cd "$BUILD_DIR" && pwd)"

PKG_DIR="$SCRIPT_DIR/../"
PKG_DIR="$(cd "$PKG_DIR" && pwd)"

# Flatten Nitrogen headers
$SCRIPT_DIR/flatten-nitro-headers.sh $BUILD_DIR

# Create a clean CMakeLists.txt for IDE support with explicit lists
cat > "$PKG_DIR/CMakeLists.txt" << 'EOF'
cmake_minimum_required(VERSION 3.10.0)
project(ShieldMobileSdk)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Include directories
include_directories(
  "android/src/main/cpp"
  "src/cpp"
  "src/cpp/account"
  "build/includes"
  "build/includes/rust"
  "nitrogen/generated/ios"
  "nitrogen/generated/android"
  "nitrogen/generated/shared/c++"
  "../../node_modules/react-native/ReactCommon/jsi"
)

# Source files
add_library(ShieldMobileSdk STATIC
  android/src/main/cpp/cpp-adapter.cpp
  src/cpp/HybridAccount.cpp
  src/cpp/HybridAuthorization.cpp
  src/cpp/HybridProvingRequest.cpp
)
EOF

# Generate compile_commands.json (run from package root, build in build dir)
cmake -S "$PKG_DIR" -B "$BUILD_DIR"

# Copy the generated compile_commands.json to the project root
cp "$BUILD_DIR/compile_commands.json" "$PKG_DIR/compile_commands.json"

# Clean up the temporary CMakeLists.txt
rm "$PKG_DIR/CMakeLists.txt"

echo "Generated compile_commands.json for IDE support"
echo "To enable, add '--compile-commands-dir=${PKG_DIR}' to your VSCode settings.json under 'clangd.arguments'."
