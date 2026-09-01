import { NextResponse } from "next/server";
import { startSessionSchema } from "@/schemas/session.schema";
import {
  SessionServiceError,
  getActiveSession,
  getSessionHistory,
  startSession,
} from "@/services/session.service";
import { requireCurrentUser, authErrorResponse } from "@/lib/auth";

type Context = { params: Promise<{ id: string }> };

function errorResponse(error: unknown) {
  if (error instanceof SessionServiceError) {
    const status = error.code === "TASK_NOT_FOUND" ? 404 : 409;
    return NextResponse.json(
      { success: false, error: { message: error.message, code: error.code } },
      { status },
    );
  }
  return NextResponse.json(
    { success: false, error: { message: "Terjadi kesalahan server.", code: "INTERNAL_ERROR" } },
    { status: 500 },
  );
}

export async function POST(request: Request, context: Context) {
  const { id } = await context.params;
  const parsed = startSessionSchema.safeParse({ taskId: id });
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { message: "Task ID tidak valid.", code: "INVALID_INPUT" } },
      { status: 400 },
    );
  }

  try {
    const user = await requireCurrentUser(request);
    return NextResponse.json({ success: true, data: await startSession(id, user.id) }, { status: 201 });
  } catch (error) {
    return error instanceof Error && error.message === "Autentikasi diperlukan." ? authErrorResponse(error) : errorResponse(error);
  }
}

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  try {
    const user = await requireCurrentUser(_request);
    const [active, history] = await Promise.all([
      getActiveSession(id, user.id),
      getSessionHistory(id, user.id),
    ]);
    return NextResponse.json({ success: true, data: { active, history } });
  } catch (error) {
    return error instanceof Error && error.message === "Autentikasi diperlukan." ? authErrorResponse(error) : errorResponse(error);
  }
}
