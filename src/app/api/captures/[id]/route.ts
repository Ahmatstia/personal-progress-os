import { NextResponse } from "next/server";
import { CaptureServiceError, deleteCapture } from "@/services/capture.service";
import { requireCurrentUser, authErrorResponse } from "@/lib/auth";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: Context) {
  let user;
  try { user = await requireCurrentUser(_request); } catch (error) { return authErrorResponse(error); }
  try {
    return NextResponse.json({ success: true, data: await deleteCapture((await context.params).id, user.id) });
  } catch (error) {
    const known = error instanceof CaptureServiceError;
    return NextResponse.json(
      { success: false, error: { message: known ? error.message : "Terjadi kesalahan server.", code: known ? "CAPTURE_NOT_FOUND" : "INTERNAL_ERROR" } },
      { status: known ? 404 : 500 },
    );
  }
}