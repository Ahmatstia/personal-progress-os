import { describe, expect, it } from "vitest";
import { loginSchema } from "../src/schemas/auth.schema";

describe("login schema", () => {
  it("accepts a login without a name field", () => {
    const result = loginSchema.safeParse({ email: "dev@example.com", accessCode: "development-access-code" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBeUndefined();
  });

  it("accepts an empty name and normalizes it to undefined", () => {
    const result = loginSchema.safeParse({ email: "dev@example.com", name: "", accessCode: "development-access-code" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBeUndefined();
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", accessCode: "development-access-code" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing access code", () => {
    const result = loginSchema.safeParse({ email: "dev@example.com" });
    expect(result.success).toBe(false);
  });

  it("keeps a provided name", () => {
    const result = loginSchema.safeParse({ email: "dev@example.com", name: "Local User", accessCode: "x" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("Local User");
  });
});
