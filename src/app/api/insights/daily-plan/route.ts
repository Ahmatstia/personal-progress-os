import { requireCurrentUser, authErrorResponse } from "@/lib/auth";
import { dailyPlanQuerySchema } from "@/schemas/insights.schema";
import { getInsightsDailyPlan } from "@/services/insights/insights.service";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const { searchParams } = new URL(request.url);

    const parseResult = dailyPlanQuerySchema.safeParse({
      date: searchParams.get("date") || undefined,
    });

    if (!parseResult.success) {
      return Response.json(
        { success: false, error: { message: "Query parameter tidak valid", issues: parseResult.error.issues } },
        { status: 400 }
      );
    }

    const plan = await getInsightsDailyPlan(parseResult.data.date, user.id);

    return Response.json({ success: true, data: plan });
  } catch (error) {
    return authErrorResponse(error);
  }
}
