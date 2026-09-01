import { createCapture, findRecentCaptures } from "../repositories/today.repository";

import { requireUserId } from "@/lib/ownership";

export function saveCapture(content: string, userId?: string) { return createCapture(requireUserId(userId), content.trim()); }

export function getRecentCaptures(userId?: string, limit = 10) {
  return findRecentCaptures(requireUserId(userId), Math.max(1, Math.min(limit, 50)));
}