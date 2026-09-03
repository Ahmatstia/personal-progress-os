import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePageUser } from "@/lib/auth";
import { getWeekPeriod, getPeriodMetrics, getPeriodReview } from "@/services/review.service";
import { calculateGoalProgress } from "@/services/progress.service";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { Button } from "@/app/components/ui/Button";
import { ProgressBar } from "@/app/components/ui/Progress";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Icon } from "@/app/components/ui/Icon";
import { formatDuration } from "@/lib/format";
import { NotesTimeline, type TimelineEntry } from "@/app/components/core/NotesTimeline";

export const dynamic = "force-dynamic";

function formatRange(start: Date, end: Date) {
  const fmt = new Intl.DateTimeFormat("id-ID", { month: "short", day: "numeric" });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

export default async function ReviewPage() {
  const user = await requirePageUser();
  const period = getWeekPeriod(new Date());

  const goals = await prisma.goal.findMany({
    where: { userId: user.id, status: { not: "COMPLETED" } },
    orderBy: { updatedAt: "desc" },
    include: {
      stages: {
        orderBy: { order: "asc" },
        include: { tasks: true },
      },
    },
  });

  const [reviewedList, captures, sessionReflections, allPastReviews] = await Promise.all([
    prisma.review.findMany({
      where: {
        goal: { userId: user.id },
        periodStart: period.periodStart,
      },
      select: { goalId: true },
    }),
    prisma.capture.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.session.findMany({
      where: {
        userId: user.id,
        OR: [
          { obstacle: { not: null } },
          { understanding: { not: null } },
        ],
      },
      orderBy: { startedAt: "desc" },
      take: 20,
      include: {
        task: {
          include: {
            stage: {
              include: {
                goal: true,
              },
            },
          },
        },
      },
    }),
    prisma.review.findMany({
      where: {
        goal: { userId: user.id },
      },
      orderBy: { createdAt: "desc" },
      take: 15,
      include: {
        goal: true,
      },
    }),
  ]);

  const reviewed = new Set(reviewedList.map((item) => item.goalId));

  const rows = await Promise.all(
    goals.map(async (goal) => {
      const metrics = await getPeriodMetrics(goal.id, period.periodStart, period.periodEnd, user.id);
      const review = await getPeriodReview(goal.id, period.periodStart, period.periodEnd, user.id);
      return { goal, metrics, review, progress: calculateGoalProgress(goal.stages) };
    }),
  );

  const totalMinutes = rows.reduce((s, r) => s + r.metrics.learningMinutes, 0);
  const totalTasks = rows.reduce((s, r) => s + r.metrics.tasksCompleted, 0);

  // Compile timeline entries
  const timelineEntries: TimelineEntry[] = [
    ...captures.map((c): TimelineEntry => ({
      id: `capture-${c.id}`,
      kind: "capture",
      title: "Catatan Cepat",
      content: c.content,
      timestamp: c.createdAt.toISOString(),
      entityId: c.id,
    })),
    ...sessionReflections.map((s): TimelineEntry => ({
      id: `session-${s.id}`,
      kind: "session",
      title: s.task.name,
      tag: s.task.stage.goal.name,
      subtitle: s.understanding !== null ? `Tingkat pemahaman: ${s.understanding}/5` : undefined,
      content: s.obstacle ? `Hambatan: ${s.obstacle}` : "Sesi belajar selesai dengan evaluasi pemahaman.",
      timestamp: (s.endedAt ?? s.startedAt).toISOString(),
      entityId: s.id,
    })),
    ...allPastReviews.map((r): TimelineEntry => ({
      id: `review-${r.id}`,
      kind: "review",
      title: `Refleksi: ${r.goal.name}`,
      tag: `${formatRange(r.periodStart, r.periodEnd)}`,
      content: [
        r.wentWell ? `🏆 Berjalan baik: ${r.wentWell}` : "",
        r.difficulties ? `⚠️ Tantangan: ${r.difficulties}` : "",
        r.improvements ? `💡 Perbaikan: ${r.improvements}` : "",
        r.nextFocus ? `🎯 Fokus Berikutnya: ${r.nextFocus}` : "",
      ].filter(Boolean).join("\n\n") || "Refleksi mingguan selesai tercatat.",
      timestamp: r.createdAt.toISOString(),
      entityId: r.id,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Review"
        title="Berhenti dan renungkan"
        description="Ritual mingguan yang tenang: pahami apa yang berhasil, apa yang tidak, dan ke mana harus mengarahkan energi Anda berikutnya."
      />

      <section className="relative overflow-hidden border-b border-ai-200/60 pb-10 md:pb-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-ai-100/50 blur-3xl"
        />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ai-600">Minggu ini</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl">
            {formatRange(period.periodStart, period.periodEnd)}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-surface-500">
            {rows.length === 0
              ? "Belum ada goals aktif untuk direview."
              : `${reviewed.size} dari ${rows.length} goals sudah direview minggu ini.`}
          </p>

          {rows.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-ai-100 px-3 py-1 text-xs font-semibold text-ai-700">
                {reviewed.size}/{rows.length} selesai
              </span>
              <span className="h-px w-6 bg-surface-200" aria-hidden="true" />
              <span className="text-sm text-surface-500">{formatDuration(totalMinutes)} fokus</span>
              <span className="text-surface-300">·</span>
              <span className="text-sm text-surface-500">{totalTasks} task selesai</span>
            </div>
          )}
        </div>
      </section>

      {rows.length === 0 ? (
        <div className="border-t border-surface-150 pt-10">
          <EmptyState
            icon="sparkles"
            title="Belum ada yang direview"
            description="Setelah Anda memiliki goal aktif, Anda bisa merefleksikan minggu Anda di sini."
          />
        </div>
      ) : (
        <ol className="divide-y divide-surface-150">
          {rows.map(({ goal, metrics, review, progress }, index) => {
            const done = !!review;
            return (
              <li key={goal.id} className="py-8 sm:py-10">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                          done ? "bg-success-500 text-white" : "bg-surface-200 text-surface-600"
                        }`}
                      >
                        {done ? <Icon name="check" size={15} strokeWidth={3} /> : <span className="font-mono">{index + 1}</span>}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-400">{goal.type}</p>
                        <Link
                          href={`/goals/${goal.id}`}
                          className="block truncate text-xl font-bold text-surface-900 transition hover:text-primary-700 sm:text-2xl"
                        >
                          {goal.name}
                        </Link>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-surface-500">
                      {formatDuration(metrics.learningMinutes)} fokus · {metrics.tasksCompleted} task selesai minggu ini
                    </p>
                  </div>

                  <div className="shrink-0 sm:flex sm:items-center sm:gap-6">
                    {progress < 100 && (
                      <div className="hidden w-24 sm:block">
                        <ProgressBar value={progress} size="sm" tone={done ? "success" : "primary"} />
                      </div>
                    )}
                    <Link href={`/goals/${goal.id}/reviews`}>
                      <Button size="sm" variant={done ? "secondary" : "ai"} icon={done ? "check" : "sparkles"}>
                        {done ? "Sunting review" : "Tulis review"}
                      </Button>
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {/* Timeline Catatan & Refleksi */}
      <div className="border-t border-surface-150 pt-10">
        <NotesTimeline entries={timelineEntries} />
      </div>

      <footer className="max-w-2xl border-t border-surface-150 pt-6">
        <h2 className="font-semibold text-surface-800">Mengapa review mingguan?</h2>
        <p className="mt-2 text-sm leading-6 text-surface-500">
          Review bukanlah rapor. Ini adalah kesempatan untuk melihat apa yang benar-benar bergerak, menyebut apa yang
          menghambat Anda, dan memilih satu fokus yang jelas untuk minggu ke depan — sehingga progres terus bertambah,
          bukan sekadar mengalir begitu saja.
        </p>
      </footer>
    </div>
  );
}