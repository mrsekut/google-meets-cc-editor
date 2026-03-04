// Manages resize behavior from all four corners via capture-phase mouse events.

import type { Dispatch, SetStateAction } from "react"
import { useCallback, useEffect, useRef, useState } from "react"

type Size = { width: number; height: number }
type Position = { x: number; y: number }

export type ResizeHandle =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "top"
  | "bottom"
  | "left"
  | "right"

export function useResizable(
  setSize: Dispatch<SetStateAction<Size>>,
  setPosition: Dispatch<SetStateAction<Position>>
) {
  const [isResizing, setIsResizing] = useState(false)
  const resizeStart = useRef({ x: 0, y: 0 })
  const handleRef = useRef<ResizeHandle>("bottom-right")

  const handleMouseDown = useCallback(
    (handle: ResizeHandle) => (e: React.MouseEvent) => {
      setIsResizing(true)
      handleRef.current = handle
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
      const handle = handleRef.current

      const resizesX = handle !== "top" && handle !== "bottom"
      const resizesY = handle !== "left" && handle !== "right"
      const flipX =
        handle === "top-left" || handle === "bottom-left" || handle === "left"
      const flipY =
        handle === "top-left" || handle === "top-right" || handle === "top"

      setSize((prev) => ({
        width: resizesX
          ? Math.max(250, prev.width + (flipX ? -dx : dx))
          : prev.width,
        height: resizesY
          ? Math.max(150, prev.height + (flipY ? -dy : dy))
          : prev.height
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
