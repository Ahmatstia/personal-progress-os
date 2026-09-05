import { NextResponse } from "next/server";
import { requireCurrentUser, authErrorResponse, AuthorizationError } from "@/lib/auth";
import { runReminderCycle } from "@/services/reminder.service";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    let forceIgnoreQuietHours = false;

    try {
      const body = await request.json();
      forceIgnoreQuietHours = Boolean(body?.forceIgnoreQuietHours);
    } catch {
      // Body is optional
    }

    const result = await runReminderCycle(user.id, { forceIgnoreQuietHours });
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AuthorizationError) return authErrorResponse(error);
    return NextResponse.json(
      { success: false, error: { message: "Gagal menjalankan siklus pengingat.", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}
