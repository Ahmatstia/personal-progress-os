import { NextResponse } from "next/server";
import { requireCurrentUser, authErrorResponse, AuthorizationError } from "@/lib/auth";
import { exportUserData } from "@/services/data-export.service";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const data = await exportUserData(user.id);

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `mylife-export-${dateStr}.json`;

    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (error instanceof AuthorizationError) return authErrorResponse(error);
    return NextResponse.json(
      { success: false, error: { message: "Gagal mengekspor data.", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}
