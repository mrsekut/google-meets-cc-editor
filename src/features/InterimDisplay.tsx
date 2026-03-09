// Displays the current unfinalized caption text with speaker name.

import type { CaptionData } from "~features/selectors"

type Props = {
  interimText: CaptionData | null
}

export function InterimDisplay({ interimText }: Props) {
  return (
    <div
      style={{
        height: "6em",
        display: "grid",
        gridTemplateRows: "1fr 2fr",
        borderTop: "1px solid rgba(255, 255, 255, 0.06)",
        padding: "6px 12px",
        fontSize: 12,
        fontStyle: "italic",
        lineHeight: 1.5
      }}>
      <div style={{ color: "rgba(255, 255, 255, 0.25)" }}>
        {interimText?.speaker}
      </div>
      <div
        style={{
          overflow: "hidden",
          display: "flex",
          alignItems: "flex-end"
        }}>
        <div style={{ color: "rgba(255, 255, 255, 0.4)" }}>
          {interimText?.text}
        </div>
      </div>
    </div>
  )
}
