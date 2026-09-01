import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      stageId,
      name,
      description,
      type,
      priority,
      estimatedHours,
      notes,
    } = body;

    if (!stageId || !name?.trim()) {
      return NextResponse.json(
        {
          error: "stageId dan name wajib diisi.",
        },
        {
          status: 400,
        },
      );
    }

    const stage = await prisma.stage.findUnique({
      where: {
        id: stageId,
      },
    });

    if (!stage) {
      return NextResponse.json(
        {
          error: "Stage tidak ditemukan.",
        },
        {
          status: 404,
        },
      );
    }

    const parsedEstimatedHours =
      Number.isFinite(Number(estimatedHours)) && Number(estimatedHours) >= 0
        ? Number(estimatedHours)
        : 0;

    const task = await prisma.task.create({
      data: {
        stageId,
        name: name.trim(),
        description: description?.trim() || null,
        type: type || "TASK",
        priority: priority || "MEDIUM",
        status: "NOT_STARTED",
        estimatedHours: parsedEstimatedHours,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json(task, {
      status: 201,
    });
  } catch (error) {
    console.error("POST /api/tasks error:", error);

    return NextResponse.json(
      {
        error: "Gagal membuat task.",
      },
      {
        status: 500,
      },
    );
  }
}
