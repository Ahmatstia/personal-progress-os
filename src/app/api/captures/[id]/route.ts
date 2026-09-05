import { NextResponse } from "next/server";
import {
  CaptureServiceError,
  deleteCapture,
  getCapture,
  updateCapture,
} from "@/services/capture.service";
import { requireCurrentUser, authErrorResponse } from "@/lib/auth";
import { ZodError } from "zod";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  let user;
  try {
    user = await requireCurrentUser(_request);
  } catch (error) {
    return authErrorResponse(error);
  }

  const { id } = await context.params;

  try {
    const capture = await getCapture(id, user.id);
    return NextResponse.json({ success: true, data: capture });
  } catch (error) {
    if (error instanceof CaptureServiceError) {
      return NextResponse.json(
        { success: false, error: { message: error.message, code: error.code } },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: { message: "Gagal memuat catatan.", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: Context) {
  let user;
  try {
    user = await requireCurrentUser(request);
  } catch (error) {
    return authErrorResponse(error);
  }

  const { id } = await context.params;

  try {
    const body = await request.json();
    const updated = await updateCapture(id, body, user.id);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: { message: error.issues[0].message, code: "VALIDATION_ERROR" } },
        { status: 400 }
      );
    }
    if (error instanceof CaptureServiceError) {
      return NextResponse.json(
        { success: false, error: { message: error.message, code: error.code } },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: { message: "Gagal memperbarui catatan.", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: Context) {
  let user;
  try {
    user = await requireCurrentUser(_request);
  } catch (error) {
    return authErrorResponse(error);
  }

  const { id } = await context.params;

  try {
    const result = await deleteCapture(id, user.id);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof CaptureServiceError) {
      return NextResponse.json(
        { success: false, error: { message: error.message, code: error.code } },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: { message: "Gagal menghapus catatan.", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}