import { useEffect, useRef, useState } from "react"

import type { Segment } from "./types"

type Props = {
  segment: Segment
  isEditing: boolean
  onEditStart: () => void
  onUpdate: (text: string) => void
  onNavigate: (direction: "up" | "down") => void
  onEditEnd: () => void
}

export function SegmentRow({
  segment,
  isEditing,
  onEditStart,
  onUpdate,
  onNavigate,
  onEditEnd
}: Props) {
  const [draft, setDraft] = useState(segment.text)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 編集モードに入ったらfocus
  useEffect(() => {
    if (isEditing) {
      const ta = textareaRef.current
      if (ta) {
        ta.focus()
        ta.setSelectionRange(ta.value.length, ta.value.length)
      }
    }
  }, [isEditing])

  // 外部からテキストが更新された場合（編集中でなければ追従）
  useEffect(() => {
    if (!isEditing) setDraft(segment.text)
  }, [segment.text, isEditing])

  const commit = () => {
    if (draft !== segment.text) onUpdate(draft)
    onEditEnd()
  }

  const cancel = () => {
    setDraft(segment.text)
    onEditEnd()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      commit()
      return
    }
    if (e.key === "Escape") {
      e.preventDefault()
      cancel()
      return
    }
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      const ta = textareaRef.current
      if (!ta) return

      // カーソルが先頭行で↑、または末尾行で↓の場合のみナビゲーション
      if (e.key === "ArrowUp" && ta.selectionStart === 0) {
        e.preventDefault()
        commit()
        onNavigate("up")
        return
      }
      if (e.key === "ArrowDown" && ta.selectionEnd === ta.value.length) {
        e.preventDefault()
        commit()
        onNavigate("down")
        return
      }
    }
  }

  return (
    <div style={{ marginBottom: 4 }}>
      <span
        style={{
          color: segment.color,
          opacity: 0.7,
          fontSize: 12
        }}>
        {segment.speaker} {segment.time}
      </span>
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          style={{
            display: "block",
            width: "100%",
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: 4,
            color: "inherit",
            font: "inherit",
            lineHeight: "inherit",
            padding: "2px 4px",
            resize: "vertical",
            outline: "none",
            boxSizing: "border-box"
          }}
        />
      ) : (
        <div
          onClick={onEditStart}
          style={{
            cursor: "text",
            borderRadius: 4,
            padding: "0 2px"
          }}>
          {segment.text}
        </div>
      )}
    </div>
  )
}
