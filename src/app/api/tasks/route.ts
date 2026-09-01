import { NextResponse } from "next/server";
import { createTaskSchema } from "@/schemas/task.schema";
import { createTask, TaskServiceError } from "@/services/task.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createTaskSchema.safeParse({
      ...body,
      estimatedHours: body.estimatedHours === "" || body.estimatedHours === undefined ? 0 : Number(body.estimatedHours),
    });
    if (!parsed.success) return NextResponse.json({ success: false, error: { message: "Data task tidak valid.", code: "INVALID_INPUT" } }, { status: 400 });
    return NextResponse.json({ success: true, data: await createTask(parsed.data) }, { status: 201 });
  } catch (error) {
    const serviceError = error instanceof TaskServiceError;
    return NextResponse.json({ success: false, error: { message: serviceError ? error.message : "Gagal membuat task.", code: serviceError ? error.code : "INTERNAL_ERROR" } }, { status: serviceError ? 404 : 500 });
  }
}
