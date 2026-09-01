import { NextResponse } from "next/server";
import { requireCurrentUser, authErrorResponse } from "@/lib/auth";

export async function GET() { try { return NextResponse.json(await requireCurrentUser()); } catch (error) { return authErrorResponse(error); } }
