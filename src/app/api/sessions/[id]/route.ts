import { NextResponse } from "next/server";
import { SessionServiceError, getSession } from "@/services/session.service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession((await context.params).id);
  if (!session) {
    return NextResponse.json(
      { success: false, error: { message: "Session tidak ditemukan.", code: "SESSION_NOT_FOUND" } },
      { status: 404 },
    );
  }
  return NextResponse.json({ success: true, data: session });
}

export function handleSessionError(error: unknown) {
  if (error instanceof SessionServiceError) {
    return NextResponse.json(
      { success: false, error: { message: error.message, code: error.code } },
      { status: error.code === "SESSION_NOT_FOUND" ? 404 : 409 },
    );
  }
  return NextResponse.json(
    { success: false, error: { message: "Terjadi kesalahan server.", code: "INTERNAL_ERROR" } },
    { status: 500 },
  );
}
