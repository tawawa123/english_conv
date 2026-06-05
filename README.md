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