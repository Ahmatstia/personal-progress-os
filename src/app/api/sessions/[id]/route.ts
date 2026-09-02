import { NextResponse } from "next/server";
import { SessionServiceError, deleteSession, getSession } from "@/services/session.service";
import { requireCurrentUser, authErrorResponse, AuthorizationError } from "@/lib/auth";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireCurrentUser(_request);
    return NextResponse.json({ success: true, data: await deleteSession((await context.params).id, user.id) });
  } catch (error) { return error instanceof AuthorizationError ? authErrorResponse(error) : handleSessionError(error); }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireCurrentUser(_request);
    const session = await getSession((await context.params).id, user.id);
  if (!session) {
    return NextResponse.json(
      { success: false, error: { message: "Session tidak ditemukan.", code: "SESSION_NOT_FOUND" } },
      { status: 404 },
    );
  }
  return NextResponse.json({ success: true, data: session });
  } catch (error) { return authErrorResponse(error); }
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
