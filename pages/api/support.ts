import type { NextApiRequest, NextApiResponse } from "next";
import { sendSupport } from "@/services/aiClient";

type RequestBody =
  | { action: "suggest"; lastAiMessage: string }
  | { action: "ask"; question: string }
  | { action: "evaluate"; userMessage: string };

type ResponseBody =
  | { reply: string }
  | { error: string };

const SUGGEST_PROMPT = (lastAiMessage: string) =>
  `You are an English learning assistant. The AI conversation partner just said: "${lastAiMessage}"
Provide 4 natural English response examples the learner could use.
Format each as: EN: <English> | JA: <Japanese translation>
Keep each example concise (one sentence). Do not add extra explanation.`;

const ASK_PROMPT = (question: string) =>
  `You are a Japanese English teacher. Answer the following question in Japanese, clearly and concisely.
Question: ${question}
Provide practical examples where helpful. Answer in Japanese only. Use markdown formatting.`;

const EVALUATE_PROMPT = (userMessage: string) =>
  `You are a supportive English teacher. A learner wrote this sentence in conversation:
"${userMessage}"

Evaluate their English and give constructive feedback in Japanese using markdown.
Structure your response with these sections:
- **文法**: grammar correctness
- **語彙**: vocabulary and word choice
- **自然さ**: how natural it sounds to a native speaker
- **改善例**: one improved version of the sentence

Be encouraging and specific. Keep it concise.`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseBody>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const body = req.body as RequestBody;
  let prompt: string;

  if (body.action === "suggest") {
    if (!body.lastAiMessage) {
      return res.status(400).json({ error: "lastAiMessage が必要です。" });
    }
    prompt = SUGGEST_PROMPT(body.lastAiMessage);
  } else if (body.action === "ask") {
    if (!body.question?.trim()) {
      return res.status(400).json({ error: "question が必要です。" });
    }
    prompt = ASK_PROMPT(body.question);
  } else if (body.action === "evaluate") {
    if (!body.userMessage?.trim()) {
      return res.status(400).json({ error: "userMessage が必要です。" });
    }
    prompt = EVALUATE_PROMPT(body.userMessage);
  } else {
    return res.status(400).json({ error: "action は 'suggest' / 'ask' / 'evaluate' のいずれかである必要があります。" });
  }

  const result = await sendSupport(prompt);

  if (!result.ok) {
    return res.status(500).json({ error: result.error });
  }

  return res.status(200).json({ reply: result.reply });
}
