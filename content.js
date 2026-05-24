"use strict";

/**
 * Pronunciation Helper - Content Script
 * Shows a popup near selected text with a play button to hear pronunciation.
 * Detects language from surrounding context using the LanguageDetector module.
 * Compatible with Chrome and Firefox (both support MV3).
 *
 * Accessibility: Uses aria-live region for screen reader announcements,
 * supports keyboard interaction, respects prefers-reduced-motion.
 */
(() => {
  const POPUP_ID = "pronunciation-helper-popup";
  const ANNOUNCER_ID = "pronunciation-helper-announcer";
  const MIN_SELECTION_LENGTH = 1;
  const MAX_SELECTION_LENGTH = 100;

  // Cross-browser API reference
  const api = globalThis.chrome || globalThis.browser;

  let currentPopup = null;

  /**
   * Create a visually hidden live region for screen reader announcements.
   * Follows WCAG live region best practices — single polite region, debounced.
   */
  function getOrCreateAnnouncer() {
    let announcer = document.getElementById(ANNOUNCER_ID);
    if (!announcer) {
      announcer = document.createElement("div");
      announcer.id = ANNOUNCER_ID;
      announcer.setAttribute("aria-live", "polite");
      announcer.setAttribute("aria-atomic", "true");
      // Visually hidden but accessible to screen readers
      Object.assign(announcer.style, {
        position: "absolute",
        clipPath: "inset(50%)",
        overflow: "hidden",
        width: "1px",
        height: "1px",
        margin: "-1px",
        padding: "0",
        border: "0",
        whiteSpace: "nowrap",
      });
      document.body.appendChild(announcer);
    }
    return announcer;
  }

  /**
   * Announce a message to screen readers via the live region.
   * @param {string} message - Text to announce
   */
  function announce(message) {
    const announcer = getOrCreateAnnouncer();
    // Clear and re-set to ensure re-announcement
    announcer.textContent = "";
    requestAnimationFrame(() => {
      announcer.textContent = message;
    });
  }

  /**
   * Create and display the pronunciation popup near the selection.
   * @param {string} text - The selected text to pronounce
   * @param {DOMRect} rect - Bounding rectangle of the selection
   * @param {string} lang - Detected language code
   */
  function showPopup(text, rect, lang) {
    removePopup();

    const popup = document.createElement("div");
    popup.id = POPUP_ID;
    popup.setAttribute("role", "toolbar");
    popup.setAttribute("aria-label", "Pronunciation controls");

    const langLabel = getLangDisplayName(lang);

    popup.innerHTML = `
      <button class="pronunciation-helper-btn" type="button"
              aria-label="Pronounce '${escapeHtml(text)}' in ${langLabel}"
              title="Pronounce in ${langLabel}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      </button>
      <span class="pronunciation-helper-lang" aria-hidden="true">
        ${langLabel}
      </span>
    `;

    // Position the popup above the selection
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const left = rect.left + scrollX + (rect.width / 2);

    popup.style.position = "absolute";
    popup.style.top = `${rect.top + scrollY - 44}px`;
    popup.style.left = `${left}px`;
    popup.style.transform = "translateX(-50%)";
    popup.style.zIndex = "2147483647";

    document.body.appendChild(popup);
    currentPopup = popup;

    // Bind play button
    const playBtn = popup.querySelector(".pronunciation-helper-btn");
    playBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      pronounce(text, lang);
    });

    // Prevent popup clicks from clearing selection
    popup.addEventListener("mousedown", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
  }

  /**
   * Remove the popup from the DOM.
   */
  function removePopup() {
    if (currentPopup) {
      currentPopup.remove();
      currentPopup = null;
    }
  }

  /**
   * Pronounce the given text using the Web Speech API.
   * @param {string} text - Text to pronounce
   * @param {string} lang - BCP 47 language tag
   */
  function pronounce(text, lang) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    utterance.pitch = 1;

    // Try to find a voice matching the language
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find((v) => v.lang.startsWith(lang));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    // Visual feedback on the button
    const btn = currentPopup?.querySelector(".pronunciation-helper-btn");
    if (btn) {
      btn.classList.add("pronunciation-helper-playing");
      utterance.onend = () => {
        btn.classList.remove("pronunciation-helper-playing");
        announce(`Finished pronouncing "${text}"`);
      };
      utterance.onerror = () => {
        btn.classList.remove("pronunciation-helper-playing");
        announce(`Could not pronounce "${text}"`);
      };
    }

    const langLabel = getLangDisplayName(lang);
    announce(`Pronouncing "${text}" in ${langLabel}`);
    window.speechSynthesis.speak(utterance);
  }

  /**
   * Get a human-readable language name from a language code.
   * @param {string} code - Language code (e.g., "de")
   * @returns {string} Display name
   */
  function getLangDisplayName(code) {
    const names = {
      de: "Deutsch",
      en: "English",
      fr: "Français",
      es: "Español",
      it: "Italiano",
      pt: "Português",
      tr: "Türkçe",
      hu: "Magyar",
      uk: "Українська",
      ru: "Русский",
      el: "Ελληνικά",
      la: "Latina",
      he: "עברית",
    };
    return names[code] || code.toUpperCase();
  }

  /**
   * Escape HTML special characters to prevent XSS in attribute values.
   * @param {string} str - Raw string
   * @returns {string} Escaped string
   */
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Handle text selection events.
   * Debounced to avoid excessive processing during active selection.
   */
  let selectionTimeout = null;

  function handleSelectionChange() {
    clearTimeout(selectionTimeout);
    selectionTimeout = setTimeout(async () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (!text || text.length < MIN_SELECTION_LENGTH || text.length > MAX_SELECTION_LENGTH) {
        removePopup();
        return;
      }

      // Only show for word-like selections (no full paragraphs)
      if (text.includes("\n") || text.split(/\s+/).length > 10) {
        removePopup();
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (rect.width === 0 && rect.height === 0) {
        removePopup();
        return;
      }

      // Use async detection for native API support (progressive enhancement)
      const lang = await LanguageDetector.detectAsync(selection);
      showPopup(text, rect, lang);
    }, 300);
  }

  /**
   * Handle clicks outside the popup to dismiss it.
   * @param {MouseEvent} event
   */
  function handleDocumentClick(event) {
    if (currentPopup && !currentPopup.contains(event.target)) {
      removePopup();
    }
  }

  /**
   * Handle Escape key to dismiss the popup.
   * @param {KeyboardEvent} event
   */
  function handleKeyDown(event) {
    if (event.key === "Escape" && currentPopup) {
      removePopup();
    }
  }

  /**
   * Handle messages from the background script (context menu trigger).
   */
  api.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "pronounce" && message.text) {
      const selection = window.getSelection();
      const lang = LanguageDetector.detect(selection);
      pronounce(message.text, lang);
      sendResponse({ success: true });
    }
    return true;
  });

  /**
   * Ensure voices are loaded (some browsers load them asynchronously).
   */
  function initVoices() {
    window.speechSynthesis.getVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }

  // Initialize
  initVoices();
  document.addEventListener("selectionchange", handleSelectionChange);
  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("keydown", handleKeyDown);

  // Clean up on page unload
  window.addEventListener("unload", () => {
    window.speechSynthesis.cancel();
    removePopup();
  });
})();
