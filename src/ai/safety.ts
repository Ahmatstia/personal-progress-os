import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { secret } from "@/lib/auth";
import type { ConfidenceLevel } from "./intents";

export function canRead(confidenceLevel: ConfidenceLevel): boolean {
  return confidenceLevel !== "LOW";
}

export function canWrite(confidenceLevel: ConfidenceLevel, confirmed: boolean): boolean {
  return confidenceLevel !== "LOW" && confirmed;
}

const CONFIRMATION_TTL_MS = 10 * 60 * 1000;

function computePayloadHash(args?: Record<string, unknown>): string {
  if (!args || Object.keys(args).length === 0) return "";
  return createHash("sha256").update(JSON.stringify(args)).digest("base64url").slice(0, 16);
}

/**
 * Creates an HMAC confirmation token.
 * In V2, optionally binds the payload argument hash so the token cannot be reused for different target parameters.
 */
export function createConfirmationToken(
  intent: string,
  userId?: string,
  args?: Record<string, unknown>
): { token: string; expiresAt: string } {
  const expires = Date.now() + CONFIRMATION_TTL_MS;
  const argHash = computePayloadHash(args);
  const payload = argHash
    ? `${intent}:${expires}:${userId ?? ""}:${argHash}`
    : `${intent}:${expires}:${userId ?? ""}`;
  const signature = createHmac("sha256", secret()).update(payload).digest("base64url");
  return {
    token: `${payload}.${signature}`,
    expiresAt: new Date(expires).toISOString(),
  };
}

/**
 * Verifies the HMAC confirmation token.
 * Ensures intent, expiration, userId, and optional payload argument hash match precisely.
 */
export function verifyConfirmationToken(
  token: string | undefined,
  intent: string,
  userId?: string,
  args?: Record<string, unknown>
): boolean {
  if (!token) return false;
  const separator = token.lastIndexOf(".");
  if (separator <= 0) return false;

  const payload = token.slice(0, separator);
  const received = token.slice(separator + 1);
  const parts = payload.split(":");
  if (parts.length < 3) return false;

  const [tokenIntent, tokenExpires, tokenUser, tokenArgHash] = parts;

  if (tokenIntent !== intent) return false;
  if (tokenUser !== (userId ?? "")) return false;

  const expires = Number(tokenExpires);
  if (!Number.isFinite(expires) || expires <= Date.now()) return false;

  // If token has argHash bound, verify argument match
  if (tokenArgHash && args) {
    const expectedArgHash = computePayloadHash(args);
    if (tokenArgHash !== expectedArgHash) return false;
  }

  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}