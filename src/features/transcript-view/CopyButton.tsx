import { useCallback, useState } from "react"

import type { Segment } from "./types"

type Props = {
  segments: Segment[]
}

export function CopyButton({ segments }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      const text = segments
        .map((s) => `${s.speaker} ${s.time}\n${s.text}`)
        .join("\n\n")
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    },
    [segments]
  )

  return (
    <button
      onClick={handleCopy}
      title="Copy all"
      style={{
        background: "none",
        border: "none",
        color: copied ? "rgba(129, 201, 149, 0.8)" : "rgba(255, 255, 255, 0.4)",
        cursor: "pointer",
        fontSize: 12,
        padding: "2px 4px",
        lineHeight: 1,
        transition: "color 0.15s"
      }}>
      {copied ? "Copied!" : "Copy"}
    </button>
  )
}
