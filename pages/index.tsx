import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Icon } from "@/components/Icons";
import SessionScreen from "@/components/SessionScreen";
import NormalScreen from "@/components/NormalScreen";
import ExamScreen from "@/components/ExamScreen";

type Route = "sessions" | "normal" | "exam";

function TopBar({
  route,
  onBack,
  dark,
  onToggleDark,
}: {
  route: Route;
  onBack: () => void;
  dark: boolean;
  onToggleDark: () => void;
}) {
  const { state } = useApp();
  const activeSession =
    state.activeSessionId ? state.sessions[state.activeSessionId] : null;

  return (
    <header
      style={{
        height: 52,
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: 10,
        background: "var(--surface)",
        borderBottom: "1px solid var(--line)",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: route === "sessions" ? "default" : "pointer",
        }}
        onClick={route !== "sessions" ? onBack : undefined}
      >
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            flexShrink: 0,
          }}
        >
          <Icon name="globe" size={15} stroke={2} />
        </span>
        <span
          style={{
            fontWeight: 800,
            fontSize: 15,
            letterSpacing: "-.01em",
            color: "var(--ink)",
          }}
        >
          EngConv
        </span>
      </div>

      {route !== "sessions" && activeSession && (
        <>
          <Icon name="chevron" size={14} style={{ color: "var(--ink-faint)", flexShrink: 0 }} />
          <span
            style={{
              fontSize: 13,
              color: "var(--ink-soft)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: 200,
            }}
          >
            {activeSession.name ?? (activeSession.mode === "exam" ? "Exam Session" : "New Session")}
          </span>
        </>
      )}

      <div style={{ flex: 1 }} />

      <button
        onClick={onToggleDark}
        style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          border: "1px solid var(--line)",
          background: "var(--surface-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--ink-soft)",
          cursor: "pointer",
        }}
        title={dark ? "ライトモードに切替" : "ダークモードに切替"}
      >
        <Icon name={dark ? "sun" : "moon"} size={16} />
      </button>
    </header>
  );
}

export default function Home() {
  const { state, dispatch } = useApp();
  const [route, setRoute] = useState<Route>("sessions");
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") setDark(true);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  function goToSession(id: string) {
    dispatch({ type: "SWITCH_SESSION", payload: { id } });
    const target = state.sessions[id];
    setRoute(target?.mode === "exam" ? "exam" : "normal");
  }

  function goBack() {
    dispatch({ type: "SAVE_SESSION" });
    setRoute("sessions");
  }

  function onSessionCreated(_id: string, mode: "normal" | "exam") {
    setRoute(mode === "exam" ? "exam" : "normal");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <TopBar
        route={route}
        onBack={goBack}
        dark={dark}
        onToggleDark={() => setDark((d) => !d)}
      />
      <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {route === "sessions" && (
          <SessionScreen onSelectSession={goToSession} onSessionCreated={onSessionCreated} />
        )}
        {route === "normal" && <NormalScreen />}
        {route === "exam" && <ExamScreen />}
      </main>
    </div>
  );
}
