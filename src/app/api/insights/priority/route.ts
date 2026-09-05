import { requireCurrentUser, authErrorResponse } from "@/lib/auth";
import { priorityQuerySchema } from "@/schemas/insights.schema";
import { getPrioritizedTasks } from "@/services/insights/insights.service";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const { searchParams } = new URL(request.url);

    const parseResult = priorityQuerySchema.safeParse({
      limit: searchParams.get("limit") || undefined,
      includeCompleted: searchParams.get("includeCompleted") || undefined,
      goalId: searchParams.get("goalId") || undefined,
      projectId: searchParams.get("projectId") || undefined,
      areaId: searchParams.get("areaId") || undefined,
    });

    if (!parseResult.success) {
      return Response.json(
        { success: false, error: { message: "Query parameter tidak valid", issues: parseResult.error.issues } },
        { status: 400 }
      );
    }

    const tasks = await getPrioritizedTasks(parseResult.data, user.id);

    return Response.json({ success: true, data: tasks });
  } catch (error) {
    return authErrorResponse(error);
  }
}
