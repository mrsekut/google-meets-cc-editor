// Pure functions for formatting transcript lines and computing text deltas.

export function formatTranscriptLine(
  speaker: string,
  text: string,
  timestamp: Date
): string {
  return `${speaker} ${timestamp.toLocaleTimeString()} ${text}`
}

export function computeTextDelta(
  lastText: string,
  newText: string
): string | null {
  if (newText.startsWith(lastText)) {
    const delta = newText.slice(lastText.length).trim()
    return delta || null
  }
  return null
}
