import type { Task } from "@/generated/prisma/client";
import type { PrioritizedTask, TaskPriorityContext } from "./insights-types";

export function calculateTaskPriority(
  task: Task & {
    goal?: { id: string; title: string } | null;
    project?: { id: string; title: string } | null;
    area?: { id: string; name: string; color: string } | null;
  },
  context: TaskPriorityContext
): PrioritizedTask {
  const { now, dailyFocusTaskIds } = context;
  const reasons: string[] = [];
  let score = 0;

  // Completed or cancelled tasks are deprioritized
  if (task.status === "COMPLETED") {
    return {
      task,
      score: -999,
      reasons: ["Sudah selesai"],
      urgency: "LOW",
      isOverdue: false,
      overdueDays: 0,
      isDueToday: false,
      isFocusedToday: false,
    };
  }

  // 1. Due Date Evaluation
  let isOverdue = false;
  let overdueDays = 0;
  let isDueToday = false;

  if (task.dueDate) {
    const dueTime = new Date(task.dueDate).getTime();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayEnd = todayStart + 86400000 - 1;

    if (dueTime < todayStart) {
      isOverdue = true;
      overdueDays = Math.max(1, Math.floor((todayStart - dueTime) / 86400000));
      const penalty = 50 + Math.min(overdueDays * 5, 30);
      score += penalty;
      reasons.push(`Terlambat ${overdueDays} hari`);
    } else if (dueTime >= todayStart && dueTime <= todayEnd) {
      isDueToday = true;
      score += 40;
      reasons.push("Jatuh tempo hari ini");
    } else {
      const daysUntilDue = Math.ceil((dueTime - todayEnd) / 86400000);
      if (daysUntilDue <= 3) {
        score += 25;
        reasons.push(`Jatuh tempo ${daysUntilDue} hari lagi`);
      } else if (daysUntilDue <= 7) {
        score += 10;
        reasons.push("Jatuh tempo minggu ini");
      }
    }
  }

  // 2. Daily Focus Membership
  const isFocusedToday = dailyFocusTaskIds.has(task.id);
  if (isFocusedToday) {
    score += 30;
    reasons.push("Masuk dalam Daily Focus hari ini");
  }

  // 3. Execution Status
  if (task.status === "IN_PROGRESS") {
    score += 20;
    reasons.push("Sedang dalam pengerjaan");
  }

  // 4. Base Priority Tag
  if (task.priority === "URGENT") {
    score += 35;
    reasons.push("Tingkat urgensi: Urgent");
  } else if (task.priority === "HIGH") {
    score += 25;
    reasons.push("Prioritas tinggi");
  } else if (task.priority === "MEDIUM") {
    score += 10;
    reasons.push("Prioritas menengah");
  }

  // 5. Strategic Alignment (Goal / Project parent)
  if (task.goal) {
    score += 15;
    reasons.push(`Mendukung Goal: ${task.goal.title}`);
  } else if (task.project) {
    score += 12;
    reasons.push(`Bagian dari Project: ${task.project.title}`);
  }

  // 6. Urgency classification
  let urgency: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" = "LOW";
  if (score >= 80) urgency = "CRITICAL";
  else if (score >= 50) urgency = "HIGH";
  else if (score >= 25) urgency = "MEDIUM";

  if (reasons.length === 0) {
    reasons.push("Task standar tanpa tenggat waktu mendesak");
  }

  return {
    task,
    score,
    reasons,
    urgency,
    isOverdue,
    overdueDays,
    isDueToday,
    isFocusedToday,
  };
}

export function rankTasks(
  tasks: (Task & {
    goal?: { id: string; title: string } | null;
    project?: { id: string; title: string } | null;
    area?: { id: string; name: string; color: string } | null;
  })[],
  context: TaskPriorityContext,
  options?: { includeCompleted?: boolean; limit?: number }
): PrioritizedTask[] {
  const includeCompleted = options?.includeCompleted ?? false;
  const limit = options?.limit ?? 50;

  const scored = tasks
    .map((task) => calculateTaskPriority(task, context))
    .filter((pt) => includeCompleted || pt.task.status !== "COMPLETED");

  // Deterministic sorting: score DESC -> dueDate ASC -> createdAt DESC -> id ASC
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const dueA = a.task.dueDate ? new Date(a.task.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
    const dueB = b.task.dueDate ? new Date(b.task.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
    if (dueA !== dueB) return dueA - dueB;
    const createA = new Date(a.task.createdAt).getTime();
    const createB = new Date(b.task.createdAt).getTime();
    if (createB !== createA) return createB - createA;
    return a.task.id.localeCompare(b.task.id);
  });

  return scored.slice(0, limit);
}
