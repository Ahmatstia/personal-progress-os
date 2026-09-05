import { NextResponse } from "next/server";
import { requireCurrentUser, authErrorResponse } from "@/lib/auth";
import {
  addDailyFocus,
  getDailyFocus,
  getDailyFocusHistoryList,
  DailyFocusServiceError,
} from "@/services/daily-focus.service";
import { ZodError } from "zod";

export async function GET(request: Request) {
  let user;
  try {
    user = await requireCurrentUser(request);
  } catch (error) {
    return authErrorResponse(error);
  }

  const { searchParams } = new URL(request.url);
  const isHistory = searchParams.get("history") === "true";
  const dateParam = searchParams.get("date");

  try {
    if (isHistory) {
      const limit = Number(searchParams.get("limit")) || 30;
      const history = await getDailyFocusHistoryList(user.id, limit);
      return NextResponse.json({ success: true, data: history });
    }

    const focus = await getDailyFocus(dateParam ?? undefined, user.id);
    return NextResponse.json({ success: true, data: focus });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: "Gagal memuat fokus harian.", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let user;
  try {
    user = await requireCurrentUser(request);
  } catch (error) {
    return authErrorResponse(error);
  }

  try {
    const body = await request.json();
    const result = await addDailyFocus(body, user.id);
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: { message: error.issues[0].message, code: "VALIDATION_ERROR" } },
        { status: 400 }
      );
    }
    if (error instanceof DailyFocusServiceError) {
      const status = error.code === "TASK_NOT_FOUND" ? 404 : 400;
      return NextResponse.json(
        { success: false, error: { message: error.message, code: error.code } },
        { status }
      );
    }
    return NextResponse.json(
      { success: false, error: { message: "Gagal menambahkan fokus harian.", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}
