// 一時的なデバッグログバッファ。字幕処理フローの分析用。
// 削除時: このファイルを消し、import箇所を除去するだけでOK。

type LogEntry = {
  t: number
  phase: "mutation" | "handle" | "finalize" | "command"
  segId?: string
  blockKey?: string
  speaker?: string
  text?: string
  delta?: string | null
  delayMs?: number
  action?: string
}

const MAX_ENTRIES = 10_000

class DebugLogger {
  private buffer: LogEntry[] = []

  log(entry: Omit<LogEntry, "t">) {
    if (this.buffer.length >= MAX_ENTRIES) {
      this.buffer.shift()
    }
    this.buffer.push({ t: Date.now(), ...entry })
  }

  export(): string {
    return JSON.stringify(this.buffer, null, 2)
  }

  download() {
    const blob = new Blob([this.export()], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `caption-log-${new Date().toISOString().slice(0, 19)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
}

export const logger = new DebugLogger()

// devtools用
;(window as any).__captionLog = logger
