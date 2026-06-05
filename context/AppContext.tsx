import { createContext, useContext, useReducer, useEffect } from "react";
import type { Dispatch, ReactNode } from "react";
import type {
  AppMode,
  ExamResult,
  Message,
  PersonaSettings,
  Session,
} from "@/types";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

type AppState = {
  mode: AppMode;
  messages: Message[];
  examMessages: Message[];
  examRallyCount: number;
  examResult: ExamResult | null;
  persona: PersonaSettings;
  isLoading: boolean;
  sessions: Record<string, Session>;
  activeSessionId: string | null;
  isHydrated: boolean;
};

const initialState: AppState = {
  mode: "normal",
  messages: [],
  examMessages: [],
  examRallyCount: 0,
  examResult: null,
  persona: { prompt: "" },
  isLoading: false,
  sessions: {},
  activeSessionId: null,
  isHydrated: false,
};

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type AppAction =
  | { type: "SET_MODE"; payload: AppMode }
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "ADD_EXAM_MESSAGE"; payload: Message }
  | { type: "INCREMENT_RALLY" }
  | { type: "SET_EXAM_RESULT"; payload: ExamResult }
  | { type: "SET_PERSONA"; payload: PersonaSettings }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "RESET_EXAM"; topic?: string }
  | { type: "CREATE_SESSION"; payload: { id: string; name?: string; mode: AppMode; topic?: string } }
  | { type: "SWITCH_SESSION"; payload: { id: string } }
  | { type: "DELETE_SESSION"; payload: { id: string } }
  | { type: "SAVE_SESSION" }
  | { type: "LOAD_SESSION"; payload: { sessions: Record<string, Session>; persona?: PersonaSettings } }
  | { type: "SAVE_ADVICE"; payload: { id: string; advice: string } };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function saveCurrentSession(state: AppState): Record<string, Session> {
  if (state.activeSessionId === null) return state.sessions;
  const current: Session = {
    ...state.sessions[state.activeSessionId],
    mode: state.mode,
    messages: state.messages,
    examMessages: state.examMessages,
    examRallyCount: state.examRallyCount,
    examResult: state.examResult,
    updatedAt: new Date().toISOString(),
  };
  return { ...state.sessions, [state.activeSessionId]: current };
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_MODE": {
      if (action.payload === "exam") {
        return {
          ...state,
          mode: "exam",
          examMessages: [],
          examRallyCount: 0,
          examResult: null,
        };
      }
      return { ...state, mode: action.payload };
    }

    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.payload] };

    case "ADD_EXAM_MESSAGE":
      return {
        ...state,
        examMessages: [...state.examMessages, action.payload],
      };

    case "INCREMENT_RALLY":
      return {
        ...state,
        examRallyCount: Math.min(state.examRallyCount + 1, 10),
      };

    case "SET_EXAM_RESULT":
      return { ...state, examResult: action.payload };

    case "SET_PERSONA":
      return { ...state, persona: action.payload };

    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "RESET_EXAM": {
      const resetSessions = action.topic
        ? saveCurrentSession({ ...state, sessions: Object.fromEntries(
            Object.entries(state.sessions).map(([k, s]) =>
              k === state.activeSessionId ? [k, { ...s, examTopic: action.topic }] : [k, s]
            )
          )})
        : saveCurrentSession(state);
      return {
        ...state,
        sessions: resetSessions,
        examMessages: [],
        examRallyCount: 0,
        examResult: null,
      };
    }

    case "CREATE_SESSION": {
      const { id, name, mode, topic } = action.payload;
      const now = new Date().toISOString();
      const newSession: Session = {
        id,
        name,
        mode,
        messages: [],
        examMessages: [],
        examRallyCount: 0,
        examResult: null,
        examTopic: mode === "exam" ? topic : undefined,
        createdAt: now,
      };
      const savedSessions = saveCurrentSession(state);
      return {
        ...state,
        sessions: { ...savedSessions, [id]: newSession },
        activeSessionId: id,
        mode,
        messages: [],
        examMessages: [],
        examRallyCount: 0,
        examResult: null,
      };
    }

    case "SWITCH_SESSION": {
      const { id } = action.payload;
      const target = state.sessions[id];
      if (!target) return state;
      const savedSessions = saveCurrentSession(state);
      return {
        ...state,
        sessions: savedSessions,
        activeSessionId: id,
        mode: target.mode,
        messages: target.messages,
        examMessages: target.examMessages,
        examRallyCount: target.examRallyCount,
        examResult: target.examResult ?? null,
        ...(target.mode === "exam"
          ? {}
          : { examMessages: [], examRallyCount: 0, examResult: null }),
      };
    }

    case "DELETE_SESSION": {
      const { id } = action.payload;
      const { [id]: _removed, ...rest } = state.sessions;
      const isActive = state.activeSessionId === id;
      return {
        ...state,
        sessions: rest,
        activeSessionId: isActive ? null : state.activeSessionId,
        ...(isActive
          ? {
              mode: "normal",
              messages: [],
              examMessages: [],
              examRallyCount: 0,
              examResult: null,
            }
          : {}),
      };
    }

    case "SAVE_SESSION":
      return { ...state, sessions: saveCurrentSession(state) };

    case "LOAD_SESSION":
      return {
        ...state,
        isHydrated: true,
        sessions: action.payload.sessions,
        ...(action.payload.persona ? { persona: action.payload.persona } : {}),
      };

    case "SAVE_ADVICE": {
      const { id, advice } = action.payload;
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === id ? { ...m, advice } : m
        ),
      };
    }

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// localStorage persistence
// ---------------------------------------------------------------------------

const STORAGE_KEY = "english_conv_state";

type PersistedState = {
  sessions: Record<string, Session & { messages: (Omit<Message, "timestamp"> & { timestamp: string })[] }>;
  persona: PersonaSettings;
};

function deserializeMessages(
  msgs: (Omit<Message, "timestamp"> & { timestamp: string })[]
): Message[] {
  return msgs.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }));
}

function loadFromStorage(): Pick<AppState, "sessions" | "persona"> {
  if (typeof window === "undefined") return { sessions: {}, persona: { prompt: "" } };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { sessions: {}, persona: { prompt: "" } };
    const parsed = JSON.parse(raw) as PersistedState;
    const sessions: Record<string, Session> = {};
    for (const [id, s] of Object.entries(parsed.sessions ?? {})) {
      sessions[id] = {
        ...s,
        messages: deserializeMessages(s.messages ?? []),
        examMessages: deserializeMessages(
          (s as unknown as { examMessages: (Omit<Message, "timestamp"> & { timestamp: string })[] }).examMessages ?? []
        ),
      };
    }
    return { sessions, persona: parsed.persona ?? { prompt: "" } };
  } catch {
    return { sessions: {}, persona: { prompt: "" } };
  }
}

function saveToStorage(state: AppState): void {
  if (typeof window === "undefined") return;
  try {
    const toSave: Pick<PersistedState, "persona"> & { sessions: Record<string, Session> } = {
      sessions: state.sessions,
      persona: state.persona,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // quota exceeded などの場合は無視
  }
}

function initState(): AppState {
  return { ...initialState, ...loadFromStorage() };
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

type AppContextValue = {
  state: AppState;
  dispatch: Dispatch<AppAction>;
};

const AppContext = createContext<AppContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const loaded = loadFromStorage();
    dispatch({ type: "LOAD_SESSION", payload: loaded });
  }, []);

  useEffect(() => {
    if (!state.isHydrated) return;
    // アクティブセッションの進行中メッセージをマージしてから保存
    const sessionsToSave = { ...state.sessions };
    if (state.activeSessionId && sessionsToSave[state.activeSessionId]) {
      sessionsToSave[state.activeSessionId] = {
        ...sessionsToSave[state.activeSessionId],
        messages: state.messages,
        examMessages: state.examMessages,
        examRallyCount: state.examRallyCount,
        examResult: state.examResult ?? null,
        updatedAt: new Date().toISOString(),
      };
    }
    saveToStorage({ ...state, sessions: sessionsToSave });
  }, [
    state.isHydrated,
    state.sessions,
    state.messages,
    state.examMessages,
    state.examRallyCount,
    state.examResult,
    state.persona,
    state.activeSessionId,
  ]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (ctx === null) {
    throw new Error("useApp must be used within AppProvider");
  }
  return ctx;
}
