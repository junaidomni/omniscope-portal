import { useState, useEffect, useRef } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

export type OmniMode = "sigil" | "character" | "hidden";
export type OmniState = "idle" | "hover" | "thinking" | "success" | "error" | "wave" | "thumbsup" | "celebrate";

interface OmniAvatarProps {
  mode: OmniMode;
  state: OmniState;
  size?: number; // px, default 56
  onClick?: () => void;
  badge?: boolean; // gold notification dot
  className?: string;
}

// ─── Sigil Mode ─────────────────────────────────────────────────────────────
// Concentric gold rings with breathing pulse. Institutional, geometric, premium.

function SigilAvatar({ state, size = 56, badge }: Omit<OmniAvatarProps, "mode" | "onClick" | "className">) {
  const r = size / 2;
  const outerR = r - 2;
  const midR = r - 8;
  const innerR = r - 14;

  const pulseClass =
    state === "thinking" ? "animate-spin-slow" :
    state === "success" || state === "thumbsup" || state === "celebrate" ? "animate-pulse-gold" :
    state === "error" ? "opacity-50" :
    state === "hover" || state === "wave" ? "animate-glow" :
    "animate-breathe";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className={`transition-all duration-500 ${pulseClass}`}
      >
        <defs>
          <radialGradient id="sigil-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ca8a04" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ca8a04" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={r} cy={r} r={outerR} fill="url(#sigil-glow)" />
        <circle cx={r} cy={r} r={outerR} fill="none" stroke="#ca8a04" strokeWidth="1.5" strokeOpacity={state === "error" ? 0.3 : 0.7} />
        <circle cx={r} cy={r} r={midR} fill="none" stroke="#ca8a04" strokeWidth="1" strokeOpacity={state === "error" ? 0.2 : 0.4} strokeDasharray={state === "thinking" ? "4 4" : "none"} />
        <circle cx={r} cy={r} r={innerR} fill="none" stroke="#ca8a04" strokeWidth="0.75" strokeOpacity={state === "error" ? 0.15 : 0.3} />
        <circle cx={r} cy={r} r={3} fill="#ca8a04" opacity={state === "idle" ? 0.8 : 1} />
        {(state === "success" || state === "celebrate") && (
          <circle cx={r} cy={r} r={outerR - 2} fill="none" stroke="#eab308" strokeWidth="2" opacity="0.6" className="animate-ping-once" />
        )}
      </svg>
      {badge && (
        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-yellow-500 animate-pulse-subtle border-2 border-zinc-900" />
      )}
    </div>
  );
}

// ─── Character Mode (NOMI-Inspired) ────────────────────────────────────────
// Dark sphere with expressive gold pill-shaped eyes. Inspired by NIO NOMI.
// Eyes track cursor, blink periodically, and change expression based on state.
// New: Thumbs up gesture, waving arm, celebration sparkles.

function CharacterAvatar({ state, size = 56, badge }: Omit<OmniAvatarProps, "mode" | "onClick" | "className">) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [blinking, setBlinking] = useState(false);

  // Track cursor for eye movement
  useEffect(() => {
    if (state === "thinking") {
      setEyeOffset({ x: -1.5, y: 1 });
      return;
    }
    if (state === "thumbsup" || state === "celebrate") {
      setEyeOffset({ x: 0, y: 0 });
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxOffset = size > 80 ? 5 : 3;
      const factor = Math.min(dist / 200, 1);
      setEyeOffset({
        x: (dx / (dist || 1)) * maxOffset * factor,
        y: (dy / (dist || 1)) * maxOffset * factor,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [state, size]);

  // Natural blink pattern
  useEffect(() => {
    const scheduleBlink = () => {
      const delay = 2500 + Math.random() * 3000;
      return setTimeout(() => {
        setBlinking(true);
        setTimeout(() => {
          setBlinking(false);
          if (Math.random() < 0.2) {
            setTimeout(() => {
              setBlinking(true);
              setTimeout(() => setBlinking(false), 100);
            }, 120);
          }
        }, 120);
      }, delay);
    };

    let timer = scheduleBlink();
    const interval = setInterval(() => {
      clearTimeout(timer);
      timer = scheduleBlink();
    }, 5500);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const s = size;
  const r = s / 2;
  const bodyR = r - 3;
  const scale = s / 56;

  // Eye dimensions
  const eyeW = 4.5 * scale;
  const eyeSpacing = 8 * scale;

  const getEyeH = () => {
    if (blinking) return 0.8 * scale;
    switch (state) {
      case "hover": case "wave": return 7 * scale;
      case "thinking": return 4 * scale;
      case "success": case "thumbsup": case "celebrate": return 2 * scale;
      case "error": return 5 * scale;
      default: return 6 * scale;
    }
  };

  const eyeH = getEyeH();
  const eyeRx = eyeW / 2;
  const eyeRy = eyeH / 2;
  const eyeY = (state === "success" || state === "thumbsup" || state === "celebrate") ? r - 1 * scale : r - 2 * scale;

  const showMouth = state === "success" || state === "error" || state === "hover" || state === "thumbsup" || state === "wave" || state === "celebrate";

  const rimOpacity =
    state === "hover" || state === "wave" ? 0.6 :
    state === "thinking" ? 0.3 :
    state === "success" || state === "thumbsup" || state === "celebrate" ? 0.8 :
    state === "error" ? 0.2 :
    0.35;

  const glowClass =
    state === "thinking" ? "animate-omni-think" :
    state === "success" || state === "thumbsup" || state === "celebrate" ? "animate-omni-success" :
    state === "hover" || state === "wave" ? "animate-glow" :
    "animate-breathe";

  const uid = useRef(`omni-${Math.random().toString(36).slice(2, 8)}`).current;

  // Arm/gesture calculations
  const armBaseX = r + bodyR * 0.7;
  const armBaseY = r + bodyR * 0.3;

  return (
    <div ref={containerRef} className="relative" style={{ width: s, height: s + (state === "thumbsup" || state === "wave" || state === "celebrate" ? 8 * scale : 0) }}>
      <svg
        viewBox={`0 0 ${s + 20 * scale} ${s + 12 * scale}`}
        width={s + 20 * scale}
        height={s + 12 * scale}
        className={`transition-all duration-300 ${glowClass}`}
        style={{ marginLeft: -10 * scale, marginTop: -2 * scale }}
      >
        <defs>
          <radialGradient id={`${uid}-body`} cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#2a2a2e" />
            <stop offset="70%" stopColor="#1a1a1e" />
            <stop offset="100%" stopColor="#111113" />
          </radialGradient>
          <radialGradient id={`${uid}-rim`} cx="50%" cy="50%" r="50%">
            <stop offset="85%" stopColor="transparent" />
            <stop offset="95%" stopColor="#ca8a04" stopOpacity={rimOpacity} />
            <stop offset="100%" stopColor="#ca8a04" stopOpacity={rimOpacity * 0.3} />
          </radialGradient>
          <filter id={`${uid}-eye-glow`}>
            <feGaussianBlur stdDeviation={state === "hover" || state === "wave" ? "2" : "1"} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id={`${uid}-ambient`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ca8a04" stopOpacity={state === "hover" || state === "celebrate" ? 0.15 : 0.06} />
            <stop offset="100%" stopColor="#ca8a04" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Center offset for arm space */}
        <g transform={`translate(${10 * scale}, ${2 * scale})`}>
          {/* Ambient glow */}
          <circle cx={r} cy={r} r={bodyR + 6} fill={`url(#${uid}-ambient)`} />

          {/* ── Arm gestures (behind body for some, in front for others) ── */}

          {/* Wave arm — behind body, left side */}
          {state === "wave" && (
            <g className="animate-omni-wave" style={{ transformOrigin: `${r - bodyR * 0.6}px ${r}px` }}>
              <path
                d={`M ${r - bodyR * 0.6} ${r}
                    Q ${r - bodyR - 6 * scale} ${r - 6 * scale}
                      ${r - bodyR - 8 * scale} ${r - 14 * scale}`}
                fill="none"
                stroke="#2a2a2e"
                strokeWidth={4 * scale}
                strokeLinecap="round"
              />
              {/* Hand circle */}
              <circle
                cx={r - bodyR - 8 * scale}
                cy={r - 14 * scale}
                r={3 * scale}
                fill="#2a2a2e"
                stroke="#ca8a04"
                strokeWidth={0.8 * scale}
                strokeOpacity="0.4"
              />
            </g>
          )}

          {/* Main body — dark sphere */}
          <circle cx={r} cy={r} r={bodyR} fill={`url(#${uid}-body)`} />
          <circle cx={r} cy={r} r={bodyR} fill={`url(#${uid}-rim)`} className="transition-all duration-500" />
          <circle cx={r} cy={r + bodyR * 0.15} r={bodyR * 0.85} fill="none" stroke="#000" strokeWidth="0.5" strokeOpacity="0.2" />

          {/* ── Eyes ── */}
          <g filter={`url(#${uid}-eye-glow)`} className="transition-all duration-150">
            {/* Left eye */}
            {(state === "success" || state === "thumbsup" || state === "celebrate") ? (
              <path
                d={`M ${r - eyeSpacing - eyeW} ${eyeY + eyeOffset.y}
                    Q ${r - eyeSpacing} ${eyeY - 3 * scale + eyeOffset.y}
                      ${r - eyeSpacing + eyeW} ${eyeY + eyeOffset.y}`}
                fill="none" stroke="#eab308" strokeWidth={2 * scale} strokeLinecap="round"
                className="transition-all duration-300"
              />
            ) : (
              <rect
                x={r - eyeSpacing - eyeW / 2 + eyeOffset.x}
                y={eyeY - eyeH / 2 + eyeOffset.y}
                width={eyeW} height={eyeH} rx={eyeRx} ry={Math.min(eyeRy, eyeRx)}
                fill={state === "error" ? "#d97706" : "#eab308"}
                opacity={state === "thinking" ? 0.6 : 0.95}
                className="transition-all duration-150"
              />
            )}

            {/* Right eye */}
            {(state === "success" || state === "thumbsup" || state === "celebrate") ? (
              <path
                d={`M ${r + eyeSpacing - eyeW} ${eyeY + eyeOffset.y}
                    Q ${r + eyeSpacing} ${eyeY - 3 * scale + eyeOffset.y}
                      ${r + eyeSpacing + eyeW} ${eyeY + eyeOffset.y}`}
                fill="none" stroke="#eab308" strokeWidth={2 * scale} strokeLinecap="round"
                className="transition-all duration-300"
              />
            ) : state === "error" ? (
              <rect
                x={r + eyeSpacing - eyeW / 2 + eyeOffset.x}
                y={eyeY - eyeH / 2 + eyeOffset.y - 0.5 * scale}
                width={eyeW} height={eyeH} rx={eyeRx} ry={Math.min(eyeRy, eyeRx)}
                fill="#d97706" opacity={0.9}
                transform={`rotate(8, ${r + eyeSpacing + eyeOffset.x}, ${eyeY + eyeOffset.y})`}
                className="transition-all duration-150"
              />
            ) : (
              <rect
                x={r + eyeSpacing - eyeW / 2 + eyeOffset.x}
                y={eyeY - eyeH / 2 + eyeOffset.y}
                width={eyeW} height={eyeH} rx={eyeRx} ry={Math.min(eyeRy, eyeRx)}
                fill="#eab308"
                opacity={state === "thinking" ? 0.6 : 0.95}
                className="transition-all duration-150"
              />
            )}
          </g>

          {/* ── Mouth ── */}
          {showMouth && (state === "success" || state === "thumbsup" || state === "celebrate") && (
            <path
              d={`M ${r - 4 * scale} ${r + 5 * scale}
                  Q ${r} ${r + 8.5 * scale}
                    ${r + 4 * scale} ${r + 5 * scale}`}
              fill="none" stroke="#eab308" strokeWidth={1.2 * scale} strokeLinecap="round" opacity="0.7"
              className="transition-all duration-300"
            />
          )}
          {showMouth && state === "error" && (
            <path
              d={`M ${r - 3 * scale} ${r + 6.5 * scale}
                  Q ${r} ${r + 5 * scale}
                    ${r + 3 * scale} ${r + 6.5 * scale}`}
              fill="none" stroke="#d97706" strokeWidth={1 * scale} strokeLinecap="round" opacity="0.5"
            />
          )}
          {showMouth && (state === "hover" || state === "wave") && (
            <path
              d={`M ${r - 3 * scale} ${r + 5.5 * scale}
                  Q ${r} ${r + 6.5 * scale}
                    ${r + 3 * scale} ${r + 5.5 * scale}`}
              fill="none" stroke="#ca8a04" strokeWidth={0.8 * scale} strokeLinecap="round" opacity="0.4"
            />
          )}

          {/* ── Thinking dots ── */}
          {state === "thinking" && (
            <g>
              <circle cx={r - 5 * scale} cy={r + 7 * scale} r={1.5 * scale} fill="#ca8a04" opacity="0.5" className="animate-bounce-dot-1" />
              <circle cx={r} cy={r + 7 * scale} r={1.5 * scale} fill="#ca8a04" opacity="0.5" className="animate-bounce-dot-2" />
              <circle cx={r + 5 * scale} cy={r + 7 * scale} r={1.5 * scale} fill="#ca8a04" opacity="0.5" className="animate-bounce-dot-3" />
            </g>
          )}

          {/* ── Thumbs up arm — right side, in front of body ── */}
          {state === "thumbsup" && (
            <g className="animate-omni-thumbsup" style={{ transformOrigin: `${armBaseX}px ${armBaseY}px` }}>
              {/* Arm */}
              <path
                d={`M ${armBaseX} ${armBaseY}
                    Q ${r + bodyR + 2 * scale} ${r - 2 * scale}
                      ${r + bodyR + 4 * scale} ${r - 10 * scale}`}
                fill="none" stroke="#2a2a2e" strokeWidth={4 * scale} strokeLinecap="round"
              />
              {/* Fist */}
              <circle
                cx={r + bodyR + 4 * scale}
                cy={r - 10 * scale}
                r={3.5 * scale}
                fill="#2a2a2e"
                stroke="#ca8a04"
                strokeWidth={0.8 * scale}
                strokeOpacity="0.5"
              />
              {/* Thumb — pointing up */}
              <line
                x1={r + bodyR + 4 * scale}
                y1={r - 13.5 * scale}
                x2={r + bodyR + 4 * scale}
                y2={r - 18 * scale}
                stroke="#ca8a04"
                strokeWidth={2 * scale}
                strokeLinecap="round"
                opacity="0.8"
              />
            </g>
          )}

          {/* ── Celebration sparkles ── */}
          {state === "celebrate" && (
            <g>
              {/* Sparkle particles around the body */}
              <circle cx={r - bodyR - 4 * scale} cy={r - 8 * scale} r={1.5 * scale} fill="#eab308" opacity="0.8" className="animate-sparkle-1" />
              <circle cx={r + bodyR + 5 * scale} cy={r - 6 * scale} r={1 * scale} fill="#eab308" opacity="0.7" className="animate-sparkle-2" />
              <circle cx={r - 6 * scale} cy={r - bodyR - 4 * scale} r={1.2 * scale} fill="#fbbf24" opacity="0.6" className="animate-sparkle-3" />
              <circle cx={r + 8 * scale} cy={r - bodyR - 2 * scale} r={1.5 * scale} fill="#fbbf24" opacity="0.8" className="animate-sparkle-1" />
              <circle cx={r - bodyR - 2 * scale} cy={r + 4 * scale} r={0.8 * scale} fill="#eab308" opacity="0.5" className="animate-sparkle-2" />
              <circle cx={r + bodyR + 3 * scale} cy={r + 6 * scale} r={1 * scale} fill="#eab308" opacity="0.6" className="animate-sparkle-3" />
              {/* Star shapes */}
              <text x={r - bodyR - 6 * scale} y={r - 12 * scale} fontSize={6 * scale} fill="#eab308" opacity="0.7" className="animate-sparkle-2">✦</text>
              <text x={r + bodyR + 2 * scale} y={r - 12 * scale} fontSize={5 * scale} fill="#fbbf24" opacity="0.6" className="animate-sparkle-1">✦</text>
              <text x={r} y={r - bodyR - 6 * scale} fontSize={7 * scale} fill="#eab308" opacity="0.8" className="animate-sparkle-3">★</text>
            </g>
          )}

          {/* ── Success ring flash ── */}
          {(state === "success" || state === "celebrate") && (
            <circle cx={r} cy={r} r={bodyR - 1} fill="none" stroke="#eab308" strokeWidth="1.5" opacity="0.4" className="animate-ping-once" />
          )}
        </g>
      </svg>

      {/* Notification badge */}
      {badge && (
        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-yellow-500 animate-pulse-subtle border-2 border-zinc-900" />
      )}
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export default function OmniAvatar({ mode, state, size = 56, onClick, badge, className }: OmniAvatarProps) {
  const [hovered, setHovered] = useState(false);
  const currentState = hovered && state === "idle" ? "hover" : state;

  if (mode === "hidden") return null;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative cursor-pointer transition-transform duration-200 hover:scale-110 active:scale-95 focus:outline-none ${className || ""}`}
      title="Ask Omni"
      aria-label="Ask Omni AI Assistant"
    >
      {mode === "sigil" ? (
        <SigilAvatar state={currentState} size={size} badge={badge} />
      ) : (
        <CharacterAvatar state={currentState} size={size} badge={badge} />
      )}
    </button>
  );
}
