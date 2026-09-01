import { NextResponse } from "next/server";
import { aiInputSchema } from "@/schemas/ai.schema";
import { interpretInput } from "@/services/ai.service";

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { body = {}; }
  const parsed = aiInputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: { message: "Text input wajib diisi.", code: "INVALID_INPUT" } }, { status: 400 });
  return NextResponse.json({ success: true, data: interpretInput(parsed.data.text) });
}
