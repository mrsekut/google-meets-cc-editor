import { useEffect, useState } from "react"

import { useDraggable } from "./useDraggable"
import { useResizable } from "./useResizable"

export function usePanel() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [size, setSize] = useState({ width: 400, height: 300 })

  const { isDragging, handleMouseDown: handleDragMouseDown } = useDraggable(
    position,
    setPosition
  )
  const { isResizing, handleMouseDown: handleResizeMouseDown } = useResizable(
    setSize,
    setPosition
  )

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

  return {
    position,
    size,
    isDragging,
    isResizing,
    isInteracting: isDragging || isResizing,
    handleDragMouseDown,
    handleResizeMouseDown
  }
}
