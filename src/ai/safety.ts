import { createHmac, timingSafeEqual } from "node:crypto";
import { secret } from "@/lib/auth";
import type { ConfidenceLevel } from "./intents";

export function canRead(confidenceLevel: ConfidenceLevel) {
  return confidenceLevel !== "LOW";
}

export function canWrite(confidenceLevel: ConfidenceLevel, confirmed: boolean) {
  return confidenceLevel !== "LOW" && confirmed;
}

const CONFIRMATION_TTL_MS = 10 * 60 * 1000;

// Token konfirmasi satu-kali (stateless): HMAC dari `intent:expires` yang
// terikat pada intent tertentu dan masa berlaku singkat. Konfirmasi tulis AI
// hanya dipercaya bila token ini valid — bukan sekadar `confirmed: true`
// dari client.
export function createConfirmationToken(intent: string) {
  const expires = Date.now() + CONFIRMATION_TTL_MS;
  const payload = `${intent}:${expires}`;
  const signature = createHmac("sha256", secret()).update(payload).digest("base64url");
  return {
    token: `${payload}.${signature}`,
    expiresAt: new Date(expires).toISOString(),
  };
}

export function verifyConfirmationToken(token: string | undefined, intent: string) {
  if (!token) return false;
  const separator = token.lastIndexOf(".");
  if (separator <= 0) return false;
  const payload = token.slice(0, separator);
  const received = token.slice(separator + 1);
  const [tokenIntent, tokenExpires] = payload.split(":");
  if (tokenIntent !== intent) return false;
  const expires = Number(tokenExpires);
  if (!Number.isFinite(expires) || expires <= Date.now()) return false;
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}