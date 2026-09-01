import { NextResponse } from "next/server";
import { startSessionSchema } from "@/schemas/session.schema";
import {
  SessionServiceError,
  getActiveSession,
  getSessionHistory,
  startSession,
} from "@/services/session.service";

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
    return NextResponse.json({ success: true, data: await startSession(id) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  try {
    const [active, history] = await Promise.all([
      getActiveSession(id),
      getSessionHistory(id),
    ]);
    return NextResponse.json({ success: true, data: { active, history } });
  } catch (error) {
    return errorResponse(error);
  }
}
