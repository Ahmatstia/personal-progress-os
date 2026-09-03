import { NextResponse } from "next/server";
import { deleteGoal, updateGoal, GoalServiceError } from "@/services/goal.service";
import { requireCurrentUser, authErrorResponse } from "@/lib/auth";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  let user;
  try {
    user = await requireCurrentUser(request);
  } catch (error) {
    return authErrorResponse(error);
  }

  try {
    const json = await request.json();
    const result = await updateGoal((await context.params).id, json, user.id);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const known = error instanceof GoalServiceError;
    return NextResponse.json(
      {
        success: false,
        error: {
          message: known ? error.message : "Terjadi kesalahan saat memperbarui goal.",
          code: known ? error.code : "INTERNAL_ERROR",
        },
      },
      { status: known ? 404 : 400 },
    );
  }
}

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