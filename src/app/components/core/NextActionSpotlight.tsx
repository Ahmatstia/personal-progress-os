import Link from "next/link";
import { Icon } from "../ui/Icon";
import { StartSessionButton } from "./StartSessionButton";
import { FocusOrb } from "./FocusOrb";

// Next Action Spotlight — signature component.
// Objek utama yang menceritakan "Apa yang harus saya kerjakan sekarang?"
// Satu spotlight per halaman; bukan katalog card.

export function NextActionSpotlight({
  nextAction,
  progress,
  className = "",
}: {
  nextAction: {
    taskId: string;
    goalId: string;
    goalName: string;
    stageName: string;
    taskName: string;
    priority?: string;
    estimatedHours?: number;
    estimatedMinutes?: number;
    startedAt?: Date | null;
    reason?: string;
  } | null;
  progress?: number | null;
  className?: string;
}) {
  const inSession = nextAction?.reason === "ACTIVE_SESSION";

  return (
    <section
      className={`relative overflow-hidden rounded-3xl border border-primary-200/70 bg-surface-0 p-6 shadow-raised sm:p-7 ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-primary-100/50 blur-3xl"
      />
      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-2 text-primary-700">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100">
              <Icon name="bolt" size={16} />
            </span>
            <p className="eyebrow">Aksi berikutnya</p>
          </div>
          {progress != null && (
            <FocusOrb
              value={progress}
              size={56}
              stroke={5}
              tone="primary"
              label={`Progress goal ${Math.round(progress)} persen`}
            >
              <span className="text-sm font-bold text-surface-900">
                {Math.round(progress)}%
              </span>
            </FocusOrb>
          )}
        </div>

        {!nextAction ? (
          <div className="mt-5">
            <h2 className="text-xl font-semibold text-surface-900">
              Semua sudah jelas
            </h2>
            <p className="mt-2 max-w-md text-sm text-surface-500">
              Tidak ada aksi berikutnya yang harus dikerjakan. Buat task atau
              lengkapi review untuk menjaga momentum.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href="/today"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white transition hover:bg-primary-700"
              >
                <Icon name="sun" size={16} /> Ke Hari Ini
              </Link>
              <Link
                href="/goals"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-surface-200 bg-surface-0 px-4 text-sm font-semibold text-surface-700 transition hover:bg-surface-100"
              >
                <Icon name="target" size={16} /> Ke Goals
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <p className="text-xs font-medium uppercase tracking-wider text-surface-400">
              Kerjakan ini berikutnya
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold leading-tight text-surface-900 sm:text-3xl">
                {nextAction.taskName}
              </h2>
              {inSession && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success-100 px-2.5 py-0.5 text-[11px] font-semibold text-success-700">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success-600" />
                  Sesi berlangsung
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-surface-500">
              {nextAction.goalName}
              <span className="mx-1.5 text-surface-300">·</span>
              {nextAction.stageName}
            </p>

            {nextAction.estimatedMinutes != null && nextAction.estimatedMinutes > 0 && (
              <p className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-surface-200 bg-surface-50 px-3 py-1 text-xs font-medium text-surface-600">
                <Icon name="clock" size={14} />
                ±{" "}
                {nextAction.estimatedMinutes >= 60
                  ? `${(nextAction.estimatedMinutes / 60).toFixed(
                      nextAction.estimatedMinutes % 60 === 0 ? 0 : 1,
                    )} jam`
                  : `${nextAction.estimatedMinutes} menit`}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <StartSessionButton taskId={nextAction.taskId} taskName={nextAction.taskName} />
              <Link
                href={`/tasks/${nextAction.taskId}`}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-surface-200 bg-surface-0 px-4 text-sm font-semibold text-surface-700 transition hover:bg-surface-100"
              >
                <Icon name="arrowRight" size={16} /> Buka task
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}