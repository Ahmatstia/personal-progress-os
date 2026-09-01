import { NextResponse } from "next/server";
import { focusOrderSchema } from "@/schemas/today.schema";
import { removeTodayFocus, reorderTodayFocus, TodayServiceError } from "@/services/today.service";

type Context = { params: Promise<{ id: string }> };
function errorResponse(error: unknown) { const known = error instanceof TodayServiceError; return NextResponse.json({ success: false, error: { message: known ? error.message : "Fokus gagal diperbarui.", code: known ? error.code : "INTERNAL_ERROR" } }, { status: known ? 404 : 500 }); }

export async function DELETE(_request: Request, context: Context) { try { return NextResponse.json({ success: true, data: await removeTodayFocus((await context.params).id) }); } catch (error) { return errorResponse(error); } }
export async function PATCH(request: Request, context: Context) {
  const parsed = focusOrderSchema.safeParse(await request.json());
  if (!parsed.success || !parsed.data.direction) return NextResponse.json({ success: false, error: { message: "Arah fokus tidak valid.", code: "INVALID_INPUT" } }, { status: 400 });
  try { return NextResponse.json({ success: true, data: await reorderTodayFocus((await context.params).id, parsed.data.direction) }); } catch (error) { return errorResponse(error); }
}
