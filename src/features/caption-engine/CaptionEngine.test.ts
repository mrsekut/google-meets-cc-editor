import { describe, expect, it } from "vitest"

import { CaptionEngine } from "./CaptionEngine"

describe("CaptionEngine", () => {
  describe("handleCaptionUpdate", () => {
    it("returns setInterim command with full text for new segment", () => {
      const engine = new CaptionEngine()
      const result = engine.handleCaptionUpdate(
        "block-1",
        "Alice",
        "こんにちは"
      )

      expect(result.commands).toEqual([
        { type: "setInterim", speaker: "Alice", text: "こんにちは" }
      ])
      expect(result.segmentId).toBe("seg-1")
      expect(result.finalizeDelayMs).toBe(2500)
    })

    it("returns same segmentId for same blockKey", () => {
      const engine = new CaptionEngine()
      const r1 = engine.handleCaptionUpdate("block-1", "Alice", "hello")
      const r2 = engine.handleCaptionUpdate("block-1", "Alice", "hello world")

      expect(r1.segmentId).toBe(r2.segmentId)
    })

    it("returns different segmentIds for different blockKeys", () => {
      const engine = new CaptionEngine()
      const r1 = engine.handleCaptionUpdate("block-1", "Alice", "hello")
      const r2 = engine.handleCaptionUpdate("block-2", "Bob", "hi")

      expect(r1.segmentId).not.toBe(r2.segmentId)
    })

    it("shows delta as interim after segment is finalized", () => {
      const engine = new CaptionEngine()

      // First update + finalize
      const r1 = engine.handleCaptionUpdate("block-1", "Alice", "こんにちは")
      engine.finalizeSegment(r1.segmentId, "Alice", "こんにちは")

      // Second update extends the finalized text
      const r2 = engine.handleCaptionUpdate(
        "block-1",
        "Alice",
        "こんにちは、今日は"
      )

      expect(r2.commands).toEqual([
        { type: "setInterim", speaker: "Alice", text: "、今日は" }
      ])
    })
  })

  describe("finalizeDelayMs", () => {
    it("returns 2500ms for normal text", () => {
      const engine = new CaptionEngine()
      const result = engine.handleCaptionUpdate(
        "block-1",
        "Alice",
        "こんにちは"
      )
      expect(result.finalizeDelayMs).toBe(2500)
    })

    it("returns 500ms when text ends with 。", () => {
      const engine = new CaptionEngine()
      const result = engine.handleCaptionUpdate(
        "block-1",
        "Alice",
        "今日は天気がいいですね。"
      )
      expect(result.finalizeDelayMs).toBe(500)
    })

    it("returns 500ms when text ends with .", () => {
      const engine = new CaptionEngine()
      const result = engine.handleCaptionUpdate(
        "block-1",
        "Alice",
        "That sounds good."
      )
      expect(result.finalizeDelayMs).toBe(500)
    })

    it("returns 500ms when text ends with ！", () => {
      const engine = new CaptionEngine()
      const result = engine.handleCaptionUpdate("block-1", "Alice", "すごい！")
      expect(result.finalizeDelayMs).toBe(500)
    })

    it("returns 500ms when text ends with ？", () => {
      const engine = new CaptionEngine()
      const result = engine.handleCaptionUpdate(
        "block-1",
        "Alice",
        "本当ですか？"
      )
      expect(result.finalizeDelayMs).toBe(500)
    })

    it("returns 0ms when unfinalzied text exceeds 100 chars", () => {
      const engine = new CaptionEngine()
      const longText = "あ".repeat(100)
      const result = engine.handleCaptionUpdate("block-1", "Alice", longText)
      expect(result.finalizeDelayMs).toBe(0)
    })

    it("max length check uses delta, not full text", () => {
      const engine = new CaptionEngine()

      // Finalize 80 chars
      const prefix = "あ".repeat(80)
      const r1 = engine.handleCaptionUpdate("block-1", "Alice", prefix)
      engine.finalizeSegment(r1.segmentId, "Alice", prefix)

      // Add 30 more chars (total 110, but delta is only 30)
      const r2 = engine.handleCaptionUpdate(
        "block-1",
        "Alice",
        prefix + "い".repeat(30)
      )
      expect(r2.finalizeDelayMs).toBe(2500) // delta=30 < 100, normal delay
    })

    it("max length takes priority over punctuation", () => {
      const engine = new CaptionEngine()
      const longText = "あ".repeat(99) + "。"
      const result = engine.handleCaptionUpdate("block-1", "Alice", longText)
      expect(result.finalizeDelayMs).toBe(0) // 100 chars, immediate
    })
  })

  describe("finalizeSegment", () => {
    it("returns appendTranscript + setHasContent for new text", () => {
      const engine = new CaptionEngine()
      const result = engine.handleCaptionUpdate("block-1", "Alice", "hello")

      const commands = engine.finalizeSegment(
        result.segmentId,
        "Alice",
        "hello"
      )

      expect(commands).toEqual([
        { type: "clearInterim", speaker: "Alice" },
        { type: "appendTranscript", speaker: "Alice", text: "hello" },
        { type: "setHasContent" }
      ])
    })

    it("skips appendTranscript when text is unchanged", () => {
      const engine = new CaptionEngine()
      const result = engine.handleCaptionUpdate("block-1", "Alice", "hello")

      // Finalize once
      engine.finalizeSegment(result.segmentId, "Alice", "hello")

      // Finalize again with same text
      const commands = engine.finalizeSegment(
        result.segmentId,
        "Alice",
        "hello"
      )

      expect(commands).toEqual([{ type: "clearInterim", speaker: "Alice" }])
    })

    it("appends only delta when text extends previous", () => {
      const engine = new CaptionEngine()
      const result = engine.handleCaptionUpdate("block-1", "Alice", "hello")

      // Finalize first part
      engine.finalizeSegment(result.segmentId, "Alice", "hello")

      // Finalize extended text
      const commands = engine.finalizeSegment(
        result.segmentId,
        "Alice",
        "hello world"
      )

      expect(commands).toEqual([
        { type: "clearInterim", speaker: "Alice" },
        { type: "appendTranscript", speaker: "Alice", text: "world" },
        { type: "setHasContent" }
      ])
    })

    it("appends full text when new text does not extend previous", () => {
      const engine = new CaptionEngine()
      const result = engine.handleCaptionUpdate("block-1", "Alice", "hello")

      // Finalize first
      engine.finalizeSegment(result.segmentId, "Alice", "hello")

      // Completely different text
      const commands = engine.finalizeSegment(
        result.segmentId,
        "Alice",
        "goodbye"
      )

      expect(commands).toEqual([
        { type: "clearInterim", speaker: "Alice" },
        { type: "appendTranscript", speaker: "Alice", text: "goodbye" },
        { type: "setHasContent" }
      ])
    })

    it("records finalized text for future delta computation", () => {
      const engine = new CaptionEngine()
      const result = engine.handleCaptionUpdate("block-1", "Alice", "hello")
      engine.finalizeSegment(result.segmentId, "Alice", "hello")

      expect(engine.getFinalizedText(result.segmentId)).toBe("hello")
    })
  })

  describe("multi-speaker scenario", () => {
    it("tracks segments independently per speaker/block", () => {
      const engine = new CaptionEngine()

      const alice = engine.handleCaptionUpdate("block-1", "Alice", "hello")
      const bob = engine.handleCaptionUpdate("block-2", "Bob", "hi")

      // Finalize both
      const aliceCommands = engine.finalizeSegment(
        alice.segmentId,
        "Alice",
        "hello"
      )
      const bobCommands = engine.finalizeSegment(bob.segmentId, "Bob", "hi")

      expect(aliceCommands).toContainEqual({
        type: "appendTranscript",
        speaker: "Alice",
        text: "hello"
      })
      expect(bobCommands).toContainEqual({
        type: "appendTranscript",
        speaker: "Bob",
        text: "hi"
      })
    })
  })

  describe("dispose", () => {
    it("clears all internal state", () => {
      const engine = new CaptionEngine()
      const r = engine.handleCaptionUpdate("block-1", "Alice", "hello")
      engine.finalizeSegment(r.segmentId, "Alice", "hello")

      engine.dispose()

      // After dispose, same blockKey gets a new segmentId
      const r2 = engine.handleCaptionUpdate("block-1", "Alice", "hello")
      expect(r2.segmentId).not.toBe(r.segmentId)
      expect(engine.getFinalizedText(r.segmentId)).toBeUndefined()
    })
  })
})
