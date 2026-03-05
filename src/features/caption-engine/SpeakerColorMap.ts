// speakerごとに固定色を割り当てるマップ。
// 登場順にカラーパレットから順番に割り当てる。

const SPEAKER_COLORS = [
  "#8ab4f8", // blue
  "#81c995", // green
  "#fcad70", // orange
  "#f28b82", // red
  "#c58af9", // purple
  "#78d9ec", // cyan
  "#fdd663", // yellow
  "#ff8bcb" // pink
] as const

export class SpeakerColorMap {
  private map = new Map<string, string>()

  getColor(speaker: string): string {
    const existing = this.map.get(speaker)
    if (existing) return existing
    const color =
      SPEAKER_COLORS[this.map.size % SPEAKER_COLORS.length] ?? "#000000"
    this.map.set(speaker, color)
    return color
  }

  get size(): number {
    return this.map.size
  }

  clear(): void {
    this.map.clear()
  }
}
