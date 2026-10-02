import { describe, it, expect } from "vitest";
import { signupSchema, loginSchema } from "@/lib/schemas/auth";

describe("Auth Validation Schemas", () => {
  it("rejects signup with short name", () => {
    const res = signupSchema.safeParse({
      name: "A",
      email: "test@example.com",
      password: "Password1",
      confirm_password: "Password1",
      language: "roman_ur",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toContain("at least 2 characters");
    }
  });

  it("rejects signup with invalid password (no digit or no uppercase)", () => {
    const res = signupSchema.safeParse({
      name: "Ayesha",
      email: "test@example.com",
      password: "passwordonly",
      confirm_password: "passwordonly",
      language: "roman_ur",
    });
    expect(res.success).toBe(false);
  });

  it("rejects signup when passwords do not match", () => {
    const res = signupSchema.safeParse({
      name: "Ayesha",
      email: "test@example.com",
      password: "Password123",
      confirm_password: "Password999",
      language: "roman_ur",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toContain("Passwords do not match");
    }
  });

  it("accepts valid signup input", () => {
    const res = signupSchema.safeParse({
      name: "Ayesha Khan",
      email: "ayesha@example.com",
      password: "SecurePassword1",
      confirm_password: "SecurePassword1",
      language: "roman_ur",
      invite_code: "LAHORE2026",
    });
    expect(res.success).toBe(true);
  });

  it("validates login requirements", () => {
    const invalid = loginSchema.safeParse({ email: "invalid", password: "" });
    expect(invalid.success).toBe(false);

    const valid = loginSchema.safeParse({
      email: "valid@example.com",
      password: "MyPassword1",
    });
    expect(valid.success).toBe(true);
  });
});
