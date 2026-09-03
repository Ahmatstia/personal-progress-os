import { z } from "zod";

export type ToolType = "READ" | "WRITE" | "DESTRUCTIVE";

export type ToolContext = {
  userId: string;
  activeGoalId?: string;
  activeStageId?: string;
  activeTaskId?: string;
};

export type ToolExecutionResult<T = unknown> = {
  success: boolean;
  toolName: string;
  type: ToolType;
  message: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  verified?: boolean;
};

export interface Tool<TInput = Record<string, unknown>, TOutput = unknown> {
  name: string;
  description: string;
  type: ToolType;
  schema: z.ZodType<TInput>;
  execute(input: TInput, context: ToolContext): Promise<ToolExecutionResult<TOutput>>;
  verify?(result: ToolExecutionResult<TOutput>, context: ToolContext): Promise<boolean>;
}
