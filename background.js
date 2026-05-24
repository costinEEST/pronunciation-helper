"use strict";

/**
 * Pronunciation Helper - Service Worker (Background Script)
 * Registers context menu for pronouncing selected text.
 * Compatible with Chrome (MV3) and Firefox (MV3, 109+).
 */

// Use chrome namespace (Firefox supports it in MV3)
const api = globalThis.chrome || globalThis.browser;

// Create context menu on install (idempotent on re-creation)
api.runtime.onInstalled.addListener(() => {
  api.contextMenus.create({
    id: "pronounce-selection",
    title: "Pronounce \"%s\"",
    contexts: ["selection"],
  });
});

// Handle context menu clicks
api.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "pronounce-selection" && info.selectionText) {
    try {
      await api.tabs.sendMessage(tab.id, {
        action: "pronounce",
        text: info.selectionText.trim(),
      });
    } catch (error) {
      // Content script may not be loaded on this page (e.g., chrome:// pages)
      console.warn("Could not send message to tab:", error.message);
    }
  }
});
