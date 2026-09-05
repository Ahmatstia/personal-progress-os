import { requireCurrentUser, authErrorResponse } from "@/lib/auth";
import { unifiedInboxQuerySchema } from "@/schemas/insights.schema";
import { getInsightsUnifiedInbox } from "@/services/insights/insights.service";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const { searchParams } = new URL(request.url);

    const parseResult = unifiedInboxQuerySchema.safeParse({
      limit: searchParams.get("limit") || undefined,
      source: searchParams.get("source") || undefined,
    });

    if (!parseResult.success) {
      return Response.json(
        { success: false, error: { message: "Query parameter tidak valid", issues: parseResult.error.issues } },
        { status: 400 }
      );
    }

    const { source, limit } = parseResult.data;
    const inbox = await getInsightsUnifiedInbox(source, limit, user.id);

    return Response.json({ success: true, data: inbox });
  } catch (error) {
    return authErrorResponse(error);
  }
}
