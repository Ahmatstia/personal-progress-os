import { requireCurrentUser, authErrorResponse } from "@/lib/auth";
import { lifeHealthQuerySchema } from "@/schemas/insights.schema";
import { getInsightsLifeHealth } from "@/services/insights/insights.service";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const { searchParams } = new URL(request.url);

    const parseResult = lifeHealthQuerySchema.safeParse({
      days: searchParams.get("days") || undefined,
    });

    if (!parseResult.success) {
      return Response.json(
        { success: false, error: { message: "Query parameter tidak valid", issues: parseResult.error.issues } },
        { status: 400 }
      );
    }

    const health = await getInsightsLifeHealth(parseResult.data.days, user.id);

    return Response.json({ success: true, data: health });
  } catch (error) {
    return authErrorResponse(error);
  }
}
