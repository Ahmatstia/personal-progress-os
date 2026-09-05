import { NextResponse } from "next/server";
import { requireCurrentUser, authErrorResponse, AuthorizationError } from "@/lib/auth";
import { testTelegramConnection } from "@/services/telegram.service";
import { testEmailConnection } from "@/services/email.service";

export async function POST(request: Request) {
  try {
    await requireCurrentUser(request);
    const body = await request.json();
    const { channel, target } = body as { channel?: string; target?: string };

    if (channel === "telegram") {
      const res = await testTelegramConnection(target);
      return NextResponse.json({
        success: res.success,
        channel: "telegram",
        details: res,
      });
    }

    if (channel === "email") {
      const res = await testEmailConnection(target);
      return NextResponse.json({
        success: res.success,
        channel: "email",
        details: res,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Kanal tidak valid. Gunakan 'telegram' atau 'email'.",
      },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof AuthorizationError) return authErrorResponse(error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Gagal menguji saluran notifikasi.",
      },
      { status: 500 }
    );
  }
}
