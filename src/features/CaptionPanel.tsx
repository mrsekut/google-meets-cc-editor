// Main floating panel with drag, resize, minimize, transcript area, and interim display.

import { useAtomValue } from "jotai"
import { useRef, useState } from "react"

import { useAutoCC } from "~features/autoStartCC/useAutoCC"
import type { CaptionData } from "~features/selectors"
import { useCaptionObserver } from "~features/useCaptionObserver"

import { InterimDisplay } from "./InterimDisplay"
import { isMinimizedAtom, MinimizeButton, MinimizeIcon } from "./panel/minimize"
import { ResizeHandles } from "./panel/ResizeHandler"
import { usePanel } from "./panel/usePanel"
import { TranscriptArea } from "./TranscriptArea"

export function CaptionPanel() {
  const [interimText, setInterimText] = useState<CaptionData | null>(null)
  const [hasContent, setHasContent] = useState(false)
  const isMinimized = useAtomValue(isMinimizedAtom)
  const transcriptRef = useRef<HTMLDivElement>(null)
  const panel = usePanel()

  useAutoCC()
  useCaptionObserver(transcriptRef, setHasContent, setInterimText)

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
        />

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
            onInput={() => setHasContent(!!transcriptRef.current?.textContent)}
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
  onMouseDown
}: {
  isDragging: boolean
  onMouseDown: (e: React.MouseEvent) => void
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
      <MinimizeButton />
    </div>
  )
}
