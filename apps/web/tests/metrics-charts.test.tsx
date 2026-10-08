import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PerformanceCharts } from "@/components/metrics/PerformanceCharts";
import PerformanceMetricsPage from "@/app/(dashboard)/metrics/page";
import {
  BusinessService,
  MetricsService,
  ContentService,
  ProposalsService,
  type BusinessResponse,
  type MetricsChartsResponse,
  type MetricsSnapshotResponse,
  type MetricsProgressResponse,
  type PaginatedResponse_MetricsSnapshotResponse_,
} from "@/lib/api";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/metrics",
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: () => null,
  }),
}));

const mockChartsData: MetricsChartsResponse = {
  business_id: "biz-123",
  timeframe_days: 30,
  start_date: "2026-10-01",
  end_date: "2026-10-05",
  summary: {
    total_views: 4500,
    total_reach: 3800,
    total_engagement: 305,
    total_inquiries: 15,
    total_orders: 3,
    total_revenue_pkr: 8000,
    net_follower_delta: 20,
    inquiry_to_order_rate_pct: 20.0,
    total_snapshots: 4,
  },
  timeline: [
    {
      date: "2026-10-01",
      views: 1200,
      reach: 1000,
      likes: 80,
      comments: 10,
      shares: 5,
      saves: 15,
      engagement: 110,
      follower_delta: 5,
      inquiries: 4,
      orders: 1,
      revenue_pkr: 2500,
    },
    {
      date: "2026-10-03",
      views: 1800,
      reach: 1500,
      likes: 90,
      comments: 12,
      shares: 8,
      saves: 10,
      engagement: 120,
      follower_delta: 8,
      inquiries: 6,
      orders: 1,
      revenue_pkr: 3000,
    },
    {
      date: "2026-10-05",
      views: 1500,
      reach: 1300,
      likes: 60,
      comments: 5,
      shares: 4,
      saves: 6,
      engagement: 75,
      follower_delta: 7,
      inquiries: 5,
      orders: 1,
      revenue_pkr: 2500,
    },
  ],
  channels: [
    {
      platform: "instagram",
      snapshots_count: 2,
      views: 3000,
      reach: 2500,
      inquiries: 10,
      orders: 2,
      revenue_pkr: 5500,
      views_share_pct: 66.7,
      revenue_share_pct: 68.8,
    },
    {
      platform: "facebook",
      snapshots_count: 2,
      views: 1500,
      reach: 1300,
      inquiries: 5,
      orders: 1,
      revenue_pkr: 2500,
      views_share_pct: 33.3,
      revenue_share_pct: 31.2,
    },
  ],
  top_content: [
    {
      content_item_id: "post-101",
      title: "Day 5 (Reel): Authentic Multani Clay Craft",
      platform: "instagram",
      views: 1800,
      revenue_pkr: 3000,
      inquiries: 6,
      orders: 1,
    },
  ],
};

const mockBusiness: BusinessResponse = {
  id: "biz-123",
  owner_id: "user-123",
  program_id: "prog-1",
  name: "Fatima's Block Prints",
  niche: "crafts",
  city: "Lahore",
  area: "Gulberg",
  budget_pkr: 25000,
  hours_per_week: 20,
  tone: "friendly",
  languages: ["roman_ur", "ur"],
  platforms: ["instagram", "facebook"],
  target_customer: "Women interested in artisan kurtas",
  created_at: "2026-10-01T10:00:00Z",
  updated_at: null,
};

const mockSnapshots: MetricsSnapshotResponse[] = [
  {
    id: "snapshot-1",
    business_id: "biz-123",
    content_item_id: null,
    content_item_title: null,
    platform: "instagram",
    period_start: "2026-10-01",
    period_end: "2026-10-02",
    views: 3000,
    reach: 2500,
    likes: 150,
    comments: 20,
    shares: 10,
    saves: 25,
    follower_delta: 12,
    inquiries: 10,
    orders: 2,
    revenue_pkr: 5000,
    created_at: "2026-10-02T12:00:00Z",
    updated_at: null,
  },
];

const mockProgress: MetricsProgressResponse = {
  total_days_logged: 2,
  target_days: 3,
  threshold_met: false,
  latest_snapshot_date: "2026-10-02",
};

describe("PerformanceCharts Component (Task 49 / F-016)", () => {
  const onDaysChange = vi.fn();
  const onPlatformChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders summary KPIs, timeframe options, and channel share stats", () => {
    render(
      <PerformanceCharts
        chartsData={mockChartsData}
        days={30}
        onDaysChange={onDaysChange}
        selectedPlatform="all"
        onPlatformChange={onPlatformChange}
      />
    );

    // Summary KPIs
    expect(screen.getByText("Rs 8,000")).toBeInTheDocument();
    expect(screen.getByText("4,500")).toBeInTheDocument();
    expect(screen.getByText("305")).toBeInTheDocument();
    expect(screen.getByText("20%")).toBeInTheDocument();

    // Timeframe selector buttons
    expect(screen.getByRole("button", { name: "Timeframe Last 7 Days" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Timeframe Last 14 Days" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Timeframe Last 30 Days" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Timeframe All Time" })).toBeInTheDocument();

    // Channel filter buttons
    expect(screen.getByRole("button", { name: "Chart All" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Chart Instagram" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Chart Facebook" })).toBeInTheDocument();

    // Channel shares breakdown
    expect(screen.getByText("66.7%")).toBeInTheDocument();
    expect(screen.getByText("33.3%")).toBeInTheDocument();

    // Top content item
    expect(screen.getByText(/Authentic Multani Clay Craft/i)).toBeInTheDocument();
  });

  it("triggers onDaysChange when clicking timeframe buttons", () => {
    render(
      <PerformanceCharts
        chartsData={mockChartsData}
        days={30}
        onDaysChange={onDaysChange}
        selectedPlatform="all"
        onPlatformChange={onPlatformChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Timeframe Last 7 Days" }));
    expect(onDaysChange).toHaveBeenCalledWith(7);

    fireEvent.click(screen.getByRole("button", { name: "Timeframe All Time" }));
    expect(onDaysChange).toHaveBeenCalledWith(null);
  });

  it("triggers onPlatformChange when clicking channel buttons", () => {
    render(
      <PerformanceCharts
        chartsData={mockChartsData}
        days={30}
        onDaysChange={onDaysChange}
        selectedPlatform="all"
        onPlatformChange={onPlatformChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Chart Instagram" }));
    expect(onPlatformChange).toHaveBeenCalledWith("instagram");

    fireEvent.click(screen.getByRole("button", { name: "Chart Facebook" }));
    expect(onPlatformChange).toHaveBeenCalledWith("facebook");
  });

  it("renders empty state when timeline has no data", () => {
    const emptyCharts: MetricsChartsResponse = {
      business_id: "biz-123",
      timeframe_days: 7,
      start_date: null,
      end_date: null,
      summary: {
        total_views: 0,
        total_reach: 0,
        total_engagement: 0,
        total_inquiries: 0,
        total_orders: 0,
        total_revenue_pkr: 0,
        net_follower_delta: 0,
        inquiry_to_order_rate_pct: 0,
        total_snapshots: 0,
      },
      timeline: [],
      channels: [],
      top_content: [],
    };

    render(
      <PerformanceCharts
        chartsData={emptyCharts}
        days={7}
        onDaysChange={onDaysChange}
        selectedPlatform="all"
        onPlatformChange={onPlatformChange}
      />
    );

    expect(screen.getByText(/No chart data available for this timeframe/i)).toBeInTheDocument();
  });
});

describe("PerformanceMetricsPage Integration with Charts (Task 49 / F-016)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(BusinessService, "getCurrentUserBusinessApiV1BusinessesGet").mockResolvedValue(mockBusiness);

    vi.spyOn(MetricsService, "listBusinessMetricsApiV1BusinessesBusinessIdMetricsGet").mockResolvedValue({
      items: mockSnapshots,
      total: mockSnapshots.length,
      page: 1,
      pageSize: 50,
    } as unknown as PaginatedResponse_MetricsSnapshotResponse_);

    vi.spyOn(MetricsService, "getCoachingProgressApiV1BusinessesBusinessIdMetricsProgressGet").mockResolvedValue(mockProgress);

    vi.spyOn(MetricsService, "getMetricsChartsApiV1BusinessesBusinessIdMetricsChartsGet").mockResolvedValue(mockChartsData);

    vi.spyOn(ContentService, "getCalendarApiV1BusinessesBusinessIdContentCalendarGet").mockResolvedValue({
      business_id: "biz-123",
      generated_at: "2026-10-01T00:00:00Z",
      total_items: 0,
      items: [],
    } as unknown as Awaited<ReturnType<typeof ContentService.getCalendarApiV1BusinessesBusinessIdContentCalendarGet>>);

    vi.spyOn(
      ProposalsService,
      "getLatestWeeklyReviewApiV1BusinessesBusinessIdWeeklyReviewLatestGet"
    ).mockResolvedValue(null);
  });

  it("fetches charts data and displays Performance Charts section on the dashboard", async () => {
    render(<PerformanceMetricsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Performance Charts & Conversion Analytics/i)).toBeInTheDocument();
    });

    expect(screen.getByText("Rs 8,000")).toBeInTheDocument();
    expect(screen.getByText(/Authentic Multani Clay Craft/i)).toBeInTheDocument();
  });
});
