import type { ReactNode } from "react";

// Focus Orb — signature component.
// Lingkaran kemajuan untuk satu angka penting: progress goal, persentase fokus,
// atau "waktu berjalan" pada sesi. Satu fokus per orb = satu makna.
// value 0-100. Tanpa value = ring kosong (dipakai timer lewat prop `sweep`
// agar terasa hidup tanpa mengeklaim target durasi).

const tones = {
  primary: { track: "stroke-surface-150", arc: "stroke-primary-500" },
  success: { track: "stroke-surface-150", arc: "stroke-success-500" },
  ai: { track: "stroke-surface-150", arc: "stroke-ai-500" },
  warning: { track: "stroke-surface-150", arc: "stroke-warning-500" },
} as const;

export function FocusOrb({
  value,
  size = 84,
  stroke = 6,
  tone = "primary",
  sweep = false,
  label,
  children,
  className = "",
}: {
  value?: number;
  size?: number;
  stroke?: number;
  tone?: keyof typeof tones;
  sweep?: boolean;
  label?: string;
  children?: ReactNode;
  className?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = value == null ? null : Math.max(0, Math.min(100, value));
  const offset = percent == null ? circumference : circumference * (1 - percent / 100);

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      role={label ? "img" : undefined}
      aria-label={label}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className={tones[tone].track}
        />
        {percent != null && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`${tones[tone].arc} transition-[stroke-dashoffset] duration-700 ease-out`}
          />
        )}
      </svg>
      {sweep && (
        <span aria-hidden="true" className="sweep-dot pointer-events-none absolute inset-0">
          <span className="absolute -top-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-ai-500/80" />
        </span>
      )}
      <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        {children}
      </span>
    </div>
  );
}