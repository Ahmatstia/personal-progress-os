import { createCapture } from "../repositories/today.repository";

import { requireUserId } from "@/lib/ownership";

export function saveCapture(content: string, userId?: string) { return createCapture(requireUserId(userId), content.trim()); }
