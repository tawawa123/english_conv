# English Conversation AI App

このプロジェクトは、英語学習者向けの対話型英会話アプリケーションです。AIエージェントと英語でチャットしながら学習でき、学習を補助するサポート機能も備えています。

## 目的

- AIエージェントを使って英語の会話練習を行う
- ユーザーが入力した英文をAIに渡し、自然な英語応答を受け取る
- 試験モード（Exam Mode）でラリー制のチャレンジ練習と自動評価を提供する
- AIの性格や応答スタイルをペルソナ設定でカスタマイズできる
- 例文提案や日本語Q&Aで学習を補助する

## 主要機能（要約）

- 会話ウィンドウ（ConversationPane）: テキスト/音声入力、会話履歴表示、API 送受信
- サポートウィンドウ（SupportPane）: モード切替、ペルソナ編集、例文提案、日本語Q&A
- Exam モード: トピック提示 → 10 ラリーの対話 → 自動採点（ExamResult）表示
 - セッション管理ウィンドウ（SessionPane）: 会話セッションの一覧・切替・保存・復元を提供し、`normal` と `exam` の状態を明確に分離する

## 実装上の整合性と重要な注意点

以下は要件と実装で齟齬が発生しやすい箇所と、その解決方針です。実装時は必ずこれらを満たしてください。

- Exam 用の会話履歴は `messages` と分離して `examMessages` に保存すること。
  - 実装: `ConversationPane` は `state.mode === 'exam'` の場合、ユーザー発話・AI 応答ともに `ADD_EXAM_MESSAGE` を dispatch する（`ADD_MESSAGE` のみを使わない）。

- セッション管理: `SessionPane` を導入してセッション毎に `messages` / `examMessages` を切り替え・保存できるようにすること。
  - 目的: 同一ユーザーが複数の会話セッション（学習セッション）を扱えるようにし、`normal` と `exam` の状態が混在しないようにする。
  - 実装例: セッション選択時に `dispatch` でコンテキストをセッションの状態に差し替える、あるいはセッションIDをコンテキストに保持して各アクションに sessionId を紐付ける。

- Exam のラリー数は `examRallyCount` で管理し、`INCREMENT_RALLY` は最大 10 を超えないよう reducer 側で上限を設けること。

- Exam 結果表示 (`ExamResult`) は UI 上で明確に表示されること。
  - 推奨: `pages/index.tsx` の `Layout` で `state.examResult` が存在する場合、左ペイン（ConversationPane）の代わりに `ExamResult` を表示するか、モーダルとして重ねて表示する。いずれの場合もユーザーが「再挑戦」できる導線（`RESET_EXAM`）を用意する。

- サービス層 (`services/`) は AI 呼び出しをラップする `aiClient`（例: `sendMessages(messages, personaPrompt)`）を持つこと。現在は `stt.ts` / `tts.ts` のみが実装想定だが、API ラッパーが不足している場合は実装を追加すること。

これらの整合性を保つことで、通常モードと Exam モードの状態が混在せず、評価フローが正しく動作します。

## アプリ要件

- セッション管理ウィンドウ
  - セッションの新規立ち上げ
  - 今まで立ち上げたセッションの一括表示
  - セッションの削除
  - セッション立ち上げ時に、normalモードかexamモードかを選択

- Normalモード
  - 会話ウィンドウ
    - ユーザーの英文入力を受け付ける
    - AIエージェントからの返答を表示する
    - 送信は Enter、Shift+Enter で改行対応
    - 音声入力（STT）による音声認識入力に対応

  - サポートウィンドウ
    - アプリモードの切り替え（normal / exam）
    - AIペルソナの編集・保存
    - 直前のAI発話に対する返答例の提案
    - 日本語での質問と回答表示

- Examモード
  - AIエージェントがランダムな話題を提示
  - 10ラリーの対話を行うチャレンジモード
  - 対話終了後にスコアとフィードバックを表示
  - 試験モードでは音声主体の会話体験を想定
  - 各Examセッション1つにつき、1つの結果が保持・表示される

### 各要件の詳細

- 会話ウィンドウ
  - ユーザーの英文入力を受け付ける（Enter: 送信、Shift+Enter: 改行）
  - AIエージェントからの返答を表示する
  - 音声入力（STT）による音声認識入力に対応
  - 実装注記: `state.mode` によって `messages` か `examMessages` に振り分ける。API 送信前にメッセージを `ApiMessage[]` に正規化する。

- セッション管理ウィンドウ（SessionPane）
  - 機能: 会話セッションの一覧表示、セッション切替、ローカル保存／復元、セッションのエクスポート/インポート（オプション）
  - 要件: セッション切替時に現在のセッションを安全に保存し、切替先セッションの `messages` / `examMessages` / `examRallyCount` / `examResult` を読み込めること
  - 表示: セッションは `normal` セッションと `exam` セッションをそれぞれ区別して表示できること

- サポートウィンドウ
  - アプリモードの切り替え（`normal` / `exam`）
  - AIペルソナの編集・保存（`SET_PERSONA`）
  - 直前のAI発話に対する返答例の提案（`/api/support`）
  - 日本語での質問と回答表示（`/api/support`）

- Examモード
  - AIエージェントがランダムな話題を提示（`/api/exam` またはサーバー側ロジック）
  - ユーザーは 10 ラリーの対話を行う（`examRallyCount` をカウント）
  - 対話終了後に採点とフィードバックを生成し、`SET_EXAM_RESULT` で保存する
  - Result 表示後は `RESET_EXAM` で状態をクリアして再挑戦できる

## 利用方法

1. 開発サーバーを起動する

```bash
npm run dev
```

2. ブラウザで `http://localhost:3000` を開く
3. 左ペインの会話ウィンドウで英語メッセージを入力し、AIと対話する
4. 右ペインのサポートウィンドウでモード切替、ペルソナ編集、例文提案、日本語Q&Aを利用する
5. `exam` モードではラリー数が表示され、10ラリー後に評価が得られる

## 技術スタック

- Next.js
- TypeScript
- React
- Tailwind CSS
- Next.js API Routes
- 音声入力 / 出力サービス（`services/stt.ts` / `services/tts.ts`）

## 主なファイル構成

- `pages/index.tsx` - メイン画面とレイアウト（`ExamBanner` とペイン表示、`ExamResult` の表示ロジックを含めることを推奨）
- `context/AppContext.tsx` - グローバル状態管理（`messages` / `examMessages` / `examRallyCount` / `examResult` など）
- `components/ConversationPane/index.tsx` - 会話チャット画面（Exam 用分岐で `ADD_EXAM_MESSAGE` を使うこと）
- `components/SupportPane/index.tsx` - 学習サポート画面（`suggest` / `ask` 呼び出し）
- `components/ExamResult/index.tsx` - Exam 結果表示コンポーネント（再挑戦ボタンで `RESET_EXAM` を呼ぶ）
- `components/SessionPane/index.tsx` - セッション管理用コンポーネント（セッション一覧・切替・保存・復元）
- `pages/api/chat.ts` - 会話API（AI 呼び出しの受け口）
- `pages/api/support.ts` - サポートAPI（例文提案 / 日本語Q&A）
- `pages/api/exam.ts` - 試験モードAPI（トピック生成 / 採点）
- `services/aiClient.ts` - 推奨: AI 呼び出しをラップするクライアント（`sendMessages`）
- `services/stt.ts`, `services/tts.ts` - 音声入出力ラッパー
- `types/index.ts` - 型定義

## 推奨修正（具体案）

1. `ConversationPane` の `sendMessage` 実装を次のように分岐させる：
   - `if (state.mode === 'exam') dispatch({ type: 'ADD_EXAM_MESSAGE', payload: msg })`
   - `else dispatch({ type: 'ADD_MESSAGE', payload: msg })`

2. `pages/index.tsx` の `Layout` で `state.examResult` を監視し、結果があるときは `ExamResult` を表示する（左ペインの置換またはモーダル）。

3. `services/` に `aiClient.ts`（または `claudeClient.ts`）を追加して、`pages/api` とクライアント両方で再利用可能な AI 呼び出しコードを配置する。

これらの更新を適用すれば、ドキュメントに定義された要件と実装の間の齟齬は解消されます。