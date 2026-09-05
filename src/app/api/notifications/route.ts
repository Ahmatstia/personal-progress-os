import { NextResponse } from "next/server";
import { requireCurrentUser, authErrorResponse, AuthorizationError } from "@/lib/auth";
import { listNotifications, createNotification, NotificationServiceError } from "@/services/notification.service";
import { createNotificationSchema, listNotificationsQuerySchema } from "@/schemas/notification.schema";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const { searchParams } = new URL(request.url);

    const parsedQuery = listNotificationsQuerySchema.parse({
      isRead: searchParams.get("isRead") ?? undefined,
      type: searchParams.get("type") ?? undefined,
      severity: searchParams.get("severity") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      offset: searchParams.get("offset") ?? undefined,
    });

    const result = await listNotifications(parsedQuery, user.id);
    return NextResponse.json({ success: true, data: result.items, pagination: result.pagination });
  } catch (error) {
    if (error instanceof AuthorizationError) return authErrorResponse(error);
    const isServiceError = error instanceof NotificationServiceError;
    return NextResponse.json(
      {
        success: false,
        error: {
          message: isServiceError ? error.message : "Gagal mengambil daftar notifikasi.",
          code: isServiceError ? error.code : "INTERNAL_ERROR",
        },
      },
      { status: isServiceError ? 400 : 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const body = await request.json();

    const parsed = createNotificationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Data notifikasi tidak valid.",
            code: "VALIDATION_ERROR",
            details: parsed.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const created = await createNotification(parsed.data, user.id);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthorizationError) return authErrorResponse(error);
    return NextResponse.json(
      { success: false, error: { message: "Gagal membuat notifikasi.", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}
