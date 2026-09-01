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
      where: { id },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task tidak ditemukan." },
        { status: 404 },
      );
    }

    const data: {
      name?: string;
      description?: string | null;
      priority?: string;
      estimatedHours?: number;
      notes?: string | null;
      status?: string;
      startedAt?: Date | null;
      completedAt?: Date | null;
    } = {};

    if (body.name !== undefined) {
      if (!body.name.trim()) {
        return NextResponse.json(
          { error: "Nama task wajib diisi." },
          { status: 400 },
        );
      }

      data.name = body.name.trim();
    }

    if (body.description !== undefined) {
      data.description = body.description?.trim() || null;
    }

    if (body.priority !== undefined) {
      data.priority = body.priority;
    }

    if (body.estimatedHours !== undefined) {
      const hours = Number(body.estimatedHours);

      if (!Number.isFinite(hours) || hours < 0) {
        return NextResponse.json(
          { error: "Estimated hours tidak valid." },
          { status: 400 },
        );
      }

      data.estimatedHours = hours;
    }

    if (body.notes !== undefined) {
      data.notes = body.notes?.trim() || null;
    }

    if (body.status !== undefined) {
      const completed = body.status === "COMPLETED";

      data.status = completed ? "COMPLETED" : "NOT_STARTED";

      data.startedAt = completed
        ? (task.startedAt ?? new Date())
        : task.startedAt;

      data.completedAt = completed ? new Date() : null;
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data,
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("PATCH /api/tasks/[id] error:", error);

    return NextResponse.json(
      { error: "Gagal memperbarui task." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task tidak ditemukan." },
        { status: 404 },
      );
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("DELETE /api/tasks/[id] error:", error);

    return NextResponse.json(
      { error: "Gagal menghapus task." },
      { status: 500 },
    );
  }
}
