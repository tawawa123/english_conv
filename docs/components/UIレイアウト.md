# components/

このフォルダにはアプリの UI コンポーネントが含まれます。各コンポーネントはプレゼンテーションとユーザー操作を担当し、`context/` や `services/` を通じて状態や外部サービスと連携します。

## 目的

- 画面の見た目とユーザーインタラクションを提供する。
- 共有状態と外部 API のロジックを切り離し、UI 層を簡潔に保つ。
- 再利用しやすく、テストしやすい構造にする。

## 画面コンポーネント（トップレベル）

`pages/index.tsx` はローカルルートステートで以下の3画面を切り替える。

### `SessionScreen`
- セッション一覧の表示・検索・削除を担う。
- `NewSessionModal`：セッション名・モード（Normal / Exam）・トピックを選択して新規作成。
- セッションをクリックすると `SWITCH_SESSION` を dispatch し、対応する画面へ遷移。
- `sortedSessions()` で更新日時降順に並べて表示。

### `NormalScreen`
- Normal モードの会話画面。内部に `ConversationPane` と `SupportPane` を持つ。

#### 内部コンポーネント: `ConversationPane`
- ユーザーの英文入力、送信、AI 応答表示を担う。
- `services/stt.ts` を使った音声入力（STT）に対応。未対応ブラウザではボタンを無効化。
- AI 返答は `services/tts.ts` で音声読み上げ（TTS）する。
- 送信: Enter キー（Shift+Enter で改行）または送信ボタン。
- `/api/chat` へ `messages`（`ApiMessage[]`）と `personaPrompt` を POST し、返答を `ADD_MESSAGE` で追加。
- STT エラーはメッセージ一覧上部にインライン表示。
- AI の返答バブルをクリックすると `ttsStop()` 後に `ttsSpeak()` で再読み上げ（TTS 未対応時は無効）。

#### 内部コンポーネント: `EvalPopup`
- ユーザーのメッセージバブルをクリックすると表示されるポップアップ。
- `/api/support { action: "evaluate" }` を呼び出し、文法・語彙・自然さ・改善例を Markdown 形式で表示。

#### 内部コンポーネント: `SupportPane`
- 右側サイドパネル（デフォルト 300px、200〜500px でドラッグリサイズ可能）。3タブ構成。
- `ConversationPane` との境界に縦ディバイダーを配置。`onMouseDown` で幅を動的に変更する。
  - **例文タブ**: ボタンを押すと `/api/support { action: "suggest" }` を呼び、直前の AI 発話に対する返答例を取得。
  - **質問タブ**: 日本語で質問を入力し `/api/support { action: "ask" }` を呼ぶ。回答は Markdown レンダリング（`react-markdown`）。
  - **ペルソナタブ**: AI に渡すシステムプロンプトを編集・保存（`SET_PERSONA`）。
- `personaInput` の入力と保存を行い、`SET_PERSONA` を dispatch する。

### `ExamScreen`
- Exam モードの音声主体の会話画面。内部に `VoiceStage` / `ExamResultView` / `ExamTranscript` を持つ。

#### 内部コンポーネント: `VoiceStage`
- マイクボタンで `services/stt.ts` の STT を起動し、発話を取得。
- 取得した発話を `/api/chat` へ送信し、AI 返答を `services/tts.ts` で読み上げ（TTS）。
- `RallyRing`（SVG円グラフ）でラリー進捗（0〜10）を表示。
- 10ラリー完了後に `/api/exam { action: "score" }` を呼び採点。

#### 内部コンポーネント: `ExamResultView`
- Exam 終了後にスコアと日本語フィードバックを表示。
- `ScoreGauge`（半円グラフ）でスコアを視覚表示。
- 再挑戦ボタンで `RESET_EXAM` を dispatch。

#### 内部コンポーネント: `ExamTranscript`
- 右側パネルに Exam 中の発話ログを時系列で表示。

## 共有コンポーネント

### `Icons.tsx`
- `Icon`：SVG アイコンコンポーネント（30種以上）。
- `TypingDots`：AI 応答待ちのアニメーション。
- `Spinner`：ローディングスピナー。
- `ModeChip`：Normal / Exam モードバッジ。

## コンポーネントの設計方針

- 見た目と操作に集中し、状態管理は `context/` に委譲する。
- API 呼び出しは `fetch('/api/...')` を直接行い、ビジネスロジックは最小限に留める。
- `services/stt.ts` / `services/tts.ts` を介して音声入出力を行い、ブラウザ API 依存を隔離する。
- コンポーネント内で副作用を扱う場合は、`useEffect` などの React フックに限定する。

## UI/UX 要件

- ユーザーと AI の発話を視覚的に区別する（色分け、位置揃えなど）。
- メッセージ送信時は Enter、Shift+Enter で改行を使い分ける。
- 音声認識中は録音状態を明示し、録音停止ボタンの視認性を確保する。
- ユーザーのメッセージバブルはクリック可能で、タップすると発話評価ポップアップを表示する。
- `SupportPane` のサポート機能はボタン操作と結果表示をシンプルに保つ。
- Q&A 回答は `react-markdown` で Markdown レンダリングする。

## 拡張

- `ConversationPane` に対してメッセージ編集、削除、翻訳機能、ストリーミング表示などを追加可能。
- `SupportPane` に学習履歴、例文カテゴリ、単語帳機能を追加して学習支援を拡張。
- `ExamResultView` に詳細評価基準や改善ポイントの表示を追加する。

以上が `components/` フォルダの設計と要件です。
