type Option = { value: string; label: string };

const tones = {
  primary: { active: "bg-primary-600 text-white shadow-sm", rest: "text-surface-600 hover:bg-surface-100" },
  ai: { active: "bg-ai-600 text-white shadow-sm", rest: "text-surface-600 hover:bg-surface-100" },
} as const;

export function SegmentedControl({
  options,
  value,
  onChange,
  tone = "primary",
  ariaLabel,
  className = "",
}: {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  tone?: keyof typeof tones;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`inline-flex rounded-xl border border-surface-200 bg-surface-0 p-1 shadow-soft ${className}`}
    >
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              active ? tones[tone].active : tones[tone].rest
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}