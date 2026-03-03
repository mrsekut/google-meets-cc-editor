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
        borderTop: "1px solid rgba(255, 255, 255, 0.06)",
        padding: "6px 12px",
        color: "rgba(255, 255, 255, 0.4)",
        fontSize: 12,
        fontStyle: "italic",
        lineHeight: 1.5
      }}>
      <span style={{ color: "rgba(255, 255, 255, 0.25)", marginRight: 6 }}>
        {interimText.speaker}
      </span>
      {interimText.text}
    </div>
  )
}
