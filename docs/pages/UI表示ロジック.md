# pages/

このフォルダにはアプリのページコンポーネントと API ルートが含まれる。Next.js のファイルベースルーティングに従った、UI 表示とサーバーサイド（API）ロジックが含まれる。

## 目的

- 画面構成（レイアウト、ページ）を定義する
- クライアント側 UI とサーバーサイド API のエンドポイントをまとめる
- `AppProvider` によるグローバル状態のラップと初期化を行う

## 主要ファイル

- `index.tsx` — メイン画面のエントリ。`AppProvider` を使ってアプリをラップし、`ExamBanner` と 2 カラムレイアウト（`ConversationPane` / `SupportPane`）を配置する。
- `_app.tsx` — Next.js のアプリラッパー（必要に応じてグローバル CSS やプロバイダを設定）。
- `_document.tsx` — HTML ドキュメントのカスタマイズ（フォントや meta 等）。

## API ルート（`pages/api/`）

サーバーサイドで AI と連携するエンドポイントやサポート機能を実装する場所です。現在の構成では以下が想定されています：

- `api/chat.ts` — 会話のやり取りを処理し、外部 AI サービス（Claude / OpenAI 等）と通信して返信を返す。`POST` で `messages` と `personaPrompt` を受け取り、生成された `reply` を返す。
- `api/support.ts` — 例文提案（`suggest`）や日本語質問（`ask`）など、サポート系のリクエストを処理する。
- `api/exam.ts` — Exam モード用のトピック生成、採点ロジック、フィードバック生成などを扱う。

セッション API（推奨）:

- `api/sessions.ts` — セッションの一覧取得・保存・削除・インポート／エクスポートを扱うエンドポイントを設けると、クライアントとサーバーでセッション永続化を安定して扱える。

実装上の注意:

- API ハンドラは外部 AI クライアントのキーや設定を環境変数（`.env`）で参照すること。キーはリポジトリに含めない。
- 長時間の処理や非同期ジョブはキューやワーカーで切り分けることを検討する。
- エラー時は適切な HTTP ステータスと JSON エラーメッセージを返す。

## UI とページの役割

- `index.tsx` の `Layout` は以下を提供する：
  - `ExamBanner`（`state.mode === 'exam'` のとき表示）
  - メイン領域で `ConversationPane`（左）と `SupportPane`（右）と `SessionPane`（任意位置）を並列表示
  - `state.examResult` が存在する場合は `ConversationPane` の代わりに `ExamResult` を表示するか、モーダルで重ね表示する設計を推奨する。
- 各ページ・コンポーネントはプレゼンテーションとロジックを分離し、API 呼び出しや副作用はフックや `pages/api` を通じて行う。

## テスト

- `pages/api` のユニットテストは HTTP リクエストの入力と期待される JSON 出力を検証する。
- `index.tsx` のレンダリングや `ExamBanner` の表示条件は簡単なレンダリングテストで確認する。

## デプロイ上の注意

- Vercel を使う場合、`pages/api` はそのままサーバーレス関数としてデプロイされる。
- 外部 AI API キーは Vercel の環境変数に設定する。

## 使い方（開発時）

```bash
npm run dev
# ブラウザで http://localhost:3000 を開く
```