# Pronunciation Helper

A cross-browser extension (Chrome & Firefox) that helps you hear the pronunciation of words on any webpage. Select a word and a popup appears with a play button. The extension detects the language from surrounding text context and pronounces the word accordingly.

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

If you're not familiar with Git, the easiest way to get the extension files is:

1. Go to the GitHub repository page
2. Click the green **"Code"** button near the top-right
3. Click **"Download ZIP"**
4. Once downloaded, find the ZIP file (usually in your Downloads folder)
5. **Extract/unzip** the file — this creates a folder called `pronunciation-helper-main`

You now have the extension files on your computer. Proceed to Step 2 for your browser.

### Step 2: Load the extension in your browser

#### Chrome

1. Open Chrome and type `chrome://extensions` in the address bar, then press Enter
2. Turn on **"Developer mode"** using the toggle in the top-right corner
3. Click the **"Load unpacked"** button that appears
4. Navigate to the folder you extracted and select it (the folder containing `manifest.json`)
5. The extension is now active — you'll see it in your extensions list

#### Edge

1. Open Edge and type `edge://extensions` in the address bar, then press Enter
2. Turn on **"Developer mode"** using the toggle in the bottom-left
3. Click **"Load unpacked"**
4. Navigate to the folder you extracted and select it
5. The extension is now active

#### Firefox

1. Open Firefox and type `about:debugging#/runtime/this-firefox` in the address bar, then press Enter
2. Click **"Load Temporary Add-on..."**
3. Navigate to the folder you extracted and select the **`manifest.json`** file inside it
4. The extension is now active (note: in Firefox, temporary add-ons are removed when you close the browser)

> **Firefox note:** Temporary extensions don't persist across browser restarts. You'll need to reload it each time you restart Firefox, unless you use Firefox Developer Edition with unsigned extension support.

### Updating the extension

When a new version is available:

1. Download the new ZIP from GitHub (same steps as above)
2. Extract it, replacing the old folder
3. In your browser's extensions page, click **"Reload"** (or remove and re-add it)

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

## Requirements

- Speech synthesis voices installed for the target language (most OS installations include these by default)
- Chrome 88+ / Firefox 109+ / Edge 88+

## Project Structure

```
pronunciation-helper/
├── manifest.json          # Extension manifest (Manifest V3)
├── background.js          # Service worker — context menu registration
├── content.js             # Content script — selection handling and popup UI
├── content.css            # Popup styles (namespaced, responsive to user preferences)
├── language-detector.js   # Language detection with native API progressive enhancement
├── icons/
│   ├── icon-48.svg
│   └── icon-96.svg
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

## Privacy

This extension is designed with privacy as a core principle. It collects no data and makes no network requests.

**What the extension accesses:**

- **Selected text on the page** — Only the word or phrase you actively select, used solely to pass it to the browser's speech synthesis engine
- **Surrounding text context** — Approximately 200 characters around your selection, analyzed locally to detect the language. This text is never stored or transmitted
- **Page language attribute** — Reads the `<html lang="...">` attribute as a fallback for language detection

**What the extension does NOT do:**

- Does not collect, store, or transmit any personal data
- Does not make any network requests — all processing happens locally on your device
- Does not use cookies, analytics, telemetry, or any third-party services
- Does not track browsing history, URLs visited, or pages viewed
- Does not access or store any data beyond the current selection moment
- Does not use `chrome.storage` or any persistent storage mechanism
- Does not fingerprint your device or browser

**Permissions explained:**

| Permission | Why it's needed |
|------------|----------------|
| `contextMenus` | Registers the "Pronounce" right-click menu item |
| Content script on `<all_urls>` | Enables the selection popup on any webpage you visit |

All speech synthesis is handled by your operating system's built-in text-to-speech engine (Web Speech API). No audio data leaves your device.

## License

MIT
