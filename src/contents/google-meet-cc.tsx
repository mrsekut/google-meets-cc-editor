import type { PlasmoCSConfig, PlasmoGetOverlayAnchor } from "plasmo"
import { useCallback, useEffect, useRef, useState } from "react"

import { computeTextDelta, formatTranscriptLine } from "~core/format"
import {
  extractCaptionData,
  findCaptionRegion,
  findCCButton,
  SELECTORS
} from "~core/selectors"

export const config: PlasmoCSConfig = {
  matches: ["https://meet.google.com/*"],
  run_at: "document_idle"
}

export const getOverlayAnchor: PlasmoGetOverlayAnchor = async () =>
  document.body

const FINALIZE_DELAY_MS = 2500
const AUTO_CC_POLL_MS = 2000

const segmentId = { current: 0 }

function GoogleMeetCC() {
  const [interimText, setInterimText] = useState<{
    speaker: string
    text: string
  } | null>(null)
  const [hasContent, setHasContent] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [size, setSize] = useState({ width: 400, height: 300 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const transcriptRef = useRef<HTMLDivElement>(null)

  // 初期位置: 右下
  useEffect(() => {
    setPosition({
      x: window.innerWidth - size.width - 20,
      y: window.innerHeight - size.height - 20
    })
  }, [])

  // --- 字幕自動ON ---
  useEffect(() => {
    const state = { stopped: false, pollTimer: undefined as number | undefined }

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

      // ボタンがまだ見つからない場合はリトライ
      state.pollTimer = window.setTimeout(tryEnableCC, AUTO_CC_POLL_MS)
    }

    // ページ読み込み後に開始
    state.pollTimer = window.setTimeout(tryEnableCC, 3000)

    return () => {
      state.stopped = true
      if (state.pollTimer != null) clearTimeout(state.pollTimer)
    }
  }, [])

  // --- 字幕キャプチャのオブザーバー ---
  useEffect(() => {
    const blockToSegmentId = new Map<Element, string>()
    const activeTimers = new Map<string, number>()
    // segId → 最後に確定したテキスト（同じブロックがさらに伸びた場合に差分を追記）
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

        // DOM に直接追加（React state を経由しないのでユーザの編集が保護される）
        const lastText = finalizedSegments.get(currentSegId)
        if (lastText === text) return // テキスト変更なし

        const el = transcriptRef.current
        if (el) {
          const now = new Date()
          const delta = lastText ? computeTextDelta(lastText, text) : null

          if (lastText && delta) {
            // 同じブロックのテキストが伸びた → 差分だけ追記
            el.appendChild(
              document.createTextNode(
                "\n" + formatTranscriptLine(speaker, delta, now)
              )
            )
          } else if (!lastText) {
            // 初回確定
            const line = formatTranscriptLine(speaker, text, now)
            if (el.textContent) {
              el.appendChild(document.createTextNode("\n" + line))
            } else {
              el.textContent = line
            }
          } else {
            // テキストが予想外に変わった → 全文を新しい行として追記
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
      if (
        mutation.type === "characterData" &&
        mutation.target.parentElement
      ) {
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

  // ドラッグ
  const handleHeaderMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true)
      dragOffset.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
      }
      e.preventDefault()
    },
    [position]
  )

  // リサイズ
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true)
    dragOffset.current = { x: e.clientX, y: e.clientY }
    e.preventDefault()
    e.stopPropagation()
  }, [])

  useEffect(() => {
    if (!isDragging && !isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.current.x,
          y: e.clientY - dragOffset.current.y
        })
      }
      if (isResizing) {
        const dx = e.clientX - dragOffset.current.x
        const dy = e.clientY - dragOffset.current.y
        setSize((prev) => ({
          width: Math.max(250, prev.width + dx),
          height: Math.max(150, prev.height + dy)
        }))
        dragOffset.current = { x: e.clientX, y: e.clientY }
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
    }

    window.addEventListener("mousemove", handleMouseMove, true)
    window.addEventListener("mouseup", handleMouseUp, true)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove, true)
      window.removeEventListener("mouseup", handleMouseUp, true)
    }
  }, [isDragging, isResizing])

  return (
    <>
      {/* 最小化ボタン */}
      {isMinimized && (
        <div
          style={{
            position: "fixed",
            right: 20,
            bottom: 20,
            zIndex: 999999,
            background: "#1a73e8",
            color: "white",
            borderRadius: "50%",
            width: 48,
            height: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            fontSize: 20,
            fontWeight: "bold"
          }}
          onClick={() => setIsMinimized(false)}
          title="字幕パネルを開く">
          CC
        </div>
      )}

      {/* メインパネル（最小化時は display:none でDOMに残す → 編集内容を保護） */}
      <div
        style={{
          position: "fixed",
          left: position.x,
          top: position.y,
          width: size.width,
          height: size.height,
          zIndex: 999999,
          background: "white",
          borderRadius: 8,
          boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          display: isMinimized ? "none" : "flex",
          flexDirection: "column",
          fontFamily: "system-ui, sans-serif",
          fontSize: 13,
          overflow: "hidden",
          userSelect: isDragging || isResizing ? "none" : "auto"
        }}>
        {/* ヘッダー（ドラッグハンドル） */}
        <div
          style={{
            padding: "6px 12px",
            background: "#1a73e8",
            color: "white",
            cursor: isDragging ? "grabbing" : "grab",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0
          }}
          onMouseDown={handleHeaderMouseDown}>
          <span style={{ fontWeight: "bold", fontSize: 12 }}>
            Google Meets CC
          </span>
          <button
            onClick={() => setIsMinimized(true)}
            style={{
              background: "none",
              border: "none",
              color: "white",
              cursor: "pointer",
              fontSize: 16,
              padding: 0,
              lineHeight: 1
            }}
            title="最小化">
            _
          </button>
        </div>

        {/* メインコンテンツ */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}>
          {/* 確定済みテキスト（DOM直接操作でユーザ編集を保護） */}
          <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
            {!hasContent && (
              <div
                style={{
                  position: "absolute",
                  top: 8,
                  left: 12,
                  color: "#999",
                  pointerEvents: "none",
                  whiteSpace: "pre-wrap",
                  fontSize: 13,
                  lineHeight: 1.6,
                  zIndex: 1
                }}>
                字幕を待機中...
              </div>
            )}
            <div
              ref={transcriptRef}
              contentEditable
              suppressContentEditableWarning
              onInput={() => {
                setHasContent(!!transcriptRef.current?.textContent)
              }}
              style={{
                height: "100%",
                overflow: "auto",
                padding: "8px 12px",
                outline: "none",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                lineHeight: 1.6,
                color: "#333",
                fontSize: 13
              }}
            />
          </div>

          {/* 区切り線 + 未確定テキスト */}
          {interimText && (
            <div
              style={{
                flexShrink: 0,
                borderTop: "1px dashed #ccc",
                padding: "6px 12px",
                background: "#fafafa",
                color: "#888",
                fontSize: 12,
                fontStyle: "italic",
                lineHeight: 1.5
              }}>
              <span style={{ color: "#aaa", marginRight: 6 }}>
                {interimText.speaker}
              </span>
              {interimText.text}
            </div>
          )}
        </div>

        {/* リサイズハンドル */}
        <div
          onMouseDown={handleResizeMouseDown}
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            width: 20,
            height: 20,
            cursor: "nwse-resize",
            background:
              "linear-gradient(135deg, transparent 40%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.15) 50%, transparent 50%, transparent 60%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0.15) 70%, transparent 70%)",
            borderRadius: "0 0 8px 0"
          }}
        />
      </div>
    </>
  )
}

export default GoogleMeetCC
