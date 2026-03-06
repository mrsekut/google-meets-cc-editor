// Main floating panel with drag, resize, minimize, transcript area, and interim display.

import { useAtomValue } from "jotai"
import { useCallback, useRef, useState } from "react"

import { useAutoCC } from "~features/autoStartCC/useAutoCC"
import { logger } from "~features/caption-engine/DebugLogger"
import { SpeakerColorMap } from "~features/caption-engine/SpeakerColorMap"
import type { CaptionData } from "~features/selectors"
import { CopyButton } from "~features/transcript-view/CopyButton"
import { TranscriptArea } from "~features/transcript-view/TranscriptArea"
import type { Segment } from "~features/transcript-view/types"
import { useCaptionObserver } from "~features/useCaptionObserver"

import { InterimDisplay } from "./InterimDisplay"
import { isMinimizedAtom, MinimizeButton, MinimizeIcon } from "./panel/minimize"
import { ResizeHandles } from "./panel/ResizeHandler"
import { usePanel } from "./panel/usePanel"

export function CaptionPanel() {
  const [interimText, setInterimText] = useState<CaptionData | null>(null)
  const [segments, setSegments] = useState<Segment[]>([])
  const isMinimized = useAtomValue(isMinimizedAtom)
  const panel = usePanel()
  const speakerColors = useRef(new SpeakerColorMap())

  const onAppendSegment = useCallback((speaker: string, text: string) => {
    const color = speakerColors.current.getColor(speaker)
    const time = new Date().toLocaleTimeString()
    setSegments((prev) => [
      ...prev,
      { id: Date.now(), speaker, text, time, color }
    ])
  }, [])

  const onUpdateSegment = useCallback((id: number, text: string) => {
    setSegments((prev) => prev.map((s) => (s.id === id ? { ...s, text } : s)))
  }, [])

  useAutoCC()
  useCaptionObserver(onAppendSegment, setInterimText)

  return (
    <>
      {isMinimized && <MinimizeIcon />}

      <div
        style={{
          position: "fixed",
          left: panel.position.x,
          top: panel.position.y,
          width: panel.size.width,
          height: panel.size.height,
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
          userSelect: panel.isInteracting ? "none" : "auto"
        }}>
        <TitleBar
          isDragging={panel.isDragging}
          onMouseDown={panel.handleDragMouseDown}
          segments={segments}
        />

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}>
          <TranscriptArea
            segments={segments}
            onUpdateSegment={onUpdateSegment}
          />
          <InterimDisplay interimText={interimText} />
        </div>

        <ResizeHandles onMouseDown={panel.handleResizeMouseDown} />
      </div>
    </>
  )
}

function TitleBar({
  isDragging,
  onMouseDown,
  segments
}: {
  isDragging: boolean
  onMouseDown: (e: React.MouseEvent) => void
  segments: Segment[]
}) {
  return (
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
      onMouseDown={onMouseDown}>
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
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <CopyButton segments={segments} />
        <button
          onClick={(e) => {
            e.stopPropagation()
            logger.download()
          }}
          title="Export debug log"
          style={{
            background: "none",
            border: "none",
            color: "rgba(255, 255, 255, 0.4)",
            cursor: "pointer",
            fontSize: 14,
            padding: "2px 4px",
            lineHeight: 1
          }}>
          ↓
        </button>
        <MinimizeButton />
      </div>
    </div>
  )
}
