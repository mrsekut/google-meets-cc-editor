import type { ResizeHandle } from "./useResizable"

export const resizeHandleConfigs: [ResizeHandle, React.CSSProperties][] = [
  [
    "top-left",
    { top: 0, left: 0, width: 16, height: 16, cursor: "nwse-resize" }
  ],
  [
    "top-right",
    { top: 0, right: 0, width: 16, height: 16, cursor: "nesw-resize" }
  ],
  [
    "bottom-left",
    { bottom: 0, left: 0, width: 16, height: 16, cursor: "nesw-resize" }
  ],
  [
    "bottom-right",
    { bottom: 0, right: 0, width: 16, height: 16, cursor: "nwse-resize" }
  ],
  ["top", { top: 0, left: 16, right: 16, height: 6, cursor: "ns-resize" }],
  [
    "bottom",
    { bottom: 0, left: 16, right: 16, height: 6, cursor: "ns-resize" }
  ],
  ["left", { left: 0, top: 16, bottom: 16, width: 6, cursor: "ew-resize" }],
  ["right", { right: 0, top: 16, bottom: 16, width: 6, cursor: "ew-resize" }]
]

export function ResizeHandles({
  onMouseDown
}: {
  onMouseDown: (handle: ResizeHandle) => (e: React.MouseEvent) => void
}) {
  return (
    <>
      {resizeHandleConfigs.map(([handle, style]) => (
        <div
          key={handle}
          onMouseDown={onMouseDown(handle)}
          style={{ position: "absolute", ...style }}
        />
      ))}
    </>
  )
}
