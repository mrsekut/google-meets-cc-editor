# Implementation Plan 1: transcript-view コンポーネント群

## Overview

字幕ロジックに依存しない、汎用的な編集可能リストUIを新規作成する。
この時点ではCaptionPanelとの接続は行わず、コンポーネント単体で完成させる。

## Dependencies

- Requires: なし
- Blocks: 5-implementation-plan-2
- Parallel: なし

## Tasks

### Segment型定義

- [ ] `src/features/transcript-view/types.ts` — Segment型をexport

### TranscriptArea

- [ ] `src/features/transcript-view/TranscriptArea.tsx` — セグメントリスト描画
  - props: `segments`, `onUpdateSegment`, `editingId`, `onEditStart`
  - 空の場合「字幕を待機中...」表示
  - 自動スクロール（末尾追従 + ユーザースクロールで停止）

### SegmentRow

- [ ] `src/features/transcript-view/SegmentRow.tsx` — 1セグメントの表示/編集
  - 通常モード: speaker + time ヘッダー + テキスト表示、クリックで編集モードへ
  - 編集モード: textarea表示、Enter確定 / Esc取り消し / blur確定
  - 上下矢印キーで隣のセグメントへ移動（onNavigate コールバック）

### useSegmentNavigation

- [ ] `src/features/transcript-view/useSegmentNavigation.ts` — フォーカス管理hook
  - editingId state管理
  - onNavigate(direction: "up" | "down") → 隣のセグメントIDを計算してeditingIdを更新
  - onEditStart(id) / onEditEnd()

### CopyButton

- [ ] `src/features/transcript-view/CopyButton.tsx` — 全文コピーボタン
  - クリックでsegmentsをフォーマットしてclipboardへ
  - 「Copied!」に一時変化（1.5秒）

### Reviewability

- [ ] tsc passes
- [ ] bun run build passes
- [ ] simulatorまたはストーリー的な手動確認で動作検証可能

## Suggested Commits

1. `feat: add Segment type and transcript-view components`
2. `feat: add useSegmentNavigation hook`
3. `feat: add CopyButton with visual feedback`
