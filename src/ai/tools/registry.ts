import type { Tool, ToolContext, ToolExecutionResult } from "./tool.interface";
import { createGoalTool, deleteGoalTool, findGoalTool, getGoalTool, updateGoalTool } from "./goal.tools";
import { createStageTool, deleteStageTool, findStageTool, getStageTool, reorderStageTool, updateStageTool } from "./stage.tools";
import {
  bulkCompleteTasksTool,
  bulkDeleteTasksTool,
  completeTaskTool,
  createTaskTool,
  deleteTaskTool,
  getTaskTool,
  reopenTaskTool,
  searchTasksTool,
  updateTaskTool,
} from "./task.tools";
import { endSessionTool, getActiveSessionTool, startSessionTool } from "./session.tools";
import { createFocusTool, getTodayFocusTool } from "./focus.tools";
import { getBottleneckTool, getNextActionTool, getProgressTool, getStreakTool, getTimeSpentTool } from "./analytics.tools";
import { createReviewTool, getReviewTool } from "./review.tools";

export const toolRegistry: Record<string, Tool<any, any>> = {
  // Goals
  create_goal: createGoalTool,
  get_goal: getGoalTool,
  find_goal: findGoalTool,
  update_goal: updateGoalTool,
  delete_goal: deleteGoalTool,

  // Stages
  create_stage: createStageTool,
  get_stage: getStageTool,
  find_stage: findStageTool,
  update_stage: updateStageTool,
  delete_stage: deleteStageTool,
  reorder_stage: reorderStageTool,

  // Tasks
  create_task: createTaskTool,
  get_task: getTaskTool,
  search_tasks: searchTasksTool,
  update_task: updateTaskTool,
  complete_task: completeTaskTool,
  reopen_task: reopenTaskTool,
  delete_task: deleteTaskTool,
  bulk_delete_tasks: bulkDeleteTasksTool,
  bulk_complete_tasks: bulkCompleteTasksTool,

  // Sessions
  start_session: startSessionTool,
  end_session: endSessionTool,
  get_active_session: getActiveSessionTool,

  // Focus
  create_focus: createFocusTool,
  get_today_focus: getTodayFocusTool,

  // Analytics
  get_progress: getProgressTool,
  get_streak: getStreakTool,
  get_time_spent: getTimeSpentTool,
  get_bottleneck: getBottleneckTool,
  get_next_action: getNextActionTool,

  // Reviews
  get_review: getReviewTool,
  create_review: createReviewTool,
};

export async function executeTool<TInput = Record<string, unknown>, TOutput = unknown>(
  toolName: string,
  rawInput: TInput,
  context: ToolContext
): Promise<ToolExecutionResult<TOutput>> {
  const tool = toolRegistry[toolName];
  if (!tool) {
    return {
      success: false,
      toolName,
      type: "READ",
      message: `Tool "${toolName}" tidak ditemukan dalam registry.`,
      error: { code: "TOOL_NOT_FOUND", message: `Tool "${toolName}" not registered.` },
    };
  }

  const parsed = tool.schema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      toolName,
      type: tool.type,
      message: `Parameter untuk tool "${toolName}" tidak valid: ${parsed.error.issues.map((i: { message: string }) => i.message).join(", ")}`,
      error: { code: "INVALID_TOOL_ARGUMENTS", message: "Schema validation failed.", details: parsed.error.issues },
    };
  }

  const result = await tool.execute(parsed.data, context);
  if (result.success && tool.verify) {
    try {
      const isVerified = await tool.verify(result, context);
      result.verified = isVerified;
      if (!isVerified) {
        result.success = false;
        result.message = `Operasi tool "${toolName}" berhasil dijalankan namun verifikasi database gagal.`;
        result.error = { code: "VERIFICATION_FAILED", message: "Database state post-condition verification failed." };
      }
    } catch {
      result.verified = false;
    }
  }

  return result as ToolExecutionResult<TOutput>;
}
