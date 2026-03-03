// Plasmo CSUI entry point: assembles hooks and renders the caption panel.

import type { PlasmoCSConfig, PlasmoGetOverlayAnchor } from "plasmo"
import { useEffect, useRef, useState } from "react"

import type { CaptionData } from "~core/selectors"
import { useAutoCC } from "~hooks/useAutoCC"
import { useCaptionObserver } from "~hooks/useCaptionObserver"
import { useDraggable } from "~hooks/useDraggable"
import { useResizable } from "~hooks/useResizable"

export const config: PlasmoCSConfig = {
  matches: ["https://meet.google.com/*"],
  run_at: "document_idle"
}

export const getOverlayAnchor: PlasmoGetOverlayAnchor = async () =>
  document.body

function GoogleMeetCC() {
  const [interimText, setInterimText] = useState<CaptionData | null>(null)
  const [hasContent, setHasContent] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [size, setSize] = useState({ width: 400, height: 300 })
  const transcriptRef = useRef<HTMLDivElement>(null)

  const { isDragging, handleMouseDown: handleDragMouseDown } = useDraggable(
    position,
    setPosition
  )
  const { isResizing, handleMouseDown: handleResizeMouseDown } =
    useResizable(setSize)

  useEffect(() => {
    setPosition({
      x: window.innerWidth - size.width - 20,
      y: window.innerHeight - size.height - 20
    })
  }, [])

  useAutoCC()
  useCaptionObserver(transcriptRef, setHasContent, setInterimText)

  return (
    <>
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
          onMouseDown={handleDragMouseDown}>
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

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}>
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
