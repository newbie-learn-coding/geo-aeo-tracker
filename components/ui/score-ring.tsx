"use client";

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function ScoreRing({ score, size = 80, strokeWidth = 6, label }: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;

  const color =
    clamped >= 80
      ? "var(--accent-success)"
      : clamped >= 50
        ? "var(--accent-warning)"
        : "var(--accent-error)";

  const glowColor =
    clamped >= 80
      ? "rgba(16, 185, 129, 0.35)"
      : clamped >= 50
        ? "rgba(245, 158, 11, 0.35)"
        : "rgba(239, 68, 68, 0.35)";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--th-score-ring-bg)"
            strokeWidth={strokeWidth}
          />
          {/* Score arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 0.8s ease-out, stroke 0.3s ease",
              filter: `drop-shadow(0 0 6px ${glowColor})`,
            }}
          />
        </svg>
        {/* Center score */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ color }}
        >
          <span
            className="font-semibold tabular-nums"
            style={{ fontSize: size * 0.28 }}
          >
            {Math.round(clamped)}
          </span>
        </div>
      </div>
      {label && (
        <span className="text-xs text-[var(--text-tertiary)] text-center">
          {label}
        </span>
      )}
    </div>
  );
}
