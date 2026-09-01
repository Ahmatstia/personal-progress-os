import { NextResponse } from "next/server";
import { captureSchema } from "@/schemas/today.schema";
import { saveCapture } from "@/services/capture.service";
import { requireCurrentUser, authErrorResponse } from "@/lib/auth";

export async function POST(request: Request) {
  let user; try { user = await requireCurrentUser(request); } catch (error) { return authErrorResponse(error); }
  const parsed = captureSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ success: false, error: { message: "Capture tidak boleh kosong.", code: "INVALID_INPUT" } }, { status: 400 });
  return NextResponse.json({ success: true, data: await saveCapture(parsed.data.content, user.id) }, { status: 201 });
}
