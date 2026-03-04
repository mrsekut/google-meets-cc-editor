// Google Meetsの字幕DOMを監視し、確定したテキストをエディターに書き込むhook。
//
// 全体の流れ:
//   字幕DOM変化 → observeCaptionRegion(MutationObserver)
//     → findCaptionBlock(mutationから字幕ブロック特定)
//     → handleCaptionUpdate(デバウンスで確定判定)
//       ├→ 即座: setInterimText(interim表示を更新)
//       └→ 2.5秒後: appendToTranscript(エディターに確定テキスト書き込み)

import type { Dispatch, RefObject, SetStateAction } from "react"
import { useEffect } from "react"

import { computeTextDelta } from "~features/format"
import type { CaptionData } from "~features/selectors"
import {
  extractCaptionData,
  findCaptionRegion,
  SELECTORS
} from "~features/selectors"

// 字幕テキストが更新されなくなってから確定するまでの待ち時間
const FINALIZE_DELAY_MS = 2500

// セグメントIDのグローバルカウンター（useEffect再実行をまたいで一意性を保つ）
const segmentId = { current: 0 }

export function useCaptionObserver(
  transcriptRef: RefObject<HTMLDivElement>,
  setHasContent: Dispatch<SetStateAction<boolean>>,
  setInterimText: Dispatch<SetStateAction<CaptionData | null>>
) {
  useEffect(() => {
    // 字幕ブロック(DOM要素) → セグメントID。同じDOM要素の変化を同一セグメントとして追跡する
    const blockToSegmentId = new Map<Element, string>()
    // セグメントID → setTimeout ID。テキスト更新のたびにリセットされるデバウンスタイマー
    const activeTimers = new Map<string, number>()
    // セグメントID → 最後に確定したテキスト。差分計算に使う
    const finalizedSegments = new Map<string, string>()

    // 字幕領域を監視開始。mutation → 字幕ブロック特定 → handleCaptionUpdate
    const cleanup = observeCaptionRegion((mutations) => {
      const processedBlocks = new Set<Element>()
      for (const mutation of mutations) {
        const captionBlock = findCaptionBlock(mutation)
        if (!captionBlock || processedBlocks.has(captionBlock)) continue
        processedBlocks.add(captionBlock)
        handleCaptionUpdate(captionBlock)
      }
    })

    return () => {
      cleanup()
      for (const timer of activeTimers.values()) clearTimeout(timer)
      activeTimers.clear()
      blockToSegmentId.clear()
    }

    function handleCaptionUpdate(captionBlock: Element) {
      const result = extractCaptionData(captionBlock)
      if (!result) return

      const { speaker, text } = result

      // 既知のブロックならIDを再利用、新規なら発番
      const segId =
        blockToSegmentId.get(captionBlock) ??
        (() => {
          const id = `seg-${++segmentId.current}`
          blockToSegmentId.set(captionBlock, id)
          return id
        })()

      // 即座にinterim表示を更新（確定済み部分を除いた未確定テキストのみ表示）
      const lastText = finalizedSegments.get(segId)
      const interimText = (lastText && computeTextDelta(lastText, text)) ?? text
      setInterimText({ speaker, text: interimText })

      // デバウンス: 前回のタイマーをキャンセルして再セット
      const existingTimer = activeTimers.get(segId)
      if (existingTimer != null) clearTimeout(existingTimer)

      const currentSegId = segId
      const timer = window.setTimeout(() => {
        // --- ここから確定処理（2.5秒間テキスト更新がなかった） ---
        activeTimers.delete(currentSegId)

        // interim表示をクリア（ただし別の発話で上書きされていたら残す）
        setInterimText((prev) => {
          if (prev?.speaker === speaker) return null
          return prev
        })

        // 前回確定時と同じテキストなら書き込みスキップ
        const lastText = finalizedSegments.get(currentSegId)
        if (lastText === text) return

        const el = transcriptRef.current
        if (!el) return

        // 差分があれば差分だけ、なければ全文を書き込み
        // 例: "こんにちは" → "こんにちは、今日は" なら "、今日は" だけ追記
        const displayText =
          (lastText && computeTextDelta(lastText, text)) ?? text
        appendToTranscript(el, speaker, displayText)
        finalizedSegments.set(currentSegId, text)
        setHasContent(true)
        el.scrollTop = el.scrollHeight
      }, FINALIZE_DELAY_MS)

      activeTimers.set(segId, timer)
    }
  }, [])
}

// --- DOM書き込み ---

function appendToTranscript(el: HTMLDivElement, speaker: string, text: string) {
  if (el.textContent) {
    el.appendChild(document.createTextNode("\n"))
  }

  const color = getSpeakerColor(speaker)
  const time = new Date().toLocaleTimeString()

  const header = document.createElement("span")
  header.style.color = color
  header.style.opacity = "0.7"
  header.textContent = `${speaker} ${time}`

  el.appendChild(header)
  el.appendChild(document.createTextNode("\n" + text))
}

// speakerごとに色を割り当てる
const SPEAKER_COLORS = [
  "#8ab4f8", // blue
  "#81c995", // green
  "#fcad70", // orange
  "#f28b82", // red
  "#c58af9", // purple
  "#78d9ec", // cyan
  "#fdd663", // yellow
  "#ff8bcb" // pink
]
const speakerColorMap = new Map<string, string>()

function getSpeakerColor(speaker: string): string {
  const existing = speakerColorMap.get(speaker)
  if (existing) return existing
  const color =
    SPEAKER_COLORS[speakerColorMap.size % SPEAKER_COLORS.length] ?? "#000000"
  speakerColorMap.set(speaker, color)
  return color
}

// --- 字幕領域の検出・監視 ---

// MutationRecordから該当する字幕ブロック(.nMcdL)を探す
// - characterData変化: テキスト変更 → 親から字幕ブロックを辿る
// - childList変化: 要素追加 → 追加ノード内から字幕ブロックを探す
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

// 字幕領域(caption region)を見つけてMutationObserverを張る。
// 字幕ONにする前はregionがDOMに存在しないため、二段構えで監視する:
//   1. regionが既にあれば即座に監視開始
//   2. なければbody全体を監視し、regionが現れたら切り替え
function observeCaptionRegion(
  onMutations: (mutations: MutationRecord[]) => void
): () => void {
  let captionObserver: MutationObserver | null = null
  let regionObserver: MutationObserver | null = null

  const region = findCaptionRegion()
  if (region) {
    startObserving(region)
  } else {
    // regionが見つかるまでbody全体を監視
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
