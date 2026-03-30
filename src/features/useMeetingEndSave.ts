// 会議終了を検知して字幕テキストを自動保存するhook。
// Google Meetの退出後画面（"You left the meeting" / 通話から退出）のDOM出現を監視し、
// 検知時にテキストファイルをダウンロードする。

import { useEffect, type RefObject } from "react"

import type { TranscriptHandle } from "~features/TranscriptArea"

// 会議退出後に表示される要素のセレクタ候補
// Google Meetは退出後に "You left the meeting" 画面を表示する
const MEETING_END_SELECTORS = [
  '[data-call-ended="true"]',
  '[jsname="r4nke"]' // "Return to home screen" / ホーム画面に戻る リンク
] as const

export function useMeetingEndSave(
  transcriptRef: RefObject<TranscriptHandle | null>
) {
  useEffect(() => {
    let saved = false

    const observer = new MutationObserver(() => {
      if (saved) return
      if (!isMeetingEnded()) return

      const text = transcriptRef.current?.getText()
      if (!text?.trim()) return

      saved = true
      observer.disconnect()
      downloadTranscript(text)
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    return () => {
      observer.disconnect()
    }
  }, [])
}

function isMeetingEnded(): boolean {
  return MEETING_END_SELECTORS.some((sel) => document.querySelector(sel))
}

function downloadTranscript(text: string) {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-")
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `meeting-transcript-${timestamp}.txt`
  a.click()
  URL.revokeObjectURL(url)
  console.log("[Google Meets CC] Transcript saved automatically")
}
