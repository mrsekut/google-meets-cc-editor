// Plasmo CSUI entry point: mounts the CaptionPanel on Google Meets pages.

import type { PlasmoCSConfig, PlasmoGetOverlayAnchor } from "plasmo"

import { CaptionPanel } from "~features/CaptionPanel"

export const config: PlasmoCSConfig = {
  matches: ["https://meet.google.com/*"],
  run_at: "document_idle"
}

export const getOverlayAnchor: PlasmoGetOverlayAnchor = async () =>
  document.body

export default CaptionPanel
