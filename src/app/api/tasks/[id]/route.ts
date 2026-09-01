import { NextResponse } from "next/server";
import { updateTaskSchema } from "@/schemas/task.schema";
import { deleteTask, TaskServiceError, updateTask } from "@/services/task.service";

type Context = { params: Promise<{ id: string }> };

function serviceErrorResponse(error: unknown) {
  const serviceError = error instanceof TaskServiceError;
  return NextResponse.json(
    { success: false, error: { message: serviceError ? error.message : "Terjadi kesalahan server.", code: serviceError ? error.code : "INTERNAL_ERROR" } },
    { status: serviceError ? 404 : 500 },
  );
}

export async function PATCH(request: Request, context: Context) {
  try {
    const body = await request.json();
    const parsed = updateTaskSchema.safeParse({
      ...body,
      estimatedHours: body.estimatedHours === undefined ? undefined : Number(body.estimatedHours),
    });
    if (!parsed.success) return NextResponse.json({ success: false, error: { message: "Data task tidak valid.", code: "INVALID_INPUT" } }, { status: 400 });
    return NextResponse.json({ success: true, data: await updateTask((await context.params).id, parsed.data) });
  } catch (error) {
    return serviceErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    return NextResponse.json({ success: true, data: await deleteTask((await context.params).id) });
  } catch (error) {
    return serviceErrorResponse(error);
  }
}
