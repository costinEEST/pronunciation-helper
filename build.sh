#!/bin/bash

# Build and release script for Pronunciation Helper browser extension
# Produces release-ready archives for Chrome and a signed XPI for Firefox,
# then optionally publishes them as a GitHub Release.
#
# Prerequisites:
#   - Node.js and npm installed
#   - MOZILLA_JWT_ISSUER and MOZILLA_JWT_SECRET set in ~/.zshenv
#   - GitHub CLI (gh) installed and authenticated (for --release flag)
#
# Usage:
#   ./build.sh            # Build only
#   ./build.sh --release  # Build and publish to GitHub Releases

set -e

RELEASE=false
if [ "$1" = "--release" ]; then
  RELEASE=true
fi

VERSION=$(grep '"version"' manifest.json | head -1 | sed 's/.*: *"\(.*\)".*/\1/')

if [ -z "$VERSION" ]; then
  echo "Error: Could not read version from manifest.json"
  exit 1
fi

echo "Building Pronunciation Helper v${VERSION}..."
echo ""

# --- Ensure web-ext is installed ---

if ! command -v web-ext &> /dev/null; then
  echo "web-ext not found. Installing globally..."
  npm install -g web-ext
  echo ""
fi

# --- Validate Mozilla credentials ---

if [ -z "$MOZILLA_JWT_ISSUER" ] || [ -z "$MOZILLA_JWT_SECRET" ]; then
  echo "Error: MOZILLA_JWT_ISSUER and MOZILLA_JWT_SECRET must be set."
  echo "Add them to ~/.zshenv and restart your terminal, or run:"
  echo "  export MOZILLA_JWT_ISSUER=your_key"
  echo "  export MOZILLA_JWT_SECRET=your_secret"
  exit 1
fi

# --- Setup ---

DIST_DIR="dist"
CHROME_FILE="${DIST_DIR}/pronunciation-helper-chrome-v${VERSION}.zip"

# Extension source files to include
FILES=(
  manifest.json
  background.js
  content.js
  content.css
  language-detector.js
  icons/
  LICENSE
)

mkdir -p "$DIST_DIR"

# --- Build Chrome ZIP ---

rm -f "$CHROME_FILE"
zip -r "$CHROME_FILE" "${FILES[@]}" -x '.*'
echo "✓ Chrome:  $CHROME_FILE"
echo ""

# --- Build and sign Firefox XPI ---

echo "Signing Firefox extension with web-ext..."
echo ""

web-ext sign \
  --source-dir=. \
  --artifacts-dir="$DIST_DIR" \
  --api-key="$MOZILLA_JWT_ISSUER" \
  --api-secret="$MOZILLA_JWT_SECRET" \
  --channel=unlisted \
  --ignore-files=dist/ .git/ .agents/ .kiro/ .gitignore skills-lock.json README.md build.sh

# Rename the signed XPI to our naming convention
SIGNED_XPI=$(find "$DIST_DIR" -name '*.xpi' -newer "$CHROME_FILE" | head -1)

if [ -n "$SIGNED_XPI" ]; then
  FIREFOX_FILE="${DIST_DIR}/pronunciation-helper-firefox-v${VERSION}.xpi"
  mv "$SIGNED_XPI" "$FIREFOX_FILE"
  echo ""
  echo "✓ Firefox: $FIREFOX_FILE (signed)"
else
  echo ""
  echo "⚠ Firefox signing may have failed. Check web-ext output above."
  echo "  The XPI might still be processing — Mozilla sometimes takes a few minutes."
  exit 1
fi

echo ""
echo "Done. Build artifacts are in ${DIST_DIR}/."

# --- Publish to GitHub Releases ---

if [ "$RELEASE" = true ]; then
  echo ""

  if ! command -v gh &> /dev/null; then
    echo "Error: GitHub CLI (gh) is not installed."
    echo "Install it with: brew install gh"
    echo "Then authenticate: gh auth login"
    exit 1
  fi

  if ! gh auth status &> /dev/null; then
    echo "Error: GitHub CLI is not authenticated."
    echo "Run: gh auth login"
    exit 1
  fi

  TAG="v${VERSION}"

  echo "Publishing GitHub Release ${TAG}..."
  echo ""

  # Create and push the git tag if it doesn't exist
  if git rev-parse "$TAG" &> /dev/null; then
    echo "Tag ${TAG} already exists, skipping tag creation."
  else
    git tag "$TAG"
    git push origin "$TAG"
    echo "✓ Created and pushed tag ${TAG}"
  fi

  # Create the GitHub release with both artifacts
  gh release create "$TAG" \
    "$CHROME_FILE" \
    "$FIREFOX_FILE" \
    --title "${TAG} — Pronunciation Helper" \
    --generate-notes

  echo ""
  echo "✓ Release ${TAG} published to GitHub."
  echo "  https://github.com/costinEEST/pronunciation-helper/releases/tag/${TAG}"
fi
