// Displays the current unfinalized caption text with speaker name.

import type { CaptionData } from "~core/selectors"

type Props = {
  interimText: CaptionData | null
}

export function InterimDisplay({ interimText }: Props) {
  if (!interimText) return null

  return (
    <div
      style={{
        flexShrink: 0,
        borderTop: "1px dashed #ccc",
        padding: "6px 12px",
        background: "#fafafa",
        color: "#888",
        fontSize: 12,
        fontStyle: "italic",
        lineHeight: 1.5
      }}>
      <span style={{ color: "#aaa", marginRight: 6 }}>
        {interimText.speaker}
      </span>
      {interimText.text}
    </div>
  )
}
