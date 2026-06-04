import type { Message, MessageRole, Session } from "@/types";

// ---------------------------------------------------------------------------
// ID / 時刻
// ---------------------------------------------------------------------------

export function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function clockTime(ts: Date): string {
  return ts.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function relTime(iso: string | undefined): string {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "たった今";
  if (m < 60) return `${m}分前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}時間前`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}日前`;
  return new Date(iso).toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
}

// ---------------------------------------------------------------------------
// メッセージ生成
// ---------------------------------------------------------------------------

export function makeMessage(role: MessageRole, content: string): Message {
  return { id: uid(), role, content, timestamp: new Date() };
}

// ---------------------------------------------------------------------------
// セッション一覧表示用
// ---------------------------------------------------------------------------

export function lastPreview(s: Session): string {
  if (s.mode === "exam") {
    return s.examTopic ? `Topic — ${s.examTopic}` : "Speaking test";
  }
  const m = s.messages[s.messages.length - 1];
  if (!m) return "会話はまだありません";
  return (m.role === "user" ? "You: " : "") + m.content;
}

export function sortedSessions(sessions: Record<string, Session>): Session[] {
  return Object.values(sessions).sort(
    (a, b) =>
      new Date(b.updatedAt ?? b.createdAt).getTime() -
      new Date(a.updatedAt ?? a.createdAt).getTime()
  );
}

// ---------------------------------------------------------------------------
// Exam トピック
// ---------------------------------------------------------------------------

export const EXAM_TOPICS: string[] = [
  "Your weekend routine",
  "Describe your hometown",
  "A memorable trip",
  "Your favorite way to relax",
  "A skill you want to learn",
  "The best meal you've had",
  "How technology changed your daily life",
  "A person you admire",
];

export function randTopic(): string {
  return EXAM_TOPICS[Math.floor(Math.random() * EXAM_TOPICS.length)];
}

// ---------------------------------------------------------------------------
// シミュレート AI（Phase 4 で実 API に差し替え）
// ---------------------------------------------------------------------------

const NORMAL_REPLIES = [
  "That makes sense. Can you tell me a bit more about why?",
  "Nice — and how did that make you feel at the time?",
  "Oh interesting! So what happened after that?",
  "Good point. What would you do differently next time?",
  "I love that. Could you describe it in a little more detail?",
  "Got it. And is that something you do often, or just occasionally?",
];

const CORRECTIONS = [
  'Quick tip: "a lot of" sounds more natural than "many" here.',
  'Small note: try "I\'ve been…" instead of "I am…" for that idea.',
  'Tiny correction: after "interested" use "in + -ing," e.g. "interested in traveling."',
  'One tweak: "years of experience" reads more smoothly.',
];

const EXAM_REPLIES = [
  "Good. Can you give me a specific example?",
  "Interesting — and why do you think that is?",
  "Thanks. How does that compare to a few years ago?",
  "I see. What's one thing you'd change about it?",
  "Nice. Could you expand on that a little?",
  "Okay! And how do you usually feel about that?",
];

export function aiReply(mode: "normal" | "exam"): string {
  if (mode === "exam") {
    return EXAM_REPLIES[Math.floor(Math.random() * EXAM_REPLIES.length)];
  }
  let r = NORMAL_REPLIES[Math.floor(Math.random() * NORMAL_REPLIES.length)];
  if (Math.random() < 0.4) {
    r = CORRECTIONS[Math.floor(Math.random() * CORRECTIONS.length)] + " " + r;
  }
  return r;
}

export const SUGGESTIONS = [
  { en: "That's a great question. Let me think for a second.", ja: "良い質問ですね。少し考えさせてください。" },
  { en: "I'd say it depends, but generally I prefer the first option.", ja: "場合によりますが、基本的には最初の選択肢が好きです。" },
  { en: "Could you say that again? I didn't quite catch it.", ja: "もう一度言ってもらえますか？うまく聞き取れませんでした。" },
  { en: "Honestly, I haven't thought about that before.", ja: "正直なところ、今まで考えたことがありませんでした。" },
];

const ASK_ANSWERS: Record<string, string> = {
  default:
    "直前のAIの発話は「もっと詳しく教えてください」という意味で、あなたに具体例や理由を促しています。一文で簡潔に答えてから、理由を一つ添えると自然です。",
  past: '過去形は完了した出来事に、現在完了形は「過去から現在につながる経験・継続」に使います。例: "I went there yesterday."（過去）/ "I have been there twice."（経験）。',
  natural:
    "より自然にするには、まず結論を述べてから理由を続ける「PREP」の流れが効果的です。Point → Reason → Example → Point の順を意識してみましょう。",
};

export function askAnswer(question: string): string {
  const t = question.toLowerCase();
  if (t.includes("過去") || t.includes("現在完了") || t.includes("時制")) return ASK_ANSWERS.past;
  if (t.includes("自然") || t.includes("natural")) return ASK_ANSWERS.natural;
  return ASK_ANSWERS.default;
}

const STT_SAMPLES = [
  "I think it really depends on the situation, but I usually choose the quiet option.",
  "Last weekend I visited my grandparents and we cooked dinner together.",
  "My hometown is small but the people there are really friendly.",
  "I'd love to learn how to play the piano someday.",
  "The most memorable trip I had was hiking in the mountains last summer.",
];

export function randStt(): string {
  return STT_SAMPLES[Math.floor(Math.random() * STT_SAMPLES.length)];
}

export function scoreExam(): { score: number; feedback: string } {
  const score = 70 + Math.floor(Math.random() * 22);
  return {
    score,
    feedback:
      "10ラリーを最後までやり切りました。話の展開が自然で、相手の質問に的確に答えられています。改善点として、冠詞（a / the）の使い分けと、過去の出来事を話す際の時制に時々ブレが見られました。次は具体例を一つ添えることを意識すると、より説得力のある受け答えになります。",
  };
}
