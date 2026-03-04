// DOM selectors and query helpers for Google Meets caption elements.

export const SELECTORS = {
  captionRegion: 'div[role="region"][aria-label="字幕"]',
  captionRegionEn: 'div[role="region"][aria-label="Captions"]',
  captionRegionFallback: 'div[role="region"][tabindex="0"]',
  captionBlock: ".nMcdL",
  speakerName: ".NWpY1d",
  captionText: ".ygicle"
} as const

export type CaptionData = {
  speaker: string
  text: string
}

export function findCaptionRegion(): Element | null {
  return (
    document.querySelector(SELECTORS.captionRegion) ||
    document.querySelector(SELECTORS.captionRegionEn) ||
    document.querySelector(SELECTORS.captionRegionFallback)
  )
}

export function extractCaptionData(block: Element): CaptionData | null {
  const speakerEl = block.querySelector(SELECTORS.speakerName)
  const textEl = block.querySelector(SELECTORS.captionText)
  const speaker = speakerEl?.textContent?.trim() || "Unknown"
  const text = textEl?.textContent?.trim() || ""
  if (!text) return null
  return { speaker, text }
}
