import { NextResponse } from "next/server";
import { getToday } from "@/services/today.service";
import { requireCurrentUser, authErrorResponse } from "@/lib/auth";

export async function GET() { try { await requireCurrentUser(); return NextResponse.json({ success: true, data: await getToday() }); } catch (error) { return authErrorResponse(error); } }
