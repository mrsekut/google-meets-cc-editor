import { describe, expect, it } from "vitest"

import { computeTextDelta, formatTranscriptLine } from "./format"

describe("computeTextDelta", () => {
  it("returns delta when newText extends lastText", () => {
    expect(computeTextDelta("こんにちは", "こんにちは、今日は")).toBe(
      "、今日は"
    )
  })

  it("returns null when texts are identical", () => {
    expect(computeTextDelta("hello", "hello")).toBeNull()
  })

  it("returns null when newText does not start with lastText", () => {
    expect(computeTextDelta("hello", "goodbye")).toBeNull()
  })

  it("returns full text when delta is only whitespace", () => {
    expect(computeTextDelta("hello", "hello   ")).toBeNull()
  })

  it("trims leading whitespace from delta", () => {
    expect(computeTextDelta("hello", "hello world")).toBe("world")
  })

  describe("punctuation replacement + extension", () => {
    it("finds delta when trailing punctuation was replaced and text extended", () => {
      // "すごい！" → "すごいリアルで家事しながら。"
      expect(computeTextDelta("すごい！", "すごいリアルで家事しながら。")).toBe(
        "リアルで家事しながら。"
      )
    })

    it("finds delta when trailing 。was replaced with 、and text extended", () => {
      // "動物の森と。" → "動物の森と、ブロック系で..."
      expect(
        computeTextDelta("動物の森と。", "動物の森と、ブロック系でいろいろ。")
      ).toBe("ブロック系でいろいろ。")
    })

    it("finds delta when trailing ！ was removed and text extended", () => {
      expect(computeTextDelta("そう！", "そうで、私あのアレンジ。")).toBe(
        "で、私あのアレンジ。"
      )
    })

    it("returns null when punctuation changed but no new content", () => {
      expect(computeTextDelta("はい。", "はい！")).toBeNull()
    })
  })

  describe("speech recognition revision handling", () => {
    it("finds delta when lastText exists as substring in newText (caption window expansion)", () => {
      const lastText =
        "要件のいただいてる部分と、以前もyoutubeさんだったと思うんですけど"
      const newText =
        "ありがとうございます。すいません、えっと お知らせの時間いただきましてありがとうございます。要件のいただいてる部分と、以前もyoutubeさんだったと思うんですけど、ご紹介っていうところも知って"
      const delta = computeTextDelta(lastText, newText)
      expect(delta).toBe("ご紹介っていうところも知って")
    })

    it("finds delta when lastText (with trailing punctuation) is found in newText", () => {
      const lastText = "思うんですけど。"
      const newText = "思うんですけど、ご紹介っていうところも知って。"
      const delta = computeTextDelta(lastText, newText)
      expect(delta).toBe("ご紹介っていうところも知って。")
    })

    it("handles space-normalized matching", () => {
      const lastText = "ところも 知って"
      const newText = "ところも知っていたので"
      const delta = computeTextDelta(lastText, newText)
      expect(delta).toBe("いたので")
    })

    it("returns null when revision only (no new content)", () => {
      const lastText = "ところも 知って。"
      const newText = "ところも知って。"
      const delta = computeTextDelta(lastText, newText)
      expect(delta).toBeNull()
    })

    it("returns null for short texts that cannot be reliably matched", () => {
      const lastText = "はい"
      const newText = "いいえ"
      expect(computeTextDelta(lastText, newText)).toBeNull()
    })
  })
})

describe("formatTranscriptLine", () => {
  it("formats speaker, time, and text", () => {
    const timestamp = new Date("2024-01-01T12:34:56")
    const result = formatTranscriptLine("Alice", "hello", timestamp)
    expect(result).toContain("Alice")
    expect(result).toContain("hello")
    expect(result).toContain("\n")
  })
})
