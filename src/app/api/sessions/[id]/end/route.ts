import { NextResponse } from "next/server";
import { endSessionSchema } from "@/schemas/session.schema";
import { endSession, SessionServiceError } from "@/services/session.service";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const id = (await context.params).id;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsed = endSessionSchema.safeParse({ ...(body as object), sessionId: id });
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { message: "Data session tidak valid.", code: "INVALID_INPUT" } },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json({ success: true, data: await endSession(id, parsed.data) });
  } catch (error) {
    const serviceError = error instanceof SessionServiceError;
    return NextResponse.json(
      {
        success: false,
        error: {
          message: serviceError ? error.message : "Terjadi kesalahan server.",
          code: serviceError ? error.code : "INTERNAL_ERROR",
        },
      },
      { status: serviceError ? (error.code === "SESSION_NOT_FOUND" ? 404 : 409) : 500 },
    );
  }
}
