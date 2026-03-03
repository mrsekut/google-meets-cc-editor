// Observes caption DOM mutations, debounces finalization, and appends confirmed text to the transcript.

import type { Dispatch, RefObject, SetStateAction } from "react"
import { useEffect } from "react"

import { computeTextDelta, formatTranscriptLine } from "~core/format"
import type { CaptionData } from "~core/selectors"
import {
  extractCaptionData,
  findCaptionRegion,
  SELECTORS
} from "~core/selectors"

const FINALIZE_DELAY_MS = 2500

const segmentId = { current: 0 }

export function useCaptionObserver(
  transcriptRef: RefObject<HTMLDivElement>,
  setHasContent: Dispatch<SetStateAction<boolean>>,
  setInterimText: Dispatch<SetStateAction<CaptionData | null>>
) {
  useEffect(() => {
    const blockToSegmentId = new Map<Element, string>()
    const activeTimers = new Map<string, number>()
    const finalizedSegments = new Map<string, string>()

    function handleCaptionUpdate(captionBlock: Element) {
      const result = extractCaptionData(captionBlock)
      if (!result) return

      const { speaker, text } = result

      const segId =
        blockToSegmentId.get(captionBlock) ??
        (() => {
          const id = `seg-${++segmentId.current}`
          blockToSegmentId.set(captionBlock, id)
          return id
        })()

      setInterimText({ speaker, text })

      const existingTimer = activeTimers.get(segId)
      if (existingTimer != null) clearTimeout(existingTimer)

      const currentSegId = segId
      const timer = window.setTimeout(() => {
        activeTimers.delete(currentSegId)
        setInterimText((prev) => {
          if (prev?.speaker === speaker && prev?.text === text) return null
          return prev
        })

        const lastText = finalizedSegments.get(currentSegId)
        if (lastText === text) return

        const el = transcriptRef.current
        if (el) {
          const now = new Date()
          const delta = lastText ? computeTextDelta(lastText, text) : null

          if (lastText && delta) {
            el.appendChild(
              document.createTextNode(
                "\n" + formatTranscriptLine(speaker, delta, now)
              )
            )
          } else if (!lastText) {
            const line = formatTranscriptLine(speaker, text, now)
            if (el.textContent) {
              el.appendChild(document.createTextNode("\n" + line))
            } else {
              el.textContent = line
            }
          } else {
            const line = formatTranscriptLine(speaker, text, now)
            el.appendChild(document.createTextNode("\n" + line))
          }
          finalizedSegments.set(currentSegId, text)
          setHasContent(true)
          el.scrollTop = el.scrollHeight
        }
      }, FINALIZE_DELAY_MS)

      activeTimers.set(segId, timer)
    }

    function findCaptionBlock(mutation: MutationRecord): Element | null {
      if (mutation.type === "characterData" && mutation.target.parentElement) {
        return mutation.target.parentElement.closest(SELECTORS.captionBlock)
      }
      if (mutation.type === "childList") {
        for (const node of Array.from(mutation.addedNodes)) {
          if (!(node instanceof HTMLElement)) continue
          if (node.matches?.(SELECTORS.captionBlock)) return node
          const nested = node.querySelector?.(SELECTORS.captionBlock)
          if (nested) return nested
        }
      }
      return null
    }

    function handleMutations(mutations: MutationRecord[]) {
      const processedBlocks = new Set<Element>()

      for (const mutation of mutations) {
        const captionBlock = findCaptionBlock(mutation)
        if (!captionBlock || processedBlocks.has(captionBlock)) continue
        processedBlocks.add(captionBlock)
        handleCaptionUpdate(captionBlock)
      }
    }

    const observers = {
      caption: null as MutationObserver | null,
      region: null as MutationObserver | null
    }

    function observeCaptionRegion(region: Element) {
      observers.caption?.disconnect()
      observers.caption = new MutationObserver(handleMutations)
      observers.caption.observe(region, {
        childList: true,
        characterData: true,
        subtree: true
      })
      console.log("[Google Meets CC] Caption observer started")
    }

    const region = findCaptionRegion()
    if (region) {
      observeCaptionRegion(region)
    } else {
      observers.region = new MutationObserver(() => {
        const r = findCaptionRegion()
        if (r) {
          observers.region?.disconnect()
          observers.region = null
          observeCaptionRegion(r)
        }
      })
      observers.region.observe(document.body, {
        childList: true,
        subtree: true
      })
      console.log("[Google Meets CC] Waiting for caption region...")
    }

    return () => {
      observers.caption?.disconnect()
      observers.region?.disconnect()
      for (const timer of activeTimers.values()) clearTimeout(timer)
      activeTimers.clear()
      blockToSegmentId.clear()
    }
  }, [])
}
