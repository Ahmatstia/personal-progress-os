import { requireCurrentUser, authErrorResponse } from "@/lib/auth";
import { conflictQuerySchema } from "@/schemas/insights.schema";
import { getInsightsConflicts } from "@/services/insights/insights.service";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const { searchParams } = new URL(request.url);

    const parseResult = conflictQuerySchema.safeParse({
      date: searchParams.get("date") || undefined,
      days: searchParams.get("days") || undefined,
    });

    if (!parseResult.success) {
      return Response.json(
        { success: false, error: { message: "Query parameter tidak valid", issues: parseResult.error.issues } },
        { status: 400 }
      );
    }

    const { date, days } = parseResult.data;
    const conflicts = await getInsightsConflicts(date, days, user.id);

    return Response.json({ success: true, data: conflicts });
  } catch (error) {
    return authErrorResponse(error);
  }
}
