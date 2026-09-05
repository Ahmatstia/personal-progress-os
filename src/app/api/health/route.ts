import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/repositories/health.repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const dbOk = await checkDatabaseHealth();
  const uptime = Math.floor(process.uptime());

  const responseBody = {
    status: dbOk ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    uptime,
    database: dbOk ? "connected" : "disconnected",
    environment: process.env.NODE_ENV || "development",
  };

  return NextResponse.json(responseBody, {
    status: dbOk ? 200 : 503,
  });
}
