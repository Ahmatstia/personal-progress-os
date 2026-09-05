import { NextResponse } from "next/server";
import { requireCurrentUser, authErrorResponse, AuthorizationError } from "@/lib/auth";
import { markAsRead, NotificationServiceError } from "@/services/notification.service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireCurrentUser(request);
    const { id } = await params;

    const updated = await markAsRead(id, user.id);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof AuthorizationError) return authErrorResponse(error);
    const isServiceError = error instanceof NotificationServiceError;
    return NextResponse.json(
      {
        success: false,
        error: {
          message: isServiceError ? error.message : "Gagal menandai notifikasi sebagai dibaca.",
          code: isServiceError ? error.code : "INTERNAL_ERROR",
        },
      },
      { status: isServiceError && error.code === "NOT_FOUND" ? 404 : 500 }
    );
  }
}
