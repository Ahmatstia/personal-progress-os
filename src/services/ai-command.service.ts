import { completeTask, createTask, findMatchingTasks, findTask, getTaskDetail, reopenTask } from "@/services/task.service";
import { createGoal } from "@/services/goal.service";
import { endSession, getAnyActiveSession, startSession } from "@/services/session.service";
import { addTodayFocus, getToday } from "@/services/today.service";
import { getDashboardAnalytics, getGoalAnalytics } from "@/services/analytics.service";
import { getGoalReviewPageData } from "@/services/review.service";
import { interpretInput } from "@/services/ai.service";
import { routeIntent } from "../ai/router";
import { canRead, canWrite, createConfirmationToken, verifyConfirmationToken } from "../ai/safety";
import { requireUserId } from "@/lib/ownership";
import { aiCommandSchema, type AICommandInput } from "../schemas/ai-command.schema";
import { formatDuration } from "../lib/format";

type CommandResult = {
  success: boolean;
  code: string;
  message: string;
  interpretation: ReturnType<typeof interpretInput>;
  data?: unknown;
  requiresConfirmation?: boolean;
  confirmationToken?: string;
};

const writeIntents = new Set(["GOAL_CREATE", "TASK_CREATE", "TASK_COMPLETE", "TASK_REOPEN", "SESSION_START", "SESSION_END", "FOCUS"]);

function entityValue(input: ReturnType<typeof interpretInput>, type: "GOAL" | "TASK") {
  return input.entities.find((entity) => entity.type === type)?.value;
}

export function resolveContextInterpretation(input: AICommandInput, baseInterpretation: ReturnType<typeof interpretInput>) {
  return baseInterpretation.intent === "UNKNOWN" && input.context?.taskId && /yang tadi|yang ini|task itu/.test(baseInterpretation.normalizedText)
    ? { ...baseInterpretation, intent: "TASK_STATUS" as const, confidence: 0.56, confidenceLevel: "MEDIUM" as const }
    : baseInterpretation;
}

async function resolveTask(query: string | undefined, taskId: string | undefined, userId?: string) {
  const owner = requireUserId(userId);
  if (taskId) {
    const task = await findTask(owner, taskId);
    return task ? [task] : [];
  }
  return query ? findMatchingTasks(query, owner) : [];
}

function confirmation(input: AICommandInput, interpretation: ReturnType<typeof interpretInput>) {
  const { token } = createConfirmationToken(interpretation.intent);
  return { success: false, code: "CONFIRMATION_REQUIRED", message: `Saya memahami perintah ${interpretation.intent}. Anda bisa menjalankannya melalui tombol Konfirmasi.`, interpretation, requiresConfirmation: true, confirmationToken: token } satisfies CommandResult;
}

export async function executeAICommand(rawInput: AICommandInput, userId?: string): Promise<CommandResult> {
  const input = aiCommandSchema.parse(rawInput);
  const baseInterpretation = interpretInput(input.text);
  const interpretation = resolveContextInterpretation(input, baseInterpretation);
  const { intent, confidenceLevel } = interpretation;
  if (intent === "UNKNOWN" || !canRead(confidenceLevel)) return { success: false, code: "SAFE_FALLBACK", message: "Saya belum cukup yakin memahami perintah itu. Coba gunakan tujuan yang lebih spesifik.", interpretation };
  if (writeIntents.has(intent)) {
    const approved = canWrite(confidenceLevel, input.confirmed) && verifyConfirmationToken(input.confirmationToken, intent);
    if (!approved) return confirmation(input, interpretation);
  }

  switch (intent) {
    case "TODAY": {
      const data = await getToday(new Date(), userId);
      return { success: true, code: "OK", message: data.nextAction ? `Next action: ${data.nextAction.taskName}.` : "Belum ada task aktif untuk hari ini.", interpretation, data };
    }
    case "NEXT_ACTION": {
      const data = (await getToday(new Date(), userId)).nextAction;
      return { success: true, code: "OK", message: data ? `Aksi berikutnya: ${data.taskName}.` : "Belum ada next action.", interpretation, data };
    }
    case "PROGRESS":
    case "GOAL_STATUS": {
      const data = input.context?.goalId ? await getGoalAnalytics(input.context.goalId, undefined, undefined, userId) : await getDashboardAnalytics({ days: 30 }, userId);
      return { success: true, code: "OK", message: `Progress saat ini ${data.summary.completionRate}%.`, interpretation, data };
    }
    case "ANALYTICS":
    case "STREAK":
    case "TIME_SPENT":
    case "COMPLETION":
    case "BOTTLENECK": {
      const data = await getDashboardAnalytics({ days: 30 }, userId);
      return { success: true, code: "OK", message: `Ringkasan 30 hari: ${formatDuration(data.summary.totalMinutes)} fokus, ${data.summary.completedTasks} task selesai, streak ${data.summary.currentStreak} hari.`, interpretation, data };
    }
    case "TASK_STATUS": {
      if (input.context?.taskId) {
        const data = await getTaskDetail(input.context.taskId, userId);
        return { success: true, code: "OK", message: data ? `Status task: ${data.task.status}.` : "Task tidak ditemukan.", interpretation, data };
      }
      const query = input.context?.taskName ?? entityValue(interpretation, "TASK");
      const data = query ? await findMatchingTasks(query, userId) : await findMatchingTasks("", userId);
      return { success: true, code: "OK", message: data.length ? `Ditemukan ${data.length} task: ${data.map((task) => task.name).join(", ")}.` : "Tidak ada task yang cocok.", interpretation, data };
    }
    case "TASK_SEARCH": {
      const query = input.context?.taskName ?? entityValue(interpretation, "TASK");
      const data = query ? await findMatchingTasks(query, userId) : await findMatchingTasks("", userId);
      return { success: true, code: "OK", message: data.length ? `Ditemukan ${data.length} task: ${data.map((task) => task.name).join(", ")}.` : "Tidak ada task yang cocok.", interpretation, data };
    }
    case "OVERDUE": {
      const data = (await getToday(new Date(), userId)).overdueTasks;
      return { success: true, code: "OK", message: data.length ? `Ada ${data.length} task yang melewati deadline.` : "Tidak ada task overdue.", interpretation, data };
    }
    case "FOCUS": {
      if (input.confirmed) {
        const matches = await resolveTask(input.context?.taskName ?? entityValue(interpretation, "TASK"), input.context?.taskId, userId);
      if (matches.length !== 1) return { success: false, code: matches.length ? "AMBIGUOUS_TASK" : "TASK_NOT_FOUND", message: matches.length ? "Pilih satu task untuk fokus." : "Task fokus tidak ditemukan.", interpretation, data: matches, confirmationToken: createConfirmationToken("FOCUS").token };
        const focused = await addTodayFocus(matches[0].id, new Date(), userId);
        return { success: true, code: "FOCUSED", message: `Task ${matches[0].name} ditambahkan ke fokus hari ini.`, interpretation, data: focused };
      }
      const data = await getToday(new Date(), userId);
      return { success: true, code: "OK", message: data.focusTasks.length ? `Fokus hari ini: ${data.focusTasks.map((item) => item.task.name).join(", ")}.` : "Belum ada fokus hari ini.", interpretation, data: data.focusTasks };
    }
    case "REVIEW":
    case "REFLECTION": {
      if (input.context?.goalId) {
        const data = await getGoalReviewPageData(input.context.goalId, userId);
        return { success: true, code: "OK", message: data ? "Data review goal berhasil ditemukan." : "Goal tidak ditemukan.", interpretation, data };
      }
      return { success: true, code: "GUIDANCE", message: "Gunakan halaman Review untuk melihat atau menulis refleksi berbasis data sesi.", interpretation };
    }
    case "HELP":
    case "MOTIVATION":
      return { success: true, code: "GUIDANCE", message: "Saya dapat membantu melihat hari ini, progress, analytics, task, session, fokus, dan review.", interpretation };
    case "GOAL_CREATE": {
      const name = input.context?.goalName ?? entityValue(interpretation, "GOAL");
      if (!name) return { success: false, code: "MISSING_GOAL_NAME", message: "Sebutkan nama goal yang ingin dibuat.", interpretation };
      const data = await createGoal({ name, type: "LEARNING" }, userId);
      return { success: true, code: "CREATED", message: `Goal ${data.name} berhasil dibuat.`, interpretation, data };
    }
    case "TASK_CREATE": {
      const name = input.context?.taskName ?? entityValue(interpretation, "TASK");
      const stageId = input.context?.stageId;
      if (!name || !stageId) return { success: false, code: "MISSING_TASK_CONTEXT", message: "Nama task dan stageId diperlukan untuk membuat task.", interpretation };
      const data = await createTask({ stageId, name, type: "TASK", priority: "MEDIUM", estimatedHours: 0, description: null, notes: null }, userId) as { name: string };
      return { success: true, code: "CREATED", message: `Task ${data.name} berhasil dibuat.`, interpretation, data };
    }
    case "TASK_COMPLETE":
    case "TASK_REOPEN": {
      const matches = await resolveTask(input.context?.taskName ?? entityValue(interpretation, "TASK"), input.context?.taskId, userId);
      if (matches.length !== 1) return { success: false, code: matches.length ? "AMBIGUOUS_TASK" : "TASK_NOT_FOUND", message: matches.length ? "Saya menemukan beberapa task yang cocok. Pilih satu task terlebih dahulu." : "Task yang dimaksud tidak ditemukan.", interpretation, data: matches, confirmationToken: createConfirmationToken(intent).token };
      const data = intent === "TASK_COMPLETE" ? await completeTask(matches[0].id, userId) : await reopenTask(matches[0].id, userId);
      return { success: true, code: "UPDATED", message: `Task ${data.name} berhasil diperbarui.`, interpretation, data };
    }
    case "SESSION_START": {
      const matches = await resolveTask(input.context?.taskName ?? entityValue(interpretation, "TASK"), input.context?.taskId, userId);
      if (matches.length !== 1) return { success: false, code: matches.length ? "AMBIGUOUS_TASK" : "TASK_NOT_FOUND", message: matches.length ? "Pilih satu task untuk memulai session." : "Task untuk session tidak ditemukan.", interpretation, data: matches, confirmationToken: createConfirmationToken("SESSION_START").token };
      const data = await startSession(matches[0].id, userId);
      return { success: true, code: "STARTED", message: `Session untuk ${matches[0].name} dimulai.`, interpretation, data };
    }
    case "SESSION_END": {
      const active = await getAnyActiveSession(userId);
      if (!active) return { success: false, code: "NO_ACTIVE_SESSION", message: "Tidak ada session aktif.", interpretation };
      const data = await endSession(active.id, { sessionId: active.id }, userId);
      return { success: true, code: "ENDED", message: "Session aktif berhasil diakhiri.", interpretation, data };
    }
    default:
      return { success: false, code: "UNSUPPORTED_INTENT", message: `Intent ${routeIntent(intent).intent} belum memiliki command handler.`, interpretation };
  }
}
