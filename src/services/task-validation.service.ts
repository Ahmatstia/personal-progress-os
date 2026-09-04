import { prisma } from "@/lib/prisma";
import { findStageForTask } from "@/repositories/task.repository";

export class TaskValidationError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = "TaskValidationError";
  }
}

export interface TaskParentValidationInput {
  stageId?: string | null;
  milestoneId?: string | null;
  projectId?: string | null;
  areaId?: string | null;
  goalId?: string | null;
}

export interface ResolvedTaskParents {
  stageId: string | null;
  milestoneId: string | null;
  projectId: string | null;
  areaId: string | null;
  goalId: string | null;
}

/**
 * Validates task parent relationships and ownership according to MyLife Step 3 rules:
 * 1. Task must have at least one structural parent (stageId, milestoneId, projectId, or areaId).
 * 2. stageId: validates ownership, implies Goal-track, goalId must equal Stage.goalId.
 * 3. milestoneId: validates ownership, requires projectId, projectId must equal Milestone.projectId.
 * 4. projectId: validates ownership, if Project.goalId exists -> Task.goalId must match. If null -> goalId is null.
 * 5. stageId cannot coexist with projectId or milestoneId.
 * 6. All parent entities must belong to the same user.
 * 7. goalId must never be trusted directly from client input when it can be resolved from the parent.
 * 8. Returns resolved goalId and parentage.
 */
export async function validateTaskParents(
  userId: string,
  input: TaskParentValidationInput
): Promise<ResolvedTaskParents> {
  const { stageId, milestoneId, projectId, areaId, goalId } = input;

  // Rule 1: Mandatory structural parent check
  if (!stageId && !milestoneId && !projectId && !areaId) {
    throw new TaskValidationError(
      "Task must have at least one structural parent (stageId, milestoneId, projectId, or areaId).",
      "MISSING_STRUCTURAL_PARENT"
    );
  }

  // Rule 5: Cross-track exclusivity
  if (stageId && (projectId || milestoneId)) {
    throw new TaskValidationError(
      "Task cannot simultaneously belong to a Goal Stage and a Project/Milestone. Choose one primary track.",
      "CROSS_TRACK_CONFLICT"
    );
  }

  const resolvedStageId: string | null = stageId ?? null;
  const resolvedMilestoneId: string | null = milestoneId ?? null;
  let resolvedProjectId: string | null = projectId ?? null;
  const resolvedAreaId: string | null = areaId ?? null;
  let resolvedGoalId: string | null = null;

  // Rule 2: Goal-track validation via Stage
  if (resolvedStageId) {
    const stage = await findStageForTask(userId, resolvedStageId);
    if (!stage) {
      throw new TaskValidationError(
        "Referenced Stage does not exist or does not belong to user.",
        "STAGE_NOT_FOUND"
      );
    }
    const stageWithGoal = stage as { goalId?: string | null };
    if (goalId && stageWithGoal.goalId && goalId !== stageWithGoal.goalId) {
      throw new TaskValidationError(
        "Task goalId does not match the parent Stage's goalId.",
        "GOAL_ID_MISMATCH"
      );
    }
    resolvedGoalId = stageWithGoal.goalId ?? null;
  }

  // Rule 3: Milestone validation
  if (resolvedMilestoneId) {
    const milestone = await prisma.milestone.findFirst({
      where: { id: resolvedMilestoneId, userId },
    });
    if (!milestone) {
      throw new TaskValidationError(
        "Referenced Milestone does not exist or does not belong to user.",
        "MILESTONE_NOT_FOUND"
      );
    }
    if (resolvedProjectId && resolvedProjectId !== milestone.projectId) {
      throw new TaskValidationError(
        "Task projectId does not match the parent Milestone's projectId.",
        "PROJECT_ID_MISMATCH"
      );
    }
    resolvedProjectId = milestone.projectId;
  }

  // Rule 4: Project-track validation
  if (resolvedProjectId) {
    const project = await prisma.project.findFirst({
      where: { id: resolvedProjectId, userId },
    });
    if (!project) {
      throw new TaskValidationError(
        "Referenced Project does not exist or does not belong to user.",
        "PROJECT_NOT_FOUND"
      );
    }
    if (project.goalId) {
      if (goalId && goalId !== project.goalId) {
        throw new TaskValidationError(
          "Task goalId does not match the parent Project's goalId.",
          "GOAL_ID_MISMATCH"
        );
      }
      resolvedGoalId = project.goalId;
    } else {
      resolvedGoalId = null;
    }
  }

  // Area ownership validation
  if (resolvedAreaId) {
    const area = await prisma.area.findFirst({
      where: { id: resolvedAreaId, userId },
    });
    if (!area) {
      throw new TaskValidationError(
        "Referenced Area does not exist or does not belong to user.",
        "AREA_NOT_FOUND"
      );
    }
  }

  return {
    stageId: resolvedStageId,
    milestoneId: resolvedMilestoneId,
    projectId: resolvedProjectId,
    areaId: resolvedAreaId,
    goalId: resolvedGoalId,
  };
}
