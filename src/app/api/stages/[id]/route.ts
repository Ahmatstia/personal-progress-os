import { NextResponse } from "next/server";
import { updateStageSchema } from "@/schemas/stage.schema";
import { deleteStage, moveStage, StageServiceError, updateStage } from "@/services/stage.service";
import { requireCurrentUser, authErrorResponse } from "@/lib/auth";

type Context = { params: Promise<{ id: string }> };

function errorResponse(error: unknown) {
  const known = error instanceof StageServiceError;
  return NextResponse.json({ success: false, error: { message: known ? error.message : "Terjadi kesalahan server.", code: known ? "STAGE_NOT_FOUND" : "INTERNAL_ERROR" } }, { status: known ? 404 : 500 });
}

export async function PATCH(request: Request, context: Context) {
  try { await requireCurrentUser(); } catch (error) { return authErrorResponse(error); }
  try {
    const body = await request.json();
    if (body.order === "up" || body.order === "down") {
      return NextResponse.json({ success: true, data: await moveStage((await context.params).id, body.order) });
    }
    const parsed = updateStageSchema.safeParse({ ...body, order: body.order === undefined ? undefined : Number(body.order) });
    if (!parsed.success) return NextResponse.json({ success: false, error: { message: "Data stage tidak valid.", code: "INVALID_INPUT" } }, { status: 400 });
    return NextResponse.json({ success: true, data: await updateStage((await context.params).id, parsed.data) });
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(_request: Request, context: Context) {
  try { await requireCurrentUser(); } catch (error) { return authErrorResponse(error); }
  try { return NextResponse.json({ success: true, data: await deleteStage((await context.params).id) }); }
  catch (error) { return errorResponse(error); }
}
