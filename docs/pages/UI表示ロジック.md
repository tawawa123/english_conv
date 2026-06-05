# pages/

このフォルダにはアプリのページコンポーネントと API ルートが含まれる。Next.js のファイルベースルーティングに従った、UI 表示とサーバーサイド（API）ロジックが含まれる。

## 目的

- 画面構成（レイアウト、ページ）を定義する
- クライアント側 UI とサーバーサイド API のエンドポイントをまとめる
- `AppProvider` によるグローバル状態のラップと初期化を行う

## 主要ファイル

- `index.tsx` — メイン画面のエントリ。ローカルの `route` ステートで `SessionScreen` / `NormalScreen` / `ExamScreen` を切り替える。`TopBar`（ブランドロゴ・パンくず・ダークモード切替）を常時表示。
- `_app.tsx` — Next.js のアプリラッパー。`AppProvider` でアプリ全体をラップし、グローバル CSS を適用。
- `_document.tsx` — HTML ドキュメントのカスタマイズ（Google Fonts: Schibsted Grotesk / Zen Kaku Gothic New / Newsreader）。

## ルーティング

`index.tsx` はファイルベースルーティングを使わず、ローカルステートで画面を切り替える。

```typescript
const [route, setRoute] = useState<'sessions' | 'normal' | 'exam'>('sessions');
```

- `sessions` → `SessionScreen`（デフォルト）
- `normal` → `NormalScreen`
- `exam` → `ExamScreen`

セッション画面に戻る際は `dispatch({ type: 'SAVE_SESSION' })` を呼んでから遷移する。

## API ルート（`pages/api/`）

サーバーサイドで AI（Gemini）と連携するエンドポイントを実装する。

- `api/chat.ts` — 会話のやり取りを処理し、Gemini API と通信して返信を返す。`POST` で `messages: ApiMessage[]` と `personaPrompt?: string` を受け取り、`{ reply: string }` を返す。
- `api/support.ts` — サポート系リクエストを処理する。`action` フィールドで処理を切り替える：
  - `suggest`：直前の AI 発話に対する返答例を4件生成。
  - `ask`：日本語での質問に日本語で回答（Markdown 形式）。
  - `evaluate`：ユーザーの発話を文法・語彙・自然さ・改善例の観点で評価（Markdown 形式）。
- `api/exam.ts` — Exam モード用の採点を行う。`POST` で `{ action: "score", messages: ApiMessage[], topic: string }` を受け取り、`{ score: number, feedback: string }` を返す。

実装上の注意:

- API ハンドラは Gemini API キーを環境変数 `GEMINI_API_KEY`（`.env.local`）で参照する。キーはリポジトリに含めない。
- エラー時は適切な HTTP ステータスと `{ error: string }` 形式の JSON を返す。

## UI とページの役割

- `index.tsx` の `TopBar` はブランドロゴ・現在のセッション名（パンくず）・ダークモードトグルを表示する。
- 画面遷移の起点は `SessionScreen`。セッション選択または新規作成で `NormalScreen` か `ExamScreen` へ移動する。
- Exam 終了後の結果は `ExamScreen` 内の `ExamResultView` で表示する（`state.examResult` が非 null のとき）。
- 各ページ・コンポーネントはプレゼンテーションとロジックを分離し、API 呼び出しや副作用はフックや `pages/api` を通じて行う。

## テスト

- `pages/api` のユニットテストは HTTP リクエストの入力と期待される JSON 出力を検証する。
- `index.tsx` のルート切替ロジックと `TopBar` の表示条件は簡単なレンダリングテストで確認する。

## デプロイ上の注意

- Vercel を使う場合、`pages/api` はそのままサーバーレス関数としてデプロイされる。
- `GEMINI_API_KEY` は Vercel の環境変数ダッシュボードに設定する。

## 使い方（開発時）

```bash
npm run dev
# ブラウザで http://localhost:3000 を開く
```
