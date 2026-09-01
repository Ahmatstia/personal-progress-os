import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSession } from "@/lib/auth";
import { loginSchema } from "@/schemas/auth.schema";

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Data login tidak valid." }, { status: 400 });
  const expected = process.env.AUTH_ACCESS_CODE ?? "development-access-code";
  if (parsed.data.accessCode !== expected) return NextResponse.json({ error: "Kode akses salah." }, { status: 401 });
  const user = await prisma.user.upsert({ where: { email: parsed.data.email.toLowerCase() }, update: parsed.data.name ? { name: parsed.data.name } : {}, create: { id: crypto.randomUUID(), email: parsed.data.email.toLowerCase(), name: parsed.data.name ?? null } });
  await setSession(user.id);
  return NextResponse.json({ id: user.id, email: user.email, name: user.name });
}
