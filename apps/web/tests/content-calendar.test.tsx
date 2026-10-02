import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import ContentCalendarPage from "@/app/(dashboard)/content/calendar/page";
import {
  BusinessService,
  ContentService,
  type BusinessResponse,
  type ContentCalendarViewResponse,
  type ContentItemResponse,
} from "@/lib/api";

vi.mock("next/navigation", () => ({
  usePathname: () => "/content/calendar",
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

const mockBusiness: BusinessResponse = {
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

const mockItems: ContentItemResponse[] = [
  {
    id: "item-1",
    calendar_id: "cal-test-123",
    day: 1,
    date: "2026-10-01",
    status: "approved",
    pillar: "behind_the_scenes",
    format: "reel",
    goal: "awareness",
    hook: "Dekhein kaisay banta hai pure raw silk dupatta",
    caption: "Har suit ke peechay 3 din ki mehnat hoti hai. Order karein!",
    cta: "Order on WhatsApp",
    hashtags: ["#handmadelahore", "#silkpakistan", "#artisanwork"],
    image_prompt: {
      prompt: "Close up shot of artisan hands weaving silk threads on a wooden loom",
    },
    video_prompt: {
      prompt: "Fast paced cut of fabric dipping in vibrant dye then drying in sun",
    },
    created_at: "2026-10-01T12:00:00Z",
    updated_at: null,
  },
  {
    id: "item-2",
    calendar_id: "cal-test-123",
    day: 2,
    date: "2026-10-02",
    status: "draft",
    pillar: "product_showcase",
    format: "carousel",
    goal: "conversion",
    hook: "Top 3 styling tips for festive season",
    caption: "Shaadi season styling made simple. Slide to see all looks.",
    cta: "Shop now",
    hashtags: ["#pakistanifashion", "#weddingguest"],
    image_prompt: {
      prompt: "Editorial flatlay of 3 embroidered dupattas on marble table",
    },
    video_prompt: null,
    created_at: "2026-10-01T12:00:00Z",
    updated_at: null,
  },
  {
    id: "item-8",
    calendar_id: "cal-test-123",
    day: 8,
    date: "2026-10-08",
    status: "posted",
    pillar: "behind_the_scenes",
    format: "story",
    goal: "engagement",
    hook: "Quick studio tour!",
    caption: "Good morning! New stock arriving today.",
    cta: "Reply with questions",
    hashtags: ["#morningroutine"],
    image_prompt: {},
    video_prompt: null,
    created_at: "2026-10-01T12:00:00Z",
    updated_at: null,
  },
];

const mockCalendarView: ContentCalendarViewResponse = {
  calendar_id: "cal-test-123",
  business_id: "biz-test-123",
  status: "approved",
  items: mockItems,
  stats: {
    total: 3,
    draft: 1,
    approved: 1,
    posted: 1,
    skipped: 0,
    needs_review: 0,
  },
};

describe("ContentCalendarPage Component (F-011 Content Calendar Month View)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(BusinessService, "getCurrentUserBusinessApiV1BusinessesGet").mockResolvedValue(
      mockBusiness
    );
    vi.spyOn(
      ContentService,
      "getCalendarApiV1BusinessesBusinessIdContentCalendarGet"
    ).mockResolvedValue(mockCalendarView);
  });

  it("renders header, stats cards, and calendar item cards", async () => {
    render(<ContentCalendarPage />);

    expect(screen.getByText(/loading your 30-day content calendar/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("30-Day Content Calendar")).toBeInTheDocument();
    });

    // Check stats cards
    expect(screen.getByText("Total Posts")).toBeInTheDocument();
    expect(screen.getByText("Drafts")).toBeInTheDocument();
    expect(screen.getAllByText("Approved").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Posted").length).toBeGreaterThan(0);

    // Check items rendered
    expect(screen.getByText("Day 1")).toBeInTheDocument();
    expect(screen.getByText("Day 2")).toBeInTheDocument();
    expect(screen.getByText("Day 8")).toBeInTheDocument();
    expect(screen.getByText("Dekhein kaisay banta hai pure raw silk dupatta")).toBeInTheDocument();
  });

  it("filters items by status dropdown", async () => {
    render(<ContentCalendarPage />);

    await waitFor(() => {
      expect(screen.getByText("Day 1")).toBeInTheDocument();
    });

    const statusSelect = screen.getByLabelText(/filter by status/i);
    fireEvent.change(statusSelect, { target: { value: "draft" } });

    // Day 2 is draft, Day 1 is approved
    expect(screen.getByText("Day 2")).toBeInTheDocument();
    expect(screen.queryByText("Dekhein kaisay banta hai pure raw silk dupatta")).not.toBeInTheDocument();
  });

  it("filters items by week buttons", async () => {
    render(<ContentCalendarPage />);

    await waitFor(() => {
      expect(screen.getByText("Day 8")).toBeInTheDocument();
    });

    // Click W1 (1-7)
    const w1Button = screen.getByRole("button", { name: "W1 (1-7)" });
    fireEvent.click(w1Button);

    // Days 1 and 2 should show, Day 8 should not
    expect(screen.getByText("Day 1")).toBeInTheDocument();
    expect(screen.getByText("Day 2")).toBeInTheDocument();
    expect(screen.queryByText("Day 8")).not.toBeInTheDocument();

    // Click W2 (8-14)
    const w2Button = screen.getByRole("button", { name: "W2 (8-14)" });
    fireEvent.click(w2Button);

    expect(screen.queryByText("Day 1")).not.toBeInTheDocument();
    expect(screen.getByText("Day 8")).toBeInTheDocument();
  });

  it("opens detail drawer on card click and displays caption and prompts", async () => {
    render(<ContentCalendarPage />);

    await waitFor(() => {
      expect(screen.getByText("Day 1")).toBeInTheDocument();
    });

    const card = screen.getByRole("button", { name: /open details for day 1/i });
    fireEvent.click(card);

    // Drawer opens
    const drawerTitle = screen.getByRole("dialog");
    expect(drawerTitle).toBeInTheDocument();
    expect(
      within(drawerTitle).getByText(
        "Har suit ke peechay 3 din ki mehnat hoti hai. Order karein!"
      )
    ).toBeInTheDocument();
    expect(within(drawerTitle).getByText("#handmadelahore")).toBeInTheDocument();
    expect(within(drawerTitle).getByText(/close preview/i)).toBeInTheDocument();
  });

  it("allows updating item status via drawer action button", async () => {
    const updateSpy = vi
      .spyOn(
        ContentService,
        "updateItemStatusApiV1BusinessesBusinessIdContentItemsItemIdStatusPatch"
      )
      .mockResolvedValue({
        ...mockItems[1],
        status: "approved",
      });

    render(<ContentCalendarPage />);

    await waitFor(() => {
      expect(screen.getByText("Day 2")).toBeInTheDocument();
    });

    // Open Day 2 (which is draft)
    const card2 = screen.getByRole("button", { name: /open details for day 2/i });
    fireEvent.click(card2);

    // In drawer, click "Approve" button
    const approveBtn = screen.getByRole("button", { name: "Approve" });
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith({
        businessId: "biz-test-123",
        itemId: "item-2",
        requestBody: { status: "approved" },
      });
    });

    expect(screen.getByText(/day 2 updated to approved/i)).toBeInTheDocument();
  });
});
