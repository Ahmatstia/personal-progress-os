export type ReviewInsightMetrics = {
  learningHours: number;
  tasksCompleted: number;
  understanding: number | null;
};

export function buildInsights(current: ReviewInsightMetrics, previous: ReviewInsightMetrics | null) {
  if (!previous) return [];
  const insights: string[] = [];
  if (current.learningHours > previous.learningHours) insights.push(`You studied ${formatNumber(current.learningHours - previous.learningHours)}h more than last week.`);
  if (current.learningHours < previous.learningHours) insights.push("Learning time decreased compared with last week.");
  if (current.tasksCompleted > previous.tasksCompleted) insights.push(`You completed ${current.tasksCompleted - previous.tasksCompleted} more tasks.`);
  if (current.tasksCompleted < previous.tasksCompleted) insights.push("You completed fewer tasks than last week.");
  if (current.understanding !== null && previous.understanding !== null && current.understanding > previous.understanding) insights.push("Your average understanding improved.");
  if (current.understanding !== null && previous.understanding !== null && current.understanding < previous.understanding) insights.push("Your reported understanding dropped this week.");
  return insights;
}

function formatNumber(value: number) { return Number(value.toFixed(1)); }
