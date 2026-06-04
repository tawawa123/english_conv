export type AppMode = "normal" | "exam";

export type MessageRole = "user" | "assistant";

export type Message = {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
};

export type ExamResult = {
  score: number;
  feedback: string;
};

export type PersonaSettings = {
  prompt: string;
};

export type ApiMessage = {
  role: MessageRole;
  content: string;
};

export type Session = {
  id: string;
  name?: string;
  mode: AppMode;
  messages: Message[];
  examMessages: Message[];
  examRallyCount: number;
  examResult?: ExamResult | null;
  examTopic?: string;
  createdAt: string;
  updatedAt?: string;
};
