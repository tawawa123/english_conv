import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { useApp } from "@/context/AppContext";
import { Icon, TypingDots, ModeChip } from "@/components/Icons";
import {
  makeMessage,
  aiReply,
  clockTime,
  SUGGESTIONS,
  askAnswer,
} from "@/lib/utils";
import type { Message } from "@/types";

// ─── Message bubble ─────────────────────────────────────────────

function Bubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        animation: "slideUp .16s ease",
      }}
    >
      <div
        style={{
          maxWidth: "72%",
          padding: "10px 14px",
          borderRadius: isUser
            ? "var(--r-lg) var(--r-lg) 4px var(--r-lg)"
            : "4px var(--r-lg) var(--r-lg) var(--r-lg)",
          background: isUser ? "var(--accent)" : "var(--surface)",
          color: isUser ? "#fff" : "var(--ink)",
          fontSize: 14,
          lineHeight: 1.55,
          boxShadow: "var(--shadow-sm)",
          border: isUser ? "none" : "1px solid var(--line)",
        }}
      >
        <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {msg.content}
        </div>
        <div
          style={{
            fontSize: 10.5,
            marginTop: 5,
            color: isUser
              ? "rgba(255,255,255,.6)"
              : "var(--ink-faint)",
            textAlign: "right",
          }}
        >
          {clockTime(msg.timestamp)}
        </div>
      </div>
    </div>
  );
}

// ─── ConversationPane ────────────────────────────────────────────

function ConversationPane() {
  const { state, dispatch } = useApp();
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.messages, state.isLoading]);

  async function sendMessage(content: string) {
    if (!content.trim() || state.isLoading) return;
    const userMsg = makeMessage("user", content.trim());
    dispatch({ type: "ADD_MESSAGE", payload: userMsg });
    dispatch({ type: "SET_LOADING", payload: true });
    setText("");

    await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));
    const reply = aiReply("normal");
    dispatch({ type: "ADD_MESSAGE", payload: makeMessage("assistant", reply) });
    dispatch({ type: "SET_LOADING", payload: false });
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(text);
    }
  }

  function toggleRecording() {
    if (isRecording) {
      setIsRecording(false);
      // STT simulation: insert sample text
      import("@/lib/utils").then(({ randStt }) => {
        setText((t) => (t ? t + " " : "") + randStt());
        textareaRef.current?.focus();
      });
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
        background: "var(--canvas)",
        overflow: "hidden",
      }}
    >
      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 20px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {state.messages.length === 0 && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              color: "var(--ink-faint)",
              animation: "fadeIn .3s ease",
            }}
          >
            <Icon name="message" size={38} stroke={1.2} />
            <span style={{ fontSize: 14 }}>英語で話しかけてみましょう</span>
          </div>
        )}
        {state.messages.map((m) => (
          <Bubble key={m.id} msg={m} />
        ))}
        {state.isLoading && (
          <div style={{ display: "flex", animation: "slideUp .16s ease" }}>
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "4px var(--r-lg) var(--r-lg) var(--r-lg)",
                background: "var(--surface)",
                border: "1px solid var(--line)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <TypingDots />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--line)",
          background: "var(--surface)",
          display: "flex",
          alignItems: "flex-end",
          gap: 10,
        }}
      >
        {/* Mic button */}
        <button
          onClick={toggleRecording}
          style={{
            flexShrink: 0,
            width: 38,
            height: 38,
            borderRadius: "var(--r-md)",
            border: "1px solid var(--line)",
            background: isRecording ? "var(--danger)" : "var(--surface-2)",
            color: isRecording ? "#fff" : "var(--ink-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            animation: isRecording ? "pulseRing 1.4s infinite" : "none",
          }}
          title={isRecording ? "停止" : "音声入力"}
        >
          <Icon name={isRecording ? "stop" : "mic"} size={17} />
        </button>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="英語でメッセージを入力… (Enter で送信)"
          rows={1}
          style={{
            flex: 1,
            resize: "none",
            border: "1px solid var(--line)",
            borderRadius: "var(--r-md)",
            padding: "9px 12px",
            background: "var(--surface-2)",
            color: "var(--ink)",
            fontSize: 14,
            outline: "none",
            lineHeight: 1.5,
            maxHeight: 120,
            overflowY: "auto",
          }}
          onInput={(e) => {
            const t = e.currentTarget;
            t.style.height = "auto";
            t.style.height = `${Math.min(t.scrollHeight, 120)}px`;
          }}
        />

        <button
          onClick={() => sendMessage(text)}
          disabled={!text.trim() || state.isLoading}
          style={{
            flexShrink: 0,
            width: 38,
            height: 38,
            borderRadius: "var(--r-md)",
            border: "none",
            background:
              text.trim() && !state.isLoading ? "var(--accent)" : "var(--line)",
            color: text.trim() && !state.isLoading ? "#fff" : "var(--ink-faint)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: text.trim() && !state.isLoading ? "pointer" : "default",
          }}
        >
          <Icon name="send" size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── SupportPane ─────────────────────────────────────────────────

type SupportTab = "persona" | "suggest" | "ask";

function SupportPane() {
  const { state, dispatch } = useApp();
  const [tab, setTab] = useState<SupportTab>("suggest");
  const [personaText, setPersonaText] = useState(state.persona.prompt);
  const [personaSaved, setPersonaSaved] = useState(false);
  const [suggestions] = useState(SUGGESTIONS);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  function savePersona() {
    dispatch({ type: "SET_PERSONA", payload: { prompt: personaText } });
    setPersonaSaved(true);
    setTimeout(() => setPersonaSaved(false), 1800);
  }

  function handleAsk() {
    if (!question.trim()) return;
    setAnswer(askAnswer(question));
  }

  const tabs: { id: SupportTab; label: string; icon: Parameters<typeof Icon>[0]["name"] }[] = [
    { id: "suggest", label: "例文", icon: "sparkle" },
    { id: "ask", label: "質問", icon: "message" },
    { id: "persona", label: "ペルソナ", icon: "persona" },
  ];

  return (
    <div
      style={{
        width: 300,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        borderLeft: "1px solid var(--line)",
        background: "var(--surface)",
        overflow: "hidden",
      }}
    >
      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--line)",
          padding: "0 4px",
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              padding: "11px 0",
              background: "none",
              border: "none",
              borderBottom: `2px solid ${tab === t.id ? "var(--accent)" : "transparent"}`,
              color: tab === t.id ? "var(--accent-strong)" : "var(--ink-faint)",
              fontWeight: tab === t.id ? 700 : 500,
              fontSize: 12,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              letterSpacing: ".01em",
            }}
          >
            <Icon name={t.icon} size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>

        {tab === "suggest" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ margin: "0 0 6px", fontSize: 12, color: "var(--ink-soft)" }}>
              使えそうな表現をクリックしてコピー
            </p>
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => navigator.clipboard?.writeText(s.en)}
                style={{
                  padding: "12px 14px",
                  borderRadius: "var(--r-md)",
                  border: "1px solid var(--line)",
                  background: "var(--surface-2)",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", lineHeight: 1.4 }}>
                  {s.en}
                </span>
                <span style={{ fontSize: 11.5, color: "var(--ink-faint)", fontFamily: "var(--font-jp)" }}>
                  {s.ja}
                </span>
              </button>
            ))}
          </div>
        )}

        {tab === "ask" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ margin: 0, fontSize: 12, color: "var(--ink-soft)" }}>
              英語や表現についての疑問を日本語で質問できます。
            </p>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="例：過去形と現在完了形の違いは？"
              rows={3}
              style={{
                resize: "none",
                padding: "9px 12px",
                borderRadius: "var(--r-md)",
                border: "1px solid var(--line-strong)",
                background: "var(--surface-2)",
                color: "var(--ink)",
                fontSize: 13,
                outline: "none",
                fontFamily: "var(--font-jp)",
              }}
            />
            <button
              onClick={handleAsk}
              disabled={!question.trim()}
              style={{
                padding: "9px 0",
                borderRadius: "var(--r-md)",
                border: "none",
                background: question.trim() ? "var(--accent)" : "var(--line)",
                color: question.trim() ? "#fff" : "var(--ink-faint)",
                fontWeight: 700,
                fontSize: 13,
                cursor: question.trim() ? "pointer" : "default",
              }}
            >
              質問する
            </button>
            {answer && (
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "var(--r-md)",
                  background: "var(--accent-tint)",
                  border: "1px solid color-mix(in oklab, var(--accent) 20%, transparent)",
                  fontSize: 13,
                  color: "var(--ink)",
                  lineHeight: 1.65,
                  fontFamily: "var(--font-jp)",
                  animation: "slideUp .2s ease",
                }}
              >
                {answer}
              </div>
            )}
          </div>
        )}

        {tab === "persona" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ margin: 0, fontSize: 12, color: "var(--ink-soft)", fontFamily: "var(--font-jp)" }}>
              AIの話し方やキャラクターをプロンプトで設定します。
            </p>
            <textarea
              value={personaText}
              onChange={(e) => setPersonaText(e.target.value)}
              placeholder="例：あなたはフレンドリーなカフェの店員です。"
              rows={6}
              style={{
                resize: "vertical",
                padding: "9px 12px",
                borderRadius: "var(--r-md)",
                border: "1px solid var(--line-strong)",
                background: "var(--surface-2)",
                color: "var(--ink)",
                fontSize: 13,
                outline: "none",
                fontFamily: "var(--font-jp)",
                lineHeight: 1.6,
              }}
            />
            <button
              onClick={savePersona}
              style={{
                padding: "9px 0",
                borderRadius: "var(--r-md)",
                border: "none",
                background: personaSaved ? "var(--success)" : "var(--accent)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Icon name={personaSaved ? "check" : "edit"} size={14} />
              {personaSaved ? "保存しました" : "保存する"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── NormalScreen ────────────────────────────────────────────────

export default function NormalScreen() {
  const { state } = useApp();
  const activeSession = state.activeSessionId
    ? state.sessions[state.activeSessionId]
    : null;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Session info bar */}
      {activeSession && (
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
          <ModeChip mode={activeSession.mode} />
          {activeSession.name && (
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)" }}>
              {activeSession.name}
            </span>
          )}
        </div>
      )}

      {/* Main layout */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <ConversationPane />
        <SupportPane />
      </div>
    </div>
  );
}
