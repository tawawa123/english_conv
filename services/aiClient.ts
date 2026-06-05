import { GoogleGenAI } from "@google/genai";
import type { ApiMessage } from "@/types";

const MODEL = "gemini-3-flash-preview";

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY が設定されていません。.env.local を確認してください。");
  }
  return new GoogleGenAI({ apiKey });
}

export type ChatResult =
  | { ok: true; reply: string }
  | { ok: false; error: string };

export async function sendChat(
  messages: ApiMessage[],
  personaPrompt?: string
): Promise<ChatResult> {
  try {
    const ai = getClient();

    // システムプロンプトの基本ルールを定義
    const BASE_RULES =
      "Always respond in English only, regardless of what language the user writes in. " +
      "Keep your response to 2-3 sentences maximum.";
    const systemInstruction = personaPrompt?.trim()
      ? `${personaPrompt.trim()}\n\n${BASE_RULES}`
      : `You are a friendly English conversation partner. ${BASE_RULES}`;

    // Gemini の history は最後のユーザーメッセージを除いた部分
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "user") {
      return { ok: false, error: "最後のメッセージがユーザーのものではありません。" };
    }

    const chat = ai.chats.create({
      model: MODEL,
      config: { systemInstruction },
      history,
    });

    const response = await chat.sendMessage({
      message: lastMessage.content,
    });

    const text = response.text;
    if (!text) {
      return { ok: false, error: "AIから空のレスポンスが返されました。" };
    }

    return { ok: true, reply: text };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "不明なエラーが発生しました。";
    console.error("[aiClient] sendChat error:", message);
    return { ok: false, error: message };
  }
}

export type SupportResult =
  | { ok: true; reply: string }
  | { ok: false; error: string };

export async function sendSupport(prompt: string): Promise<SupportResult> {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    });
    const text = response.text;
    if (!text) {
      return { ok: false, error: "AIから空のレスポンスが返されました。" };
    }
    return { ok: true, reply: text };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "不明なエラーが発生しました。";
    console.error("[aiClient] sendSupport error:", message);
    return { ok: false, error: message };
  }
}
