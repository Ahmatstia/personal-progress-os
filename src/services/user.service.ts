import { countGoals } from "@/repositories/goal.repository";
import { countTasks } from "@/repositories/task.repository";
import { countSessions } from "@/repositories/session.repository";
import { requireUserId } from "@/lib/ownership";

export type UserAccountStats = {
  goalCount: number;
  taskCount: number;
  sessionCount: number;
};

export async function getUserAccountStats(userId?: string): Promise<UserAccountStats> {
  const owner = requireUserId(userId);
  const [goalCount, taskCount, sessionCount] = await Promise.all([
    countGoals(owner),
    countTasks(owner),
    countSessions(owner),
  ]);

  return {
    goalCount,
    taskCount,
    sessionCount,
  };
}
