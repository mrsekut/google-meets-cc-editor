import { describe, expect, it } from "vitest"

import { SpeakerColorMap } from "./SpeakerColorMap"

describe("SpeakerColorMap", () => {
  it("assigns a color to a new speaker", () => {
    const map = new SpeakerColorMap()
    const color = map.getColor("Alice")
    expect(color).toBe("#8ab4f8")
  })

  it("returns the same color for the same speaker", () => {
    const map = new SpeakerColorMap()
    const first = map.getColor("Alice")
    const second = map.getColor("Alice")
    expect(first).toBe(second)
  })

  it("assigns different colors to different speakers", () => {
    const map = new SpeakerColorMap()
    const alice = map.getColor("Alice")
    const bob = map.getColor("Bob")
    expect(alice).not.toBe(bob)
  })

  it("cycles through palette when speakers exceed palette size", () => {
    const map = new SpeakerColorMap()
    const speakers = Array.from({ length: 9 }, (_, i) => `Speaker${i}`)
    const colors = speakers.map((s) => map.getColor(s))
    // 9th speaker should wrap around to the 1st color
    expect(colors[8]).toBe(colors[0])
  })

  it("tracks size correctly", () => {
    const map = new SpeakerColorMap()
    expect(map.size).toBe(0)
    map.getColor("Alice")
    expect(map.size).toBe(1)
    map.getColor("Alice") // same speaker, no new entry
    expect(map.size).toBe(1)
    map.getColor("Bob")
    expect(map.size).toBe(2)
  })

  it("clears all assignments", () => {
    const map = new SpeakerColorMap()
    map.getColor("Alice")
    map.clear()
    expect(map.size).toBe(0)
    // After clear, Alice gets the first color again
    expect(map.getColor("Alice")).toBe("#8ab4f8")
  })
})
