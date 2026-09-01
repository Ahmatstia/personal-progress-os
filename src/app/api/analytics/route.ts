import { NextResponse } from "next/server";
import { analyticsQuerySchema } from "@/schemas/analytics.schema";
import { getDashboardAnalytics } from "@/services/analytics.service";

export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsed = analyticsQuerySchema.safeParse(params);
  if (!parsed.success) return NextResponse.json({ success: false, error: { message: "Parameter analytics tidak valid.", code: "INVALID_INPUT" } }, { status: 400 });
  try { return NextResponse.json({ success: true, data: await getDashboardAnalytics(parsed.data) }); }
  catch { return NextResponse.json({ success: false, error: { message: "Analytics gagal dimuat.", code: "INTERNAL_ERROR" } }, { status: 500 }); }
}
