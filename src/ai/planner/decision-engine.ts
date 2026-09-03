import type { Entity, Intent } from "../intents";
import { executeTool } from "../tools/registry";
import { resolveGoalEntity, resolveStageEntity, resolveTaskEntity } from "../resolver/entity-resolver";
import { resolveContextReferences } from "../context/context-resolver";
import type { ConversationContext } from "../context/conversation-state";
import { createConfirmationToken } from "../safety";

export type PlanStep = {
  step: number;
  tool: string;
  description: string;
  arguments: Record<string, unknown>;
  requiresConfirmation?: boolean;
  status: "pending" | "executed" | "failed" | "skipped";
  result?: unknown;
};

export type ExecutionPlan = {
  type: "SINGLE" | "MULTI_STEP" | "BULK" | "AMBIGUOUS" | "NOT_FOUND" | "FALLBACK";
  intent: Intent;
  steps: PlanStep[];
  requiresConfirmation: boolean;
  confirmationToken?: string;
  ambiguityCandidates?: Array<{ id: string; name: string; type: string; parentName?: string }>;
  message: string;
};

export async function buildExecutionPlan(
  text: string,
  intent: Intent,
  entities: Entity[],
  convContext: ConversationContext,
  requestContext?: { taskId?: string; taskName?: string; goalId?: string; goalName?: string; stageId?: string }
): Promise<ExecutionPlan> {
  const userId = convContext.userId;
  const contextRefs = resolveContextReferences(text, convContext, requestContext);

  // Helper entity extractor
  const getEntity = (type: Entity["type"]) => entities.find((e) => e.type === type)?.value;

  // ── 1. Multi-step command decomposition ──────────────────
  if (intent === "MULTI_STEP" || text.includes(" lalu ") || text.includes(" kemudian ")) {
    const parts = text.split(/\s+(?:lalu|kemudian|setelah itu|dan setelahnya)\s+/i);
    if (parts.length > 1) {
      const steps: PlanStep[] = [];
      let stepNum = 1;

      // Check if creating goal + stage + tasks
      const goalName = getEntity("GOAL") || parts[0].replace(/.*(?:buat|bikin)\s+goal\s+/i, "").trim();
      const stageName = getEntity("STAGE") || (parts[1] ? parts[1].replace(/.*(?:buat|bikin)\s+stage\s+/i, "").trim() : "Dasar");

      steps.push({
        step: stepNum++,
        tool: "create_goal",
        description: `Buat goal "${goalName}"`,
        arguments: { name: goalName, type: "LEARNING" },
        status: "pending",
      });

      steps.push({
        step: stepNum++,
        tool: "create_stage",
        description: `Buat stage "${stageName}" di goal "${goalName}"`,
        arguments: { name: stageName, dependsOnStep: 1 },
        status: "pending",
      });

      // Parse task count or task names
      const countEntity = entities.find((e) => e.type === "COUNT");
      const taskCount = countEntity?.metadata?.count ? Number(countEntity.metadata.count) : 3;

      for (let i = 1; i <= Math.min(taskCount, 5); i++) {
        steps.push({
          step: stepNum++,
          tool: "create_task",
          description: `Buat task ${i} untuk stage "${stageName}"`,
          arguments: { name: `Langkah ${i}: Pelajari dasar ${goalName}`, priority: "MEDIUM", dependsOnStep: 2 },
          status: "pending",
        });
      }

      const { token } = createConfirmationToken("MULTI_STEP", userId, { steps: steps.length });
      return {
        type: "MULTI_STEP",
        intent: "MULTI_STEP",
        steps,
        requiresConfirmation: true,
        confirmationToken: token,
        message: `Saya telah menyusun rencana ${steps.length} langkah untuk membuat goal "${goalName}", stage "${stageName}", dan ${steps.length - 2} task awal.`,
      };
    }
  }

  // ── 2. Bulk Operations ───────────────────────────────────
  if (intent === "TASK_BULK_DELETE") {
    const goalQuery = getEntity("GOAL") || contextRefs.referencedGoalName;
    let goalId = contextRefs.referencedGoalId;
    if (!goalId && goalQuery) {
      const gRes = await resolveGoalEntity(goalQuery, userId);
      if (gRes.resolvedEntity) goalId = gRes.resolvedEntity.id;
    }

    const { token } = createConfirmationToken("TASK_BULK_DELETE", userId, { goalId, status: "COMPLETED" });
    return {
      type: "BULK",
      intent: "TASK_BULK_DELETE",
      steps: [
        {
          step: 1,
          tool: "bulk_delete_tasks",
          description: `Hapus seluruh task yang sudah selesai${goalQuery ? ` pada goal "${goalQuery}"` : ""}`,
          arguments: { goalId, status: "COMPLETED" },
          status: "pending",
        },
      ],
      requiresConfirmation: true,
      confirmationToken: token,
      message: `Konfirmasi penghapusan seluruh task yang telah selesai${goalQuery ? ` pada goal "${goalQuery}"` : ""}.`,
    };
  }

  if (intent === "TASK_BULK_COMPLETE") {
    const goalQuery = getEntity("GOAL") || contextRefs.referencedGoalName;
    let goalId = contextRefs.referencedGoalId;
    if (!goalId && goalQuery) {
      const gRes = await resolveGoalEntity(goalQuery, userId);
      if (gRes.resolvedEntity) goalId = gRes.resolvedEntity.id;
    }

    const { token } = createConfirmationToken("TASK_BULK_COMPLETE", userId, { goalId });
    return {
      type: "BULK",
      intent: "TASK_BULK_COMPLETE",
      steps: [
        {
          step: 1,
          tool: "bulk_complete_tasks",
          description: `Tandai semua task aktif selesai${goalQuery ? ` pada goal "${goalQuery}"` : ""}`,
          arguments: { goalId },
          status: "pending",
        },
      ],
      requiresConfirmation: true,
      confirmationToken: token,
      message: `Konfirmasi penyelesaian seluruh task aktif${goalQuery ? ` pada goal "${goalQuery}"` : ""}.`,
    };
  }

  // ── 3. Single Destructive & Write Operations ─────────────

  // Delete Task
  if (intent === "TASK_DELETE") {
    const taskQuery = contextRefs.referencedTaskName || getEntity("TASK");
    const taskId = contextRefs.referencedTaskId;

    if (taskId) {
      const { token } = createConfirmationToken("TASK_DELETE", userId, { id: taskId });
      return {
        type: "SINGLE",
        intent: "TASK_DELETE",
        steps: [
          {
            step: 1,
            tool: "delete_task",
            description: `Hapus task ID: ${taskId}`,
            arguments: { id: taskId },
            status: "pending",
          },
        ],
        requiresConfirmation: true,
        confirmationToken: token,
        message: `Konfirmasi penghapusan task.`,
      };
    }

    if (!taskQuery) {
      return {
        type: "NOT_FOUND",
        intent: "TASK_DELETE",
        steps: [],
        requiresConfirmation: false,
        message: "Sebutkan nama task yang ingin dihapus.",
      };
    }

    const resolution = await resolveTaskEntity(taskQuery, userId);
    if (resolution.status === "AMBIGUOUS") {
      return {
        type: "AMBIGUOUS",
        intent: "TASK_DELETE",
        steps: [],
        requiresConfirmation: false,
        ambiguityCandidates: resolution.candidates.map((c) => ({
          id: c.id,
          name: c.name,
          type: "TASK",
          parentName: c.parentName,
        })),
        message: `Ditemukan beberapa task dengan nama "${taskQuery}". Pilih task yang ingin dihapus:`,
      };
    }

    if (!resolution.resolvedEntity) {
      return {
        type: "NOT_FOUND",
        intent: "TASK_DELETE",
        steps: [],
        requiresConfirmation: false,
        message: `Task "${taskQuery}" tidak ditemukan.`,
      };
    }

    const target = resolution.resolvedEntity;
    const { token } = createConfirmationToken("TASK_DELETE", userId, { id: target.id });
    return {
      type: "SINGLE",
      intent: "TASK_DELETE",
      steps: [
        {
          step: 1,
          tool: "delete_task",
          description: `Hapus task "${target.name}" (${target.parentName})`,
          arguments: { id: target.id },
          status: "pending",
        },
      ],
      requiresConfirmation: true,
      confirmationToken: token,
      message: `Konfirmasi penghapusan task "${target.name}" (${target.parentName}).`,
    };
  }

  // Delete Goal
  if (intent === "GOAL_DELETE") {
    const goalQuery = contextRefs.referencedGoalName || getEntity("GOAL");
    const goalId = contextRefs.referencedGoalId;

    if (!goalId && !goalQuery) {
      return {
        type: "NOT_FOUND",
        intent: "GOAL_DELETE",
        steps: [],
        requiresConfirmation: false,
        message: "Sebutkan nama goal yang ingin dihapus.",
      };
    }

    let targetId = goalId;
    let targetName = goalQuery ?? "Goal";

    if (!targetId && goalQuery) {
      const gRes = await resolveGoalEntity(goalQuery, userId);
      if (gRes.status === "AMBIGUOUS") {
        return {
          type: "AMBIGUOUS",
          intent: "GOAL_DELETE",
          steps: [],
          requiresConfirmation: false,
          ambiguityCandidates: gRes.candidates.map((c) => ({ id: c.id, name: c.name, type: "GOAL" })),
          message: `Ditemukan beberapa goal yang mirip "${goalQuery}". Pilih satu:`,
        };
      }
      if (!gRes.resolvedEntity) {
        return {
          type: "NOT_FOUND",
          intent: "GOAL_DELETE",
          steps: [],
          requiresConfirmation: false,
          message: `Goal "${goalQuery}" tidak ditemukan.`,
        };
      }
      targetId = gRes.resolvedEntity.id;
      targetName = gRes.resolvedEntity.name;
    }

    const { token } = createConfirmationToken("GOAL_DELETE", userId, { id: targetId });
    return {
      type: "SINGLE",
      intent: "GOAL_DELETE",
      steps: [
        {
          step: 1,
          tool: "delete_goal",
          description: `Hapus goal "${targetName}" beserta seluruh stage dan task-nya`,
          arguments: { id: targetId },
          status: "pending",
        },
      ],
      requiresConfirmation: true,
      confirmationToken: token,
      message: `Peringatan: Menghapus goal "${targetName}" akan menghapus seluruh stage dan task di dalamnya. Konfirmasi untuk melanjutkan.`,
    };
  }

  // Delete Stage
  if (intent === "STAGE_DELETE") {
    const stageQuery = contextRefs.referencedStageName || getEntity("STAGE");
    const stageId = contextRefs.referencedStageId;

    if (!stageId && !stageQuery) {
      return {
        type: "NOT_FOUND",
        intent: "STAGE_DELETE",
        steps: [],
        requiresConfirmation: false,
        message: "Sebutkan nama stage yang ingin dihapus.",
      };
    }

    let targetId = stageId;
    let targetName = stageQuery ?? "Stage";

    if (!targetId && stageQuery) {
      const sRes = await resolveStageEntity(stageQuery, userId, contextRefs.referencedGoalId);
      if (sRes.status === "AMBIGUOUS") {
        return {
          type: "AMBIGUOUS",
          intent: "STAGE_DELETE",
          steps: [],
          requiresConfirmation: false,
          ambiguityCandidates: sRes.candidates.map((c) => ({ id: c.id, name: c.name, type: "STAGE", parentName: c.parentName })),
          message: `Ditemukan beberapa stage yang mirip "${stageQuery}". Pilih satu:`,
        };
      }
      if (!sRes.resolvedEntity) {
        return {
          type: "NOT_FOUND",
          intent: "STAGE_DELETE",
          steps: [],
          requiresConfirmation: false,
          message: `Stage "${stageQuery}" tidak ditemukan.`,
        };
      }
      targetId = sRes.resolvedEntity.id;
      targetName = sRes.resolvedEntity.name;
    }

    const { token } = createConfirmationToken("STAGE_DELETE", userId, { id: targetId });
    return {
      type: "SINGLE",
      intent: "STAGE_DELETE",
      steps: [
        {
          step: 1,
          tool: "delete_stage",
          description: `Hapus stage "${targetName}"`,
          arguments: { id: targetId },
          status: "pending",
        },
      ],
      requiresConfirmation: true,
      confirmationToken: token,
      message: `Konfirmasi penghapusan stage "${targetName}". Seluruh task di dalamnya akan ikut terhapus.`,
    };
  }

  // Default fallback
  return {
    type: "FALLBACK",
    intent,
    steps: [],
    requiresConfirmation: false,
    message: "Rencana eksekusi tidak dapat disusun.",
  };
}

export async function executePlan(
  plan: ExecutionPlan,
  userId: string
): Promise<{ success: boolean; results: unknown[]; message: string }> {
  const results: unknown[] = [];
  let lastGoalId: string | undefined = undefined;
  let lastStageId: string | undefined = undefined;

  for (const step of plan.steps) {
    const args = { ...step.arguments };
    if (args.dependsOnStep === 1 && lastGoalId) {
      args.goalId = lastGoalId;
      delete args.dependsOnStep;
    }
    if (args.dependsOnStep === 2 && lastStageId) {
      args.stageId = lastStageId;
      delete args.dependsOnStep;
    }

    const res: {
      success: boolean;
      toolName?: string;
      message?: string;
      error?: { code: string; message: string };
      data?: unknown;
    } = await executeTool(step.tool, args, { userId, activeGoalId: lastGoalId, activeStageId: lastStageId });

    if (!res.success) {
      step.status = "failed";
      step.result = res.error;
      return {
        success: false,
        results,
        message: `Langkah ${step.step} (${step.description}) gagal: ${res.message}`,
      };
    }

    step.status = "executed";
    step.result = res.data;
    results.push(res.data);

    if (step.tool === "create_goal" && (res.data as any)?.id) {
      lastGoalId = (res.data as any).id;
    }
    if (step.tool === "create_stage" && (res.data as any)?.id) {
      lastStageId = (res.data as any).id;
    }
  }

  return {
    success: true,
    results,
    message: `Seluruh ${plan.steps.length} langkah berhasil dieksekusi dengan baik.`,
  };
}
