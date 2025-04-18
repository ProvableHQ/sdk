#!/bin/bash

# script exists immediately if command fails
set -e

# check for dependencies
command -v git >/dev/null 2>&1 || { echo >&2 "git is required but it's not installed. Aborting."; exit 1; }
command -v cargo >/dev/null 2>&1 || { echo >&2 "cargo is required but it's not installed. Aborting."; exit 1; }

INSTALL_DIR="${INSTALL_DIR:-$HOME/.leo}"

# ask for confirmation
read -p "This script will install Leo into $INSTALL_DIR. Do you want to continue? (y/N) " choice
case "$choice" in 
  y|Y ) echo "Continuing installation...";;
  * ) echo "Aborting."; exit;;
esac

# clone or update the repo
if [ -d "$INSTALL_DIR" ]; then
  echo "Directory $INSTALL_DIR exists. Updating repository..."
  git -C "$INSTALL_DIR" pull
else
  echo "Cloning repository into $INSTALL_DIR..."
  git clone https://github.com/ProvableHQ/leo "$INSTALL_DIR"
fi

# build and install
echo "Building and installing from source..."
cargo install --path "$INSTALL_DIR"
