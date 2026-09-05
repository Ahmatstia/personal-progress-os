import { requirePageUser } from "@/lib/auth";
import {
  getInsightsAnalytics,
  getPrioritizedTasks,
  getInsightsDailyPlan,
  getInsightsConflicts,
  getInsightsUnifiedInbox,
  getInsightsLifeHealth,
} from "@/services/insights/insights.service";
import InsightsDashboard from "./InsightsDashboard";

export default async function InsightsPage() {
  const user = await requirePageUser();
  const now = new Date();

  const [analytics, priority, dailyPlan, conflicts, inbox, health] = await Promise.all([
    getInsightsAnalytics("this_week", undefined, undefined, user.id),
    getPrioritizedTasks({ limit: 20, includeCompleted: false }, user.id),
    getInsightsDailyPlan(now, user.id),
    getInsightsConflicts(now, 1, user.id),
    getInsightsUnifiedInbox("ALL", 50, user.id),
    getInsightsLifeHealth(30, user.id),
  ]);

  return (
    <main className="container-app py-6 md:py-8">
      <InsightsDashboard
        initialAnalytics={analytics}
        initialPriority={priority}
        initialDailyPlan={dailyPlan}
        initialConflicts={conflicts}
        initialInbox={inbox}
        initialHealth={health}
      />
    </main>
  );
}
