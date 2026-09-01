import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser, authErrorResponse } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
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

    const goal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        userId: user.id,
      },
    });

    if (!goal) {
      return NextResponse.json(
        {
          error: "Goal tidak ditemukan.",
        },
        {
          status: 404,
        },
      );
    }

    const stage = await prisma.stage.create({
      data: {
        goalId,
        userId: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        order: Number.isInteger(order) ? order : 0,
      },
    });

    return NextResponse.json(stage, {
      status: 201,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Autentikasi diperlukan.") return authErrorResponse(error);
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
