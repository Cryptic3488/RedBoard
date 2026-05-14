#!/bin/sh
set -e

# Xcode Cloud post-clone: build web app and sync Capacitor before Xcode compiles.
# Node.js is pre-installed on Xcode Cloud runners — no brew install needed.

# Ensure Homebrew-managed binaries are on PATH (handles both Intel and Apple Silicon)
if [ -f "/opt/homebrew/bin/brew" ]; then
  eval "$(/opt/homebrew/bin/brew shellenv)"
elif [ -f "/usr/local/bin/brew" ]; then
  eval "$(/usr/local/bin/brew shellenv)"
fi

echo "Node: $(node --version)"
echo "npm:  $(npm --version)"

# Repo root is two levels up from ios/App/ci_scripts
cd "$CI_PRIMARY_REPOSITORY_PATH"

npm ci
npm run build
npx cap sync ios
