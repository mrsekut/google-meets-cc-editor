// contentEditable な字幕表示エリア。
// useImperativeHandle で append() を公開し、DOM操作・スクロール制御を内部に閉じる。

import { forwardRef, useImperativeHandle, useRef, useState } from "react"

import { SpeakerColorMap } from "~features/caption-engine/SpeakerColorMap"

export type TranscriptHandle = {
  append: (speaker: string, text: string) => void
}

export const TranscriptArea = forwardRef<TranscriptHandle>(
  function TranscriptArea(_, ref) {
    const elRef = useRef<HTMLDivElement>(null)
    const [hasContent, setHasContent] = useState(false)
    const speakerColors = useRef(new SpeakerColorMap())

    useImperativeHandle(ref, () => ({
      append(speaker: string, text: string) {
        const el = elRef.current
        if (!el) return

        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30

        appendToDOM(el, speakerColors.current, speaker, text)
        setHasContent(true)

        if (atBottom) el.scrollTop = el.scrollHeight
      }
    }))

    return (
      <div
        style={{
          position: "relative",
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column"
        }}>
        {!hasContent && (
          <div
            style={{
              position: "absolute",
              top: 8,
              left: 12,
              color: "rgba(255, 255, 255, 0.3)",
              pointerEvents: "none",
              whiteSpace: "pre-wrap",
              fontSize: 13,
              lineHeight: 1.6,
              zIndex: 1
            }}>
            字幕を待機中...
          </div>
        )}
        <div
          ref={elRef}
          contentEditable
          suppressContentEditableWarning
          onInput={() => setHasContent(!!elRef.current?.textContent)}
          style={{
            flex: 1,
            minHeight: 0,
            overflow: "auto",
            padding: "8px 12px",
            outline: "none",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            lineHeight: 1.6,
            color: "rgba(255, 255, 255, 0.88)",
            fontSize: 13
          }}
        />
      </div>
    )
  }
)

// --- DOM書き込み ---

function appendToDOM(
  el: HTMLDivElement,
  speakerColors: SpeakerColorMap,
  speaker: string,
  text: string
) {
  if (el.textContent) {
    el.appendChild(document.createTextNode("\n"))
  }

  const color = speakerColors.getColor(speaker)
  const time = new Date().toLocaleTimeString()

  const header = document.createElement("span")
  header.style.color = color
  header.style.opacity = "0.7"
  header.textContent = `${speaker} ${time}`

  el.appendChild(header)
  el.appendChild(document.createTextNode("\n" + text))
}
