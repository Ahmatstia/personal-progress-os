import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSession } from "@/lib/auth";
import { loginSchema } from "@/schemas/auth.schema";

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map<string, { count: number; resetAt: number }>();

function allowAttempt(ip: string) {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= MAX_ATTEMPTS;
}

function secureEqual(a: string, b: string) {
  const digest = (value: string) => createHmac("sha256", "ppos-constant-time-compare").update(value).digest();
  return timingSafeEqual(digest(a), digest(b));
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!allowAttempt(ip)) {
    return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi beberapa saat." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Data login tidak valid." }, { status: 400 });
  }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Data login tidak valid." }, { status: 400 });

  const expected = process.env.AUTH_ACCESS_CODE;
  if (!expected) {
    return NextResponse.json({ error: "Autentikasi belum dikonfigurasi di server.", code: "AUTH_NOT_CONFIGURED" }, { status: 503 });
  }
  if (!secureEqual(parsed.data.accessCode, expected)) {
    return NextResponse.json({ error: "Kode akses salah." }, { status: 401 });
  }

  const user = await prisma.user.upsert({
    where: { email: parsed.data.email.toLowerCase() },
    update: parsed.data.name ? { name: parsed.data.name } : {},
    create: { id: crypto.randomUUID(), email: parsed.data.email.toLowerCase(), name: parsed.data.name ?? null },
  });
  await setSession(user.id);
  return NextResponse.json({ id: user.id, email: user.email, name: user.name });
}