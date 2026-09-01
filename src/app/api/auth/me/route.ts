import { NextResponse } from "next/server";
import { requireCurrentUser, authErrorResponse } from "@/lib/auth";

export async function GET(request: Request) { try { return NextResponse.json(await requireCurrentUser(request)); } catch (error) { return authErrorResponse(error); } }
