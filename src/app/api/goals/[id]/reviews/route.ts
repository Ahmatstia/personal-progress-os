import { NextResponse } from "next/server";
import { reviewSchema } from "@/schemas/review.schema";
import { createReview, getGoalReviews, ReviewServiceError } from "@/services/review.service";
import { requireCurrentUser, authErrorResponse } from "@/lib/auth";

type Context = { params: Promise<{ id: string }> };

function errorResponse(error: unknown) {
  const known = error instanceof ReviewServiceError;
  return NextResponse.json({ success: false, error: { message: known ? error.message : "Terjadi kesalahan server.", code: known ? error.code : "INTERNAL_ERROR" } }, { status: known ? 404 : 500 });
}

export async function GET(_request: Request, context: Context) {
  try { const user = await requireCurrentUser(); return NextResponse.json({ success: true, data: await getGoalReviews((await context.params).id, user.id) }); }
  catch (error) { return errorResponse(error); }
}

export async function POST(request: Request, context: Context) {
  try {
    const user = await requireCurrentUser();
    const parsed = reviewSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ success: false, error: { message: "Data review tidak valid.", code: "INVALID_INPUT" } }, { status: 400 });
    return NextResponse.json({ success: true, data: await createReview((await context.params).id, parsed.data, user.id) }, { status: 201 });
  } catch (error) { return error instanceof Error && error.message === "Autentikasi diperlukan." ? authErrorResponse(error) : errorResponse(error); }
}
