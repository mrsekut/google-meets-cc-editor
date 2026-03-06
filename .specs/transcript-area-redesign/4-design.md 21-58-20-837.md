# Design: TranscriptArea Redesign

## Domain Models

```typescript
/** 確定済み字幕の1単位 */
type Segment = {
  id: number // 一意識別子（Date.now()ベース）
  speaker: string
  text: string
  time: string // "12:00:00" 形式
  color: string // speaker色
}
```

## Feature Boundaries

| Feature         | Responsibility                        | Depends On                      |
| --------------- | ------------------------------------- | ------------------------------- |
| caption-engine  | 字幕DOM監視 → セグメント確定ロジック  | -                               |
| transcript-view | セグメントリストの表示・編集・コピー  | -                               |
| CaptionPanel    | caption-engineとtranscript-viewの接続 | caption-engine, transcript-view |

ポイント: **transcript-viewはcaption-engineを知らない**。Segment[]を受け取って表示・編集するだけ。

## Directory Structure

```
src/features/
├── caption-engine/        # 既存: CaptionEngine, SpeakerColorMap, DebugLogger
├── transcript-view/       # 新規: 編集可能リストUI
│   ├── TranscriptArea.tsx
│   ├── SegmentRow.tsx
│   ├── CopyButton.tsx
│   └── useSegmentNavigation.ts
├── CaptionPanel.tsx       # 変更: 接続層
├── useCaptionObserver.ts  # 変更: シグネチャ変更
└── InterimDisplay.tsx     # 既存: 変更なし
```

## Main Flow

### 字幕追加フロー

1. `observeCaptionRegion`: DOM MutationRecord → CaptionData
2. `CaptionEngine.handleCaptionUpdate / finalizeSegment`: CaptionData → Command[]
3. `useCaptionObserver`: Command("appendTranscript") → `onAppendSegment(speaker, text)` コールバック呼び出し
4. `CaptionPanel`: onAppendSegment → `setSegments(prev => [...prev, newSegment])` で state 更新
5. `TranscriptArea`: Segment[] → ReactElement（リスト描画）

### 編集フロー

1. ユーザーがセグメントをクリック → `SegmentRow` が editing state に遷移
2. テキスト編集 → Enter で確定 → `onUpdateSegment(id, newText)` コールバック
3. 上下矢印キー → `useSegmentNavigation` がフォーカス移動を管理

### コピーフロー

1. `CopyButton` クリック → `segments.map(format).join("\n\n")` → clipboard
2. ボタンが「Copied!」に一時変化（1.5秒後に戻る）

## Layer Structure

```
Core (pure) → Hooks → Components
```

| Logic                          | Layer                       | Reason                              |
| ------------------------------ | --------------------------- | ----------------------------------- |
| Segment型定義                  | Core                        | 純粋な型                            |
| セグメント間ナビゲーション判定 | Core (useSegmentNavigation) | キーイベント → 次のフォーカスID計算 |
| segments state管理             | Hooks (CaptionPanel)        | React state                         |
| onAppendSegment → state更新    | Hooks (CaptionPanel)        | useCallback                         |
| TranscriptArea, SegmentRow     | Components                  | React描画                           |
| CopyButton                     | Components                  | clipboard API + UI feedback         |
