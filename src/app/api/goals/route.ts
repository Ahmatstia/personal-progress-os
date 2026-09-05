import { NextResponse } from "next/server";
import { createGoal, GoalServiceError } from "@/services/goal.service";
import { createGoalSchema } from "@/schemas/goal.schema";
import { requireCurrentUser, authErrorResponse, AuthorizationError } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const body = await request.json();

    const result = createGoalSchema.safeParse(body);

    if (!result.success) {
      console.error("POST /api/goals validation error:", result.error.issues);
      const firstIssue = result.error.issues[0]?.message;
      return NextResponse.json(
        {
          error: firstIssue ? `Data tidak valid: ${firstIssue}` : "Data tidak valid",
          details: result.error.issues,
        },
        { status: 400 },
      );
    }

    const title = result.data.title ?? result.data.name;
    if (!title || !title.trim()) {
      return NextResponse.json(
        {
          error: "Nama goal wajib diisi.",
        },
        { status: 400 },
      );
    }

    const goal = await createGoal(
      {
        title: title.trim(),
        name: title.trim(),
        type: result.data.type,
        description: result.data.description ?? null,
        areaId: result.data.areaId ?? null,
        priority: result.data.priority,
        targetDate: result.data.targetDate,
      },
      user.id,
    );

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    if (error instanceof AuthorizationError) return authErrorResponse(error);
    const isServiceError = error instanceof GoalServiceError;
    console.error("POST /api/goals error:", error);

    return NextResponse.json(
      {
        error: isServiceError ? error.message : "Gagal membuat goal.",
      },
      { status: isServiceError ? 400 : 500 },
    );
  }
}
