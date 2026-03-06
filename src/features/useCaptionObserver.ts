// Google Meetsの字幕DOMを監視し、確定したテキストをエディターに書き込むhook。
//
// 全体の流れ:
//   字幕DOM変化 → observeCaptionRegion(MutationObserver)
//     → findCaptionBlock(mutationから字幕ブロック特定)
//     → CaptionEngine.handleCaptionUpdate(コマンド生成)
//       ├→ 即座: setInterimコマンド実行
//       └→ 2.5秒後: CaptionEngine.finalizeSegment → コマンド実行

import type { Dispatch, RefObject, SetStateAction } from "react"
import { useEffect } from "react"

import {
  CaptionEngine,
  type Command
} from "~features/caption-engine/CaptionEngine"
import { logger } from "~features/caption-engine/DebugLogger"
import { SpeakerColorMap } from "~features/caption-engine/SpeakerColorMap"
import type { CaptionData } from "~features/selectors"
import {
  extractCaptionData,
  findCaptionRegion,
  SELECTORS
} from "~features/selectors"

// blockKey用のグローバルカウンター（DOMのElement参照をstringキーに変換）
const blockKeyCounter = { current: 0 }
const blockKeyMap = new WeakMap<Element, string>()

function getBlockKey(el: Element): string {
  const existing = blockKeyMap.get(el)
  if (existing) return existing
  const key = `block-${++blockKeyCounter.current}`
  blockKeyMap.set(el, key)
  return key
}

export function useCaptionObserver(
  transcriptRef: RefObject<HTMLDivElement>,
  setHasContent: Dispatch<SetStateAction<boolean>>,
  setInterimText: Dispatch<SetStateAction<CaptionData | null>>
) {
  useEffect(() => {
    const engine = new CaptionEngine()
    const speakerColors = new SpeakerColorMap()

    // セグメントID → { timerId, speaker, text }
    const activeTimers = new Map<
      string,
      { timerId: number; speaker: string; text: string }
    >()

    // コマンドを解釈してReact state/DOMを更新
    function executeCommand(cmd: Command) {
      switch (cmd.type) {
        case "setInterim":
          setInterimText({ speaker: cmd.speaker, text: cmd.text })
          break
        case "clearInterim":
          setInterimText((prev) => {
            if (prev?.speaker === cmd.speaker) return null
            return prev
          })
          break
        case "appendTranscript": {
          // [debug] appendTranscriptコマンド実行時
          logger.log({ phase: "command", speaker: cmd.speaker, text: cmd.text })

          const el = transcriptRef.current
          if (!el) break
          appendToTranscript(el, speakerColors, cmd.speaker, cmd.text)
          el.scrollTop = el.scrollHeight
          break
        }
        case "setHasContent":
          setHasContent(true)
          break
      }
    }

    function executeCommands(commands: Command[]) {
      for (const cmd of commands) executeCommand(cmd)
    }

    // 字幕領域を監視開始
    const cleanup = observeCaptionRegion((mutations) => {
      const processedBlocks = new Set<Element>()
      for (const mutation of mutations) {
        const captionBlock = findCaptionBlock(mutation)
        if (!captionBlock || processedBlocks.has(captionBlock)) continue
        processedBlocks.add(captionBlock)

        const data = extractCaptionData(captionBlock)
        if (!data) continue

        const blockKey = getBlockKey(captionBlock)

        // [debug] mutation処理後
        logger.log({
          phase: "mutation",
          blockKey,
          speaker: data.speaker,
          text: data.text
        })

        const result = engine.handleCaptionUpdate(
          blockKey,
          data.speaker,
          data.text
        )

        // [debug] handleCaptionUpdate後
        logger.log({
          phase: "handle",
          segId: result.segmentId,
          delayMs: result.finalizeDelayMs,
          text: data.text
        })

        // 即時コマンド実行
        executeCommands(result.commands)

        // デバウンスタイマー管理
        const existing = activeTimers.get(result.segmentId)
        if (existing) clearTimeout(existing.timerId)

        const segId = result.segmentId
        const speaker = data.speaker
        const text = data.text
        const timerId = window.setTimeout(() => {
          activeTimers.delete(segId)
          const commands = engine.finalizeSegment(segId, speaker, text)

          // [debug] finalizeSegment後
          const appendCmd = commands.find(
            (c): c is Extract<Command, { type: "appendTranscript" }> =>
              c.type === "appendTranscript"
          )
          const action = appendCmd
            ? commands.some((c) => c.type === "setHasContent")
              ? "first"
              : "append"
            : commands.some((c) => c.type === "clearInterim")
              ? "skip"
              : "unchanged"
          logger.log({
            phase: "finalize",
            segId,
            speaker,
            text,
            delta: appendCmd?.text ?? null,
            action
          })

          executeCommands(commands)
        }, result.finalizeDelayMs)

        activeTimers.set(segId, { timerId, speaker, text })
      }
    })

    return () => {
      cleanup()
      for (const { timerId } of activeTimers.values()) clearTimeout(timerId)
      activeTimers.clear()
      engine.dispose()
    }
  }, [])
}

// --- DOM書き込み ---

function appendToTranscript(
  el: HTMLDivElement,
  speakerColors: SpeakerColorMap,
  speaker: string,
  text: string
) {
  if (el.textContent) {
    el.appendChild(document.createTextNode("\n"))
  }

  const color = speakerColors.getColor(speaker)
  const time = new Date().toLocaleTimeString()

  const header = document.createElement("span")
  header.style.color = color
  header.style.opacity = "0.7"
  header.textContent = `${speaker} ${time}`

  el.appendChild(header)
  el.appendChild(document.createTextNode("\n" + text))
}

// --- 字幕領域の検出・監視 ---

// MutationRecordから該当する字幕ブロック(.nMcdL)を探す
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
    // フォールバック: テキスト内容変更（Text node追加）の場合、
    // mutation.targetが字幕ブロック内にあるか確認
    if (mutation.target instanceof HTMLElement) {
      return mutation.target.closest(SELECTORS.captionBlock)
    }
  }
  return null
}

// 字幕領域(caption region)を見つけてMutationObserverを張る。
function observeCaptionRegion(
  onMutations: (mutations: MutationRecord[]) => void
): () => void {
  let captionObserver: MutationObserver | null = null
  let regionObserver: MutationObserver | null = null

  const region = findCaptionRegion()
  if (region) {
    startObserving(region)
  } else {
    regionObserver = new MutationObserver(() => {
      const r = findCaptionRegion()
      if (r) {
        regionObserver?.disconnect()
        regionObserver = null
        startObserving(r)
      }
    })
    regionObserver.observe(document.body, {
      childList: true,
      subtree: true
    })
    console.log("[Google Meets CC] Waiting for caption region...")
  }

  return () => {
    captionObserver?.disconnect()
    regionObserver?.disconnect()
  }

  function startObserving(region: Element) {
    captionObserver?.disconnect()
    captionObserver = new MutationObserver(onMutations)
    captionObserver.observe(region, {
      childList: true,
      characterData: true,
      subtree: true
    })
    console.log("[Google Meets CC] Caption observer started")
  }
}
