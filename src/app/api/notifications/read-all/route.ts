import { NextResponse } from "next/server";
import { requireCurrentUser, authErrorResponse, AuthorizationError } from "@/lib/auth";
import { markAllAsRead } from "@/services/notification.service";

export async function PATCH(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const result = await markAllAsRead(user.id);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AuthorizationError) return authErrorResponse(error);
    return NextResponse.json(
      { success: false, error: { message: "Gagal menandai semua sebagai dibaca.", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}
