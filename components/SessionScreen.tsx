import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Icon, ModeChip } from "@/components/Icons";
import { uid, sortedSessions, lastPreview, relTime, EXAM_TOPICS, randTopic } from "@/lib/utils";
import type { AppMode } from "@/types";

type Props = {
  onSelectSession: (id: string) => void;
  onSessionCreated: (id: string, mode: AppMode) => void;
};

// ─── NewSessionModal ────────────────────────────────────────────

function NewSessionModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: (name: string, mode: AppMode, topic?: string) => void;
}) {
  const [name, setName] = useState("");
  const [mode, setMode] = useState<AppMode>("normal");
  const [topic, setTopic] = useState<string>(EXAM_TOPICS[0]);

  function handleSubmit() {
    onConfirm(name.trim(), mode, mode === "exam" ? topic : undefined);
  }

  return (
    <div
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
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "var(--r-xl)",
          padding: 28,
          width: 420,
          boxShadow: "var(--shadow-lg)",
          animation: "popIn .18s ease",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 700, fontSize: 17 }}>新規セッション</span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--ink-soft)",
              padding: 4,
              cursor: "pointer",
              display: "flex",
            }}
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Session name */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", letterSpacing: ".04em" }}>
            セッション名（任意）
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例：週末の話題"
            style={{
              padding: "9px 12px",
              borderRadius: "var(--r-md)",
              border: "1px solid var(--line-strong)",
              background: "var(--surface-2)",
              color: "var(--ink)",
              fontSize: 14,
              outline: "none",
            }}
          />
        </div>

        {/* Mode select */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", letterSpacing: ".04em" }}>
            モード
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            {(["normal", "exam"] as AppMode[]).map((m) => {
              const selected = mode === m;
              const isExam = m === "exam";
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    borderRadius: "var(--r-md)",
                    border: `1.5px solid ${selected
                      ? isExam ? "var(--warm)" : "var(--accent)"
                      : "var(--line)"}`,
                    background: selected
                      ? isExam ? "var(--warm-tint)" : "var(--accent-tint)"
                      : "var(--surface-2)",
                    color: selected
                      ? isExam ? "var(--warm-strong)" : "var(--accent-strong)"
                      : "var(--ink-soft)",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Icon name={isExam ? "trophy" : "message"} size={18} />
                  {isExam ? "EXAM" : "NORMAL"}
                </button>
              );
            })}
          </div>
        </div>

        {/* Topic select (exam only) */}
        {mode === "exam" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", letterSpacing: ".04em" }}>
                トピック
              </label>
              <button
                onClick={() => setTopic(randTopic())}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: 0,
                }}
              >
                <Icon name="retry" size={13} />
                ランダム
              </button>
            </div>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              style={{
                padding: "9px 12px",
                borderRadius: "var(--r-md)",
                border: "1px solid var(--line-strong)",
                background: "var(--surface-2)",
                color: "var(--ink)",
                fontSize: 14,
                outline: "none",
                cursor: "pointer",
              }}
            >
              {EXAM_TOPICS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 18px",
              borderRadius: "var(--r-md)",
              border: "1px solid var(--line)",
              background: "var(--surface-2)",
              color: "var(--ink-soft)",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            style={{
              padding: "9px 22px",
              borderRadius: "var(--r-md)",
              border: "none",
              background: mode === "exam" ? "var(--warm)" : "var(--accent)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            開始
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DeleteConfirm ──────────────────────────────────────────────

function DeleteConfirm({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  return (
    <div
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
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "var(--r-xl)",
          padding: 24,
          width: 340,
          boxShadow: "var(--shadow-lg)",
          animation: "popIn .18s ease",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 15 }}>セッションを削除しますか？</span>
        <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
          この操作は元に戻せません。
        </span>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              borderRadius: "var(--r-md)",
              border: "1px solid var(--line)",
              background: "var(--surface-2)",
              color: "var(--ink-soft)",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "8px 16px",
              borderRadius: "var(--r-md)",
              border: "none",
              background: "var(--danger)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            削除
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SessionScreen ──────────────────────────────────────────────

export default function SessionScreen({ onSelectSession, onSessionCreated }: Props) {
  const { state, dispatch } = useApp();
  const [showNew, setShowNew] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const sessions = sortedSessions(state.sessions).filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (s.name ?? "").toLowerCase().includes(q) ||
      lastPreview(s).toLowerCase().includes(q)
    );
  });

  function handleCreate(name: string, mode: AppMode, topic?: string) {
    const id = uid();
    dispatch({
      type: "CREATE_SESSION",
      payload: { id, name: name || undefined, mode, topic },
    });
    setShowNew(false);
    onSessionCreated(id, mode);
  }

  function handleDelete() {
    if (!deleteId) return;
    dispatch({ type: "DELETE_SESSION", payload: { id: deleteId } });
    setDeleteId(null);
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: "28px 32px",
        gap: 20,
        overflow: "auto",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, flex: 1 }}>セッション</h1>
        <button
          onClick={() => setShowNew(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            borderRadius: "var(--r-md)",
            border: "none",
            background: "var(--accent)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          <Icon name="plus" size={15} stroke={2.2} />
          新規セッション
        </button>
      </div>

      {/* Search */}
      <div style={{ position: "relative", maxWidth: 360 }}>
        <Icon
          name="search"
          size={15}
          style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--ink-faint)",
            pointerEvents: "none",
          }}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="セッションを検索…"
          style={{
            width: "100%",
            padding: "8px 12px 8px 34px",
            borderRadius: "var(--r-md)",
            border: "1px solid var(--line)",
            background: "var(--surface)",
            color: "var(--ink)",
            fontSize: 13,
            outline: "none",
          }}
        />
      </div>

      {/* Session list */}
      {sessions.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            color: "var(--ink-faint)",
            animation: "fadeIn .2s ease",
          }}
        >
          <Icon name="message" size={36} stroke={1.2} />
          <span style={{ fontSize: 14 }}>
            {search ? "該当するセッションがありません" : "セッションがまだありません"}
          </span>
          {!search && (
            <button
              onClick={() => setShowNew(true)}
              style={{
                marginTop: 4,
                padding: "8px 18px",
                borderRadius: "var(--r-md)",
                border: "none",
                background: "var(--accent)",
                color: "#fff",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              最初のセッションを作成
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => onSelectSession(s.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 16px",
                borderRadius: "var(--r-lg)",
                background: "var(--surface)",
                border: `1px solid ${state.activeSessionId === s.id ? "var(--line-strong)" : "var(--line)"}`,
                cursor: "pointer",
                animation: "slideUp .18s ease",
                boxShadow: state.activeSessionId === s.id ? "var(--shadow-sm)" : "none",
              }}
            >
              <ModeChip mode={s.mode} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>
                  {s.name ?? (s.mode === "exam" ? "Exam Session" : "New Session")}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--ink-faint)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {lastPreview(s)}
                </div>
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: "var(--ink-faint)",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {relTime(s.updatedAt ?? s.createdAt)}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteId(s.id);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--ink-faint)",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                  borderRadius: 6,
                  flexShrink: 0,
                }}
                title="削除"
              >
                <Icon name="trash" size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showNew && (
        <NewSessionModal onClose={() => setShowNew(false)} onConfirm={handleCreate} />
      )}
      {deleteId && (
        <DeleteConfirm onClose={() => setDeleteId(null)} onConfirm={handleDelete} />
      )}
    </div>
  );
}
