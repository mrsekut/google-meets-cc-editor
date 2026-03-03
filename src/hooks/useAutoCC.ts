// Polls for the CC button and auto-clicks it to enable captions.

import { useEffect } from "react"

import { findCaptionRegion, findCCButton } from "~core/selectors"

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
        setTimeout(() => {
          if (!state.stopped && !findCaptionRegion()) {
            state.pollTimer = window.setTimeout(tryEnableCC, AUTO_CC_POLL_MS)
          }
        }, 1000)
        return
      }

      state.pollTimer = window.setTimeout(tryEnableCC, AUTO_CC_POLL_MS)
    }

    state.pollTimer = window.setTimeout(tryEnableCC, 3000)

    return () => {
      state.stopped = true
      if (state.pollTimer != null) clearTimeout(state.pollTimer)
    }
  }, [])
}
