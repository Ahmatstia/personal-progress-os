import { NextResponse } from "next/server";
import { createActivitySchema, activityCategoryEnum } from "@/schemas/activity.schema";
import { createActivity, getActivities, ActivityServiceError } from "@/services/activity.service";
import { requireCurrentUser, authErrorResponse, AuthorizationError } from "@/lib/auth";
import type { ActivityCategory } from "@/generated/prisma/client";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const { searchParams } = new URL(request.url);
    const categoryParam = searchParams.get("category");
    const areaId = searchParams.get("areaId") || undefined;
    const projectId = searchParams.get("projectId") || undefined;
    const taskId = searchParams.get("taskId") || undefined;
    const startFrom = searchParams.get("startFrom") || undefined;
    const startTo = searchParams.get("startTo") || undefined;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;
    const offset = searchParams.get("offset") ? Number(searchParams.get("offset")) : undefined;

    const parsedCategory = categoryParam ? activityCategoryEnum.safeParse(categoryParam) : null;
    const category = parsedCategory?.success ? (parsedCategory.data as ActivityCategory) : undefined;

    const data = await getActivities(user.id, { category, areaId, projectId, taskId, startFrom, startTo, limit, offset });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof AuthorizationError) return authErrorResponse(error);
    return NextResponse.json({ success: false, error: { message: "Gagal mengambil data aktivitas.", code: "INTERNAL_ERROR" } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const body = await request.json();

    const parsed = createActivitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: "Data aktivitas tidak valid.", code: "INVALID_INPUT", details: parsed.error.issues } },
        { status: 400 }
      );
    }

    const data = await createActivity(parsed.data, user.id);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthorizationError) return authErrorResponse(error);
    const isServiceError = error instanceof ActivityServiceError;
    const status = isServiceError && (error.code === "TASK_NOT_FOUND" || error.code === "PROJECT_NOT_FOUND" || error.code === "AREA_NOT_FOUND") ? 404 : isServiceError ? 400 : 500;
    return NextResponse.json(
      { success: false, error: { message: isServiceError ? error.message : "Gagal membuat aktivitas.", code: isServiceError ? error.code : "INTERNAL_ERROR" } },
      { status }
    );
  }
}
