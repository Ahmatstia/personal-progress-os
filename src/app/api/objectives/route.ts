import { NextResponse } from "next/server";
import { createObjectiveSchema } from "@/schemas/objective.schema";
import { createObjective, getObjectivesByGoal, ObjectiveServiceError } from "@/services/objective.service";
import { requireCurrentUser, authErrorResponse, AuthorizationError } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const { searchParams } = new URL(request.url);
    const goalId = searchParams.get("goalId");

    if (!goalId) {
      return NextResponse.json(
        { success: false, error: { message: "Query parameter goalId diperlukan.", code: "MISSING_GOAL_ID" } },
        { status: 400 }
      );
    }

    const data = await getObjectivesByGoal(goalId, user.id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof AuthorizationError) return authErrorResponse(error);
    const isServiceError = error instanceof ObjectiveServiceError;
    const status = isServiceError && error.code === "GOAL_NOT_FOUND" ? 404 : 500;
    return NextResponse.json(
      { success: false, error: { message: isServiceError ? error.message : "Gagal mengambil data objective.", code: isServiceError ? error.code : "INTERNAL_ERROR" } },
      { status }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const body = await request.json();

    const parsed = createObjectiveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: "Data objective tidak valid.", code: "INVALID_INPUT", details: parsed.error.issues } },
        { status: 400 }
      );
    }

    const data = await createObjective(parsed.data, user.id);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthorizationError) return authErrorResponse(error);
    const isServiceError = error instanceof ObjectiveServiceError;
    const status = isServiceError && error.code === "GOAL_NOT_FOUND" ? 404 : isServiceError ? 400 : 500;
    return NextResponse.json(
      { success: false, error: { message: isServiceError ? error.message : "Gagal membuat objective.", code: isServiceError ? error.code : "INTERNAL_ERROR" } },
      { status }
    );
  }
}
