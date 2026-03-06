import { useEffect, useMemo, useRef } from "react"

import { SegmentRow } from "./SegmentRow"
import type { Segment } from "./types"
import { useSegmentNavigation } from "./useSegmentNavigation"

type Props = {
  segments: Segment[]
  onUpdateSegment: (id: number, text: string) => void
}

export function TranscriptArea({ segments, onUpdateSegment }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const shouldAutoScroll = useRef(true)

  const segmentIds = useMemo(() => segments.map((s) => s.id), [segments])
  const { editingId, onEditStart, onEditEnd, onNavigate } =
    useSegmentNavigation(segmentIds)

  // 新しいセグメント追加時に自動スクロール
  useEffect(() => {
    if (shouldAutoScroll.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [segments.length])

  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return
    shouldAutoScroll.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 30
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        flex: 1,
        minHeight: 0,
        overflow: "auto",
        padding: "8px 12px",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        lineHeight: 1.6,
        color: "rgba(255, 255, 255, 0.88)",
        fontSize: 13
      }}>
      {segments.length === 0 && (
        <div style={{ color: "rgba(255, 255, 255, 0.3)" }}>字幕を待機中...</div>
      )}
      {segments.map((seg) => (
        <SegmentRow
          key={seg.id}
          segment={seg}
          isEditing={editingId === seg.id}
          onEditStart={() => onEditStart(seg.id)}
          onUpdate={(text) => onUpdateSegment(seg.id, text)}
          onNavigate={onNavigate}
          onEditEnd={onEditEnd}
        />
      ))}
    </div>
  )
}
