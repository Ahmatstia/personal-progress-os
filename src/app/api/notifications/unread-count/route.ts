import { NextResponse } from "next/server";
import { requireCurrentUser, authErrorResponse, AuthorizationError } from "@/lib/auth";
import { getUnreadNotificationCount } from "@/services/notification.service";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const unreadCount = await getUnreadNotificationCount(user.id);
    return NextResponse.json({ success: true, data: { unreadCount } });
  } catch (error) {
    if (error instanceof AuthorizationError) return authErrorResponse(error);
    return NextResponse.json(
      { success: false, error: { message: "Gagal mengambil jumlah unread.", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}
