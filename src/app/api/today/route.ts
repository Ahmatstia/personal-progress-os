import { NextResponse } from "next/server";
import { getToday } from "@/services/today.service";

export async function GET() { return NextResponse.json({ success: true, data: await getToday() }); }
