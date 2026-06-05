import { useState, useRef, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Icon, TypingDots, ModeChip } from "@/components/Icons";
import { makeMessage, aiReply, scoreExam, clockTime, randStt } from "@/lib/utils";
import type { Message } from "@/types";

const MAX_RALLY = 10;

// ─── RallyRing ───────────────────────────────────────────────────

function RallyRing({ count, max }: { count: number; max: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const pct = count / max;
  return (
    <div style={{ position: "relative", width: 96, height: 96 }}>
      <svg width={96} height={96} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={48} cy={48} r={r} fill="none" stroke="var(--line)" strokeWidth={7} />
        <circle
          cx={48}
          cy={48}
          r={r}
          fill="none"
          stroke="var(--warm)"
          strokeWidth={7}
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset .4s ease" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontWeight: 800, fontSize: 22, color: "var(--warm-strong)" }}>{count}</span>
        <span style={{ fontSize: 10.5, color: "var(--ink-faint)", letterSpacing: ".04em" }}>
          / {max}
        </span>
      </div>
    </div>
  );
}

// ─── ScoreGauge ──────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const r = 52;
  const circ = Math.PI * r; // half circle
  const pct = score / 100;

  const color =
    score >= 85 ? "var(--success)" : score >= 70 ? "var(--accent)" : "var(--warm)";

  return (
    <div style={{ position: "relative", width: 140, height: 76 }}>
      <svg width={140} height={76} viewBox="0 0 140 76">
        {/* Background arc */}
        <path
          d={`M 14 70 A ${r} ${r} 0 0 1 126 70`}
          fill="none"
          stroke="var(--line)"
          strokeWidth={10}
          strokeLinecap="round"
        />
        {/* Filled arc */}
        <path
          d={`M 14 70 A ${r} ${r} 0 0 1 126 70`}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          style={{ transition: "stroke-dashoffset .8s ease" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          bottom: 4,
          left: 0,
          right: 0,
          textAlign: "center",
        }}
      >
        <span style={{ fontWeight: 800, fontSize: 34, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 13, color: "var(--ink-faint)", marginLeft: 2 }}>/100</span>
      </div>
    </div>
  );
}

// ─── ExamResultView ──────────────────────────────────────────────

function ExamResultView({ onRetry }: { onRetry: () => void }) {
  const { state } = useApp();
  const result = state.examResult;
  if (!result) return null;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        gap: 24,
        animation: "popIn .3s ease",
      }}
    >
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "var(--r-xl)",
          padding: "32px 36px",
          maxWidth: 480,
          width: "100%",
          boxShadow: "var(--shadow-md)",
          border: "1px solid var(--line)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="trophy" size={22} style={{ color: "var(--warm)" }} />
          <span style={{ fontWeight: 800, fontSize: 18 }}>Exam 結果</span>
        </div>

        <ScoreGauge score={result.score} />

        <div
          style={{
            padding: "16px 18px",
            borderRadius: "var(--r-lg)",
            background: "var(--surface-2)",
            border: "1px solid var(--line)",
            fontSize: 13.5,
            lineHeight: 1.7,
            color: "var(--ink)",
            fontFamily: "var(--font-jp)",
            width: "100%",
          }}
        >
          {result.feedback}
        </div>

        <button
          onClick={onRetry}
          style={{
            padding: "10px 28px",
            borderRadius: "var(--r-md)",
            border: "none",
            background: "var(--warm)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Icon name="retry" size={16} />
          再挑戦
        </button>
      </div>
    </div>
  );
}

// ─── ExamTranscript ──────────────────────────────────────────────

function ExamTranscript({ messages }: { messages: Message[] }) {
  return (
    <div
      style={{
        width: 260,
        flexShrink: 0,
        borderLeft: "1px solid var(--line)",
        background: "var(--surface)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 14px",
          borderBottom: "1px solid var(--line)",
          fontSize: 12,
          fontWeight: 700,
          color: "var(--ink-soft)",
          letterSpacing: ".04em",
        }}
      >
        TRANSCRIPT
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
        {messages.length === 0 ? (
          <span style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 8 }}>
            まだ発話がありません
          </span>
        ) : (
          messages.map((m) => (
            <div key={m.id} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: ".06em",
                  color:
                    m.role === "user" ? "var(--accent-strong)" : "var(--warm-strong)",
                }}
              >
                {m.role === "user" ? "YOU" : "AI"} · {clockTime(m.timestamp)}
              </span>
              <span style={{ fontSize: 12.5, color: "var(--ink)", lineHeight: 1.5 }}>
                {m.content}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── VoiceStage ──────────────────────────────────────────────────

function VoiceStage({ topic }: { topic: string }) {
  const { state, dispatch } = useApp();
  const [isRecording, setIsRecording] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.examMessages]);

  const isComplete = state.examRallyCount >= MAX_RALLY;

  async function handleMicToggle() {
    if (isRecording) {
      setIsRecording(false);
      const transcript = randStt();
      const userMsg = makeMessage("user", transcript);
      dispatch({ type: "ADD_EXAM_MESSAGE", payload: userMsg });
      dispatch({ type: "INCREMENT_RALLY" });

      if (state.examRallyCount + 1 >= MAX_RALLY) {
        dispatch({ type: "SET_LOADING", payload: true });
        await new Promise((r) => setTimeout(r, 800));
        const result = scoreExam();
        dispatch({ type: "SET_EXAM_RESULT", payload: result });
        dispatch({ type: "SET_LOADING", payload: false });
        return;
      }

      setAiSpeaking(true);
      await new Promise((r) => setTimeout(r, 1000 + Math.random() * 600));
      const reply = aiReply("exam");
      dispatch({ type: "ADD_EXAM_MESSAGE", payload: makeMessage("assistant", reply) });
      setAiSpeaking(false);
    } else {
      setIsRecording(true);
    }
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        padding: 32,
        background: "var(--canvas)",
        overflow: "hidden",
      }}
    >
      {/* Topic card */}
      <div
        style={{
          padding: "14px 22px",
          borderRadius: "var(--r-lg)",
          background: "var(--warm-tint)",
          border: "1px solid color-mix(in oklab, var(--warm) 25%, transparent)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          maxWidth: 400,
          textAlign: "center",
        }}
      >
        <Icon name="target" size={18} style={{ color: "var(--warm-strong)", flexShrink: 0 }} />
        <span style={{ fontWeight: 600, fontSize: 14, color: "var(--warm-strong)" }}>
          {topic}
        </span>
      </div>

      {/* Rally ring */}
      <RallyRing count={state.examRallyCount} max={MAX_RALLY} />

      {/* AI speaking indicator */}
      {aiSpeaking && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, animation: "fadeIn .2s ease" }}>
          <Icon name="waveform" size={16} style={{ color: "var(--warm)" }} />
          <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>AIが話しています…</span>
          <TypingDots color="var(--warm)" />
        </div>
      )}

      {/* Loading indicator */}
      {state.isLoading && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>採点中…</span>
          <TypingDots />
        </div>
      )}

      {/* Mic button */}
      {!isComplete && !state.isLoading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <button
            onClick={handleMicToggle}
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              border: "none",
              background: isRecording ? "var(--danger)" : "var(--warm)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "var(--shadow-md)",
              animation: isRecording ? "pulseRing 1.4s infinite" : "none",
            }}
          >
            <Icon name={isRecording ? "stop" : "mic"} size={28} stroke={1.8} />
          </button>
          <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>
            {isRecording ? "タップして停止・送信" : "タップして話す"}
          </span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

// ─── ExamScreen ──────────────────────────────────────────────────

export default function ExamScreen() {
  const { state, dispatch } = useApp();

  const activeSession = state.activeSessionId
    ? state.sessions[state.activeSessionId]
    : null;
  const topic = activeSession?.examTopic ?? "Your weekend routine";

  const hasResult = state.examResult !== null;

  function handleRetry() {
    dispatch({ type: "RESET_EXAM" });
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Info bar */}
      <div
        style={{
          padding: "8px 16px",
          borderBottom: "1px solid var(--line)",
          background: "var(--surface)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <ModeChip mode="exam" />
        {activeSession?.name && (
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)" }}>
            {activeSession.name}
          </span>
        )}
        <div style={{ flex: 1 }} />
        {!hasResult && (
          <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>
            Rally {state.examRallyCount} / {MAX_RALLY}
          </span>
        )}
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {hasResult ? (
          <ExamResultView onRetry={handleRetry} />
        ) : (
          <VoiceStage topic={topic} />
        )}
        <ExamTranscript messages={state.examMessages} />
      </div>
    </div>
  );
}
