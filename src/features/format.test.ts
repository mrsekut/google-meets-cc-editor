import { describe, expect, it } from "vitest"

import { computeTextDelta, formatTranscriptLine } from "./format"

describe("computeTextDelta", () => {
  it("returns delta when newText extends lastText", () => {
    expect(computeTextDelta("こんにちは", "こんにちは、今日は")).toBe("、今日は")
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
