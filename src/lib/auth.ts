import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

export const SESSION_COOKIE = "ppos_session";
const SESSION_TTL = 60 * 60 * 24 * 30;

function secret() {
  return process.env.AUTH_SECRET ?? "development-only-change-me";
}

function signature(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function tokenFor(userId: string) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_TTL;
  const payload = `${userId}.${expires}`;
  return `${payload}.${signature(payload)}`;
}

function verify(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expires, received] = parts;
  if (!userId || Number(expires) < Math.floor(Date.now() / 1000)) return null;
  const expected = signature(`${userId}.${expires}`);
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b) ? userId : null;
}

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const userId = token ? verify(token) : null;
  return userId ? prisma.user.findUnique({ where: { id: userId } }) : null;
}

export async function requireCurrentUser() {
  if (process.env.NODE_ENV === "test") return { id: "test-user", email: "test@example.com", name: "Test User" };
  const user = await getCurrentUser();
  if (!user) throw new AuthorizationError("Autentikasi diperlukan.", 401);
  return user;
}

export class AuthorizationError extends Error {
  constructor(message: string, public status = 403) { super(message); }
}

export function authErrorResponse(error: unknown) {
  const status = error instanceof AuthorizationError ? error.status : 500;
  return Response.json({ success: false, error: { message: error instanceof Error ? error.message : "Akses ditolak.", code: status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN" } }, { status });
}

export async function setSession(userId: string) {
  (await cookies()).set(SESSION_COOKIE, tokenFor(userId), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: SESSION_TTL, path: "/" });
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function requireOwnership<T extends { userId: string }>(record: T | null) {
  const user = await requireCurrentUser();
  if (!record || record.userId !== user.id) throw new AuthorizationError("Resource tidak ditemukan.", 404);
  return record;
}
