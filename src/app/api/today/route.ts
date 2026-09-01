import { NextResponse } from "next/server";
import { getToday } from "@/services/today.service";
import { requireCurrentUser, authErrorResponse } from "@/lib/auth";

export async function GET(request: Request) { try { const user = await requireCurrentUser(request); return NextResponse.json({ success: true, data: await getToday(new Date(), user.id) }); } catch (error) { return authErrorResponse(error); } }
