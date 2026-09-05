import { NextResponse } from "next/server";
import { deleteGoal, updateGoal, findGoal, GoalServiceError } from "@/services/goal.service";
import { requireCurrentUser, authErrorResponse, AuthorizationError } from "@/lib/auth";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  try {
    const user = await requireCurrentUser(request);
    const { id } = await context.params;
    const goal = await findGoal(user.id, id, true);
    if (!goal) {
      return NextResponse.json(
        { success: false, error: { message: "Goal tidak ditemukan.", code: "GOAL_NOT_FOUND" } },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: goal });
  } catch (error) {
    if (error instanceof AuthorizationError) return authErrorResponse(error);
    return NextResponse.json({ success: false, error: { message: "Gagal mengambil data goal.", code: "INTERNAL_ERROR" } }, { status: 500 });
  }
}

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