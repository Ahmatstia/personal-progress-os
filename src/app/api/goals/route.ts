import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireCurrentUser, authErrorResponse } from "@/lib/auth";

const createGoalSchema = z.object({
  name: z.string().min(1, "Nama goal wajib diisi"),
  type: z.string().min(1, "Tipe goal wajib diisi"),
  description: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
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

    const goal = await prisma.goal.create({
      data: {
        name: result.data.name,
        type: result.data.type,
        description: result.data.description ?? "",
        userId: user.id,
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Autentikasi diperlukan.") return authErrorResponse(error);
    console.error(error);

    return NextResponse.json(
      {
        error: "Gagal membuat goal",
      },
      { status: 500 },
    );
  }
}
