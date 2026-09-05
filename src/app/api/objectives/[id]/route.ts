import { NextResponse } from "next/server";
import { updateObjectiveSchema } from "@/schemas/objective.schema";
import { getObjective, updateObjective, deleteObjective, ObjectiveServiceError } from "@/services/objective.service";
import { requireCurrentUser, authErrorResponse, AuthorizationError } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireCurrentUser(request);
    const { id } = await params;
    const data = await getObjective(id, user.id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof AuthorizationError) return authErrorResponse(error);
    const isNotFound = error instanceof ObjectiveServiceError && error.code === "OBJECTIVE_NOT_FOUND";
    return NextResponse.json(
      { success: false, error: { message: isNotFound ? error.message : "Gagal mengambil data objective.", code: isNotFound ? error.code : "INTERNAL_ERROR" } },
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

    const parsed = updateObjectiveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: "Data update objective tidak valid.", code: "INVALID_INPUT", details: parsed.error.issues } },
        { status: 400 }
      );
    }

    const data = await updateObjective(id, parsed.data, user.id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof AuthorizationError) return authErrorResponse(error);
    const isServiceError = error instanceof ObjectiveServiceError;
    const status = isServiceError && (error.code === "OBJECTIVE_NOT_FOUND" || error.code === "GOAL_NOT_FOUND") ? 404 : 500;
    return NextResponse.json(
      { success: false, error: { message: isServiceError ? error.message : "Gagal memperbarui objective.", code: isServiceError ? error.code : "INTERNAL_ERROR" } },
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
    const result = await deleteObjective(id, user.id);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AuthorizationError) return authErrorResponse(error);
    const isServiceError = error instanceof ObjectiveServiceError;
    const status = isServiceError && error.code === "OBJECTIVE_NOT_FOUND" ? 404 : 500;
    return NextResponse.json(
      { success: false, error: { message: isServiceError ? error.message : "Gagal menghapus objective.", code: isServiceError ? error.code : "INTERNAL_ERROR" } },
      { status }
    );
  }
}
