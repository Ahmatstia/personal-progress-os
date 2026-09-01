import { NextResponse } from "next/server";
import { focusSchema } from "@/schemas/today.schema";
import { addTodayFocus, TodayServiceError } from "@/services/today.service";
import { requireCurrentUser, authErrorResponse } from "@/lib/auth";

export async function POST(request: Request) {
  const parsed = focusSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ success: false, error: { message: "Task fokus tidak valid.", code: "INVALID_INPUT" } }, { status: 400 });
  try { const user = await requireCurrentUser(); return NextResponse.json({ success: true, data: await addTodayFocus(parsed.data.taskId, new Date(), user.id) }, { status: 201 }); }
  catch (error) { if (error instanceof Error && error.message === "Autentikasi diperlukan.") return authErrorResponse(error); const known = error instanceof TodayServiceError; return NextResponse.json({ success: false, error: { message: known ? error.message : "Fokus gagal ditambahkan.", code: known ? error.code : "INTERNAL_ERROR" } }, { status: known && error.code === "TASK_NOT_FOUND" ? 404 : 409 }); }
}
