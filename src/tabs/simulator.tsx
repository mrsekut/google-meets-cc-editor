// キャプションシミュレータ: Google Meetsの字幕DOM構造を模擬生成し、
// CaptionPanelの動作をブラウザ上で確認するためのPlasmo tabページ。
//
// 使い方: chrome-extension://<id>/tabs/simulator.html

import { useRef } from "react"

import { CaptionPanel } from "~features/CaptionPanel"

// --- シナリオ定義 ---

type CaptionStep = {
  speaker: string
  text: string
  delayMs: number
}

const SCENARIOS: Record<string, { label: string; steps: CaptionStep[] }> = {
  singleSpeaker: {
    label: "1人長話",
    steps: [
      { speaker: "田中", text: "えーと", delayMs: 0 },
      { speaker: "田中", text: "えーと、今日は", delayMs: 400 },
      { speaker: "田中", text: "えーと、今日はプロジェクトの", delayMs: 800 },
      {
        speaker: "田中",
        text: "えーと、今日はプロジェクトの進捗について",
        delayMs: 1200
      },
      {
        speaker: "田中",
        text: "えーと、今日はプロジェクトの進捗についてお話しします",
        delayMs: 1600
      },
      // 2.5秒の無音で確定 → 新しいセグメント
      {
        speaker: "田中",
        text: "まず最初に、テスト基盤の整備が完了しました",
        delayMs: 5000
      },
      {
        speaker: "田中",
        text: "まず最初に、テスト基盤の整備が完了しました。Vitestを導入し",
        delayMs: 5500
      },
      {
        speaker: "田中",
        text: "まず最初に、テスト基盤の整備が完了しました。Vitestを導入し、ユニットテストが書けるようになりました",
        delayMs: 6000
      }
    ]
  },
  multiSpeaker: {
    label: "複数話者交互",
    steps: [
      { speaker: "田中", text: "それでは始めましょう", delayMs: 0 },
      { speaker: "田中", text: "それでは始めましょうか", delayMs: 500 },
      // 田中確定後、鈴木が話す
      { speaker: "鈴木", text: "はい", delayMs: 3500 },
      { speaker: "鈴木", text: "はい、お願いします", delayMs: 4000 },
      // 鈴木確定後、佐藤が話す
      { speaker: "佐藤", text: "私からも一点", delayMs: 7500 },
      { speaker: "佐藤", text: "私からも一点あります", delayMs: 8000 },
      // 佐藤確定後、田中が再度話す
      { speaker: "田中", text: "どうぞ", delayMs: 11500 },
      { speaker: "田中", text: "どうぞ佐藤さん", delayMs: 12000 }
    ]
  },
  overlap: {
    label: "重複テキスト",
    steps: [
      { speaker: "田中", text: "了解です", delayMs: 0 },
      { speaker: "田中", text: "了解です了解です", delayMs: 500 },
      // 確定後、同じテキストで始まる新しい発話
      { speaker: "田中", text: "了解です、", delayMs: 4000 },
      { speaker: "田中", text: "了解です、進めてください", delayMs: 4500 }
    ]
  },
  rapid: {
    label: "高速入力",
    steps: Array.from({ length: 20 }, (_, i) => ({
      speaker: "田中",
      text: "あ".repeat(i + 1),
      delayMs: i * 100
    }))
  }
}

// --- シミュレータ本体 ---

function Simulator() {
  const regionRef = useRef<HTMLDivElement>(null)
  const timersRef = useRef<number[]>([])

  function clearTimers() {
    for (const t of timersRef.current) clearTimeout(t)
    timersRef.current = []
  }

  function clearCaptions() {
    clearTimers()
    const region = regionRef.current
    if (!region) return
    region.innerHTML = ""
  }

  function runScenario(steps: CaptionStep[]) {
    clearCaptions()
    const region = regionRef.current
    if (!region) return

    // 現在のcaptionBlockを追跡（speakerが変わったら新しいblockを作る）
    let currentBlock: HTMLDivElement | null = null
    let currentSpeaker: string | null = null

    for (const step of steps) {
      const timer = window.setTimeout(() => {
        // speakerが変わったら新しいブロックを作成
        if (step.speaker !== currentSpeaker) {
          currentBlock = createCaptionBlock(step.speaker, step.text)
          region.appendChild(currentBlock)
          currentSpeaker = step.speaker
        } else if (currentBlock) {
          // 同じspeakerならテキストを更新
          const textEl = currentBlock.querySelector(".ygicle")
          if (textEl) textEl.textContent = step.text
        }
      }, step.delayMs)
      timersRef.current.push(timer)
    }
  }

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        background: "#1a1a2e",
        color: "#e0e0e0",
        minHeight: "100vh",
        padding: 24
      }}>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>
        Caption Simulator
      </h1>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 24 }}>
        Google Meetsの字幕DOM構造を模擬生成し、CaptionPanelの動作を確認します。
        <br />
        シナリオボタンを押すと、字幕DOMが動的に変更され、CaptionPanelがそれを検出します。
      </p>

      {/* シナリオボタン */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {Object.entries(SCENARIOS).map(([key, scenario]) => (
          <button
            key={key}
            onClick={() => runScenario(scenario.steps)}
            style={{
              padding: "8px 16px",
              background: "#2d2d44",
              color: "#e0e0e0",
              border: "1px solid #444",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 13
            }}>
            {scenario.label}
          </button>
        ))}
        <button
          onClick={clearCaptions}
          style={{
            padding: "8px 16px",
            background: "#442d2d",
            color: "#e0e0e0",
            border: "1px solid #644",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 13
          }}>
          クリア
        </button>
      </div>

      {/* 模擬字幕領域（useCaptionObserverが監視する） */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, color: "#888", marginBottom: 8 }}>
          模擬字幕DOM (MutationObserverの監視対象)
        </h2>
        <div
          ref={regionRef}
          role="region"
          aria-label="字幕"
          tabIndex={0}
          style={{
            background: "#0d0d1a",
            border: "1px solid #333",
            borderRadius: 8,
            padding: 12,
            minHeight: 80
          }}
        />
      </div>

      <p style={{ fontSize: 11, color: "#666" }}>
        CaptionPanelは右上にフローティング表示されます。
        ドラッグで移動、角をドラッグでリサイズできます。
      </p>

      {/* CaptionPanelをそのまま配置 */}
      <CaptionPanel />
    </div>
  )
}

// --- DOM生成ヘルパー ---

function createCaptionBlock(speaker: string, text: string): HTMLDivElement {
  const block = document.createElement("div")
  block.className = "nMcdL"
  block.style.cssText =
    "padding: 4px 8px; margin: 2px 0; background: rgba(255,255,255,0.05); border-radius: 4px;"

  const speakerEl = document.createElement("div")
  speakerEl.className = "NWpY1d"
  speakerEl.textContent = speaker
  speakerEl.style.cssText = "font-size: 11px; color: #8ab4f8; margin-bottom: 2px;"

  const textEl = document.createElement("div")
  textEl.className = "ygicle"
  textEl.textContent = text
  textEl.style.cssText = "font-size: 13px; color: #e0e0e0;"

  block.appendChild(speakerEl)
  block.appendChild(textEl)
  return block
}

export default Simulator
