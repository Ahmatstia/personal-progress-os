import { formatDuration } from "../lib/format";

export type ReviewInsightMetrics = {
  learningHours: number;
  tasksCompleted: number;
  understanding: number | null;
};

export function buildInsights(current: ReviewInsightMetrics, previous: ReviewInsightMetrics | null) {
  if (!previous) return [];
  const insights: string[] = [];
  if (current.learningHours > previous.learningHours) insights.push(`Belajar ${formatDuration((current.learningHours - previous.learningHours) * 60)} lebih banyak dibanding minggu lalu.`);
  if (current.learningHours < previous.learningHours) insights.push("Waktu belajar menurun dibanding minggu lalu.");
  if (current.tasksCompleted > previous.tasksCompleted) insights.push(`Menyelesaikan ${current.tasksCompleted - previous.tasksCompleted} task lebih banyak dari minggu lalu.`);
  if (current.tasksCompleted < previous.tasksCompleted) insights.push("Menyelesaikan task lebih sedikit dari minggu lalu.");
  if (current.understanding !== null && previous.understanding !== null && current.understanding > previous.understanding) insights.push("Pemahaman rata-rata Anda meningkat.");
  if (current.understanding !== null && previous.understanding !== null && current.understanding < previous.understanding) insights.push("Pemahaman yang dilaporkan menurun minggu ini.");
  return insights;
}
