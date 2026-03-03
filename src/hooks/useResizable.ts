// Manages resize behavior from all four corners via capture-phase mouse events.

import type { Dispatch, SetStateAction } from "react"
import { useCallback, useEffect, useRef, useState } from "react"

type Size = { width: number; height: number }
type Position = { x: number; y: number }

export type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right"

export function useResizable(
  setSize: Dispatch<SetStateAction<Size>>,
  setPosition: Dispatch<SetStateAction<Position>>
) {
  const [isResizing, setIsResizing] = useState(false)
  const resizeStart = useRef({ x: 0, y: 0 })
  const cornerRef = useRef<Corner>("bottom-right")

  const handleMouseDown = useCallback(
    (corner: Corner) => (e: React.MouseEvent) => {
      setIsResizing(true)
      cornerRef.current = corner
      resizeStart.current = { x: e.clientX, y: e.clientY }
      e.preventDefault()
      e.stopPropagation()
    },
    []
  )

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - resizeStart.current.x
      const dy = e.clientY - resizeStart.current.y
      const corner = cornerRef.current

      const flipX = corner === "top-left" || corner === "bottom-left"
      const flipY = corner === "top-left" || corner === "top-right"

      setSize((prev) => ({
        width: Math.max(250, prev.width + (flipX ? -dx : dx)),
        height: Math.max(150, prev.height + (flipY ? -dy : dy))
      }))

      if (flipX || flipY) {
        setPosition((prev) => ({
          x: prev.x + (flipX ? dx : 0),
          y: prev.y + (flipY ? dy : 0)
        }))
      }

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
