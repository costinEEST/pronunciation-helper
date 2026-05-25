# Pronunciation Helper

A cross-browser extension (Chrome & Firefox) that helps you hear the pronunciation of words on any webpage. Select a word and a popup appears with a play button. The extension detects the language from surrounding text context and pronounces the word accordingly.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
  - [Download](#step-1-download-the-extension)
  - [Chrome](#chrome)
  - [Edge](#edge)
  - [Firefox](#firefox)
  - [Updating](#updating-the-extension)
  - [Troubleshooting](#troubleshooting)
- [Usage](#usage)
- [How Language Detection Works](#how-language-detection-works)
- [Supported Languages](#supported-languages)
- [Browser Compatibility](#browser-compatibility)
- [Accessibility](#accessibility)
- [Privacy](#privacy)
- [Building a Release](#building-a-release)
  - [Prerequisites](#prerequisites)
  - [Running the Build Script](#running-the-build-script)
  - [Publishing to GitHub Releases](#publishing-to-github-releases)
- [Project Structure](#project-structure)
- [Technical Notes](#technical-notes)
- [License](#license)

## Features

- **Selection popup** — Select any word and a small popup appears above it with a play button
- **Context menu** — Right-click a selected word and choose "Pronounce" from the menu
- **Language detection** — Analyzes surrounding words to detect the language (13 languages supported)
- **Native AI detection** — Progressively enhances with Chrome's built-in LanguageDetector API (138+) when available
- **Web Speech API** — Uses the browser's built-in speech synthesis for pronunciation
- **Cross-browser** — Works in both Chrome (MV3) and Firefox (MV3, 109+)
- **Accessible** — ARIA live region announcements, keyboard dismissal, focus-visible styles
- **Respects preferences** — Adapts to light/dark color scheme and reduced motion settings
- **Lightweight** — No external dependencies, no network requests, fully offline

## Installation

### Step 1: Download the extension

Go to the [**Releases page**](../../releases) on GitHub and download the file for your browser:

| Browser | File to download |
|---------|-----------------|
| Chrome / Edge / Brave | `pronunciation-helper-chrome-vX.X.X.zip` |
| Firefox | `pronunciation-helper-firefox-vX.X.X.xpi` |

> **Tip:** Always pick the latest release at the top of the page.

---

### Step 2: Install in your browser

#### Chrome

The extension installs permanently — it stays active even after you restart Chrome.

1. **Download** the `pronunciation-helper-chrome-vX.X.X.zip` file from the Releases page
2. **Extract/unzip** the file:
   - On **Windows**: Right-click the ZIP → "Extract All..." → choose a location you'll keep (e.g., `Documents/pronunciation-helper`)
   - On **macOS**: Double-click the ZIP file — a folder appears next to it
   - On **Linux**: Right-click → "Extract Here"
3. **Open Chrome** and type `chrome://extensions` in the address bar, then press Enter
4. Turn on **"Developer mode"** using the toggle in the **top-right corner** of the page
5. Click the **"Load unpacked"** button that appears
6. Navigate to the folder you just extracted (the one containing `manifest.json`) and select it
7. Done — the extension appears in your list and **stays installed permanently**

> **Important:** Do not delete or move the extracted folder after loading it. Chrome reads the extension files from that location. If you move the folder, Chrome will disable the extension and you'll need to reload it from the new location.

#### Edge

Same process as Chrome — the extension stays installed permanently.

1. **Download** the `pronunciation-helper-chrome-vX.X.X.zip` file (Edge uses the same format as Chrome)
2. **Extract/unzip** the file to a permanent location (e.g., `Documents/pronunciation-helper`)
3. **Open Edge** and type `edge://extensions` in the address bar, then press Enter
4. Turn on **"Developer mode"** using the toggle in the **bottom-left** of the page
5. Click **"Load unpacked"**
6. Navigate to the extracted folder and select it
7. Done — the extension stays installed across restarts

> **Important:** Same as Chrome — don't delete or move the folder after loading.

#### Firefox

Firefox requires extensions to be **signed** for permanent installation. The `.xpi` file in the release is already signed, so it installs permanently.

1. **Download** the `pronunciation-helper-firefox-vX.X.X.xpi` file from the Releases page
2. **Open Firefox** and type `about:addons` in the address bar, then press Enter
3. Click the **gear icon** (⚙️) near the top of the page
4. Select **"Install Add-on From File..."**
5. Navigate to the `.xpi` file you downloaded and select it
6. Firefox will ask you to confirm — click **"Add"**
7. Done — the extension is permanently installed and survives browser restarts

> **Alternative (unsigned builds):** If you're using an unsigned `.xpi` (e.g., built locally without signing), you need **Firefox Developer Edition** or **Firefox Nightly**:
> 1. Open `about:config` in the address bar
> 2. Search for `xpinstall.signatures.required`
> 3. Set it to `false`
> 4. Then install the `.xpi` as described above
>
> Regular Firefox requires signed extensions — this workaround only works in Developer Edition or Nightly.

---

### Updating the extension

#### Chrome / Edge

1. Download the new `.zip` from the [Releases page](../../releases)
2. Extract it, **replacing** the old folder contents (same location)
3. Go to `chrome://extensions` (or `edge://extensions`)
4. Find "Pronunciation Helper" and click the **reload icon** (🔄) on its card

#### Firefox

1. Download the new `.xpi` from the [Releases page](../../releases)
2. Go to `about:addons`
3. Use the gear icon → "Install Add-on From File..." and select the new `.xpi`
4. Firefox will update the extension in place

---

### Troubleshooting

| Problem | Solution |
|---------|----------|
| Chrome says "Extension not found" after restart | The extracted folder was moved or deleted. Re-extract and reload from the new location. |
| Firefox says "Add-on could not be installed" | The `.xpi` may be unsigned. Use Firefox Developer Edition with signature checking disabled (see above). |
| Extension doesn't appear after loading | Make sure you selected the correct folder (the one directly containing `manifest.json`, not a parent folder). |
| No sound when clicking play | Your system may not have speech synthesis voices installed for that language. Check your OS text-to-speech settings. |

## Usage

1. **Select a word** on any webpage by clicking and dragging, or double-clicking
2. A small popup appears above the selection showing a play button and the detected language
3. **Click the play button** to hear the pronunciation
4. Press **Escape** to dismiss the popup
5. Alternatively, **right-click** a selected word and choose "Pronounce" from the context menu

## How Language Detection Works

The extension uses a multi-signal approach with progressive enhancement:

1. **Native API (Chrome 138+)** — Uses the browser's built-in `LanguageDetector` API when available for high-accuracy detection
2. **Surrounding context** — Analyzes ~200 characters around the selected word
3. **Common word matching** — Checks for function words (articles, prepositions, conjunctions) typical of each language
4. **Morphological patterns** — Looks for language-specific suffixes and character patterns (e.g., German umlauts, French accents, Cyrillic characters)
5. **Confidence threshold** — Falls back to the page's `lang` attribute if detection confidence is too low
6. **Page language fallback** — Uses the HTML `lang` attribute as a baseline; defaults to German if unset

## Supported Languages

| Code | Language   |
|------|------------|
| de   | German     |
| en   | English    |
| fr   | French     |
| es   | Spanish    |
| it   | Italian    |
| pt   | Portuguese |
| tr   | Turkish    |
| hu   | Hungarian  |
| uk   | Ukrainian  |
| ru   | Russian    |
| el   | Greek      |
| la   | Latin      |
| he   | Hebrew     |

## Browser Compatibility

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome  | 88+            | Full Manifest V3 support; native LanguageDetector from 138+ |
| Firefox | 109+           | MV3 support with `browser_specific_settings` |
| Edge    | 88+            | Chromium-based, same as Chrome |

## Accessibility

- **Screen reader support** — Uses `aria-live="polite"` region to announce pronunciation status
- **Keyboard navigation** — Press Escape to dismiss the popup; play button is focusable with visible focus indicator
- **ARIA roles** — Popup uses `role="toolbar"` with descriptive `aria-label`
- **Reduced motion** — Animations are disabled when `prefers-reduced-motion: reduce` is active
- **Color scheme** — Popup adapts to light/dark mode via `prefers-color-scheme`
- **Contrast** — Focus indicators meet 3:1 non-text contrast ratio

## Privacy

This extension collects no data and makes no network requests.

**What it accesses:**

- **Selected text** — The word you select, passed to the browser's speech synthesis engine
- **Surrounding context** — ~200 characters around your selection, analyzed locally for language detection (never stored or transmitted)
- **Page language attribute** — The `<html lang="...">` value as a fallback

**What it does NOT do:**

- No data collection, storage, or transmission
- No network requests — fully offline
- No cookies, analytics, or telemetry
- No browsing history tracking
- No persistent storage (`chrome.storage` is not used)
- No device fingerprinting

**Permissions explained:**

| Permission | Why it's needed |
|------------|----------------|
| `contextMenus` | Registers the "Pronounce" right-click menu item |
| Content script on `<all_urls>` | Enables the selection popup on any webpage you visit |

All speech synthesis is handled by your operating system's built-in text-to-speech engine (Web Speech API). No audio data leaves your device.

## Building a Release

The project includes a `build.sh` script that produces both browser packages in one step:
- A `.zip` for Chrome/Edge (load unpacked)
- A signed `.xpi` for Firefox (permanent install)

### Prerequisites

1. **Node.js and npm** — needed to install `web-ext` (the script installs it automatically if missing)
2. **Mozilla API credentials** — required to sign the Firefox extension
   - Create a free account at [addons.mozilla.org](https://addons.mozilla.org)
   - Generate API keys at: https://addons.mozilla.org/developers/addon/api/key/
   - Add them to your `~/.zshenv`:
     ```bash
     export MOZILLA_JWT_ISSUER="your-jwt-issuer"
     export MOZILLA_JWT_SECRET="your-jwt-secret"
     ```
   - Restart your terminal (or run `source ~/.zshenv`)

### Running the build script

```bash
# Build only (produces files in dist/)
./build.sh

# Build and publish to GitHub Releases in one step
./build.sh --release
```

The script will:
1. Read the version from `manifest.json`
2. Install `web-ext` globally if not already present
3. Verify that `MOZILLA_JWT_ISSUER` and `MOZILLA_JWT_SECRET` are set
4. Create a `dist/` folder with:
   - `pronunciation-helper-chrome-vX.X.X.zip`
   - `pronunciation-helper-firefox-vX.X.X.xpi` (signed as `unlisted`)
5. With `--release`: create a git tag, push it, and publish a GitHub Release with both files attached

### Firefox signing channel

Mozilla requires a `--channel` when signing extensions. The build script uses `unlisted`. Here's what the options mean:

| Channel | What it means | When to use |
|---------|---------------|-------------|
| `unlisted` | Signed by Mozilla but **not published** on addons.mozilla.org. You distribute the `.xpi` yourself (e.g., via GitHub Releases). | Self-distributed extensions like this one. |
| `listed` | Signed **and published** on addons.mozilla.org. Goes through Mozilla's review process and becomes publicly searchable. | When you want the extension available in the Firefox Add-ons store. |

We use `unlisted` because the extension is distributed through GitHub Releases, not the Firefox Add-ons store. Users install it manually from the `.xpi` file. Mozilla still signs it, which means it works in regular Firefox without disabling signature checks.

### Publishing to GitHub Releases

The easiest way is to use the `--release` flag:

```bash
# Make sure your changes are committed and pushed first
git add -A
git commit -m "chore: prepare v1.0.0 release"
git push origin main

# Build + publish in one command
./build.sh --release
```

This requires the [GitHub CLI](https://cli.github.com/) (`brew install gh`, then `gh auth login`).

The script will tag the current commit with the version from `manifest.json`, push the tag, and create a release with both artifacts attached. After that, users can download the files from the [Releases page](../../releases).

## Project Structure

```
pronunciation-helper/
├── manifest.json          # Extension manifest (Manifest V3)
├── background.js          # Service worker — context menu registration
├── content.js             # Content script — selection handling and popup UI
├── content.css            # Popup styles (namespaced, responsive to user preferences)
├── language-detector.js   # Language detection with native API progressive enhancement
├── build.sh               # Build script — produces Chrome .zip and signed Firefox .xpi
├── icons/
│   ├── icon-48.svg
│   └── icon-96.svg
├── dist/                  # Build output (git-ignored)
└── README.md
```

## Technical Notes

- Uses **Manifest V3** for both Chrome and Firefox compatibility
- Background script declares both `service_worker` (Chrome/Edge) and `scripts` (Firefox) — each browser uses its supported field and ignores the other
- Content scripts use **namespaced CSS classes** to avoid conflicts with page styles
- CSS uses **rem units**, **logical properties**, and **CSS custom properties** for theming
- Progressively enhances with Chrome's **LanguageDetector API** (138+) without requiring it
- The `browser_specific_settings` field is ignored by Chrome and required by Firefox for extension ID
- No `eval()`, no inline scripts — fully CSP-compliant
- All async operations use `async/await` (no `.then()` chains)
- Decorative SVGs use `aria-hidden="true"`

## License

MIT
