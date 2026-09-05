"use client";

import { useState } from "react";
import Link from "next/link";
import type {
  AnalyticsSummary,
  PrioritizedTask,
  DailyPlanRecommendation,
  TimeConflict,
  UnifiedInboxSummary,
  LifeHealthResult,
  InsightPeriod,
} from "@/services/insights/insights-types";

interface InsightsDashboardProps {
  initialAnalytics: AnalyticsSummary;
  initialPriority: PrioritizedTask[];
  initialDailyPlan: DailyPlanRecommendation;
  initialConflicts: TimeConflict[];
  initialInbox: UnifiedInboxSummary;
  initialHealth: LifeHealthResult;
}

export default function InsightsDashboard({
  initialAnalytics,
  initialPriority,
  initialDailyPlan,
  initialConflicts,
  initialInbox,
  initialHealth,
}: InsightsDashboardProps) {
  const [period, setPeriod] = useState<InsightPeriod>("this_week");
  const [analytics, setAnalytics] = useState<AnalyticsSummary>(initialAnalytics);
  const [loadingPeriod, setLoadingPeriod] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "priority" | "daily_plan" | "inbox" | "analytics">("overview");

  async function handlePeriodChange(newPeriod: InsightPeriod) {
    setPeriod(newPeriod);
    setLoadingPeriod(true);
    try {
      const res = await fetch(`/api/insights/analytics?period=${newPeriod}`);
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch {
      // Keep previous state on error
    } finally {
      setLoadingPeriod(false);
    }
  }

  const healthColor =
    initialHealth.status === "EXCELLENT"
      ? "text-emerald-500 bg-emerald-50 border-emerald-200"
      : initialHealth.status === "GOOD"
      ? "text-blue-500 bg-blue-50 border-blue-200"
      : initialHealth.status === "ATTENTION"
      ? "text-amber-500 bg-amber-50 border-amber-200"
      : "text-rose-500 bg-rose-50 border-rose-200";

  return (
    <div className="space-y-8">
      {/* Header & Navigation Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-surface-900">Life Intelligence & Insights</h1>
          <p className="mt-1 text-sm text-surface-600">
            Analisis deterministik komprehensif atas eksekusi, prioritas, jadwal, dan kesehatan hidup Anda.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1 rounded-xl bg-surface-100 p-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "overview" ? "bg-white text-surface-900 shadow-sm" : "text-surface-600 hover:text-surface-900"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("priority")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "priority" ? "bg-white text-surface-900 shadow-sm" : "text-surface-600 hover:text-surface-900"
            }`}
          >
            Smart Priority ({initialPriority.length})
          </button>
          <button
            onClick={() => setActiveTab("daily_plan")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "daily_plan" ? "bg-white text-surface-900 shadow-sm" : "text-surface-600 hover:text-surface-900"
            }`}
          >
            Daily Plan
          </button>
          <button
            onClick={() => setActiveTab("inbox")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "inbox" ? "bg-white text-surface-900 shadow-sm" : "text-surface-600 hover:text-surface-900"
            }`}
          >
            Unified Inbox ({initialInbox.counts.total})
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "analytics" ? "bg-white text-surface-900 shadow-sm" : "text-surface-600 hover:text-surface-900"
            }`}
          >
            Analytics
          </button>
        </div>
      </div>

      {/* Conflict Alert Banner if any */}
      {initialConflicts.length > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-rose-900">
                Terdeteksi {initialConflicts.length} Konflik Waktu Jadwal
              </h3>
              <ul className="mt-2 space-y-1 text-xs text-rose-700">
                {initialConflicts.map((c) => (
                  <li key={c.id} className="flex items-center gap-2">
                    <span className="font-semibold uppercase">[{c.severity}]</span>
                    <span>{c.explanation}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/calendar"
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-xs hover:bg-rose-100"
            >
              Buka Kalender
            </Link>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB 1: OVERVIEW */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Top Grid: Life Health + Quick Intelligence Stats */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Life Health Card */}
            <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-surface-500">Life Health Index</span>
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${healthColor}`}>
                  {initialHealth.status}
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-5xl font-extrabold text-surface-900">{initialHealth.overallScore}</span>
                <span className="text-sm font-semibold text-surface-500">/ 100</span>
              </div>
              <p className="mt-2 text-xs text-surface-600">
                Indeks operasional kehidupan berdasarkan keteraturan eksekusi, ketepatan tenggat, dan fokus.
              </p>

              {/* Progress bars for components */}
              <div className="mt-4 space-y-2.5">
                {Object.values(initialHealth.components).map((comp) => (
                  <div key={comp.key}>
                    <div className="flex justify-between text-[11px] font-medium text-surface-600">
                      <span>{comp.label}</span>
                      <span>
                        {comp.score}/{comp.maxScore}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-100">
                      <div
                        className="h-full bg-brand-500 rounded-full transition-all"
                        style={{ width: `${(comp.score / comp.maxScore) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths & Action Warnings */}
            <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm md:col-span-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-surface-500">Diagnostik Operasional</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                    <span>✨</span> Kekuatan Teridentifikasi
                  </h4>
                  <ul className="mt-2 space-y-2 text-xs text-surface-700">
                    {initialHealth.strengths.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-2 rounded-lg bg-emerald-50/50 p-2 border border-emerald-100">
                        <span className="text-emerald-500">✓</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                    <span>⚠️</span> Area Perhatian
                  </h4>
                  <ul className="mt-2 space-y-2 text-xs text-surface-700">
                    {initialHealth.warnings.length > 0 ? (
                      initialHealth.warnings.map((w, idx) => (
                        <li key={idx} className="flex items-start gap-2 rounded-lg bg-amber-50/50 p-2 border border-amber-100">
                          <span className="text-amber-500">!</span>
                          <span>{w}</span>
                        </li>
                      ))
                    ) : (
                      <li className="p-2 text-xs text-surface-500 italic">Tidak ada peringatan kritis saat ini.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Section: Top 5 Smart Priorities */}
          <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-surface-100">
              <div>
                <h2 className="text-base font-bold text-surface-900">Task Prioritas Tertinggi Saat Ini</h2>
                <p className="text-xs text-surface-500">
                  Dihitung secara deterministik berdasarkan urgensi tenggat, prioritas, dan keselarasan Goal.
                </p>
              </div>
              <button
                onClick={() => setActiveTab("priority")}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                Lihat Semua ({initialPriority.length}) →
              </button>
            </div>

            <div className="mt-4 divide-y divide-surface-100">
              {initialPriority.slice(0, 5).map((pt) => (
                <div key={pt.task.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        pt.urgency === "CRITICAL"
                          ? "bg-rose-100 text-rose-800"
                          : pt.urgency === "HIGH"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      Skor {pt.score}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-surface-900">{pt.task.title}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-surface-500">
                        {pt.reasons.map((r, i) => (
                          <span key={i} className="rounded bg-surface-100 px-1.5 py-0.5">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Link
                      href="/today"
                      className="rounded-lg bg-surface-100 px-3 py-1 text-xs font-semibold text-surface-700 hover:bg-surface-200"
                    >
                      Buka di Today
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB 2: SMART PRIORITY */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === "priority" && (
        <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-surface-900">Urutan Prioritas Kerja Transparan (Deterministic)</h2>
            <p className="text-xs text-surface-500">
              Sistem menghitung pembobotan murni matematis tanpa AI untuk memastikan Anda selalu mengerjakan hal yang paling bernilai.
            </p>
          </div>

          <div className="divide-y divide-surface-100">
            {initialPriority.map((pt, idx) => (
              <div key={pt.task.id} className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-100 text-xs font-bold text-surface-600">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-surface-900">{pt.task.title}</h4>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded bg-brand-50 px-2 py-0.5 font-bold text-brand-700">
                          Skor: {pt.score}
                        </span>
                        <span className="text-surface-400">·</span>
                        <span className="text-surface-600">Status: {pt.task.status}</span>
                        {pt.task.goal && (
                          <>
                            <span className="text-surface-400">·</span>
                            <span className="text-surface-600">Goal: {pt.task.goal.title}</span>
                          </>
                        )}
                        {pt.task.project && (
                          <>
                            <span className="text-surface-400">·</span>
                            <span className="text-surface-600">Project: {pt.task.project.title}</span>
                          </>
                        )}
                      </div>

                      {/* Reasons explanation */}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {pt.reasons.map((reason, rIdx) => (
                          <span
                            key={rIdx}
                            className="rounded-md border border-surface-200 bg-surface-50 px-2 py-0.5 text-[11px] font-medium text-surface-700"
                          >
                            ✓ {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/today`}
                    className="rounded-lg border border-surface-200 px-3 py-1.5 text-xs font-semibold text-surface-700 hover:bg-surface-50"
                  >
                    Eksekusi
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB 3: DAILY PLAN */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === "daily_plan" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-surface-900">Rencana Eksekusi Hari Ini (Daily Plan)</h2>
            <p className="text-xs text-surface-500">
              Sintesis rekomendasi fokus, agenda kalender, dan task penting tanpa mengubah database.
            </p>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {/* Focus Section */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600">
                  Daily Focus ({initialDailyPlan.focusTasks.length})
                </h3>
                {initialDailyPlan.focusTasks.length > 0 ? (
                  <div className="space-y-2">
                    {initialDailyPlan.focusTasks.map((f) => (
                      <div key={f.task.id} className="rounded-xl border border-brand-200 bg-brand-50/40 p-3">
                        <p className="text-sm font-semibold text-surface-900">{f.task.title}</p>
                        <p className="mt-1 text-xs text-brand-700">Skor: {f.score} · {f.reasons.join(", ")}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-surface-500 italic">Belum ada Daily Focus dipilih untuk hari ini.</p>
                )}

                {/* Recommended Next Actions */}
                <h3 className="text-xs font-bold uppercase tracking-wider text-surface-500 pt-4">
                  Rekomendasi Tambahan ({initialDailyPlan.recommendedTasks.length})
                </h3>
                <div className="space-y-2">
                  {initialDailyPlan.recommendedTasks.map((rec) => (
                    <div key={rec.task.id} className="rounded-xl border border-surface-200 bg-surface-50/50 p-3">
                      <p className="text-sm font-medium text-surface-900">{rec.task.title}</p>
                      <p className="mt-1 text-[11px] text-surface-500">{rec.reasons.join(" · ")}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scheduled Calendar Agenda */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-surface-500">
                  Agenda Kalender Hari Ini ({initialDailyPlan.scheduledEvents.length})
                </h3>
                {initialDailyPlan.scheduledEvents.length > 0 ? (
                  <div className="space-y-2">
                    {initialDailyPlan.scheduledEvents.map((ev) => (
                      <div key={ev.id} className="rounded-xl border border-surface-200 bg-white p-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-surface-900">{ev.title}</span>
                          <span className="rounded bg-surface-100 px-2 py-0.5 text-[10px] font-bold text-surface-600">
                            {ev.eventType}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-surface-500">
                          {new Date(ev.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                          {new Date(ev.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-surface-500 italic">Tidak ada agenda kalender terjadwal hari ini.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB 4: UNIFIED INBOX */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === "inbox" && (
        <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-surface-900">Unified Attention Inbox</h2>
              <p className="text-xs text-surface-500">
                Penyatuan seluruh item yang memerlukan perhatian: capture baru, task terlambat, review, dan konflik.
              </p>
            </div>
          </div>

          <div className="mt-4 divide-y divide-surface-100">
            {initialInbox.items.length > 0 ? (
              initialInbox.items.map((item) => (
                <div key={item.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 rounded px-2 py-0.5 text-[10px] font-bold ${
                        item.priority === "URGENT"
                          ? "bg-rose-100 text-rose-800"
                          : item.priority === "HIGH"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-surface-100 text-surface-700"
                      }`}
                    >
                      {item.source}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-surface-900">{item.title}</p>
                      {item.description && <p className="mt-0.5 text-xs text-surface-500">{item.description}</p>}
                    </div>
                  </div>

                  <Link
                    href={item.actionUrl}
                    className="rounded-lg bg-surface-100 px-3 py-1.5 text-xs font-semibold text-surface-700 hover:bg-surface-200 self-end sm:self-center"
                  >
                    {item.actionLabel}
                  </Link>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-surface-500 italic">Inbox bersih! Tidak ada item yang tertunda.</p>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB 5: ANALYTICS & TRENDS */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          {/* Period selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-surface-600">Periode:</span>
            {(["today", "this_week", "this_month"] as InsightPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                disabled={loadingPeriod}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                  period === p ? "bg-brand-600 text-white" : "bg-surface-100 text-surface-700 hover:bg-surface-200"
                }`}
              >
                {p === "today" ? "Hari Ini" : p === "this_week" ? "Minggu Ini" : "Bulan Ini"}
              </button>
            ))}
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-xs">
              <span className="text-xs font-bold uppercase text-surface-500">Waktu Sesi Fokus</span>
              <p className="mt-2 text-2xl font-bold text-surface-900">{analytics.sessions.totalHours} Jam</p>
              <p className="mt-1 text-xs text-surface-500">{analytics.sessions.totalCount} sesi tercatat</p>
            </div>

            <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-xs">
              <span className="text-xs font-bold uppercase text-surface-500">Task Selesai</span>
              <p className="mt-2 text-2xl font-bold text-surface-900">{analytics.tasks.completed}</p>
              <p className="mt-1 text-xs text-surface-500">Tingkat selesai: {analytics.tasks.completionRate}%</p>
            </div>

            <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-xs">
              <span className="text-xs font-bold uppercase text-surface-500">Goals Aktif</span>
              <p className="mt-2 text-2xl font-bold text-surface-900">{analytics.goals.active}</p>
              <p className="mt-1 text-xs text-surface-500">{analytics.goals.completed} goal telah tercapai</p>
            </div>

            <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-xs">
              <span className="text-xs font-bold uppercase text-surface-500">Task Terlambat</span>
              <p className="mt-2 text-2xl font-bold text-rose-600">{analytics.tasks.overdue}</p>
              <p className="mt-1 text-xs text-surface-500">Memerlukan penyesuaian jadwal</p>
            </div>
          </div>

          {/* Goal & Area Progress Breakdown */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Goal Progress */}
            <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-xs">
              <h3 className="text-sm font-bold text-surface-900">Kemajuan per Goal</h3>
              <div className="mt-4 space-y-3">
                {analytics.goalProgress.length > 0 ? (
                  analytics.goalProgress.map((gp) => (
                    <div key={gp.goalId} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-surface-700">
                        <span>{gp.title}</span>
                        <span>{gp.completionPercentage}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-100">
                        <div
                          className="h-full bg-brand-500 rounded-full"
                          style={{ width: `${gp.completionPercentage}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-surface-500 italic">Belum ada Goal aktif.</p>
                )}
              </div>
            </div>

            {/* Area Distribution */}
            <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-xs">
              <h3 className="text-sm font-bold text-surface-900">Distribusi per Area Kehidupan</h3>
              <div className="mt-4 space-y-3">
                {analytics.areaDistribution.length > 0 ? (
                  analytics.areaDistribution.map((ar) => (
                    <div key={ar.areaId} className="flex items-center justify-between rounded-lg bg-surface-50 p-2.5">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: ar.color }} />
                        <span className="text-xs font-semibold text-surface-800">{ar.name}</span>
                      </div>
                      <div className="text-xs text-surface-600">
                        {ar.taskCount} task · {ar.completedTaskCount} selesai
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-surface-500 italic">Belum ada Area kehidupan dibuat.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
