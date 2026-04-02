#!/bin/bash

# This script flattens the header files from react-native-nitro-modules
# into a single directory for easier inclusion in Xcode projects.
# It mimics the behavior of CocoaPods for header management.

set -e # Exit immediately if a command exits with a non-zero status.


BUILD_DIR=$1
pushd "$BUILD_DIR"

# Define source and destination directories relative to the package root
DEST_DIR="$BUILD_DIR/includes/NitroModules"
# Resolve react-native-nitro-modules using Node's module resolution
NITRO_PATH=$(node -e "console.log(require.resolve('react-native-nitro-modules/package.json').replace('/package.json',''))" 2>/dev/null || true)

if [ -n "$NITRO_PATH" ] && [ -d "$NITRO_PATH/cpp" ]; then
    SOURCE_DIR="$NITRO_PATH/cpp"
elif [ -d "$BUILD_DIR/../node_modules/react-native-nitro-modules/cpp" ]; then
    SOURCE_DIR="$BUILD_DIR/../node_modules/react-native-nitro-modules/cpp"
else
    SOURCE_DIR="$BUILD_DIR/../../../node_modules/react-native-nitro-modules/cpp"
fi

# 1. Ensure the destination directory exists and is clean
echo "Preparing destination directory: $DEST_DIR"
mkdir -p "$DEST_DIR"
# Remove existing symlinks to avoid stale links
find "$DEST_DIR" -type l -delete

# Check if the source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo "Error: Source directory not found at $(realpath "$SOURCE_DIR")"
    echo "Please ensure react-native-nitro-modules is installed in the workspace root."
    exit 1
fi

echo "Flattening Nitro module headers..."

# 2. Loop through each subdirectory in the source directory
# Use -print0 and read -d '' to handle filenames with spaces or special characters
find "$SOURCE_DIR" -type f \( -name "*.h" -o -name "*.hpp" \) -print0 | while IFS= read -r -d $'\0' header_file; do
    # Get the absolute path of the header file to create a robust symlink
    abs_header_path=$(realpath "$header_file")
    
    # Get the base name of the header file
    header_name=$(basename "$header_file")
    
    # 3. Create the symlink in the destination directory
    ln -s "$abs_header_path" "$DEST_DIR/$header_name"
    echo "Symlinked $header_name"
done

popd

echo "Header flattening complete."
