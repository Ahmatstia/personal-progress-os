import { NextResponse } from "next/server";
import { requireCurrentUser, authErrorResponse } from "@/lib/auth";
import {
  DailyFocusServiceError,
  removeDailyFocus,
  reorderDailyFocus,
} from "@/services/daily-focus.service";
import { ZodError } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  let user;
  try {
    user = await requireCurrentUser(request);
  } catch (error) {
    return authErrorResponse(error);
  }

  const { id } = await context.params;

  try {
    const body = await request.json();
    const result = await reorderDailyFocus(id, body, user.id);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: { message: error.issues[0].message, code: "VALIDATION_ERROR" } },
        { status: 400 }
      );
    }
    if (error instanceof DailyFocusServiceError) {
      const status = error.code === "FOCUS_NOT_FOUND" ? 404 : 400;
      return NextResponse.json(
        { success: false, error: { message: error.message, code: error.code } },
        { status }
      );
    }
    return NextResponse.json(
      { success: false, error: { message: "Gagal mengubah urutan fokus.", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  let user;
  try {
    user = await requireCurrentUser(request);
  } catch (error) {
    return authErrorResponse(error);
  }

  const { id } = await context.params;

  try {
    const result = await removeDailyFocus(id, user.id);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof DailyFocusServiceError) {
      const status = error.code === "FOCUS_NOT_FOUND" ? 404 : 400;
      return NextResponse.json(
        { success: false, error: { message: error.message, code: error.code } },
        { status }
      );
    }
    return NextResponse.json(
      { success: false, error: { message: "Gagal menghapus fokus harian.", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}
