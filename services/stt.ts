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

function getRecognitionClass(): (new () => SpeechRecognition) | null {
  if (typeof window === "undefined") return null;
  return (
    (window as unknown as { SpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition ??
    (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition ??
    null
  );
}

export function isSttSupported(): boolean {
  return getRecognitionClass() !== null;
}

let current: SpeechRecognition | null = null;

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
