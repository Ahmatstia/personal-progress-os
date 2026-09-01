import { NextResponse } from "next/server";
import { aiCommandSchema } from "../../../../schemas/ai-command.schema";
import { executeAICommand } from "../../../../services/ai-command.service";
import { requireCurrentUser, authErrorResponse } from "../../../../lib/auth";

export async function POST(request: Request) {
  let user;
  try { user = await requireCurrentUser(request); } catch (error) { return authErrorResponse(error); }
  let body: unknown;
  try { body = await request.json(); } catch { body = {}; }
  const parsed = aiCommandSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: { code: "INVALID_INPUT", message: "Payload command AI tidak valid." } }, { status: 400 });
  try {
    const result = await executeAICommand(parsed.data, user.id);
    return NextResponse.json(result, { status: result.success ? 200 : result.code === "SAFE_FALLBACK" ? 422 : 409 });
  } catch {
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Command AI gagal diproses." } }, { status: 500 });
  }
}
