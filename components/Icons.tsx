import type { CSSProperties } from "react";

type IconName =
  | "plus" | "mic" | "stop" | "send" | "arrowLeft" | "arrowRight"
  | "trash" | "sparkle" | "globe" | "persona" | "close" | "check"
  | "message" | "trophy" | "clock" | "edit" | "sun" | "moon"
  | "chevron" | "chevronDown" | "retry" | "target" | "grid" | "list"
  | "play" | "search" | "waveform" | "flag" | "keyboard" | "dots";

const PATHS: Record<IconName, React.ReactNode> = {
  plus:        <><path d="M12 5v14M5 12h14"/></>,
  mic:         <><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></>,
  stop:        <><rect x="6" y="6" width="12" height="12" rx="2.5"/></>,
  send:        <><path d="M5 12l14-7-5 16-3.5-6.5L5 12z"/></>,
  arrowLeft:   <><path d="M15 5l-7 7 7 7"/></>,
  arrowRight:  <><path d="M9 5l7 7-7 7"/></>,
  trash:       <><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/></>,
  sparkle:     <><path d="M12 4l1.6 4.6L18 10l-4.4 1.4L12 16l-1.6-4.6L6 10l4.4-1.4L12 4z"/><path d="M18 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z"/></>,
  globe:       <><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.3 3.6 5.3 3.6 8.5S14.4 18.2 12 20.5C9.6 18.2 8.4 15.2 8.4 12S9.6 5.8 12 3.5z"/></>,
  persona:     <><circle cx="12" cy="8.5" r="3.6"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/></>,
  close:       <><path d="M6 6l12 12M18 6L6 18"/></>,
  check:       <><path d="M5 12.5l4.5 4.5L19 7"/></>,
  message:     <><path d="M5 6h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H9l-4 3V7a1 1 0 0 1 1-1z"/></>,
  trophy:      <><path d="M8 4h8v4a4 4 0 0 1-8 0V4zM8 6H5v1a3 3 0 0 0 3 3M16 6h3v1a3 3 0 0 1-3 3M10 14h4M9 20h6M12 14v6"/></>,
  clock:       <><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></>,
  edit:        <><path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M14 6l4 4"/></>,
  sun:         <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/></>,
  moon:        <><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/></>,
  chevron:     <><path d="M9 6l6 6-6 6"/></>,
  chevronDown: <><path d="M6 9l6 6 6-6"/></>,
  retry:       <><path d="M4 12a8 8 0 1 1 2.3 5.6M4 19v-4h4"/></>,
  target:      <><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.6" fill="currentColor" stroke="none"/></>,
  grid:        <><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></>,
  list:        <><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/></>,
  play:        <><path d="M7 5l12 7-12 7V5z"/></>,
  search:      <><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-3.8-3.8"/></>,
  waveform:    <><path d="M4 12h2M9 7v10M14 4v16M19 9v6M21.5 11v2M2.5 11v2"/></>,
  flag:        <><path d="M6 21V4M6 4h11l-2 4 2 4H6"/></>,
  keyboard:    <><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M11 10h.01M15 10h.01M17 10h.01M7 13h.01M8 14.5h8"/></>,
  dots:        <><circle cx="6" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="1.4" fill="currentColor" stroke="none"/></>,
};

type IconProps = {
  name: IconName;
  size?: number;
  stroke?: number;
  style?: CSSProperties;
  className?: string;
};

export function Icon({ name, size = 20, stroke = 1.7, style, className }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

export function TypingDots({ color }: { color?: string }) {
  return (
    <span
      className="dotpulse"
      style={{ display: "inline-flex", gap: 4, alignItems: "flex-end", height: 14 }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6, height: 6, borderRadius: 99, display: "inline-block",
            background: color || "var(--ink-faint)", transformOrigin: "bottom",
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </span>
  );
}

export function Spinner({ size = 16, width = 2.2, color = "currentColor" }: { size?: number; width?: number; color?: string }) {
  return (
    <span
      style={{
        width: size, height: size, borderRadius: 99, display: "inline-block",
        border: `${width}px solid color-mix(in oklab, ${color} 25%, transparent)`,
        borderTopColor: color,
        animation: "spin .7s linear infinite",
      }}
    />
  );
}

export function ModeChip({ mode, size = "sm" }: { mode: "normal" | "exam"; size?: "sm" | "md" }) {
  const isExam = mode === "exam";
  const pad = size === "sm" ? "3px 9px 3px 7px" : "5px 12px 5px 9px";
  const fs = size === "sm" ? 11.5 : 13;
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 5, padding: pad,
        borderRadius: 99, fontSize: fs, fontWeight: 700, letterSpacing: ".02em",
        color: isExam ? "var(--warm-strong)" : "var(--accent-strong)",
        background: isExam ? "var(--warm-tint)" : "var(--accent-tint)",
        border: `1px solid ${isExam
          ? "color-mix(in oklab, var(--warm) 30%, transparent)"
          : "color-mix(in oklab, var(--accent) 30%, transparent)"}`,
      }}
    >
      <Icon name={isExam ? "trophy" : "message"} size={size === "sm" ? 13 : 15} stroke={1.9} />
      {isExam ? "EXAM" : "NORMAL"}
    </span>
  );
}
