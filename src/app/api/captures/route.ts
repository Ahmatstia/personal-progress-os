import { NextResponse } from "next/server";
import { createCaptureSchema } from "@/schemas/capture.schema";
import { createCapture, getCaptures } from "@/services/capture.service";
import { requireCurrentUser, authErrorResponse } from "@/lib/auth";
import { ZodError } from "zod";
import type { CaptureCategory, CaptureStatus } from "@/generated/prisma/client";

export async function GET(request: Request) {
  let user;
  try {
    user = await requireCurrentUser(request);
  } catch (error) {
    return authErrorResponse(error);
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as CaptureStatus | null;
  const category = searchParams.get("category") as CaptureCategory | null;
  const limit = Number(searchParams.get("limit")) || 50;

  try {
    const captures = await getCaptures(
      {
        status: status ?? undefined,
        category: category ?? undefined,
        limit,
      },
      user.id
    );
    return NextResponse.json({ success: true, data: captures });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: "Gagal memuat daftar catatan.", code: "INTERNAL_ERROR" } },
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
    const parsed = createCaptureSchema.parse(body);
    const result = await createCapture(parsed, user.id);
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: { message: error.issues[0].message, code: "VALIDATION_ERROR" } },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: { message: "Gagal menyimpan catatan.", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}
