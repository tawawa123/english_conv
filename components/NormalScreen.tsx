import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import { useApp } from "@/context/AppContext";
import { Icon, TypingDots, ModeChip, Spinner } from "@/components/Icons";
import { makeMessage, clockTime } from "@/lib/utils";
import { sttStart, sttStop, isSttSupported } from "@/services/stt";
import { ttsSpeak, ttsStop, isTtsSupported } from "@/services/tts";
import ReactMarkdown from "react-markdown";
import type { ApiMessage, Message } from "@/types";

// ─── EvalPopup ───────────────────────────────────────────────────

function EvalPopup({ msg, onClose }: { msg: Message; onClose: () => void }) {
  const [advice, setAdvice] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "evaluate", userMessage: msg.content }),
    })
      .then((r) => r.json())
      .then((data: { reply?: string; error?: string }) => {
        if (data.reply) setAdvice(data.reply);
        else throw new Error(data.error ?? "取得に失敗しました。");
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "エラーが発生しました。");
      })
      .finally(() => setLoading(false));
  }, [msg.content]);

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        animation: "fadeIn .15s ease",
      }}
    >
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "var(--r-xl)",
          padding: 28,
          width: 440,
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "var(--shadow-lg)",
          animation: "popIn .18s ease",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Icon name="sparkle" size={17} style={{ color: "var(--accent)" }} />
            <span style={{ fontWeight: 700, fontSize: 15 }}>発話アドバイス</span>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--ink-soft)", cursor: "pointer", display: "flex" }}
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Target sentence */}
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "var(--r-md)",
            background: "var(--accent-tint)",
            border: "1px solid color-mix(in oklab, var(--accent) 20%, transparent)",
            fontSize: 13.5,
            fontStyle: "italic",
            color: "var(--accent-strong)",
            lineHeight: 1.5,
          }}
        >
          &ldquo;{msg.content}&rdquo;
        </div>

        {/* Advice */}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink-faint)", fontSize: 13 }}>
            <Spinner size={15} color="var(--accent)" />
            評価中…
          </div>
        )}
        {error && (
          <span style={{ fontSize: 13, color: "var(--danger)" }}>{error}</span>
        )}
        {advice && (
          <div
            className="md-answer"
            style={{ fontSize: 13.5, lineHeight: 1.7, fontFamily: "var(--font-jp)", color: "var(--ink)" }}
          >
            <ReactMarkdown>{advice}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Message bubble ─────────────────────────────────────────────

function Bubble({
  msg,
  onEval,
  onReplay,
}: {
  msg: Message;
  onEval?: (msg: Message) => void;
  onReplay?: (msg: Message) => void;
}) {
  const isUser = msg.role === "user";
  const canReplay = !isUser && !!onReplay;

  function handleClick() {
    if (isUser && onEval) onEval(msg);
    else if (canReplay) onReplay!(msg);
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        animation: "slideUp .16s ease",
      }}
    >
      <div
        onClick={isUser && onEval || canReplay ? handleClick : undefined}
        title={isUser ? "クリックして発話を評価" : canReplay ? "クリックして再読み上げ" : undefined}
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
          cursor: (isUser && !!onEval) || canReplay ? "pointer" : "default",
        }}
      >
        <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {msg.content}
        </div>
        <div
          style={{
            fontSize: 10.5,
            marginTop: 5,
            color: isUser ? "rgba(255,255,255,.6)" : "var(--ink-faint)",
            textAlign: "right",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 5,
          }}
        >
          {canReplay && (
            <Icon name="play" size={10} style={{ opacity: 0.5 }} />
          )}
          {clockTime(msg.timestamp)}
          {isUser && onEval && (
            <span style={{ marginLeft: 6, opacity: 0.7, fontSize: 10 }}>tap to review</span>
          )}
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
  const [sttError, setSttError] = useState("");
  const [evalMsg, setEvalMsg] = useState<Message | null>(null);
  const ttsSupported = isTtsSupported();
  const sttSupported = isSttSupported();
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    return () => sttStop();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.messages, state.isLoading]);

  async function sendMessage(content: string) {
    if (!content.trim() || state.isLoading) return;

    const userMsg = makeMessage("user", content.trim());
    dispatch({ type: "ADD_MESSAGE", payload: userMsg });
    dispatch({ type: "SET_LOADING", payload: true });
    setText("");

    const apiMessages: ApiMessage[] = [...state.messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          personaPrompt: state.persona.prompt || undefined,
        }),
      });
      const data = await res.json() as { reply?: string; error?: string };
      if (!res.ok || !data.reply) {
        throw new Error(data.error ?? "AIからの返答取得に失敗しました。");
      }
      const replyMsg = makeMessage("assistant", data.reply);
      dispatch({ type: "ADD_MESSAGE", payload: replyMsg });

      if (isTtsSupported()) {
        await ttsSpeak(data.reply);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "不明なエラーが発生しました。";
      dispatch({ type: "ADD_MESSAGE", payload: makeMessage("assistant", `[エラー] ${msg}`) });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }

  async function handleReplay(msg: Message) {
    if (!ttsSupported) return;
    ttsStop();
    await ttsSpeak(msg.content);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(text);
    }
  }

  function toggleRecording() {
    setSttError("");
    if (isRecording) {
      sttStop();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      sttStart({
        onResult: (transcript) => {
          setText((t) => (t ? t + " " : "") + transcript);
          textareaRef.current?.focus();
        },
        onEnd: () => setIsRecording(false),
        onError: (msg) => {
          setIsRecording(false);
          setSttError(msg);
        },
      });
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
      {evalMsg && (
        <EvalPopup msg={evalMsg} onClose={() => setEvalMsg(null)} />
      )}
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
        {sttError && (
          <div
            style={{
              padding: "8px 12px",
              borderRadius: "var(--r-md)",
              background: "var(--danger-tint)",
              border: "1px solid color-mix(in oklab, var(--danger) 25%, transparent)",
              fontSize: 12,
              color: "var(--danger)",
              animation: "slideUp .15s ease",
            }}
          >
            {sttError}
          </div>
        )}
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
          <Bubble key={m.id} msg={m} onEval={setEvalMsg} onReplay={ttsSupported ? handleReplay : undefined} />
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
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <button
            onClick={toggleRecording}
            disabled={!sttSupported}
            style={{
              width: 38,
              height: 38,
              borderRadius: "var(--r-md)",
              border: "1px solid var(--line)",
              background: isRecording ? "var(--danger)" : "var(--surface-2)",
              color: isRecording ? "#fff" : sttSupported ? "var(--ink-soft)" : "var(--ink-faint)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: sttSupported ? "pointer" : "not-allowed",
              animation: isRecording ? "pulseRing 1.4s infinite" : "none",
            }}
            title={!sttSupported ? "このブラウザは音声認識に対応していません" : isRecording ? "停止" : "音声入力"}
          >
            <Icon name={isRecording ? "stop" : "mic"} size={17} />
          </button>
          {sttError && (
            <span style={{ fontSize: 10, color: "var(--danger)", maxWidth: 38, textAlign: "center", lineHeight: 1.3 }}>
              ！
            </span>
          )}
        </div>

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
            background: text.trim() && !state.isLoading ? "var(--accent)" : "var(--line)",
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
type Suggestion = { en: string; ja: string };

function parseSuggestions(raw: string): Suggestion[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.includes("EN:") && line.includes("JA:"))
    .map((line) => {
      const [enPart, jaPart] = line.split("|");
      return {
        en: (enPart ?? "").replace(/^EN:\s*/i, "").trim(),
        ja: (jaPart ?? "").replace(/^JA:\s*/i, "").trim(),
      };
    })
    .filter((s) => s.en && s.ja);
}

function SupportPane({ width }: { width: number }) {
  const { state, dispatch } = useApp();
  const [tab, setTab] = useState<SupportTab>("suggest");
  const [personaText, setPersonaText] = useState(state.persona.prompt);
  const [personaSaved, setPersonaSaved] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState("");

  function savePersona() {
    dispatch({ type: "SET_PERSONA", payload: { prompt: personaText } });
    setPersonaSaved(true);
    setTimeout(() => setPersonaSaved(false), 1800);
  }

  async function fetchSuggestions() {
    const lastAiMsg = [...state.messages].reverse().find((m) => m.role === "assistant");
    if (!lastAiMsg) {
      setSuggestError("まずAIと会話してください。");
      return;
    }
    setSuggestLoading(true);
    setSuggestError("");
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "suggest", lastAiMessage: lastAiMsg.content }),
      });
      const data = await res.json() as { reply?: string; error?: string };
      if (!res.ok || !data.reply) throw new Error(data.error ?? "取得に失敗しました。");
      setSuggestions(parseSuggestions(data.reply));
    } catch (err: unknown) {
      setSuggestError(err instanceof Error ? err.message : "エラーが発生しました。");
    } finally {
      setSuggestLoading(false);
    }
  }

  async function handleAsk() {
    if (!question.trim()) return;
    setAskLoading(true);
    setAskError("");
    setAnswer("");
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ask", question }),
      });
      const data = await res.json() as { reply?: string; error?: string };
      if (!res.ok || !data.reply) throw new Error(data.error ?? "回答取得に失敗しました。");
      setAnswer(data.reply);
    } catch (err: unknown) {
      setAskError(err instanceof Error ? err.message : "エラーが発生しました。");
    } finally {
      setAskLoading(false);
    }
  }

  const tabs: { id: SupportTab; label: string; icon: Parameters<typeof Icon>[0]["name"] }[] = [
    { id: "suggest", label: "例文", icon: "sparkle" },
    { id: "ask", label: "質問", icon: "message" },
    { id: "persona", label: "ペルソナ", icon: "persona" },
  ];

  return (
    <div
      style={{
        width,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        borderLeft: "1px solid var(--line)",
        background: "var(--surface)",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", borderBottom: "1px solid var(--line)", padding: "0 4px" }}>
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
            }}
          >
            <Icon name={t.icon} size={15} />
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>

        {tab === "suggest" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={fetchSuggestions}
              disabled={suggestLoading}
              style={{
                padding: "8px 0",
                borderRadius: "var(--r-md)",
                border: "none",
                background: suggestLoading ? "var(--line)" : "var(--accent)",
                color: suggestLoading ? "var(--ink-faint)" : "#fff",
                fontWeight: 700,
                fontSize: 13,
                cursor: suggestLoading ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              {suggestLoading ? <Spinner size={14} color="#fff" /> : <Icon name="sparkle" size={14} />}
              {suggestLoading ? "取得中…" : "返答例を取得"}
            </button>

            {suggestError && (
              <span style={{ fontSize: 12, color: "var(--danger)" }}>{suggestError}</span>
            )}

            {suggestions.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ margin: "0 0 2px", fontSize: 12, color: "var(--ink-soft)" }}>
                  クリックしてコピー
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
              disabled={!question.trim() || askLoading}
              style={{
                padding: "9px 0",
                borderRadius: "var(--r-md)",
                border: "none",
                background: question.trim() && !askLoading ? "var(--accent)" : "var(--line)",
                color: question.trim() && !askLoading ? "#fff" : "var(--ink-faint)",
                fontWeight: 700,
                fontSize: 13,
                cursor: question.trim() && !askLoading ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              {askLoading ? <Spinner size={14} color="#fff" /> : null}
              {askLoading ? "回答中…" : "質問する"}
            </button>

            {askError && (
              <span style={{ fontSize: 12, color: "var(--danger)" }}>{askError}</span>
            )}

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
                className="md-answer"
              >
                <ReactMarkdown>{answer}</ReactMarkdown>
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

const SUPPORT_MIN = 80;
const SUPPORT_MAX = 1100;
const SUPPORT_DEFAULT = 300;

export default function NormalScreen() {
  const { state } = useApp();
  const activeSession = state.activeSessionId
    ? state.sessions[state.activeSessionId]
    : null;

  const [supportWidth, setSupportWidth] = useState(SUPPORT_DEFAULT);
  const dragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(SUPPORT_DEFAULT);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current) return;
    const delta = dragStartX.current - e.clientX;
    setSupportWidth(Math.min(SUPPORT_MAX, Math.max(SUPPORT_MIN, dragStartWidth.current + delta)));
  }, []);

  const onMouseUp = useCallback(() => {
    dragging.current = false;
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  }, [onMouseMove]);

  function handleDividerMouseDown(e: React.MouseEvent) {
    dragging.current = true;
    dragStartX.current = e.clientX;
    dragStartWidth.current = supportWidth;
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
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
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <ConversationPane />
        <div
          onMouseDown={handleDividerMouseDown}
          style={{
            width: 5,
            flexShrink: 0,
            cursor: "col-resize",
            background: "transparent",
            borderLeft: "1px solid var(--line)",
            transition: "background .15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "var(--accent-tint)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
        />
        <SupportPane width={supportWidth} />
      </div>
    </div>
  );
}
