import type { LifeHealthResult, LifeHealthStatus, LifeHealthComponent } from "./insights-types";

export interface LifeHealthMetricsInput {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  activeGoals: number;
  completedGoals: number;
  totalSessions: number;
  totalSessionMinutes: number;
  activeDays: number;
  daysInPeriod: number;
  areasCount: number;
  areasWithActivity: number;
  currentStreak: number;
}

export function calculateLifeHealth(input: LifeHealthMetricsInput, evaluatedAt = new Date()): LifeHealthResult {
  const {
    totalTasks,
    completedTasks,
    overdueTasks,
    activeGoals,
    completedGoals,
    totalSessions,
    totalSessionMinutes,
    activeDays,
    daysInPeriod,
    areasCount,
    areasWithActivity,
  } = input;

  const strengths: string[] = [];
  const warnings: string[] = [];

  // 1. Task Completion (0 - 25 points)
  let taskCompletionScore = 0;
  if (totalTasks === 0) {
    taskCompletionScore = 15; // neutral baseline for new user
  } else {
    const rate = completedTasks / totalTasks;
    taskCompletionScore = Math.round(rate * 25);
    if (rate >= 0.7) strengths.push(`Tingkat penyelesaian task sangat baik (${Math.round(rate * 100)}%)`);
    else if (rate < 0.3 && totalTasks >= 5) warnings.push("Banyak task yang belum selesai diselesaikan");
  }
  const taskCompletionComp: LifeHealthComponent = {
    key: "taskCompletion",
    label: "Penyelesaian Task",
    score: taskCompletionScore,
    maxScore: 25,
    status: taskCompletionScore >= 18 ? "GOOD" : taskCompletionScore >= 12 ? "FAIR" : "POOR",
    details: `${completedTasks} dari ${totalTasks} task selesai`,
  };

  // 2. Overdue Burden (0 - 20 points)
  let overdueScore = 20;
  if (overdueTasks > 0) {
    overdueScore = Math.max(0, 20 - overdueTasks * 4);
    if (overdueTasks >= 3) {
      warnings.push(`Terdapat ${overdueTasks} task yang telah melewati tenggat waktu`);
    }
  } else if (totalTasks > 0) {
    strengths.push("Semua task tepat waktu, tidak ada tunggakan tenggat");
  }
  const overdueComp: LifeHealthComponent = {
    key: "overdueBurden",
    label: "Beban Tenggat Waktu",
    score: overdueScore,
    maxScore: 20,
    status: overdueScore >= 16 ? "GOOD" : overdueScore >= 10 ? "FAIR" : "POOR",
    details: overdueTasks === 0 ? "Nol task terlambat" : `${overdueTasks} task melewati batas waktu`,
  };

  // 3. Execution Consistency (0 - 20 points)
  const days = Math.max(1, daysInPeriod);
  const consistencyRatio = Math.min(1, activeDays / Math.min(days, 30));
  const consistencyScore = Math.round(consistencyRatio * 20);
  if (consistencyRatio >= 0.6) {
    strengths.push(`Konsistensi eksekusi tinggi (${activeDays} hari aktif dalam periode)`);
  } else if (consistencyRatio < 0.2 && days >= 7) {
    warnings.push("Frekuensi eksekusi harian masih jarang");
  }
  const consistencyComp: LifeHealthComponent = {
    key: "executionConsistency",
    label: "Konsistensi Eksekusi",
    score: consistencyScore,
    maxScore: 20,
    status: consistencyScore >= 14 ? "GOOD" : consistencyScore >= 8 ? "FAIR" : "POOR",
    details: `${activeDays} hari aktif tercatat dalam ${days} hari`,
  };

  // 4. Focus Session Activity (0 - 15 points)
  let sessionScore = 0;
  if (totalSessions >= 10 || totalSessionMinutes >= 250) {
    sessionScore = 15;
    strengths.push(`Waktu fokus produktif signifikan (${Math.round(totalSessionMinutes / 60)} jam)`);
  } else if (totalSessions >= 5 || totalSessionMinutes >= 120) {
    sessionScore = 10;
  } else if (totalSessions >= 1) {
    sessionScore = 5;
  } else {
    warnings.push("Belum ada sesi fokus tercatat dalam periode ini");
  }
  const sessionComp: LifeHealthComponent = {
    key: "sessionActivity",
    label: "Aktivitas Sesi Fokus",
    score: sessionScore,
    maxScore: 15,
    status: sessionScore >= 12 ? "GOOD" : sessionScore >= 8 ? "FAIR" : "POOR",
    details: `${totalSessions} sesi fokus (${Math.round(totalSessionMinutes)} menit)`,
  };

  // 5. Goal Progress (0 - 10 points)
  let goalScore = 0;
  const totalGoals = activeGoals + completedGoals;
  if (totalGoals === 0) {
    goalScore = 6;
  } else {
    const goalProgressRatio = (completedGoals * 1.0 + activeGoals * 0.5) / totalGoals;
    goalScore = Math.round(goalProgressRatio * 10);
    if (completedGoals > 0) strengths.push(`${completedGoals} Goal besar telah berhasil dicapai`);
  }
  const goalComp: LifeHealthComponent = {
    key: "goalProgress",
    label: "Kemajuan Goal",
    score: goalScore,
    maxScore: 10,
    status: goalScore >= 7 ? "GOOD" : goalScore >= 4 ? "FAIR" : "POOR",
    details: `${activeGoals} Goal aktif, ${completedGoals} Goal selesai`,
  };

  // 6. Area Balance (0 - 10 points)
  let areaScore = 0;
  if (areasCount <= 1) {
    areaScore = 8; // Neutral if user hasn't created multiple areas yet
  } else {
    const balanceRatio = areasWithActivity / areasCount;
    areaScore = Math.round(balanceRatio * 10);
    if (balanceRatio >= 0.75) strengths.push("Keseimbangan domain hidup terjaga dengan baik");
    else if (balanceRatio < 0.4) warnings.push("Sebagian besar domain kehidupan (Area) belum tersentuh aktivitas");
  }
  const areaComp: LifeHealthComponent = {
    key: "areaBalance",
    label: "Keseimbangan Area",
    score: areaScore,
    maxScore: 10,
    status: areaScore >= 7 ? "GOOD" : areaScore >= 4 ? "FAIR" : "POOR",
    details: `${areasWithActivity} dari ${areasCount} Area aktif tersentuh aksi`,
  };

  // Aggregate Overall Score (0 - 100)
  const overallScore = Math.min(
    100,
    Math.max(
      0,
      taskCompletionScore + overdueScore + consistencyScore + sessionScore + goalScore + areaScore
    )
  );

  let status: LifeHealthStatus = "CRITICAL";
  if (overallScore >= 80) status = "EXCELLENT";
  else if (overallScore >= 65) status = "GOOD";
  else if (overallScore >= 45) status = "ATTENTION";

  if (strengths.length === 0) {
    strengths.push("Sistem siap menerima eksekusi harian Anda");
  }

  return {
    overallScore,
    status,
    components: {
      taskCompletion: taskCompletionComp,
      overdueBurden: overdueComp,
      executionConsistency: consistencyComp,
      sessionActivity: sessionComp,
      goalProgress: goalComp,
      areaBalance: areaComp,
    },
    strengths,
    warnings,
    evaluatedAt,
  };
}
