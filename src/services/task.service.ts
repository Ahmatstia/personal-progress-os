import { findTaskDetail } from "@/repositories/task.repository";
import { getActiveSession } from "@/services/session.service";

export async function getTaskDetail(id: string) {
  const task = await findTaskDetail(id);
  if (!task) return null;

  const activeSession = await getActiveSession(id);
  return { task, activeSession };
}
