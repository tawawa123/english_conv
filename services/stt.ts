// Web Speech API の型宣言（lib.dom に未収録のため手動定義）
interface SpeechRecognitionResult {
  readonly 0: SpeechRecognitionAlternative;
  readonly length: number;
}
interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

// ────────────────────────────────────────────────────────────────

type SttCallbacks = {
  onResult: (transcript: string) => void;
  onEnd?: () => void;
  onError?: (message: string) => void;
};

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "マイクの使用が許可されていません。ブラウザの設定を確認してください。",
  "no-speech": "音声が検出されませんでした。もう一度試してください。",
  "network": "音声認識にネットワークエラーが発生しました。",
  "aborted": "音声認識がキャンセルされました。",
  "audio-capture": "マイクが見つかりません。デバイスを確認してください。",
  "service-not-allowed": "音声認識サービスが許可されていません。",
};

function getRecognitionClass(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w["SpeechRecognition"] ?? w["webkitSpeechRecognition"] ?? null) as SpeechRecognitionConstructor | null;
}

export function isSttSupported(): boolean {
  return getRecognitionClass() !== null;
}

let current: SpeechRecognitionInstance | null = null;

export function sttStart(callbacks: SttCallbacks): void {
  const RecognitionClass = getRecognitionClass();
  if (!RecognitionClass) {
    callbacks.onError?.("このブラウザは音声認識に対応していません。Chrome をお試しください。");
    return;
  }

  sttStop();

  const rec = new RecognitionClass();
  rec.lang = "en-US";
  rec.continuous = false;
  rec.interimResults = false;
  rec.maxAlternatives = 1;

  rec.onresult = (e: SpeechRecognitionEvent) => {
    const transcript = e.results[0]?.[0]?.transcript ?? "";
    callbacks.onResult(transcript);
  };

  rec.onend = () => {
    current = null;
    callbacks.onEnd?.();
  };

  rec.onerror = (e: SpeechRecognitionErrorEvent) => {
    current = null;
    const msg = ERROR_MESSAGES[e.error] ?? `音声認識エラー: ${e.error}`;
    callbacks.onError?.(msg);
  };

  current = rec;
  rec.start();
}

export function sttStop(): void {
  current?.stop();
  current = null;
}
