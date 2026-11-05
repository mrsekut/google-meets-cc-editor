// Polls for the CC button and auto-clicks it to enable captions.

import { useEffect } from "react"

import { findCaptionRegion } from "~features/selectors"

const AUTO_CC_POLL_MS = 2000

export function useAutoCC() {
  useEffect(() => {
    const state = {
      stopped: false,
      pollTimer: undefined as number | undefined
    }

    function tryEnableCC() {
      if (state.stopped) return

      if (findCaptionRegion()) {
        console.log("[Google Meets CC] Captions already enabled")
        return
      }

      const btn = findCCButton()
      if (btn) {
        console.log("[Google Meets CC] Auto-enabling captions")
        btn.click()
        closePopoverIfOpened()
        scheduleRetryIfNeeded()
        return
      }

      // New UI: CC toggle lives inside the "字幕と翻訳" popover.
      const popoverBtn = findCaptionsPopoverButton()
      if (popoverBtn) {
        popoverBtn.click()
        setTimeout(() => {
          if (state.stopped) return
          const toggle = findCCButton()
          if (toggle) {
            console.log("[Google Meets CC] Auto-enabling captions (popover)")
            toggle.click()
          }
          closePopover(popoverBtn)
          scheduleRetryIfNeeded()
        }, 500)
        return
      }

      state.pollTimer = window.setTimeout(tryEnableCC, AUTO_CC_POLL_MS)
    }

    function scheduleRetryIfNeeded() {
      setTimeout(() => {
        if (!state.stopped && !findCaptionRegion()) {
          state.pollTimer = window.setTimeout(tryEnableCC, AUTO_CC_POLL_MS)
        }
      }, 1000)
    }

    function closePopoverIfOpened() {
      const popoverBtn = findCaptionsPopoverButton()
      if (popoverBtn && isPopoverOpen()) closePopover(popoverBtn)
    }

    state.pollTimer = window.setTimeout(tryEnableCC, 3000)

    return () => {
      state.stopped = true
      if (state.pollTimer != null) clearTimeout(state.pollTimer)
    }
  }, [])
}

// Toggle that turns captions ON. Old UI: toolbar button "字幕をオンにする".
// New UI: button inside the popover "自動字幕起こしをオンにする".
function findCCButton(): HTMLElement | null {
  for (const btn of document.querySelectorAll<HTMLElement>(
    "button[aria-label]"
  )) {
    const label = btn.getAttribute("aria-label") ?? ""
    if (/字幕.*オンにする/.test(label) || /turn on.*captions/i.test(label)) {
      return btn
    }
  }
  return null
}

// Toolbar button that opens the "字幕と翻訳" (Captions and translation) popover.
function findCaptionsPopoverButton(): HTMLElement | null {
  for (const btn of document.querySelectorAll<HTMLElement>(
    "button[aria-label]"
  )) {
    const label = btn.getAttribute("aria-label") ?? ""
    if (label === "字幕と翻訳" || /^captions? (and|&) translat/i.test(label)) {
      return btn
    }
  }
  return null
}

// The popover contains the "音声翻訳" (speech translation) toggle.
function isPopoverOpen(): boolean {
  for (const btn of document.querySelectorAll<HTMLElement>(
    "button[aria-label]"
  )) {
    const label = btn.getAttribute("aria-label") ?? ""
    if (/音声翻訳|speech translation/i.test(label)) return true
  }
  return false
}

function closePopover(popoverBtn: HTMLElement) {
  if (isPopoverOpen()) popoverBtn.click()
}
