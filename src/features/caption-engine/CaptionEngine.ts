// 字幕のセグメント管理・delta判定・重複検出を行う純粋ロジック。
// 副作用を持たず、コマンドを返すことで外部(hook)に処理を委ねる。
//
// 使い方:
//   const engine = new CaptionEngine()
//   const result = engine.handleCaptionUpdate(blockKey, speaker, text)
//   // result.commands を即座に実行
//   // result.segmentId でタイマーを管理し、発火時に engine.finalizeSegment() を呼ぶ

import { computeTextDelta } from "~features/format"

// --- 定数 ---

const FINALIZE_DELAY_MS = 2500
const PUNCTUATION_DELAY_MS = 500

const PUNCTUATION_RE = /[。.！？!?]$/

// --- Command types ---

export type Command =
  | { type: "setInterim"; speaker: string; text: string }
  | { type: "clearInterim"; speaker: string }
  | { type: "appendTranscript"; speaker: string; text: string }
  | { type: "setHasContent" }

export type CaptionUpdateResult = {
  commands: Command[]
  segmentId: string
  finalizeDelayMs: number
}

// --- Engine ---

export class CaptionEngine {
  private blockToSegmentId = new Map<string, string>()
  private finalizedSegments = new Map<string, string>()
  private segmentCounter = 0

  /** 字幕ブロックの更新を処理し、即時実行すべきコマンドを返す */
  handleCaptionUpdate(
    blockKey: string,
    speaker: string,
    text: string
  ): CaptionUpdateResult {
    const segId = this.getOrCreateSegmentId(blockKey)

    // interim表示: 確定済み部分を除いた未確定テキストのみ
    const lastText = this.finalizedSegments.get(segId)
    const interimText = (lastText && computeTextDelta(lastText, text)) ?? text

    const finalizeDelayMs = this.computeFinalizeDelay(interimText, text)

    return {
      commands: [{ type: "setInterim", speaker, text: interimText }],
      segmentId: segId,
      finalizeDelayMs
    }
  }

  /** タイマー発火時に呼ぶ。確定処理のコマンドを返す */
  finalizeSegment(segId: string, speaker: string, text: string): Command[] {
    const lastText = this.finalizedSegments.get(segId)

    // 前回確定時と同じテキストなら書き込みスキップ
    if (lastText === text) {
      return [{ type: "clearInterim", speaker }]
    }

    // 常に最新テキストを記録
    this.finalizedSegments.set(segId, text)

    // 初回確定: フルテキストを書き込む
    if (!lastText) {
      return [
        { type: "clearInterim", speaker },
        { type: "appendTranscript", speaker, text },
        { type: "setHasContent" }
      ]
    }

    // delta計算: テキストが伸びた場合は差分のみ書き込む
    const delta = computeTextDelta(lastText, text)
    if (delta) {
      return [
        { type: "clearInterim", speaker },
        { type: "appendTranscript", speaker, text: delta },
        { type: "setHasContent" }
      ]
    }

    // deltaが取れない場合（音声認識の修正のみ）: 書き込みスキップ
    // finalizedSegmentsは更新済みなので、次回のdelta計算は最新ベースで行われる
    return [{ type: "clearInterim", speaker }]
  }

  dispose(): void {
    this.blockToSegmentId.clear()
    this.finalizedSegments.clear()
  }

  // --- テスト用アクセサ ---

  /** @internal テスト用: 確定済みテキストを取得 */
  getFinalizedText(segId: string): string | undefined {
    return this.finalizedSegments.get(segId)
  }

  // --- private ---

  private computeFinalizeDelay(_interimText: string, fullText: string): number {
    if (PUNCTUATION_RE.test(fullText)) return PUNCTUATION_DELAY_MS
    return FINALIZE_DELAY_MS
  }

  private getOrCreateSegmentId(blockKey: string): string {
    const existing = this.blockToSegmentId.get(blockKey)
    if (existing) return existing
    const id = `seg-${++this.segmentCounter}`
    this.blockToSegmentId.set(blockKey, id)
    return id
  }
}
