# Implementation Plan 2: CaptionPanel接続 + useCaptionObserver変更

## Overview

transcript-viewコンポーネント群をCaptionPanelに接続し、既存のcontentEditable実装を置き換える。

## Dependencies

- Requires: 5-implementation-plan-1
- Blocks: なし
- Parallel: なし

## Tasks

### useCaptionObserver変更

- [ ] シグネチャ変更: `transcriptRef, setHasContent` → `onAppendSegment`コールバック
- [ ] `appendTranscript`コマンド: DOM操作 → `onAppendSegment(speaker, text)` 呼び出しに変更
- [ ] `setHasContent`コマンド: 削除（segments.length > 0 で判定）
- [ ] `appendToTranscript`関数・`SpeakerColorMap` importを削除

### CaptionPanel変更

- [ ] `segments` state + `onAppendSegment` / `onUpdateSegment` コールバック追加
- [ ] `SpeakerColorMap` をCaptionPanel側で管理
- [ ] 旧TranscriptArea（contentEditable）→ 新TranscriptArea（transcript-view）に差し替え
- [ ] TitleBarにCopyButton追加
- [ ] `transcriptRef`, `hasContent`, `onInput` を削除

### 旧TranscriptArea削除

- [ ] `src/features/TranscriptArea.tsx`（旧ファイル）を削除

### Verification

- [ ] tsc passes
- [ ] bun run build passes
- [ ] `bun run dev` でsimulator起動 → セグメント追加・編集・コピーの動作確認

## Suggested Commits

1. `refactor: change useCaptionObserver to use onAppendSegment callback`
2. `feat: connect transcript-view to CaptionPanel`
3. `chore: remove old TranscriptArea`
