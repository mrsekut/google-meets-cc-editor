// Manages resize behavior via capture-phase mouse events.

import type { Dispatch, SetStateAction } from "react"
import { useCallback, useEffect, useRef, useState } from "react"

type Size = { width: number; height: number }

export function useResizable(setSize: Dispatch<SetStateAction<Size>>) {
  const [isResizing, setIsResizing] = useState(false)
  const resizeStart = useRef({ x: 0, y: 0 })

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true)
    resizeStart.current = { x: e.clientX, y: e.clientY }
    e.preventDefault()
    e.stopPropagation()
  }, [])

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - resizeStart.current.x
      const dy = e.clientY - resizeStart.current.y
      setSize((prev) => ({
        width: Math.max(250, prev.width + dx),
        height: Math.max(150, prev.height + dy)
      }))
      resizeStart.current = { x: e.clientX, y: e.clientY }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    window.addEventListener("mousemove", handleMouseMove, true)
    window.addEventListener("mouseup", handleMouseUp, true)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove, true)
      window.removeEventListener("mouseup", handleMouseUp, true)
    }
  }, [isResizing])

  return { isResizing, handleMouseDown }
}
