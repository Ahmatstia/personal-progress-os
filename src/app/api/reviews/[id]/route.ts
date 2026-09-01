import { NextResponse } from "next/server";
import { reviewSchema } from "@/schemas/review.schema";
import { getReview, ReviewServiceError, updateReview } from "@/services/review.service";

type Context = { params: Promise<{ id: string }> };

function errorResponse(error: unknown) {
  const known = error instanceof ReviewServiceError;
  return NextResponse.json({ success: false, error: { message: known ? error.message : "Terjadi kesalahan server.", code: known ? error.code : "INTERNAL_ERROR" } }, { status: known ? 404 : 500 });
}

export async function GET(_request: Request, context: Context) {
  const review = await getReview((await context.params).id);
  if (!review) return NextResponse.json({ success: false, error: { message: "Review tidak ditemukan.", code: "REVIEW_NOT_FOUND" } }, { status: 404 });
  return NextResponse.json({ success: true, data: review });
}

export async function PATCH(request: Request, context: Context) {
  try {
    const parsed = reviewSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ success: false, error: { message: "Data review tidak valid.", code: "INVALID_INPUT" } }, { status: 400 });
    return NextResponse.json({ success: true, data: await updateReview((await context.params).id, parsed.data) });
  } catch (error) { return errorResponse(error); }
}
