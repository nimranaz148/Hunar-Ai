import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ResearchReportPage from "@/app/(dashboard)/content/research/page";
import {
  BusinessService,
  ContentService,
  type BusinessResponse,
  type ResearchReportResponse,
} from "@/lib/api";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => "/content/research",
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockBusiness: BusinessResponse = {
  id: "biz-research-123",
  owner_id: "user-research-123",
  name: "Lahore Silk House",
  niche: "apparel",
  city: "Lahore",
  area: "Gulberg",
  budget_pkr: 40000,
  hours_per_week: 15,
  tone: "inspirational",
  languages: ["roman_ur", "en"],
  platforms: ["instagram"],
  target_customer: "Women",
  created_at: "2026-10-01T00:00:00Z",
};

const mockReport: ResearchReportResponse = {
  id: "rep-123",
  business_id: "biz-research-123",
  competitors: [
    {
      name: "Silk Studio Lahore",
      handle: "@silk_lahore",
      price_point: "mid-high",
      key_advantage: "Fast 2-day delivery across Pakistan",
      weakness: "High prices and slow customer response",
    },
    {
      name: "Handmade Pret Collective",
      handle: "@handmade_pret",
      price_point: "affordable",
      key_advantage: "Viral reel engagement with artisan voiceovers",
      weakness: "Limited sizing options",
    },
  ],
  how_to_be_better: [
    "Focus on transparent artisan weaving background and unboxing videos",
    "Offer clear WhatsApp direct inquiry links in bio with 5-minute reply time",
    "Package orders with handwritten Urdu thank-you notes for organic story reposts",
  ],
  hashtags: {
    broad: ["#apparellahore", "#pakistanifashion", "#handmadesilk"],
    niche: ["#puredupattas", "#handwovensilk"],
    local: ["#lahorestyle", "#lahoreshopping"],
  },
  confidence: 0.88,
  source_urls: [
    "https://instagram.com/explore/tags/apparellahore/",
    "https://facebook.com/marketplace/lahore",
  ],
  researched_at: "2026-10-02T10:00:00Z",
  created_at: "2026-10-02T10:00:00Z",
};

describe("ResearchReportPage Component (F-014 Research Report View)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(BusinessService, "getCurrentUserBusinessApiV1BusinessesGet").mockResolvedValue(
      mockBusiness
    );
  });

  it("renders competitor teardowns, strategic levers, and confidence metric", async () => {
    vi.spyOn(
      ContentService,
      "getResearchApiV1BusinessesBusinessIdContentResearchGet"
    ).mockResolvedValue(mockReport);

    render(<ResearchReportPage />);

    expect(screen.getByText(/analyzing competitors, market gaps/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Silk Studio Lahore")).toBeInTheDocument();
    });

    expect(screen.getByText("@silk_lahore")).toBeInTheDocument();
    expect(screen.getByText("Fast 2-day delivery across Pakistan")).toBeInTheDocument();
    expect(screen.getByText("High prices and slow customer response")).toBeInTheDocument();

    expect(screen.getByText("Handmade Pret Collective")).toBeInTheDocument();
    expect(screen.getByText("@handmade_pret")).toBeInTheDocument();

    expect(
      screen.getByText(
        "Focus on transparent artisan weaving background and unboxing videos"
      )
    ).toBeInTheDocument();
    expect(screen.getByText("88% High Confidence")).toBeInTheDocument();
    expect(screen.getByText("2 Direct Brands")).toBeInTheDocument();
  });

  it("renders hashtags and handles copy to clipboard", async () => {
    vi.spyOn(
      ContentService,
      "getResearchApiV1BusinessesBusinessIdContentResearchGet"
    ).mockResolvedValue(mockReport);

    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextSpy,
      },
    });

    render(<ResearchReportPage />);

    await waitFor(() => {
      expect(screen.getByText("Silk Studio Lahore")).toBeInTheDocument();
    });

    expect(screen.getByText("#apparellahore")).toBeInTheDocument();
    expect(screen.getByText("#puredupattas")).toBeInTheDocument();
    expect(screen.getByText("#lahorestyle")).toBeInTheDocument();

    // Copy all button
    const copyAllBtn = screen.getByRole("button", { name: /copy all \(7\)/i });
    fireEvent.click(copyAllBtn);

    expect(writeTextSpy).toHaveBeenCalledWith(
      "#apparellahore #pakistanifashion #handmadesilk #puredupattas #handwovensilk #lahorestyle #lahoreshopping"
    );
  });

  it("displays empty state when no research report is returned", async () => {
    vi.spyOn(
      ContentService,
      "getResearchApiV1BusinessesBusinessIdContentResearchGet"
    ).mockResolvedValue(null as unknown as ResearchReportResponse);

    render(<ResearchReportPage />);

    await waitFor(() => {
      expect(screen.getByText(/no market research available/i)).toBeInTheDocument();
    });
  });
});
