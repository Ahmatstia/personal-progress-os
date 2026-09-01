import {
  createSession,
  endSession as endSessionRecord,
  findActiveSessionByTaskId,
  findSessionById,
  findSessionsByTaskId,
  findTaskForSession,
  markTaskInProgress,
  sumCompletedSessionMinutes,
  updateTaskActualHours as updateTaskActualHoursRecord,
} from "@/repositories/session.repository";
import type { EndSessionInput } from "@/schemas/session.schema";

export class SessionServiceError extends Error {
  constructor(
    message: string,
    public readonly code: "TASK_NOT_FOUND" | "ACTIVE_SESSION_EXISTS" | "SESSION_NOT_FOUND" | "SESSION_ALREADY_ENDED",
  ) {
    super(message);
  }
}

export function calculateDuration(startedAt: Date, endedAt: Date = new Date()) {
  return Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 60000));
}

export async function startSession(taskId: string) {
  const task = await findTaskForSession(taskId);
  if (!task) {
    throw new SessionServiceError("Task tidak ditemukan.", "TASK_NOT_FOUND");
  }

  if (await findActiveSessionByTaskId(taskId)) {
    throw new SessionServiceError(
      "Task ini sudah memiliki session aktif.",
      "ACTIVE_SESSION_EXISTS",
    );
  }

  const session = await createSession(taskId);
  if (task.status === "NOT_STARTED") {
    await markTaskInProgress(taskId, task.startedAt ?? session.startedAt);
  }

  return session;
}

export function getActiveSession(taskId: string) {
  return findActiveSessionByTaskId(taskId);
}

export function getSession(sessionId: string) {
  return findSessionById(sessionId);
}

export function getSessionHistory(taskId: string) {
  return findSessionsByTaskId(taskId);
}

export async function updateTaskActualHours(taskId: string) {
  const result = await sumCompletedSessionMinutes(taskId);
  const actualHours = (result._sum.durationMinutes ?? 0) / 60;
  await updateTaskActualHoursRecord(taskId, actualHours);
  return actualHours;
}

export async function endSession(sessionId: string, data: EndSessionInput) {
  const session = await findSessionById(sessionId);
  if (!session) {
    throw new SessionServiceError("Session tidak ditemukan.", "SESSION_NOT_FOUND");
  }
  if (session.endedAt) {
    throw new SessionServiceError(
      "Session ini sudah selesai.",
      "SESSION_ALREADY_ENDED",
    );
  }

  const endedAt = new Date();
  const completedSession = await endSessionRecord(sessionId, {
    endedAt,
    durationMinutes: calculateDuration(session.startedAt, endedAt),
    activity: data.activity || undefined,
    understanding: data.understanding,
    obstacle: data.obstacle || undefined,
    nextAction: data.nextAction || undefined,
  });

  await updateTaskActualHours(session.taskId);
  return completedSession;
}
