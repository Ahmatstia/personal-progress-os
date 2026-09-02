import {
  createSession,
  endSession as endSessionRecord,
  findActiveSessionByTaskId,
  findAnyActiveSession,
  findSessionById,
  findSessionsByTaskId,
  findTaskForSession,
  markTaskInProgress,
  recomputeTaskActualHours,
  deleteSessionById,
} from "@/repositories/session.repository";
import type { EndSessionInput } from "@/schemas/session.schema";
import { requireUserId } from "../lib/ownership";

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

export async function startSession(taskId: string, userId?: string) {
  const owner = requireUserId(userId);
  const task = await findTaskForSession(taskId, owner);
  if (!task) {
    throw new SessionServiceError("Task tidak ditemukan.", "TASK_NOT_FOUND");
  }

  if (await findActiveSessionByTaskId(taskId, owner)) {
    throw new SessionServiceError(
      "Task ini sudah memiliki session aktif.",
      "ACTIVE_SESSION_EXISTS",
    );
  }

  const otherActive = await findAnyActiveSession(owner);
  if (otherActive) {
    throw new SessionServiceError(
      otherActive.taskId === taskId
        ? "Task ini sudah memiliki session aktif."
        : "Masih ada sesi lain yang sedang berjalan. Akhiri sesi tersebut terlebih dahulu.",
      "ACTIVE_SESSION_EXISTS",
    );
  }

  const session = await createSession(taskId, owner);
  if (task.status === "NOT_STARTED") {
    await markTaskInProgress(owner, taskId, task.startedAt ?? session.startedAt);
  }

  return session;
}

export function getActiveSession(taskId: string, userId?: string) {
  return findActiveSessionByTaskId(taskId, requireUserId(userId));
}

export function getAnyActiveSession(userId?: string) {
  return findAnyActiveSession(requireUserId(userId));
}

export function getSession(sessionId: string, userId?: string) {
  return findSessionById(sessionId, requireUserId(userId));
}

export function getSessionHistory(taskId: string, userId?: string) {
  return findSessionsByTaskId(taskId, requireUserId(userId));
}

export async function updateTaskActualHours(taskId: string, userId?: string) {
  return recomputeTaskActualHours(taskId, requireUserId(userId));
}

export async function endSession(sessionId: string, data: EndSessionInput, userId?: string) {
  const owner = requireUserId(userId);
  const session = await findSessionById(sessionId, owner);
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
  const endData = {
    endedAt,
    durationMinutes: calculateDuration(session.startedAt, endedAt),
    activity: data.activity || undefined,
    understanding: data.understanding,
    obstacle: data.obstacle || undefined,
    nextAction: data.nextAction || undefined,
  };
  const completedSession = await endSessionRecord(owner, sessionId, endData);

  await updateTaskActualHours(session.taskId, owner);
  return completedSession;
}

export async function deleteSession(sessionId: string, userId?: string) {
  const owner = requireUserId(userId);
  const session = await findSessionById(sessionId, owner);
  if (!session) {
    throw new SessionServiceError("Session tidak ditemukan.", "SESSION_NOT_FOUND");
  }
  const wasCompleted = !!session.endedAt;
  await deleteSessionById(owner, sessionId);
  if (wasCompleted) await updateTaskActualHours(session.taskId, owner);
  return session;
}