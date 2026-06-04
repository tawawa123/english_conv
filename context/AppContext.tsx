import { createContext, useContext, useReducer } from "react";
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
  | { type: "LOAD_SESSION"; payload: { sessions: Record<string, Session> } };

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
      return { ...state, sessions: action.payload.sessions };

    default:
      return state;
  }
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
