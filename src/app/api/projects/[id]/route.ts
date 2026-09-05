import { NextResponse } from "next/server";
import { updateProjectSchema } from "@/schemas/project.schema";
import { getProject, updateProject, deleteProject, ProjectServiceError } from "@/services/project.service";
import { requireCurrentUser, authErrorResponse, AuthorizationError } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireCurrentUser(request);
    const { id } = await params;
    const data = await getProject(id, user.id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof AuthorizationError) return authErrorResponse(error);
    const isNotFound = error instanceof ProjectServiceError && error.code === "PROJECT_NOT_FOUND";
    return NextResponse.json(
      { success: false, error: { message: isNotFound ? error.message : "Gagal mengambil data project.", code: isNotFound ? error.code : "INTERNAL_ERROR" } },
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

    const parsed = updateProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: "Data update project tidak valid.", code: "INVALID_INPUT", details: parsed.error.issues } },
        { status: 400 }
      );
    }

    const data = await updateProject(id, parsed.data, user.id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof AuthorizationError) return authErrorResponse(error);
    const isServiceError = error instanceof ProjectServiceError;
    const status = isServiceError && (error.code === "PROJECT_NOT_FOUND" || error.code === "GOAL_NOT_FOUND" || error.code === "AREA_NOT_FOUND") ? 404 : 500;
    return NextResponse.json(
      { success: false, error: { message: isServiceError ? error.message : "Gagal memperbarui project.", code: isServiceError ? error.code : "INTERNAL_ERROR" } },
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
    const result = await deleteProject(id, user.id);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AuthorizationError) return authErrorResponse(error);
    const isServiceError = error instanceof ProjectServiceError;
    const status = isServiceError && error.code === "PROJECT_NOT_FOUND" ? 404 : 500;
    return NextResponse.json(
      { success: false, error: { message: isServiceError ? error.message : "Gagal menghapus project.", code: isServiceError ? error.code : "INTERNAL_ERROR" } },
      { status }
    );
  }
}
