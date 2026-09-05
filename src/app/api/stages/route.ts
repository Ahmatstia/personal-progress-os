import { NextResponse } from "next/server";
import { createStage, StageServiceError } from "@/services/stage.service";
import { requireCurrentUser, authErrorResponse, AuthorizationError } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const body = await request.json();

    const { goalId, name, description, order } = body;

    if (!goalId || !name?.trim()) {
      return NextResponse.json(
        {
          error: "goalId dan name wajib diisi.",
        },
        {
          status: 400,
        },
      );
    }

    const stage = await createStage(
      {
        goalId,
        name,
        description,
        order,
      },
      user.id,
    );

    return NextResponse.json(stage, {
      status: 201,
    });
  } catch (error) {
    if (error instanceof AuthorizationError) return authErrorResponse(error);
    if (error instanceof StageServiceError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("POST /api/stages error:", error);

    return NextResponse.json(
      {
        error: "Gagal membuat stage.",
      },
      {
        status: 500,
      },
    );
  }
}
