---
name: pronunciation-helper-testing
description: Investigate Pronunciation Helper extension bugs, recover blocked Chrome MCP sessions, and test local changes in Firefox before pushing or releasing. Use for browser debugging and verification in this repository.
---

# Pronunciation Helper testing

The extension loads JavaScript directly from `manifest.json`. Local testing needs no build, signing, push, or deployment. Detection lives in `language-detector.js`, popup and speech handling in `content.js`, and context-menu handling in `background.js`.

## Inspect with Chrome MCP

Start with `list_pages` and reuse a suitable tab or open a new one. Inspect the rendered page, selection, and nearest `lang` declaration. Chrome inspection does not prove the extension is installed in that browser or that Firefox works. Label injected-code checks accurately rather than calling them full extension tests.

## Recover a blocked MCP profile

For errors such as `The browser is already running for .../.cache/chrome-devtools-mcp/chrome-profile`:

1. Retry `list_pages` and reuse the browser if it succeeds. Stop recovery once `list_pages` or `new_page` succeeds.
2. Inspect relevant processes with `ps aux | rg 'chrome-devtools-mcp|chrome-profile'`. If sandboxed, request escalation for this read-only inspection with a narrow `ps aux` prefix.
3. Distinguish an older orphan from the current MCP process using start times and command lines. Identify explicit stale npm/MCP PIDs and the dedicated browser main PID whose command includes `--user-data-dir=.../.cache/chrome-devtools-mcp/chrome-profile`. Never target an ordinary user browser.
4. Check existing authorization; otherwise obtain permission before terminating the explicit stale PIDs. Use a normal termination signal (`kill <stale-pid> ...`), then retry MCP. Do not use broad `pkill`, wildcard process killing, or `kill -9` as the first attempt.
5. Only after confirming no browser uses that profile, inspect its `SingletonLock`, `SingletonSocket`, and `SingletonCookie`. If stale files remain, obtain permission unless already authorized to remove those exact files, then retry. Never delete the profile or entire cache.
6. Report the recovery performed. If still blocked, report the exact error and use available local page source, distinguishing it from rendered browser evidence. Profile cleanup does not resolve login, access-control, or missing-tool errors.

## Test unpublished changes in Firefox

Follow [Local development and testing](../../../README.md#local-development-and-testing) for the command and reload behavior. Run from the repository root. `web-ext run` loads the working tree, including uncommitted edits, into a separate temporary Firefox profile. Request execution escalation when required for network downloads or GUI launch. Keep the running session available while the user tests.

Do not run `build.sh` for local testing: it packages and signs releases and can reuse an existing signed artifact without local changes. Do not push, publish, sign, or change signing preferences merely to test locally.

For the Hungarian regression, open `https://costineest.github.io/hungarian/expresii.html`, click **Doar maghiară** (`.mode-toggle`), and select **Köszönöm.** Expect **Magyar**. Test Play and right-click **Pronounce**. Switch back with **Teljes nézet** and check the Hungarian table cell and a Romanian translation. When changing detection, also check inherited language declarations, nested overrides, and document-language fallback. Distinguish a correct detected label from successful playback; voice availability is a separate observation.

If changing the webpage too, serve its repository locally and use that localhost URL with `--start-url`. The published URL tests local extension edits against the deployed webpage, not unpublished webpage edits.

Run `node --check` on changed JavaScript and `git diff --check`. Report the checks actually performed, browser used, and manual checks left to the user. Never claim Firefox verification based solely on Chrome MCP results.
