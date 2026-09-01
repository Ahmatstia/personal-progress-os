import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const task = await prisma.task.findUnique({
      where: {
        id,
      },
    });

    if (!task) {
      return NextResponse.json(
        {
          error: "Task tidak ditemukan.",
        },
        {
          status: 404,
        },
      );
    }

    const status = body.status === "COMPLETED" ? "COMPLETED" : "NOT_STARTED";

    const updatedTask = await prisma.task.update({
      where: {
        id,
      },
      data: {
        status,

        startedAt:
          status === "COMPLETED"
            ? (task.startedAt ?? new Date())
            : task.startedAt,

        completedAt: status === "COMPLETED" ? new Date() : null,
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("PATCH /api/tasks/[id] error:", error);

    return NextResponse.json(
      {
        error: "Gagal memperbarui task.",
      },
      {
        status: 500,
      },
    );
  }
}
