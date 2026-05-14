#!/bin/sh
set -e

export HOMEBREW_NO_AUTO_UPDATE=1
export HOMEBREW_NO_INSTALL_CLEANUP=1

# Set up Homebrew environment (Apple Silicon runners use /opt/homebrew)
if [ -f "/opt/homebrew/bin/brew" ]; then
  eval "$(/opt/homebrew/bin/brew shellenv)"
elif [ -f "/usr/local/bin/brew" ]; then
  eval "$(/usr/local/bin/brew shellenv)"
fi

# Node is not pre-installed on Xcode Cloud — install it
brew install node

echo "Node: $(node --version)"
echo "npm:  $(npm --version)"

cd "$CI_PRIMARY_REPOSITORY_PATH"

npm ci
npm run build
npx cap sync ios
