import { NextResponse } from "next/server";
import { updateAreaSchema } from "@/schemas/area.schema";
import { getArea, updateArea, deleteArea, AreaServiceError } from "@/services/area.service";
import { requireCurrentUser, authErrorResponse, AuthorizationError } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireCurrentUser(request);
    const { id } = await params;
    const data = await getArea(id, user.id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof AuthorizationError) return authErrorResponse(error);
    const isNotFound = error instanceof AreaServiceError && error.code === "AREA_NOT_FOUND";
    return NextResponse.json(
      { success: false, error: { message: isNotFound ? error.message : "Gagal mengambil data area.", code: isNotFound ? error.code : "INTERNAL_ERROR" } },
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

    const parsed = updateAreaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: "Data update tidak valid.", code: "INVALID_INPUT", details: parsed.error.issues } },
        { status: 400 }
      );
    }

    const data = await updateArea(id, parsed.data, user.id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof AuthorizationError) return authErrorResponse(error);
    const isServiceError = error instanceof AreaServiceError;
    const status = isServiceError && error.code === "AREA_NOT_FOUND" ? 404 : isServiceError && error.code === "AREA_NAME_EXISTS" ? 409 : 500;
    return NextResponse.json(
      { success: false, error: { message: isServiceError ? error.message : "Gagal memperbarui area.", code: isServiceError ? error.code : "INTERNAL_ERROR" } },
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
    const result = await deleteArea(id, user.id);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AuthorizationError) return authErrorResponse(error);
    const isServiceError = error instanceof AreaServiceError;
    const status = isServiceError && error.code === "AREA_NOT_FOUND" ? 404 : isServiceError && error.code === "AREA_HAS_GOALS" ? 400 : 500;
    return NextResponse.json(
      { success: false, error: { message: isServiceError ? error.message : "Gagal menghapus area.", code: isServiceError ? error.code : "INTERNAL_ERROR" } },
      { status }
    );
  }
}
