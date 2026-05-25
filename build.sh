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
FIREFOX_FILE="${DIST_DIR}/pronunciation-helper-firefox-v${VERSION}.xpi"

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

# Skip signing if the signed XPI already exists for this version
if [ -f "$FIREFOX_FILE" ]; then
  echo "✓ Firefox: $FIREFOX_FILE already exists, skipping signing."
else
  echo "Signing Firefox extension with web-ext..."
  echo ""

  SIGN_OUTPUT=$(web-ext sign \
    --source-dir=. \
    --artifacts-dir="$DIST_DIR" \
    --api-key="$MOZILLA_JWT_ISSUER" \
    --api-secret="$MOZILLA_JWT_SECRET" \
    --channel=unlisted \
    --ignore-files=dist/ .git/ .agents/ .kiro/ .gitignore skills-lock.json README.md build.sh .amo-upload-uuid 2>&1) || {
      # Check if the error is "already submitted" (version already signed)
      if echo "$SIGN_OUTPUT" | grep -q "already been submitted"; then
        echo "⚠ Version ${VERSION} was already signed by Mozilla."
        echo "  The .xpi from a previous build should still be valid."
        echo "  If you need to re-sign, bump the version in manifest.json first."
        exit 1
      else
        echo "$SIGN_OUTPUT"
        exit 1
      fi
    }

  echo "$SIGN_OUTPUT"

  # Rename the signed XPI to our naming convention
  SIGNED_XPI=$(find "$DIST_DIR" -name '*.xpi' -not -name "pronunciation-helper-*" | head -1)

  if [ -n "$SIGNED_XPI" ]; then
    mv "$SIGNED_XPI" "$FIREFOX_FILE"
    echo ""
    echo "✓ Firefox: $FIREFOX_FILE (signed)"
  else
    echo ""
    echo "⚠ Firefox signing may have failed. Check output above."
    exit 1
  fi
fi

echo ""
echo "Done. Build artifacts are in ${DIST_DIR}/."

# --- Publish to GitHub Releases ---

if [ "$RELEASE" = true ]; then
  echo ""

  if ! command -v gh &> /dev/null; then
    echo "Error: GitHub CLI (gh) is not installed."
    echo "Install it with: brew install gh"
    echo "Then authenticate with a personal access token:"
    echo "  echo \"YOUR_TOKEN\" | gh auth login -h github.com --with-token"
    echo ""
    echo "Token needs scopes: repo, workflow, read:org"
    echo "Generate one at: https://github.com/settings/tokens/new"
    exit 1
  fi

  if ! gh auth status &> /dev/null; then
    echo "Error: GitHub CLI is not authenticated."
    echo ""
    echo "Authenticate with a personal access token:"
    echo "  echo \"YOUR_TOKEN\" | gh auth login -h github.com --with-token"
    echo ""
    echo "Token needs scopes: repo, workflow, read:org"
    echo "Generate one at: https://github.com/settings/tokens/new"
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
fi
