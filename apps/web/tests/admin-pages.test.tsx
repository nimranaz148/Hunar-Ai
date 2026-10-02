import { describe, it, expect } from "vitest";
import { changePasswordSchema } from "@/lib/schemas/auth";

describe("Change Password Validation (F-039)", () => {
  it("rejects when current password is empty", () => {
    const res = changePasswordSchema.safeParse({
      current_password: "",
      new_password: "NewPassword123",
      confirm_password: "NewPassword123",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toContain("Current password is required");
    }
  });

  it("rejects weak new password (no digit or no uppercase)", () => {
    const res = changePasswordSchema.safeParse({
      current_password: "OldPassword123",
      new_password: "weakpassword",
      confirm_password: "weakpassword",
    });
    expect(res.success).toBe(false);
  });

  it("rejects new password under 8 characters", () => {
    const res = changePasswordSchema.safeParse({
      current_password: "OldPassword123",
      new_password: "New1",
      confirm_password: "New1",
    });
    expect(res.success).toBe(false);
  });

  it("rejects when new passwords do not match", () => {
    const res = changePasswordSchema.safeParse({
      current_password: "OldPassword123",
      new_password: "NewPassword123",
      confirm_password: "MismatchPassword123",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toContain("New passwords do not match");
    }
  });

  it("accepts valid change password payload", () => {
    const res = changePasswordSchema.safeParse({
      current_password: "OldPassword123",
      new_password: "NewSecurePass99",
      confirm_password: "NewSecurePass99",
    });
    expect(res.success).toBe(true);
  });
});
