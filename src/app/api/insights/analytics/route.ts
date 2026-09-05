import { requireCurrentUser, authErrorResponse } from "@/lib/auth";
import { analyticsQuerySchema } from "@/schemas/insights.schema";
import { getInsightsAnalytics } from "@/services/insights/insights.service";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const { searchParams } = new URL(request.url);

    const parseResult = analyticsQuerySchema.safeParse({
      period: searchParams.get("period") || undefined,
      start: searchParams.get("start") || undefined,
      end: searchParams.get("end") || undefined,
      goalId: searchParams.get("goalId") || undefined,
      areaId: searchParams.get("areaId") || undefined,
    });

    if (!parseResult.success) {
      return Response.json(
        { success: false, error: { message: "Query parameter tidak valid", issues: parseResult.error.issues } },
        { status: 400 }
      );
    }

    const { period, start, end } = parseResult.data;
    const analytics = await getInsightsAnalytics(period, start, end, user.id);

    return Response.json({ success: true, data: analytics });
  } catch (error) {
    return authErrorResponse(error);
  }
}
