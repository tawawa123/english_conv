export type TtsOptions = {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
};

function getSynth(): SpeechSynthesis | null {
  if (typeof window === "undefined") return null;
  return window.speechSynthesis ?? null;
}

export function isTtsSupported(): boolean {
  return getSynth() !== null;
}

export function isTtsSpeaking(): boolean {
  return getSynth()?.speaking ?? false;
}

export function ttsSpeak(text: string, opts: TtsOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const synth = getSynth();
    if (!synth) {
      reject(new Error("このブラウザは音声合成に対応していません。"));
      return;
    }

    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = opts.lang ?? "en-US";
    utterance.rate = opts.rate ?? 1.0;
    utterance.pitch = opts.pitch ?? 1.0;
    utterance.volume = opts.volume ?? 1.0;

    utterance.onend = () => resolve();
    utterance.onerror = (e) => {
      if (e.error === "interrupted" || e.error === "canceled") {
        resolve();
      } else {
        reject(new Error(`音声合成エラー: ${e.error}`));
      }
    };

    synth.speak(utterance);
  });
}

export function ttsStop(): void {
  getSynth()?.cancel();
}
