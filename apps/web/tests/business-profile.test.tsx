import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { updateBusinessSchema } from "@/lib/schemas/business";
import BusinessProfilePage from "@/app/(dashboard)/business/page";
import { BusinessService } from "@/lib/api";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/business",
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

const mockBusinessData = {
  id: "biz-12345",
  owner_id: "user-12345",
  program_id: null,
  name: "Gulshan Bakes",
  niche: "food",
  city: "Karachi",
  area: "Gulshan-e-Iqbal",
  budget_pkr: 25000,
  hours_per_week: 20,
  tone: "friendly",
  languages: ["roman_ur", "en"],
  platforms: ["instagram", "facebook"],
  target_customer: "Families looking for custom cakes",
  created_at: "2026-10-01T10:00:00Z",
  updated_at: "2026-10-01T12:00:00Z",
};

describe("Business Profile Schema Validation (F-004)", () => {
  it("rejects payload with missing required fields", () => {
    const res = updateBusinessSchema.safeParse({
      name: "",
      niche: "invalid-niche",
      city: "",
      languages: [],
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      const paths = res.error.issues.map((i) => i.path[0]);
      expect(paths).toContain("name");
      expect(paths).toContain("niche");
      expect(paths).toContain("city");
      expect(paths).toContain("languages");
    }
  });

  it("rejects budget exceeding maximum threshold", () => {
    const res = updateBusinessSchema.safeParse({
      name: "Gulshan Bakes",
      niche: "food",
      city: "Karachi",
      budget_pkr: 20_000_000,
      hours_per_week: 20,
      tone: "friendly",
      languages: ["roman_ur"],
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toContain("cannot exceed 10,000,000");
    }
  });

  it("rejects hours per week exceeding 168 hours", () => {
    const res = updateBusinessSchema.safeParse({
      name: "Gulshan Bakes",
      niche: "food",
      city: "Karachi",
      budget_pkr: 25000,
      hours_per_week: 200,
      tone: "friendly",
      languages: ["roman_ur"],
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toContain("cannot exceed 168");
    }
  });

  it("accepts valid full business update payload", () => {
    const res = updateBusinessSchema.safeParse({
      name: "Gulshan Bakes",
      niche: "food",
      city: "Karachi",
      area: "Gulshan Block 4",
      budget_pkr: 30000,
      hours_per_week: 25,
      tone: "friendly",
      languages: ["roman_ur", "en"],
      platforms: ["instagram", "whatsapp"],
      target_customer: "Families looking for birthday cakes",
    });
    expect(res.success).toBe(true);
  });
});

describe("BusinessProfilePage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders business details when API returns business data", async () => {
    vi.spyOn(
      BusinessService,
      "getCurrentUserBusinessApiV1BusinessesGet"
    ).mockResolvedValue(mockBusinessData as unknown as import("@/lib/api").BusinessResponse);

    render(<BusinessProfilePage />);

    expect(screen.getByText("Loading your business profile...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Gulshan Bakes")).toBeInTheDocument();
    });

    expect(screen.getByText("Karachi, Gulshan-e-Iqbal")).toBeInTheDocument();
    expect(screen.getByText("PKR 25,000")).toBeInTheDocument();
    expect(screen.getByText(/20 hrs\/week/i)).toBeInTheDocument();
  });

  it("switches to edit form on Edit Profile button click", async () => {
    vi.spyOn(
      BusinessService,
      "getCurrentUserBusinessApiV1BusinessesGet"
    ).mockResolvedValue(mockBusinessData as unknown as import("@/lib/api").BusinessResponse);

    render(<BusinessProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("Gulshan Bakes")).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole("button", { name: /edit profile/i });
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("Edit Business Profile")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
    });
  });

  it("renders EmptyState with onboarding link when business is not found (404)", async () => {
    vi.spyOn(
      BusinessService,
      "getCurrentUserBusinessApiV1BusinessesGet"
    ).mockRejectedValue({ status: 404 });

    render(<BusinessProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("No business profile found")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /start ai onboarding/i })).toBeInTheDocument();
    });
  });
});
