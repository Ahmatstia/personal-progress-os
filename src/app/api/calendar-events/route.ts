import { NextResponse } from "next/server";
import { createCalendarEventSchema, eventTypeEnum } from "@/schemas/calendar-event.schema";
import { createCalendarEvent, getCalendarEvents, CalendarEventServiceError } from "@/services/calendar-event.service";
import { requireCurrentUser, authErrorResponse, AuthorizationError } from "@/lib/auth";
import type { EventType } from "@/generated/prisma/client";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const { searchParams } = new URL(request.url);
    const startFrom = searchParams.get("startFrom") || undefined;
    const startTo = searchParams.get("startTo") || undefined;
    const eventTypeParam = searchParams.get("eventType");
    const projectId = searchParams.get("projectId") || undefined;
    const taskId = searchParams.get("taskId") || undefined;

    const parsedType = eventTypeParam ? eventTypeEnum.safeParse(eventTypeParam) : null;
    const eventType = parsedType?.success ? (parsedType.data as EventType) : undefined;

    const data = await getCalendarEvents(user.id, { startFrom, startTo, eventType, projectId, taskId });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof AuthorizationError) return authErrorResponse(error);
    return NextResponse.json({ success: false, error: { message: "Gagal mengambil data calendar event.", code: "INTERNAL_ERROR" } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const body = await request.json();

    const parsed = createCalendarEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: "Data calendar event tidak valid.", code: "INVALID_INPUT", details: parsed.error.issues } },
        { status: 400 }
      );
    }

    const data = await createCalendarEvent(parsed.data, user.id);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthorizationError) return authErrorResponse(error);
    const isServiceError = error instanceof CalendarEventServiceError;
    const status = isServiceError && (error.code === "TASK_NOT_FOUND" || error.code === "PROJECT_NOT_FOUND") ? 404 : isServiceError ? 400 : 500;
    return NextResponse.json(
      { success: false, error: { message: isServiceError ? error.message : "Gagal membuat calendar event.", code: isServiceError ? error.code : "INTERNAL_ERROR" } },
      { status }
    );
  }
}
