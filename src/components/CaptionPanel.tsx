// Main floating panel with drag, resize, minimize, transcript area, and interim display.

import { useEffect, useRef, useState } from "react"

import type { CaptionData } from "~core/selectors"
import { useAutoCC } from "~hooks/useAutoCC"
import { useCaptionObserver } from "~hooks/useCaptionObserver"
import { useDraggable } from "~hooks/useDraggable"
import type { ResizeHandle } from "~hooks/useResizable"
import { useResizable } from "~hooks/useResizable"

import { InterimDisplay } from "./InterimDisplay"
import { TranscriptArea } from "./TranscriptArea"

export function CaptionPanel() {
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
    useResizable(setSize, setPosition)

  useEffect(() => {
    setPosition({
      x: window.innerWidth - size.width - 20,
      y: window.innerHeight - size.height - 20
    })
  }, [])

  // ウィンドウリサイズ時にパネルをビューポート内に収める
  useEffect(() => {
    const handleWindowResize = () => {
      setPosition((prev) => ({
        x: Math.min(prev.x, window.innerWidth - 80),
        y: Math.min(prev.y, window.innerHeight - 40)
      }))
    }

    window.addEventListener("resize", handleWindowResize)
    return () => window.removeEventListener("resize", handleWindowResize)
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
            background: "rgba(32, 33, 36, 0.75)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            color: "rgba(255, 255, 255, 0.9)",
            borderRadius: "50%",
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: "0.5px"
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
          background: "rgba(32, 33, 36, 0.78)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderRadius: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          display: isMinimized ? "none" : "flex",
          flexDirection: "column",
          fontFamily: "system-ui, sans-serif",
          fontSize: 13,
          overflow: "hidden",
          userSelect: isDragging || isResizing ? "none" : "auto"
        }}>
        <div
          style={{
            padding: "8px 12px",
            cursor: isDragging ? "grabbing" : "grab",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
            borderBottom: "1px solid rgba(255, 255, 255, 0.06)"
          }}
          onMouseDown={handleDragMouseDown}>
          <span
            style={{
              fontWeight: 500,
              fontSize: 11,
              color: "rgba(255, 255, 255, 0.5)",
              letterSpacing: "0.5px",
              textTransform: "uppercase"
            }}>
            CC
          </span>
          <button
            onClick={() => setIsMinimized(true)}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255, 255, 255, 0.4)",
              cursor: "pointer",
              fontSize: 14,
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
          <TranscriptArea
            ref={transcriptRef}
            hasContent={hasContent}
            onInput={() => {
              setHasContent(!!transcriptRef.current?.textContent)
            }}
          />
          <InterimDisplay interimText={interimText} />
        </div>

        {(
          [
            ["top-left", { top: 0, left: 0, width: 16, height: 16, cursor: "nwse-resize" }],
            ["top-right", { top: 0, right: 0, width: 16, height: 16, cursor: "nesw-resize" }],
            ["bottom-left", { bottom: 0, left: 0, width: 16, height: 16, cursor: "nesw-resize" }],
            ["bottom-right", { bottom: 0, right: 0, width: 16, height: 16, cursor: "nwse-resize" }],
            ["top", { top: 0, left: 16, right: 16, height: 6, cursor: "ns-resize" }],
            ["bottom", { bottom: 0, left: 16, right: 16, height: 6, cursor: "ns-resize" }],
            ["left", { left: 0, top: 16, bottom: 16, width: 6, cursor: "ew-resize" }],
            ["right", { right: 0, top: 16, bottom: 16, width: 6, cursor: "ew-resize" }]
          ] as const
        ).map(([handle, style]) => (
          <div
            key={handle}
            onMouseDown={handleResizeMouseDown(handle as ResizeHandle)}
            style={{
              position: "absolute",
              ...style
            }}
          />
        ))}
      </div>
    </>
  )
}
