import { NextResponse } from "next/server";
import { updateMilestoneSchema } from "@/schemas/milestone.schema";
import { getMilestone, updateMilestone, deleteMilestone, MilestoneServiceError } from "@/services/milestone.service";
import { requireCurrentUser, authErrorResponse, AuthorizationError } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireCurrentUser(request);
    const { id } = await params;
    const data = await getMilestone(id, user.id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof AuthorizationError) return authErrorResponse(error);
    const isNotFound = error instanceof MilestoneServiceError && error.code === "MILESTONE_NOT_FOUND";
    return NextResponse.json(
      { success: false, error: { message: isNotFound ? error.message : "Gagal mengambil data milestone.", code: isNotFound ? error.code : "INTERNAL_ERROR" } },
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

    const parsed = updateMilestoneSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: "Data update milestone tidak valid.", code: "INVALID_INPUT", details: parsed.error.issues } },
        { status: 400 }
      );
    }

    const data = await updateMilestone(id, parsed.data, user.id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof AuthorizationError) return authErrorResponse(error);
    const isServiceError = error instanceof MilestoneServiceError;
    const status = isServiceError && (error.code === "MILESTONE_NOT_FOUND" || error.code === "PROJECT_NOT_FOUND") ? 404 : 500;
    return NextResponse.json(
      { success: false, error: { message: isServiceError ? error.message : "Gagal memperbarui milestone.", code: isServiceError ? error.code : "INTERNAL_ERROR" } },
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
    const result = await deleteMilestone(id, user.id);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AuthorizationError) return authErrorResponse(error);
    const isServiceError = error instanceof MilestoneServiceError;
    const status = isServiceError && error.code === "MILESTONE_NOT_FOUND" ? 404 : 500;
    return NextResponse.json(
      { success: false, error: { message: isServiceError ? error.message : "Gagal menghapus milestone.", code: isServiceError ? error.code : "INTERNAL_ERROR" } },
      { status }
    );
  }
}
