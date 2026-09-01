import { NextResponse } from "next/server";
import { captureSchema } from "@/schemas/today.schema";
import { saveCapture } from "@/services/capture.service";

export async function POST(request: Request) {
  const parsed = captureSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ success: false, error: { message: "Capture tidak boleh kosong.", code: "INVALID_INPUT" } }, { status: 400 });
  return NextResponse.json({ success: true, data: await saveCapture(parsed.data.content) }, { status: 201 });
}
