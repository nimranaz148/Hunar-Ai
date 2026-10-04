import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import EntrepreneurDashboardPage from "@/app/(dashboard)/dashboard/page";
import {
  BusinessService,
  type BusinessResponse,
  type EntrepreneurDashboardResponse,
} from "@/lib/api";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockBusiness: BusinessResponse = {
  id: "biz-dash-123",
  owner_id: "user-dash-123",
  name: "Amina Pret Studio",
  niche: "apparel",
  city: "Lahore",
  area: "Gulberg",
  budget_pkr: 50000,
  hours_per_week: 20,
  tone: "inspirational",
  languages: ["roman_ur", "en"],
  platforms: ["instagram"],
  target_customer: "Women",
  created_at: "2026-10-01T00:00:00Z",
};

const mockDashboard: EntrepreneurDashboardResponse = {
  business_id: "biz-dash-123",
  business_name: "Amina Pret Studio",
  niche: "apparel",
  city: "Lahore",
  tasks_done_count: 12,
  total_tasks_count: 30,
  posts_published_count: 8,
  total_posts_count: 30,
  engagement_change_pct: 23.0,
  revenue_this_week_pkr: 15000,
  today_post: {
    id: "item-dash-today",
    calendar_id: "cal-dash-today",
    day: 12,
    date: "2026-10-05",
    status: "approved",
    platform: ["instagram"],
    format: "reel",
    pillar: "behind_the_scenes",
    goal: "awareness",
    hook: "Meri customer ne jab pehli baar dupatta dekha",
    caption: "Pure raw silk fabric with traditional embroidery details.",
    cta: "Order on WhatsApp",
    hashtags: ["#lahorefashion", "#silkpret"],
    best_time_hint: "7:00 PM PKT",
    image_prompt: { prompt: "Handmade embroidery closeup" },
    video_prompt: { prompt: "Dupta draped in slow motion" },
    alt_text: "Artisan embroidery dupatta",
    created_at: "2026-10-01T12:00:00Z",
    updated_at: null,
  },
  trend_7d: [
    { day: "Mon", engagement: 120, reach: 850 },
    { day: "Tue", engagement: 145, reach: 920 },
    { day: "Wed", engagement: 170, reach: 1100 },
    { day: "Thu", engagement: 190, reach: 1250 },
    { day: "Fri", engagement: 215, reach: 1400 },
    { day: "Sat", engagement: 260, reach: 1650 },
    { day: "Sun", engagement: 295, reach: 1850 },
  ],
  upcoming_tasks: [
    {
      id: "task-1",
      title: "Shoot behind the scenes dyeing reel",
      category: "marketing",
      week: 2,
      order_index: 1,
      status: "pending",
      due_date: "2026-10-07",
    },
    {
      id: "task-2",
      title: "Setup WhatsApp quick reply templates",
      category: "operations",
      week: 2,
      order_index: 2,
      status: "in_progress",
      due_date: "2026-10-08",
    },
  ],
};

describe("EntrepreneurDashboardPage Component (D-001 Home Dashboard)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders 4 Core PRD KPI cards, today's post spotlight, and upcoming tasks", async () => {
    vi.spyOn(
      BusinessService,
      "getCurrentUserBusinessApiV1BusinessesGet"
    ).mockResolvedValue(mockBusiness);

    vi.spyOn(
      BusinessService,
      "getDashboardApiV1BusinessesBusinessIdDashboardGet"
    ).mockResolvedValue(mockDashboard);

    render(<EntrepreneurDashboardPage />);

    expect(
      screen.getByText(/loading your business performance and execution roadmap/i)
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText("Khush Amdeed, Amina Pret Studio!")
      ).toBeInTheDocument();
    });

    // 4 KPI Cards
    expect(screen.getByText("12/30")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("+23%")).toBeInTheDocument();
    expect(screen.getByText(/15,000/)).toBeInTheDocument();

    // 7-day Engagement Trend
    expect(screen.getByText("Audience Engagement Trend (7 Days)")).toBeInTheDocument();
    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Sun")).toBeInTheDocument();

    // Today's Post Spotlight
    expect(screen.getByText("Today's Post Spotlight")).toBeInTheDocument();
    expect(
      screen.getByText('"Meri customer ne jab pehli baar dupatta dekha"')
    ).toBeInTheDocument();
    expect(screen.getByText("Day 12")).toBeInTheDocument();

    // Upcoming Tasks
    expect(
      screen.getByText("Shoot behind the scenes dyeing reel")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Setup WhatsApp quick reply templates")
    ).toBeInTheDocument();
  });

  it("displays empty state when business profile has not been created", async () => {
    vi.spyOn(
      BusinessService,
      "getCurrentUserBusinessApiV1BusinessesGet"
    ).mockResolvedValue(null as unknown as BusinessResponse);

    render(<EntrepreneurDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Business Profile Not Found")).toBeInTheDocument();
    });
    expect(screen.getByText("Start AI Onboarding")).toBeInTheDocument();
  });
});
