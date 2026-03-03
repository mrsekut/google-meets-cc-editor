// Editable transcript area that preserves user edits via direct DOM manipulation.

import { forwardRef } from "react"

type Props = {
  hasContent: boolean
  onInput: () => void
}

export const TranscriptArea = forwardRef<HTMLDivElement, Props>(
  function TranscriptArea({ hasContent, onInput }, ref) {
    return (
      <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
        {!hasContent && (
          <div
            style={{
              position: "absolute",
              top: 8,
              left: 12,
              color: "rgba(255, 255, 255, 0.3)",
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
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={onInput}
          style={{
            height: "100%",
            overflow: "auto",
            padding: "8px 12px",
            outline: "none",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            lineHeight: 1.6,
            color: "rgba(255, 255, 255, 0.88)",
            fontSize: 13
          }}
        />
      </div>
    )
  }
)
