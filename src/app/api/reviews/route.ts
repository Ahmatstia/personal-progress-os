import { NextResponse } from "next/server";
import { requireCurrentUser, authErrorResponse } from "@/lib/auth";
import { getAllReviews } from "@/services/review.service";

export async function GET(request: Request) {
  let user;
  try {
    user = await requireCurrentUser(request);
  } catch (error) {
    return authErrorResponse(error);
  }

  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit")) || 50;

  try {
    const reviews = await getAllReviews(user.id, limit);
    return NextResponse.json({ success: true, data: reviews });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: "Gagal memuat daftar review.", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}
