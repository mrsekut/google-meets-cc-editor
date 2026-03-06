# Prototyping Learnings: TranscriptArea contentEditable脱却

## What Worked Well

- セグメント単位のReact state管理(`segments: Segment[]`)は自然。DOM直接操作よりはるかにシンプル
- `useCaptionObserver`のシグネチャを`transcriptRef` → `onAppendSegment`コールバックに変えるだけで、字幕ロジックとView層が綺麗に分離できた
- クリックでtextarea表示 → Enter確定 / Esc取り消しの編集フローは直感的
- 自動スクロール（末尾追従 + ユーザースクロールで停止）は良い体験

## What Felt Awkward

- **Copyボタンのフィードバックがない**: クリックしても何の反応もなく、押せたか分からない。視覚的フィードバック（「Copied!」表示 or ボタン色変化）が必要
- **編集中のキーボードナビゲーションがない**: 1つのセグメントを編集中に、上下矢印キーで隣のセグメントに移動できない。マウスでいちいちクリックしないといけない
- **`setHasContent`が宙に浮いた**: segments.length > 0で判定できるのにCommandとして残っていた。View側の都合をエンジンが知っている状態

## Discovered Requirements

- コピーボタンは視覚フィードバック付きで必須
- 編集モードでの上下キーナビゲーション（セグメント間移動）が欲しい
- TranscriptArea（View層）は字幕ロジック（CaptionEngine, useCaptionObserver）と完全に独立させる
  - TranscriptAreaは「セグメントのリストを受け取って表示・編集するコンポーネント」であるべき
  - 字幕のことを知らない、汎用的な設計にする
- `SpeakerColorMap`はView層の責務（表示色の決定）なのでView側で管理すべき

## UX Insights

- 編集可能リストとしてのUXを意識すべき。「字幕ビューア」ではなく「編集可能なログリスト」
- 矢印キーナビゲーションがあるとキーボードだけで操作完結する。ミーティング中の素早い誤字修正に重要
- セグメントのヘッダー（speaker + time）とテキストの視覚的分離は現状で十分

## Prototype Code Snippets

### useCaptionObserverのシグネチャ変更

```typescript
// Before
export function useCaptionObserver(
  transcriptRef: RefObject<HTMLDivElement>,
  setHasContent: Dispatch<SetStateAction<boolean>>,
  setInterimText: Dispatch<SetStateAction<CaptionData | null>>
)

// After
export function useCaptionObserver(
  onAppendSegment: (speaker: string, text: string) => void,
  setInterimText: Dispatch<SetStateAction<CaptionData | null>>
)
```

### CaptionPanelでのsegments管理

```typescript
const [segments, setSegments] = useState<Segment[]>([])
const speakerColors = useRef(new SpeakerColorMap())

const onAppendSegment = useCallback((speaker: string, text: string) => {
  const color = speakerColors.current.getColor(speaker)
  const time = new Date().toLocaleTimeString()
  setSegments((prev) => [
    ...prev,
    { id: Date.now(), speaker, text, time, color }
  ])
}, [])
```

### SegmentRowの編集UI

```typescript
function SegmentRow({ segment, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(segment.text)

  // Enter確定, Esc取り消し, blur確定
  // textareaで表示
}
```
