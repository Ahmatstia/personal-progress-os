import { NextResponse } from "next/server";
import { createGoal } from "@/services/goal.service";
import { z } from "zod";
import { requireCurrentUser, authErrorResponse, AuthorizationError } from "@/lib/auth";

const createGoalSchema = z.object({
  title: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  type: z.enum(["LEARNING", "ACHIEVEMENT", "HABIT", "MAINTENANCE"]).default("LEARNING"),
  description: z.string().optional(),
  areaId: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const body = await request.json();

    const result = createGoalSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Data tidak valid",
        },
        { status: 400 },
      );
    }

    const title = result.data.title ?? result.data.name;
    if (!title) {
      return NextResponse.json(
        {
          error: "Judul goal wajib diisi",
        },
        { status: 400 },
      );
    }

    const goal = await createGoal(
      {
        title,
        type: result.data.type,
        description: result.data.description ?? "",
        areaId: result.data.areaId || null,
      },
      user.id,
    );

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    if (error instanceof AuthorizationError) return authErrorResponse(error);
    console.error("POST /api/goals error:", error);

    return NextResponse.json(
      {
        error: "Gagal membuat goal",
      },
      { status: 500 },
    );
  }
}
