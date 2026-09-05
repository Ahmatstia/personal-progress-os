import { NextResponse } from "next/server";
import { updateUserPreferenceSchema } from "@/schemas/user-preference.schema";
import { getUserPreference, updateUserPreference, UserPreferenceServiceError } from "@/services/user-preference.service";
import { requireCurrentUser, authErrorResponse, AuthorizationError } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const data = await getUserPreference(user.id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof AuthorizationError) return authErrorResponse(error);
    return NextResponse.json({ success: false, error: { message: "Gagal mengambil preferensi.", code: "INTERNAL_ERROR" } }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const body = await request.json();

    const parsed = updateUserPreferenceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: "Data preferensi tidak valid.", code: "INVALID_INPUT", details: parsed.error.issues } },
        { status: 400 }
      );
    }

    const data = await updateUserPreference(parsed.data, user.id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof AuthorizationError) return authErrorResponse(error);
    const isServiceError = error instanceof UserPreferenceServiceError;
    return NextResponse.json(
      { success: false, error: { message: isServiceError ? error.message : "Gagal memperbarui preferensi.", code: isServiceError ? error.code : "INTERNAL_ERROR" } },
      { status: isServiceError ? 400 : 500 }
    );
  }
}
