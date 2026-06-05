import type { NextApiRequest, NextApiResponse } from "next";
import { sendChat } from "@/services/aiClient";
import type { ApiMessage } from "@/types";

type RequestBody = {
  messages: ApiMessage[];
  personaPrompt?: string;
};

type ResponseBody =
  | { reply: string }
  | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseBody>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { messages, personaPrompt } = req.body as RequestBody;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages は空でない配列である必要があります。" });
  }

  const result = await sendChat(messages, personaPrompt);

  if (!result.ok) {
    return res.status(500).json({ error: result.error });
  }

  return res.status(200).json({ reply: result.reply });
}
