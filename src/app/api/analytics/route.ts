import { NextResponse } from "next/server";
import { analyticsQuerySchema } from "@/schemas/analytics.schema";
import { getDashboardAnalytics } from "@/services/analytics.service";
import { requireCurrentUser, authErrorResponse } from "@/lib/auth";

export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsed = analyticsQuerySchema.safeParse(params);
  if (!parsed.success) return NextResponse.json({ success: false, error: { message: "Parameter analytics tidak valid.", code: "INVALID_INPUT" } }, { status: 400 });
  try { const user = await requireCurrentUser(request); return NextResponse.json({ success: true, data: await getDashboardAnalytics(parsed.data, user.id) }); }
  catch (error) { if (error instanceof Error && error.message === "Autentikasi diperlukan.") return authErrorResponse(error); return NextResponse.json({ success: false, error: { message: "Analytics gagal dimuat.", code: "INTERNAL_ERROR" } }, { status: 500 }); }
}
