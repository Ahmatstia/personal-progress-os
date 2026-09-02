import { createCapture, deleteCaptureById, findCapture, findRecentCaptures } from "../repositories/today.repository";

import { requireUserId } from "@/lib/ownership";

export class CaptureServiceError extends Error {
  constructor(
    message: string,
    public readonly code: "CAPTURE_NOT_FOUND",
  ) {
    super(message);
  }
}

export function saveCapture(content: string, userId?: string) { return createCapture(requireUserId(userId), content.trim()); }

export function getRecentCaptures(userId?: string, limit = 10) {
  return findRecentCaptures(requireUserId(userId), Math.max(1, Math.min(limit, 50)));
}

export async function deleteCapture(id: string, userId?: string) {
  const owner = requireUserId(userId);
  if (!(await findCapture(owner, id))) throw new CaptureServiceError("Capture tidak ditemukan.", "CAPTURE_NOT_FOUND");
  return deleteCaptureById(owner, id);
}