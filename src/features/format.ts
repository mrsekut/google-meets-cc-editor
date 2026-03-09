// Pure functions for formatting transcript lines and computing text deltas.

export function formatTranscriptLine(
  speaker: string,
  text: string,
  timestamp: Date
): string {
  return `${speaker} ${timestamp.toLocaleTimeString()}\n${text}`
}

export function computeTextDelta(
  lastText: string,
  newText: string
): string | null {
  // Case 1: Pure extension (no revision)
  if (newText.startsWith(lastText)) {
    const delta = newText.slice(lastText.length).trim()
    return delta || null
  }

  // Case 1.5: Trailing punctuation was replaced/removed and text was extended
  // e.g. "すごい！" → "すごいリアルで家事しながら。"
  const lastTrimmed = lastText.replace(/[。.！？!?、,]+$/, "")
  if (lastTrimmed.length > 0 && lastTrimmed !== lastText) {
    if (newText.startsWith(lastTrimmed)) {
      const delta = newText
        .slice(lastTrimmed.length)
        .replace(/^[。.！？!?、,\s]+/, "")
        .trim()
      return delta || null
    }
  }

  // Case 2: Text was revised by speech recognition (spaces, word endings changed)
  // Try to find lastText's content within newText as a substring
  // Strip trailing punctuation since SR often changes sentence-ending punctuation
  const searchable = lastTrimmed
  if (searchable.length >= 5) {
    // Try exact substring match first
    const idx = newText.indexOf(searchable)
    if (idx >= 0) {
      const delta = newText
        .slice(idx + searchable.length)
        .replace(/^[。.！？!?、,\s]+/, "")
        .trim()
      return delta || null
    }

    // Try space-normalized substring match
    const normSearchable = searchable.replace(/\s+/g, "")
    const normNew = newText.replace(/\s+/g, "")
    const normIdx = normNew.indexOf(normSearchable)
    if (normIdx >= 0) {
      // Map normalized position back to original newText position
      const normEnd = normIdx + normSearchable.length
      let normCount = 0
      let origPos = 0
      while (origPos < newText.length && normCount < normEnd) {
        if (/\s/.test(newText[origPos])) {
          origPos++
          continue
        }
        normCount++
        origPos++
      }
      const delta = newText
        .slice(origPos)
        .replace(/^[。.！？!?、,\s]+/, "")
        .trim()
      return delta || null
    }
  }

  return null
}
