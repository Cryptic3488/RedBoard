#!/bin/sh

# Xcode Cloud runs this after cloning the repo, before building.
# We need to install Node dependencies and build the web app so
# Capacitor's Swift packages can find the bundled assets.

set -e

# Xcode Cloud's macOS image has Node via Homebrew but it may not be on PATH
export HOMEBREW_NO_AUTO_UPDATE=1
brew install node@20 || true
export PATH="/usr/local/opt/node@20/bin:$PATH"

# Move to repo root (ci_scripts is at ios/App/ci_scripts)
cd "$CI_PRIMARY_REPOSITORY_PATH"

node --version
npm --version

npm ci
npm run build
npx cap sync ios
