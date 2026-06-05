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

// ボイスリストのロードを待つ（Chrome はロード遅延がある）
function waitForVoices(synth: SpeechSynthesis): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const voices = synth.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }
    const onChanged = () => {
      synth.removeEventListener("voiceschanged", onChanged);
      resolve(synth.getVoices());
    };
    synth.addEventListener("voiceschanged", onChanged);
    // タイムアウト: voiceschanged が発火しないブラウザへの保険
    setTimeout(() => {
      synth.removeEventListener("voiceschanged", onChanged);
      resolve(synth.getVoices());
    }, 1000);
  });
}

function pickVoice(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | null {
  // 完全一致 → 言語コード前方一致 → null
  return (
    voices.find((v) => v.lang === lang) ??
    voices.find((v) => v.lang.startsWith(lang.split("-")[0])) ??
    null
  );
}

export async function ttsSpeak(text: string, opts: TtsOptions = {}): Promise<void> {
  const synth = getSynth();
  if (!synth) {
    throw new Error("このブラウザは音声合成に対応していません。");
  }

  const lang = opts.lang ?? "en-US";
  const voices = await waitForVoices(synth);
  const voice = pickVoice(voices, lang);

  synth.cancel();

  // STT 終了直後に呼ぶと Chrome の音声入出力切替が間に合わないため待機
  await new Promise((r) => setTimeout(r, 150));

  synth.resume();

  return new Promise((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = opts.rate ?? 1.0;
    utterance.pitch = opts.pitch ?? 1.0;
    utterance.volume = opts.volume ?? 1.0;
    if (voice) utterance.voice = voice;

    utterance.onend = () => resolve();
    utterance.onerror = (e) => {
      console.error("[tts] error:", e.error);
      if (e.error === "interrupted" || e.error === "canceled") {
        resolve();
      } else {
        reject(new Error(`音声合成エラー: ${e.error}`));
      }
    };

    synth.speak(utterance);

    // speak() 後も paused 状態の場合はさらに resume
    if (synth.paused) synth.resume();
  });
}

export function ttsStop(): void {
  getSynth()?.cancel();
}
