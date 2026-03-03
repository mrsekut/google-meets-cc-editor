# Google Meets CC Editor

A Chrome extension that automatically captures Google Meets captions and accumulates them in an editable floating panel.

## Features

- Auto-enable captions
- Real-time caption capture (MutationObserver)
- Edit, select-all, and copy finalized text
- Floating panel (drag, resize from any corner, minimize)
- Text persists after meeting ends
- Japanese and English locale support

## Getting Started

```bash
bun install
bun run dev
```

Open `chrome://extensions` and load `build/chrome-mv3-dev`.

## Production Build

```bash
bun run build
```
