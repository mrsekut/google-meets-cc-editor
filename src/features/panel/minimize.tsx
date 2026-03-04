import { atom, useSetAtom } from "jotai"

export const isMinimizedAtom = atom(false)

export const MinimizeIcon = () => {
  const setIsMinimized = useSetAtom(isMinimizedAtom)
  return (
    <div
      style={{
        position: "fixed",
        right: 20,
        bottom: 20,
        zIndex: 999999,
        background: "rgba(32, 33, 36, 0.75)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        color: "rgba(255, 255, 255, 0.9)",
        borderRadius: "50%",
        width: 40,
        height: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: "0.5px"
      }}
      onClick={() => setIsMinimized(false)}
      title="字幕パネルを開く">
      CC
    </div>
  )
}

export const MinimizeButton = () => {
  const setIsMinimized = useSetAtom(isMinimizedAtom)

  return (
    <button
      onClick={() => setIsMinimized(true)}
      style={{
        background: "none",
        border: "none",
        color: "rgba(255, 255, 255, 0.4)",
        cursor: "pointer",
        fontSize: 14,
        padding: 0,
        lineHeight: 1
      }}
      title="最小化">
      _
    </button>
  )
}
