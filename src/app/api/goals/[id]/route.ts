import { NextResponse } from "next/server";
import { deleteGoal, GoalServiceError } from "@/services/goal.service";
import { requireCurrentUser, authErrorResponse } from "@/lib/auth";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: Context) {
  let user;
  try { user = await requireCurrentUser(_request); } catch (error) { return authErrorResponse(error); }
  try {
    return NextResponse.json({ success: true, data: await deleteGoal((await context.params).id, user.id) });
  } catch (error) {
    const known = error instanceof GoalServiceError;
    return NextResponse.json(
      { success: false, error: { message: known ? error.message : "Terjadi kesalahan server.", code: known ? "GOAL_NOT_FOUND" : "INTERNAL_ERROR" } },
      { status: known ? 404 : 500 },
    );
  }
}