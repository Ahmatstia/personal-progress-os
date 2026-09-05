import { NextResponse } from "next/server";
import { createAreaSchema } from "@/schemas/area.schema";
import { createArea, getAreas, AreaServiceError } from "@/services/area.service";
import { requireCurrentUser, authErrorResponse, AuthorizationError } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const { searchParams } = new URL(request.url);
    const isActiveParam = searchParams.get("isActive");
    const filter = isActiveParam !== null ? { isActive: isActiveParam === "true" } : undefined;

    const data = await getAreas(user.id, filter);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof AuthorizationError) return authErrorResponse(error);
    return NextResponse.json({ success: false, error: { message: "Gagal mengambil data area.", code: "INTERNAL_ERROR" } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const body = await request.json();

    const parsed = createAreaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: "Data area tidak valid.", code: "INVALID_INPUT", details: parsed.error.issues } },
        { status: 400 }
      );
    }

    const data = await createArea(parsed.data, user.id);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthorizationError) return authErrorResponse(error);
    const isServiceError = error instanceof AreaServiceError;
    const status = isServiceError && error.code === "AREA_NAME_EXISTS" ? 409 : isServiceError ? 400 : 500;
    return NextResponse.json(
      { success: false, error: { message: isServiceError ? error.message : "Gagal membuat area.", code: isServiceError ? error.code : "INTERNAL_ERROR" } },
      { status }
    );
  }
}
