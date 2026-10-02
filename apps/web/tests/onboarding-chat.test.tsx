import { describe, it, expect } from "vitest";
import { chatMessageSchema } from "@/lib/schemas/onboarding";

describe("Onboarding Chat Validation & Component (F-003)", () => {
  it("rejects empty chat message", () => {
    const res = chatMessageSchema.safeParse({ message: "" });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toContain("cannot be empty");
    }
  });

  it("rejects chat message exceeding 2000 characters", () => {
    const longMsg = "a".repeat(2001);
    const res = chatMessageSchema.safeParse({ message: longMsg });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toContain("cannot exceed 2000");
    }
  });

  it("accepts valid Roman Urdu and English messages within limit", () => {
    const valid1 = chatMessageSchema.safeParse({
      message: "Mujhe ghar se home bakery start karni hai Gulshan Karachi mein, budget 25000.",
    });
    expect(valid1.success).toBe(true);

    const valid2 = chatMessageSchema.safeParse({
      message: "I want to start a handmade jewelry brand in Lahore with 15k PKR budget.",
    });
    expect(valid2.success).toBe(true);
  });
});
