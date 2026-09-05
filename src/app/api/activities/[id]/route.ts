import { NextResponse } from "next/server";
import { updateActivitySchema } from "@/schemas/activity.schema";
import { getActivity, updateActivity, deleteActivity, ActivityServiceError } from "@/services/activity.service";
import { requireCurrentUser, authErrorResponse, AuthorizationError } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireCurrentUser(request);
    const { id } = await params;
    const data = await getActivity(id, user.id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof AuthorizationError) return authErrorResponse(error);
    const isNotFound = error instanceof ActivityServiceError && error.code === "ACTIVITY_NOT_FOUND";
    return NextResponse.json(
      { success: false, error: { message: isNotFound ? error.message : "Gagal mengambil data aktivitas.", code: isNotFound ? error.code : "INTERNAL_ERROR" } },
      { status: isNotFound ? 404 : 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireCurrentUser(request);
    const { id } = await params;
    const body = await request.json();

    const parsed = updateActivitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: "Data update aktivitas tidak valid.", code: "INVALID_INPUT", details: parsed.error.issues } },
        { status: 400 }
      );
    }

    const data = await updateActivity(id, parsed.data, user.id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof AuthorizationError) return authErrorResponse(error);
    const isServiceError = error instanceof ActivityServiceError;
    const status = isServiceError && (error.code === "ACTIVITY_NOT_FOUND" || error.code === "TASK_NOT_FOUND" || error.code === "PROJECT_NOT_FOUND" || error.code === "AREA_NOT_FOUND") ? 404 : 500;
    return NextResponse.json(
      { success: false, error: { message: isServiceError ? error.message : "Gagal memperbarui aktivitas.", code: isServiceError ? error.code : "INTERNAL_ERROR" } },
      { status }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireCurrentUser(request);
    const { id } = await params;
    const result = await deleteActivity(id, user.id);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AuthorizationError) return authErrorResponse(error);
    const isServiceError = error instanceof ActivityServiceError;
    const status = isServiceError && error.code === "ACTIVITY_NOT_FOUND" ? 404 : 500;
    return NextResponse.json(
      { success: false, error: { message: isServiceError ? error.message : "Gagal menghapus aktivitas.", code: isServiceError ? error.code : "INTERNAL_ERROR" } },
      { status }
    );
  }
}
