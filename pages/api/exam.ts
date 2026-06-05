import type { NextApiRequest, NextApiResponse } from "next";
import { sendSupport } from "@/services/aiClient";
import type { ApiMessage } from "@/types";

type ScoreRequestBody = {
  action: "score";
  messages: ApiMessage[];
  topic: string;
};

type ResponseBody =
  | { score: number; feedback: string }
  | { error: string };

const SCORE_PROMPT = (topic: string, messages: ApiMessage[]) => {
  const transcript = messages
    .map((m) => `${m.role === "user" ? "Learner" : "AI"}: ${m.content}`)
    .join("\n");

  return `You are an English speaking test evaluator. Evaluate the learner's performance in the following conversation.

Topic: "${topic}"
Transcript:
${transcript}

Score the learner out of 100 based on:
- Fluency and naturalness
- Vocabulary usage
- Grammar accuracy
- Topic relevance and coherence

Respond ONLY in this JSON format (no markdown, no extra text):
{"score": <number 0-100>, "feedback": "<2-3 sentences in Japanese summarizing strengths and areas for improvement>"}`;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseBody>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const body = req.body as ScoreRequestBody;

  if (body.action !== "score") {
    return res.status(400).json({ error: "action は 'score' である必要があります。" });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return res.status(400).json({ error: "messages が必要です。" });
  }

  if (!body.topic) {
    return res.status(400).json({ error: "topic が必要です。" });
  }

  const result = await sendSupport(SCORE_PROMPT(body.topic, body.messages));

  if (!result.ok) {
    return res.status(500).json({ error: result.error });
  }

  try {
    const parsed = JSON.parse(result.reply.trim()) as { score: number; feedback: string };
    if (typeof parsed.score !== "number" || typeof parsed.feedback !== "string") {
      throw new Error("不正なレスポンス形式");
    }
    const score = Math.max(0, Math.min(100, Math.round(parsed.score)));
    return res.status(200).json({ score, feedback: parsed.feedback });
  } catch {
    console.error("[api/exam] JSON parse error:", result.reply);
    return res.status(500).json({ error: "採点結果のパースに失敗しました。" });
  }
}
