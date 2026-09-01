export function requireUserId(userId?: string): string {
  if (userId) return userId;
  if (process.env.NODE_ENV === "test") return "test-user";
  throw new Error("Authenticated user context is required.");
}
