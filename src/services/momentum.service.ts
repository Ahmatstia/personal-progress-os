export type Momentum = { state: "ACTIVE" | "STEADY" | "LOW" | "INACTIVE"; activeDays7: number; lastActiveDate: string | null };

function key(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }

export function calculateMomentum(sessionDates: Date[], today = new Date()): Momentum {
  const todayStart = new Date(today); todayStart.setHours(0, 0, 0, 0);
  const active = new Set(sessionDates.filter((date) => date <= new Date(todayStart.getTime() + 86400000 - 1) && date >= new Date(todayStart.getTime() - 6 * 86400000)).map(key));
  const sorted = [...active].sort().reverse();
  return { state: active.has(key(todayStart)) ? "ACTIVE" : active.size >= 3 ? "STEADY" : active.size > 0 ? "LOW" : "INACTIVE", activeDays7: active.size, lastActiveDate: sorted[0] ?? null };
}
