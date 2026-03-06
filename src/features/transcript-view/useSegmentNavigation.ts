import { useCallback, useState } from "react"

export function useSegmentNavigation(segmentIds: number[]) {
  const [editingId, setEditingId] = useState<number | null>(null)

  const onEditStart = useCallback((id: number) => {
    setEditingId(id)
  }, [])

  const onEditEnd = useCallback(() => {
    setEditingId(null)
  }, [])

  const onNavigate = useCallback(
    (direction: "up" | "down") => {
      setEditingId((current) => {
        if (current === null) return null
        const idx = segmentIds.indexOf(current)
        if (idx === -1) return null
        const nextIdx = direction === "up" ? idx - 1 : idx + 1
        if (nextIdx < 0 || nextIdx >= segmentIds.length) return current
        return segmentIds[nextIdx]!
      })
    },
    [segmentIds]
  )

  return { editingId, onEditStart, onEditEnd, onNavigate }
}
