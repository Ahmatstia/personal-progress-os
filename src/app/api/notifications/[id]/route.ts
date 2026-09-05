import { NextResponse } from "next/server";
import { requireCurrentUser, authErrorResponse, AuthorizationError } from "@/lib/auth";
import { deleteNotification, NotificationServiceError } from "@/services/notification.service";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireCurrentUser(request);
    const { id } = await params;

    const result = await deleteNotification(id, user.id);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AuthorizationError) return authErrorResponse(error);
    const isServiceError = error instanceof NotificationServiceError;
    return NextResponse.json(
      {
        success: false,
        error: {
          message: isServiceError ? error.message : "Gagal menghapus notifikasi.",
          code: isServiceError ? error.code : "INTERNAL_ERROR",
        },
      },
      { status: isServiceError && error.code === "NOT_FOUND" ? 404 : 500 }
    );
  }
}
