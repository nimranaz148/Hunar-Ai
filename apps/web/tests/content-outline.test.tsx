import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ContentOutlinePage from "@/app/(dashboard)/content/outline/page";
import {
  BusinessService,
  ContentService,
  type BusinessResponse,
  type ContentOutlineGateResponse,
  type ContentOutlineActionResponse,
} from "@/lib/api";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/content/outline",
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

const mockBusiness = {
  id: "biz-test-123",
  owner_id: "user-test-123",
  name: "Fatima Handmades",
  niche: "apparel",
  city: "Lahore",
  area: "Gulberg",
  budget_pkr: 35000,
  hours_per_week: 20,
  tone: "friendly",
  languages: ["roman_ur"],
  platforms: ["instagram"],
  target_customer: "Women",
  created_at: "2026-10-01T00:00:00Z",
};

const mockGateData = {
  calendar: {
    id: "cal-test-123",
    business_id: "biz-test-123",
    status: "awaiting_approval",
    pillars: [
      { name: "behind_the_scenes", description: "Crafting process", target_percentage: 30 },
      { name: "product_showcase", description: "Catalog pieces", target_percentage: 40 },
      { name: "education_tips", description: "Care tips", target_percentage: 30 },
    ],
    weekly_themes: [
      { week: 1, theme: "Brand Story & Heritage", objective: "Establish identity" },
      { week: 2, theme: "Craftsmanship & Quality", objective: "Highlight materials" },
      { week: 3, theme: "Styling & Value", objective: "Inspiration" },
      { week: 4, theme: "Conversion", objective: "Drive orders" },
    ],
    format_distribution: { reels: 40, carousels: 30, stories: 20, static: 10 },
    day_briefs: [
      {
        day: 1,
        format: "reel",
        pillar: "behind_the_scenes",
        goal: "awareness",
        key_idea: "Artisan workshop intro & cutting fabric",
      },
      {
        day: 2,
        format: "carousel",
        pillar: "product_showcase",
        goal: "sales",
        key_idea: "Silk dupatta styling closeup",
      },
      {
        day: 10,
        format: "story",
        pillar: "behind_the_scenes",
        goal: "engagement",
        key_idea: "Behind the counter packing routine",
      },
    ],
    revision_notes: null,
    approved_at: null,
    created_at: "2026-10-01T12:00:00Z",
    updated_at: null,
  },
  research: {
    id: "res-test-123",
    business_id: "biz-test-123",
    competitors: [
      { name: "Competitor A", handle: "@compa", price_point: "mid", key_advantage: "Fast dispatch" },
    ],
    how_to_be_better: ["Personalized handwritten notes with every box"],
    hashtags: { broad: ["#pakistanifashion"], niche: ["#chikanwork"], local: ["#lahore"] },
    confidence: 0.88,
    source_urls: ["https://instagram.com/tags"],
    researched_at: "2026-10-01T12:00:00Z",
    created_at: "2026-10-01T12:00:00Z",
  },
};

describe("ContentOutlinePage Component (F-010 - Gate 2 Approval)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(BusinessService, "getCurrentUserBusinessApiV1BusinessesGet").mockResolvedValue(
      mockBusiness as unknown as BusinessResponse
    );
    vi.spyOn(
      ContentService,
      "getOutlineGateApiV1BusinessesBusinessIdContentOutlineGet"
    ).mockResolvedValue(mockGateData as unknown as ContentOutlineGateResponse);
  });

  it("renders 30-day content outline, strategic pillars, and research card", async () => {
    render(<ContentOutlinePage />);

    expect(screen.getByText(/Loading your 30-day content strategy/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText("30-Day Content Outline & Strategy").length).toBeGreaterThan(0);
    });

    // Check Pillars and Rationale
    expect(screen.getByText("Why This Strategy Fits Your Market")).toBeInTheDocument();
    expect(screen.getByText("88% Market Fit Confidence")).toBeInTheDocument();
    expect(screen.getByText("Personalized handwritten notes with every box")).toBeInTheDocument();
    expect(screen.getByText("Brand Story & Heritage")).toBeInTheDocument();

    // Check Day briefs
    expect(screen.getByText("Artisan workshop intro & cutting fabric")).toBeInTheDocument();
    expect(screen.getByText("Silk dupatta styling closeup")).toBeInTheDocument();
  });

  it("filters day briefs by week", async () => {
    render(<ContentOutlinePage />);

    await waitFor(() => {
      expect(screen.getByText("Artisan workshop intro & cutting fabric")).toBeInTheDocument();
    });

    // Filter to Week 2
    const week2Btn = screen.getByRole("button", { name: "Week 2" });
    fireEvent.click(week2Btn);

    // Day 1 (Week 1) should be hidden, Day 10 (Week 2: day 8-14) should be visible
    expect(screen.queryByText("Artisan workshop intro & cutting fabric")).not.toBeInTheDocument();
    expect(screen.getByText("Behind the counter packing routine")).toBeInTheDocument();
  });

  it("approves outline when user confirms approval", async () => {
    const approveSpy = vi
      .spyOn(ContentService, "approveOutlineApiV1BusinessesBusinessIdContentOutlineApprovePost")
      .mockResolvedValue({
        status: "approved",
        message: "Approved",
        calendar: { ...mockGateData.calendar, status: "approved" },
      } as unknown as ContentOutlineActionResponse);

    render(<ContentOutlinePage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Approve Outline/i })).toBeInTheDocument();
    });

    // Open confirmation dialog
    fireEvent.click(screen.getByRole("button", { name: /Approve Outline/i }));

    expect(screen.getByText("Approve 30-Day Content Outline?")).toBeInTheDocument();

    // Confirm
    const confirmBtn = screen.getByRole("button", { name: /Yes, Approve Strategy/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(approveSpy).toHaveBeenCalledWith({ businessId: "biz-test-123" });
    });
  });

  it("submits revision request with user feedback", async () => {
    const reviseSpy = vi
      .spyOn(ContentService, "reviseOutlineApiV1BusinessesBusinessIdContentOutlineRevisePost")
      .mockResolvedValue({
        status: "revision_requested",
        message: "Revision requested",
        calendar: {
          ...mockGateData.calendar,
          status: "revision_requested",
          revision_notes: "Add more video content for Eid collection.",
        },
      } as unknown as ContentOutlineActionResponse);

    render(<ContentOutlinePage />);

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /Request Changes/i })[0]).toBeInTheDocument();
    });

    // Open revision modal
    fireEvent.click(screen.getAllByRole("button", { name: /Request Changes/i })[0]);

    expect(screen.getByText("Request Outline Revisions")).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/Please add more Reels/i);
    fireEvent.change(textarea, { target: { value: "Add more video content for Eid collection." } });

    const submitBtn = screen.getByRole("button", { name: /Send Revision Request/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(reviseSpy).toHaveBeenCalledWith({
        businessId: "biz-test-123",
        requestBody: { notes: "Add more video content for Eid collection." },
      });
    });
  });
});
