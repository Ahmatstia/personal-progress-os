import Link from "next/link";
import { Icon } from "../ui/Icon";
import { StartSessionButton } from "./StartSessionButton";
import { FocusOrb } from "./FocusOrb";

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
      className={`relative overflow-hidden rounded-2xl hero-border-animated p-5 sm:p-6 ${className}`}
      style={{ background: "linear-gradient(145deg, #ffffff 0%, #f8f7ff 50%, #faf9ff 100%)" }}
    >
      {/* Ambient orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-gradient-to-br from-primary-100/70 to-ai-100/50 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-gradient-to-tr from-primary-50/60 to-ai-50/40 blur-2xl"
      />

      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-ai-500 text-white">
              <Icon name="bolt" size={14} />
            </span>
            <p className="eyebrow text-primary-700">Aksi berikutnya</p>
            {inSession && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success-100 px-2.5 py-0.5 text-[10px] font-bold text-success-700 border border-success-200">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success-500" />
                Aktif
              </span>
            )}
          </div>
          {progress != null && (
            <FocusOrb
              value={progress}
              size={52}
              stroke={5}
              tone="primary"
              label={`Progress ${Math.round(progress)} persen`}
            >
              <span className="text-[13px] font-bold text-surface-900">
                {Math.round(progress)}%
              </span>
            </FocusOrb>
          )}
        </div>

        {!nextAction ? (
          <div className="mt-4">
            <h2 className="text-xl font-bold text-surface-900">Semua sudah jelas</h2>
            <p className="mt-1.5 max-w-md text-[13px] text-surface-500">
              Tidak ada aksi berikutnya. Buat task atau lengkapi review untuk menjaga momentum.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/today"
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-4 text-[13px] font-semibold text-white transition hover:from-primary-700 hover:to-ai-600 shine-parent overflow-hidden"
              >
                <Icon name="sun" size={14} /> Ke Hari Ini
              </Link>
              <Link
                href="/goals"
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-surface-200 bg-white px-4 text-[13px] font-semibold text-surface-700 transition hover:border-primary-200 hover:bg-primary-50"
              >
                <Icon name="target" size={14} /> Ke Goals
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-surface-400">
              Kerjakan ini berikutnya
            </p>
            <h2 className="mt-1 text-xl font-bold leading-tight text-surface-900 sm:text-2xl">
              {nextAction.taskName}
            </h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="chip bg-primary-50 text-primary-700 border border-primary-100">
                {nextAction.goalName}
              </span>
              <span className="text-surface-300" aria-hidden="true">·</span>
              <span className="chip bg-surface-100 text-surface-600">
                {nextAction.stageName}
              </span>
              {nextAction.estimatedMinutes != null &&
                nextAction.estimatedMinutes > 0 && (
                  <span className="chip bg-surface-50 text-surface-500 border border-surface-150">
                    <Icon name="clock" size={10} />
                    {nextAction.estimatedMinutes >= 60
                      ? `${(nextAction.estimatedMinutes / 60).toFixed(
                          nextAction.estimatedMinutes % 60 === 0 ? 0 : 1,
                        )} jam`
                      : `${nextAction.estimatedMinutes} mnt`}
                  </span>
                )}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <StartSessionButton
                taskId={nextAction.taskId}
                taskName={nextAction.taskName}
              />
              <Link
                href={`/tasks/${nextAction.taskId}`}
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-surface-200 bg-white px-4 text-[13px] font-semibold text-surface-700 transition hover:border-primary-200 hover:bg-primary-50"
              >
                <Icon name="arrowRight" size={14} /> Buka task
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}